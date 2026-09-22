import { PgBoss } from "pg-boss";
import { pool, query, tx } from "./db";
import { entitled, isPlan, plans } from "./plans";
import { adapters, type Context } from "./publishers";
import {
  AppError,
  ProviderError,
  type Destination,
  type Connection,
  type Media,
} from "./types";
export async function reserve(userId: string, destinationId: string) {
  return tx(async (c) => {
    const [s] = (
      await c.query("SELECT * FROM subscriptions WHERE user_id=$1 FOR UPDATE", [
        userId,
      ])
    ).rows;
    if (
      !entitled(s as { status: string; period_end: string } | undefined) ||
      !isPlan(s.plan)
    )
      throw new AppError("An active subscription is required.");
    const count = Number(
      (
        await c.query(
          "SELECT count(*) FROM connections WHERE user_id=$1 AND active=true AND platform!='drive' AND status!='disconnected'",
          [userId],
        )
      ).rows[0].count,
    );
    if (count > plans[s.plan as keyof typeof plans].accounts)
      throw new AppError("Choose active accounts within your plan limit.");
    const [existing] = (
      await c.query("SELECT * FROM usage WHERE destination_id=$1", [
        destinationId,
      ])
    ).rows;
    if (existing && existing.status !== "released") return;
    const plan = plans[s.plan as keyof typeof plans];
    const used = (
      await c.query(
        `SELECT count(*) AS used_posts, COALESCE(sum(m.size), 0) AS used_bytes
         FROM usage u
         JOIN destinations d ON d.id=u.destination_id
         JOIN posts p ON p.id=d.post_id
         JOIN media m ON m.id=p.media_id
         WHERE u.user_id=$1 AND u.period_start=$2 AND u.status IN ('reserved','consumed')`,
        [userId, s.period_start],
      )
    ).rows[0];
    if (Number(used.used_posts) >= plan.posts)
      throw new AppError("Your monthly post allowance has been reached.");
    const [destMedia] = (
      await c.query(
        "SELECT m.size FROM destinations d JOIN posts p ON p.id=d.post_id JOIN media m ON m.id=p.media_id WHERE d.id=$1",
        [destinationId],
      )
    ).rows;
    const candidateSize = Number(destMedia?.size || 0);
    if (Number(used.used_bytes) + candidateSize > plan.bandwidthBytes)
      throw new AppError(
        `Your monthly video bandwidth allowance has been reached (${plan.bandwidthBytes / 1024 ** 3} GB on ${plan.name} plan).`,
      );
    await c.query(
      `INSERT INTO usage(user_id,destination_id,period_start,period_end,status) VALUES($1,$2,$3,$4,'reserved') ON CONFLICT(destination_id) DO UPDATE SET status='reserved',period_start=EXCLUDED.period_start,period_end=EXCLUDED.period_end`,
      [userId, destinationId, s.period_start, s.period_end],
    );
  });
}
async function outcome(
  d: Destination,
  status: string,
  error: string | null,
  remoteId?: string,
  url?: string,
) {
  await tx(async (c) => {
    await c.query(
      "UPDATE destinations SET status=$2,error=$3,remote_id=COALESCE($4,remote_id),remote_url=COALESCE($5,remote_url),lease_until=null,updated_at=now() WHERE id=$1",
      [d.id, status, error, remoteId, url],
    );
    if (
      status === "published" ||
      status === "failed" ||
      (status === "paused" &&
        !d.remote_id &&
        !Object.keys(d.upload_state).length)
    )
      await c.query("UPDATE usage SET status=$2 WHERE destination_id=$1", [
        d.id,
        status === "published" ? "consumed" : "released",
      ]);
    await c.query(
      "INSERT INTO publish_attempts(destination_id,status,detail) VALUES($1,$2,$3)",
      [d.id, status, error],
    );
  });
}
export async function processDestination(id: string) {
  const lock = await pool.connect();
  let locked = false;
  let userLock: string | undefined;
  try {
    locked = (
      await lock.query(
        "SELECT pg_try_advisory_lock(hashtextextended($1,0)) AS locked",
        [id],
      )
    ).rows[0].locked;
    if (!locked) return;
    let [d] = await query<Destination>(
      "SELECT * FROM destinations WHERE id=$1",
      [id],
    );
    if (!d || !["scheduled", "queued", "processing"].includes(d.status)) return;
    await lock.query("SELECT pg_advisory_lock_shared(hashtextextended($1,1))", [
      d.user_id,
    ]);
    userLock = d.user_id;
    // A disconnect or account deletion may have completed while this job waited.
    // Queued duplicate deliveries must also respect the persisted backoff.
    [d] = await query<Destination>(
      "SELECT * FROM destinations WHERE id=$1 AND status IN ('scheduled','queued','processing') AND next_attempt_at<=now()",
      [id],
    );
    if (!d) return;
    const [post] = await query("SELECT * FROM posts WHERE id=$1", [d.post_id]);
    if (!post || new Date(post.scheduled_at).getTime() > Date.now()) return;
    const [connection] = await query<Connection>(
      "SELECT * FROM connections WHERE id=$1 AND user_id=$2",
      [d.connection_id, d.user_id],
    );
    const [media] = await query<Media>(
      "SELECT * FROM media WHERE id=$1 AND user_id=$2",
      [post.media_id, d.user_id],
    );
    if (!connection || !media || connection.platform === "drive")
      throw new AppError("Publishing source or destination is unavailable.");
    const ctx: Context = {
      destination: d,
      connection,
      media,
      caption: post.caption,
    };
    const adapter = adapters[connection.platform];
    try {
      await reserve(d.user_id, id);
      if (connection.status !== "connected" || !connection.active)
        throw new AppError("Reconnect or activate this destination.");
      if (!Object.keys(d.upload_state).length) {
        const errors = await adapter.validate(ctx);
        if (errors.length) throw new AppError(errors.join(" "));
      }
      await query(
        "UPDATE destinations SET status='processing',attempts=attempts+1,lease_until=now()+interval '3 minutes',updated_at=now() WHERE id=$1",
        [id],
      );
      const result = await adapter.publish(ctx);
      await query(
        "UPDATE destinations SET consecutive_failures=0,error=null WHERE id=$1",
        [id],
      );
      if (result.status === "pending") {
        if (d.attempts > 400)
          await outcome(
            d,
            "attention",
            "The platform is taking longer than expected. Check its publishing status.",
          );
        else
          await query(
            "UPDATE destinations SET status='processing',next_attempt_at=now()+interval '15 seconds',lease_until=null,updated_at=now() WHERE id=$1",
            [id],
          );
      } else
        await outcome(
          d,
          result.status,
          result.message || null,
          result.id,
          result.url,
        );
    } catch (e) {
      const failures = d.consecutive_failures + 1;
      await query(
        "UPDATE destinations SET consecutive_failures=$2 WHERE id=$1",
        [id, failures],
      );
      if (
        e instanceof ProviderError &&
        failures <= 12 &&
        ((e.retryable && !e.ambiguous) ||
          (e.ambiguous && connection.platform === "youtube"))
      )
        await query(
          "UPDATE destinations SET status='processing',error=$2,next_attempt_at=now()+($3||' seconds')::interval,lease_until=null WHERE id=$1",
          [id, e.message, Math.min(1800, 15 * 2 ** Math.min(failures - 1, 7))],
        );
      else
        await outcome(
          d,
          e instanceof AppError && !Object.keys(d.upload_state).length
            ? "paused"
            : "attention",
          e instanceof AppError || e instanceof ProviderError
            ? e.message
            : "Publishing encountered an unexpected error. Check the platform before retrying.",
        );
    }
  } finally {
    if (userLock)
      await lock.query(
        "SELECT pg_advisory_unlock_shared(hashtextextended($1,1))",
        [userLock],
      );
    if (locked)
      await lock.query("SELECT pg_advisory_unlock(hashtextextended($1,0))", [
        id,
      ]);
    lock.release();
  }
}
export async function startWorker() {
  const boss = new PgBoss({
    connectionString: process.env.DATABASE_URL!,
    application_name: "social-publisher-worker",
  });
  boss.on("error", () => console.error("Queue operation failed."));
  await boss.start();
  await boss.createQueue("publish", {
    retryLimit: 3,
    retryDelay: 30,
    expireInSeconds: 180,
  });
  await boss.work<{ id: string }>(
    "publish",
    { localConcurrency: 3 },
    async (jobs) => {
      for (const job of jobs) await processDestination(job.data.id);
    },
  );
  const tick = async () => {
    await query(
      "INSERT INTO worker_heartbeats(id,seen_at) VALUES('publisher',now()) ON CONFLICT(id) DO UPDATE SET seen_at=now()",
    );
    const due = await query(
      "SELECT d.id FROM destinations d JOIN posts p ON p.id=d.post_id WHERE d.status IN ('scheduled','queued','processing') AND p.scheduled_at<=now() AND d.next_attempt_at<=now() AND (d.lease_until IS NULL OR d.lease_until<now()) LIMIT 100",
    );
    for (const d of due)
      await boss.send(
        "publish",
        { id: d.id },
        { singletonKey: d.id, singletonSeconds: 20 },
      );
  };
  await tick();
  const timer = setInterval(
    () => void tick().catch(() => console.error("Scheduler tick failed.")),
    10000,
  );
  return async () => {
    clearInterval(timer);
    await boss.stop();
    await pool.end();
  };
}
