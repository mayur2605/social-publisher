import { z, ZodError } from "zod";
import { randomUUID, createHmac } from "node:crypto";
import { getAuth } from "./auth";
import { configured, appUrl } from "./env";
import { query, tx } from "./db";
import {
  authorize,
  callback,
  disconnect,
  getConnection,
  creatorInfo,
  accessToken,
} from "./connections";
import { driveConnection, importFile, initiateUpload, source } from "./drive";
import { AppError, ProviderError, type Connection, type Media } from "./types";
import { postSchema } from "./validation";
import { adapters } from "./publishers";
import { plans, isPlan, entitled } from "./plans";
import { checkout, portal, webhook, stripe } from "./billing";
import { verifyMedia } from "./crypto";
const reply = (data: unknown, status = 200) =>
  Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
async function body(request: Request) {
  if (Number(request.headers.get("content-length") || 0) > 100000)
    throw new AppError("Request too large.", 413);
  const text = await request.text();
  if (text.length > 100000) throw new AppError("Request too large.", 413);
  try {
    return JSON.parse(text);
  } catch {
    throw new AppError("Invalid JSON.");
  }
}
async function mediaResponse(m: Media, request: Request) {
  const range = request.headers.get("range") || undefined;
  if (range && !/^bytes=\d+-\d*$/.test(range))
    throw new AppError("Unsupported byte range.", 416);
  const r = await source(m, range);
  const headers = new Headers({
    "Content-Type": m.mime_type,
    "Accept-Ranges": "bytes",
    "Cache-Control": "private, no-store",
    "Content-Disposition": "inline",
  });
  for (const name of ["Content-Length", "Content-Range"]) {
    const value = r.headers.get(name);
    if (value) headers.set(name, value);
  }
  if (request.method === "HEAD") {
    await r.body?.cancel();
    return new Response(null, { headers, status: r.status });
  }
  return new Response(r.body, { headers, status: r.status });
}
export async function handle(
  request: Request,
  path: string[],
): Promise<Response> {
  try {
    const url = new URL(request.url),
      route = path.join("/");
    if (route === "billing/webhook" && request.method === "POST") {
      await webhook(
        await request.text(),
        request.headers.get("stripe-signature") || "",
      );
      return reply({ received: true });
    }
    if (route === "health" && request.method === "GET") {
      try {
        await query("SELECT 1");
        const [h] = await query(
          "SELECT seen_at>now()-interval '1 minute' AS healthy FROM worker_heartbeats WHERE id='publisher'",
        );
        return reply(
          { database: true, worker: !!h?.healthy },
          h?.healthy ? 200 : 503,
        );
      } catch {
        return reply({ database: false, worker: false }, 503);
      }
    }
    if (route === "dev-login" && request.method === "GET") {
      if (process.env.ENABLE_DEV_LOGIN !== "true") {
        throw new AppError("Not found.", 404);
      }
      const [u] = await query<{ id: string }>(
        "SELECT id FROM \"user\" WHERE email='dev@socialpublisher.local'",
      );
      if (!u)
        throw new AppError(
          "Dev user not found. Run npm run dev:session first.",
          404,
        );
      const token = randomUUID();
      await query(
        'INSERT INTO session(id,token,"userId","expiresAt","updatedAt") VALUES($1,$2,$3,now()+interval \'7 days\',now())',
        [randomUUID(), token, u.id],
      );
      const signature = createHmac("sha256", process.env.BETTER_AUTH_SECRET!)
        .update(token)
        .digest("base64");
      const cookieValue = `${token}.${signature}`;
      return new Response(null, {
        status: 302,
        headers: {
          Location: "/",
          "Set-Cookie": `better-auth.session_token=${encodeURIComponent(cookieValue)}; Path=/; Max-Age=604800; SameSite=Lax`,
        },
      });
    }
    if (
      path[0] === "media" &&
      path[1] === "stream" &&
      ["GET", "HEAD"].includes(request.method)
    ) {
      const id = z.string().uuid().parse(path[2]);
      if (
        !verifyMedia(
          id,
          Number(url.searchParams.get("expires")),
          url.searchParams.get("signature") || "",
        )
      )
        throw new AppError("This media link has expired.", 403);
      const [m] = await query<Media>(
        "SELECT m.* FROM destinations d JOIN posts p ON p.id=d.post_id JOIN media m ON m.id=p.media_id JOIN connections c ON c.id=d.connection_id WHERE d.id=$1 AND d.status IN ('processing','attention') AND c.active=true AND c.status='connected'",
        [id],
      );
      if (!m) throw new AppError("Media unavailable.", 404);
      return mediaResponse(m, request);
    }
    if (!configured())
      throw new AppError(
        "Configure Google sign-in and the database to use the app.",
        503,
      );
    const session = await getAuth().api.getSession({
      headers: request.headers,
    });
    if (!session) throw new AppError("Sign in to continue.", 401);
    const userId = session.user.id;
    if (
      !["GET", "HEAD"].includes(request.method) &&
      request.headers.get("origin") !== new URL(appUrl()).origin
    )
      throw new AppError("Invalid request origin.", 403);
    if (route === "workspace" && request.method === "GET") {
      const [connections, media, posts, subscriptions, usage] =
        await Promise.all([
          query(
            "SELECT id,platform,label,active,status,external_id FROM connections WHERE user_id=$1 ORDER BY created_at",
            [userId],
          ),
          query(
            "SELECT * FROM media WHERE user_id=$1 ORDER BY created_at DESC LIMIT 100",
            [userId],
          ),
          query(
            `SELECT p.*,m.name AS media_name,COALESCE(jsonb_agg(jsonb_build_object('id',d.id,'connectionId',d.connection_id,'platform',c.platform,'label',c.label,'status',d.status,'error',d.error,'url',d.remote_url,'options',d.options)) FILTER(WHERE d.id IS NOT NULL),'[]') AS destinations FROM posts p JOIN media m ON m.id=p.media_id LEFT JOIN destinations d ON d.post_id=p.id LEFT JOIN connections c ON c.id=d.connection_id WHERE p.user_id=$1 GROUP BY p.id,m.name ORDER BY COALESCE(p.scheduled_at,p.created_at) DESC LIMIT 100`,
            [userId],
          ),
          query(
            "SELECT plan,status,period_start,period_end,cancel_at_period_end FROM subscriptions WHERE user_id=$1",
            [userId],
          ),
          query(
            "SELECT count(*) FILTER(WHERE u.status='consumed') AS consumed,count(*) FILTER(WHERE u.status='reserved') AS reserved FROM usage u JOIN subscriptions s ON s.user_id=u.user_id AND s.period_start=u.period_start WHERE u.user_id=$1",
            [userId],
          ),
        ]);
      return reply({
        user: session.user,
        connections,
        media,
        posts,
        subscription: subscriptions[0] || null,
        usage: usage[0],
        capabilities: {
          drivePicker: !!process.env.GOOGLE_PICKER_API_KEY,
          billing: !!process.env.STRIPE_SECRET_KEY,
          youtubePublic: process.env.YOUTUBE_PUBLIC_APPROVED === "true",
          tiktokPublic: process.env.TIKTOK_PUBLIC_APPROVED === "true",
        },
      });
    }
    if (
      path[0] === "connections" &&
      path[1] === "authorize" &&
      request.method === "POST"
    )
      return reply({ url: await authorize(userId, path[2]) });
    if (
      path[0] === "connections" &&
      path[1] === "callback" &&
      request.method === "GET"
    ) {
      if (url.searchParams.has("error"))
        return Response.redirect(`${appUrl()}/accounts?connection=canceled`);
      await callback(
        userId,
        path[2],
        url.searchParams.get("state") || "",
        url.searchParams.get("code") || "",
      );
      return Response.redirect(`${appUrl()}/accounts?connection=success`);
    }
    if (
      path[0] === "connections" &&
      path.length === 2 &&
      request.method === "DELETE"
    ) {
      await disconnect(userId, z.string().uuid().parse(path[1]));
      return reply({ ok: true });
    }
    if (
      path[0] === "connections" &&
      path[2] === "active" &&
      request.method === "POST"
    ) {
      const { active } = z
        .object({ active: z.boolean() })
        .parse(await body(request));
      await tx(async (c) => {
        await c.query('SELECT id FROM "user" WHERE id=$1 FOR UPDATE', [userId]);
        const [connection] = (
          await c.query(
            "SELECT * FROM connections WHERE id=$1 AND user_id=$2",
            [path[1], userId],
          )
        ).rows;
        if (
          !connection ||
          connection.platform === "drive" ||
          connection.status === "disconnected"
        )
          throw new AppError("Account cannot be activated.");
        const [s] = (
          await c.query("SELECT plan FROM subscriptions WHERE user_id=$1", [
            userId,
          ])
        ).rows;
        const plan = isPlan(s?.plan) ? s.plan : "starter";
        const count = Number(
          (
            await c.query(
              "SELECT count(*) FROM connections WHERE user_id=$1 AND id!=$2 AND active=true AND platform!='drive' AND status!='disconnected'",
              [userId, connection.id],
            )
          ).rows[0].count,
        );
        if (active && count >= plans[plan as keyof typeof plans].accounts)
          throw new AppError("Your connected-account limit has been reached.");
        await c.query("UPDATE connections SET active=$2 WHERE id=$1", [
          connection.id,
          active,
        ]);
      });
      return reply({ ok: true });
    }
    if (
      path[0] === "connections" &&
      path[2] === "creator" &&
      request.method === "GET"
    ) {
      const c = await getConnection(userId, z.string().uuid().parse(path[1]));
      if (c.platform !== "tiktok")
        throw new AppError("This is not a TikTok account.");
      return reply(await creatorInfo(c));
    }
    if (route === "drive/picker" && request.method === "POST") {
      const c = await driveConnection(userId);
      return reply({
        accessToken: await accessToken(c),
        apiKey: process.env.GOOGLE_PICKER_API_KEY,
        appId: process.env.GOOGLE_PROJECT_NUMBER,
      });
    }
    if (route === "drive/import" && request.method === "POST") {
      const { fileId } = z
        .object({ fileId: z.string().regex(/^[a-zA-Z0-9_-]+$/) })
        .parse(await body(request));
      return reply(await importFile(userId, fileId));
    }
    if (route === "drive/upload" && request.method === "POST") {
      const b = z
        .object({
          name: z.string().min(1).max(200),
          mimeType: z.string(),
          size: z.number().int().positive(),
        })
        .parse(await body(request));
      return reply(await initiateUpload(userId, b.name, b.mimeType, b.size));
    }
    if (
      path[0] === "media" &&
      path[2] === "preview" &&
      ["GET", "HEAD"].includes(request.method)
    ) {
      const [m] = await query<Media>(
        "SELECT * FROM media WHERE id=$1 AND user_id=$2",
        [z.string().uuid().parse(path[1]), userId],
      );
      if (!m) throw new AppError("Video not found.", 404);
      return mediaResponse(m, request);
    }
    if (
      (route === "posts" && request.method === "POST") ||
      (path[0] === "posts" && path.length === 2 && request.method === "PATCH")
    ) {
      const b = postSchema.parse(await body(request));
      if (
        new Set(b.destinations.map((d) => d.connectionId)).size !==
        b.destinations.length
      )
        throw new AppError("Choose each destination once.");
      if (
        b.mode === "schedule" &&
        (!b.scheduledAt ||
          new Date(b.scheduledAt).getTime() < Date.now() + 60000)
      )
        throw new AppError("Schedule at least one minute in the future.");
      const [m] = await query<Media>(
        "SELECT * FROM media WHERE id=$1 AND user_id=$2",
        [b.mediaId, userId],
      );
      if (!m) throw new AppError("Video not found.", 404);
      for (const target of b.destinations) {
        const c = await getConnection(userId, target.connectionId);
        if (c.platform === "drive" || c.status !== "connected" || !c.active)
          throw new AppError("Choose active, connected social accounts.");
        if (b.mode !== "draft") {
          const errors = await adapters[c.platform].validate({
            connection: c,
            media: m,
            caption: b.caption,
            destination: { options: target.options } as any,
          });
          if (errors.length)
            throw new AppError(`${c.label}: ${errors.join(" ")}`);
        }
      }
      if (b.mode !== "draft") {
        const [s] = await query(
          "SELECT * FROM subscriptions WHERE user_id=$1",
          [userId],
        );
        if (!entitled(s as { status: string; period_end: string } | undefined))
          throw new AppError(
            "Choose an active subscription before publishing.",
          );
      }
      const id = await tx(async (c) => {
        let postId = path[1];
        if (request.method === "PATCH") {
          postId = z.string().uuid().parse(postId);
          const ds = (
            await c.query(
              "SELECT id FROM destinations WHERE post_id=$1 AND user_id=$2 ORDER BY id",
              [postId, userId],
            )
          ).rows;
          for (const d of ds)
            await c.query(
              "SELECT pg_advisory_xact_lock(hashtextextended($1,0))",
              [d.id],
            );
          const existing = (
            await c.query(
              "SELECT id FROM posts WHERE id=$1 AND user_id=$2 FOR UPDATE",
              [postId, userId],
            )
          ).rows[0];
          if (!existing) throw new AppError("Post not found.", 404);
          if (
            (
              await c.query(
                "SELECT 1 FROM destinations WHERE post_id=$1 AND (status NOT IN ('draft','scheduled','paused','canceled') OR upload_state!='{}'::jsonb)",
                [postId],
              )
            ).rowCount
          )
            throw new AppError(
              "This post has already started publishing and cannot be edited.",
              409,
            );
          await c.query("DELETE FROM destinations WHERE post_id=$1", [postId]);
          await c.query(
            "UPDATE posts SET media_id=$2,caption=$3,timezone=$4,scheduled_at=$5 WHERE id=$1",
            [
              postId,
              b.mediaId,
              b.caption,
              b.timezone,
              b.mode === "now" ? new Date() : b.scheduledAt,
            ],
          );
        } else {
          postId = (
            await c.query(
              "INSERT INTO posts(user_id,media_id,caption,timezone,scheduled_at) VALUES($1,$2,$3,$4,$5) RETURNING id",
              [
                userId,
                b.mediaId,
                b.caption,
                b.timezone,
                b.mode === "now" ? new Date() : b.scheduledAt,
              ],
            )
          ).rows[0].id;
        }
        for (const target of b.destinations)
          await c.query(
            "INSERT INTO destinations(post_id,user_id,connection_id,options,status) VALUES($1,$2,$3,$4,$5)",
            [
              postId,
              userId,
              target.connectionId,
              target.options,
              b.mode === "draft" ? "draft" : "scheduled",
            ],
          );
        return postId;
      });
      return reply({ id }, 201);
    }
    if (
      path[0] === "posts" &&
      path[2] === "cancel" &&
      request.method === "POST"
    ) {
      await tx(async (c) => {
        const ds = (
          await c.query(
            "SELECT id FROM destinations WHERE post_id=$1 AND user_id=$2 ORDER BY id",
            [path[1], userId],
          )
        ).rows;
        if (!ds.length) throw new AppError("Post not found.", 404);
        for (const d of ds)
          await c.query(
            "SELECT pg_advisory_xact_lock(hashtextextended($1,0))",
            [d.id],
          );
        if (
          (
            await c.query(
              "SELECT 1 FROM destinations WHERE post_id=$1 AND status IN ('processing','published','attention')",
              [path[1]],
            )
          ).rowCount
        )
          throw new AppError(
            "Publishing has started. This post cannot be canceled.",
            409,
          );
        await c.query(
          "UPDATE destinations SET status='canceled',updated_at=now() WHERE post_id=$1",
          [path[1]],
        );
        await c.query(
          "UPDATE usage SET status='released' WHERE destination_id IN (SELECT id FROM destinations WHERE post_id=$1) AND status='reserved'",
          [path[1]],
        );
      });
      return reply({ ok: true });
    }
    if (
      path[0] === "destinations" &&
      path[2] === "retry" &&
      request.method === "POST"
    ) {
      await tx(async (c) => {
        await c.query("SELECT pg_advisory_xact_lock(hashtextextended($1,0))", [
          path[1],
        ]);
        const [d] = (
          await c.query(
            "SELECT * FROM destinations WHERE id=$1 AND user_id=$2 FOR UPDATE",
            [path[1], userId],
          )
        ).rows;
        if (!d) throw new AppError("Destination not found.", 404);
        if (!["failed", "paused", "attention"].includes(d.status))
          throw new AppError("This destination cannot be retried.");
        if (d.status === "attention" && !d.remote_id)
          throw new AppError(
            "Check the platform for an existing post before creating a new post.",
          );
        await c.query(
          "UPDATE destinations SET status='scheduled',next_attempt_at=now(),lease_until=null,error=null,attempts=0,consecutive_failures=0,upload_state=CASE WHEN status='failed' THEN '{}'::jsonb ELSE upload_state END,remote_id=CASE WHEN status='failed' THEN NULL ELSE remote_id END WHERE id=$1",
          [d.id],
        );
      });
      return reply({ ok: true });
    }
    if (
      path[0] === "destinations" &&
      path[2] === "resolve" &&
      request.method === "POST"
    ) {
      const { resolution, confirmed } = z
        .object({
          resolution: z.enum(["published", "not_published"]),
          confirmed: z.literal(true),
        })
        .parse(await body(request));
      void confirmed;
      await tx(async (c) => {
        await c.query("SELECT pg_advisory_xact_lock(hashtextextended($1,0))", [
          path[1],
        ]);
        const [d] = (
          await c.query(
            "SELECT * FROM destinations WHERE id=$1 AND user_id=$2 FOR UPDATE",
            [path[1], userId],
          )
        ).rows;
        if (!d) throw new AppError("Destination not found.", 404);
        if (d.status !== "attention")
          throw new AppError("Only uncertain outcomes can be reviewed.", 409);
        const status = resolution === "published" ? "published" : "failed";
        await c.query(
          "UPDATE destinations SET status=$2,error=$3,updated_at=now() WHERE id=$1",
          [
            d.id,
            status,
            resolution === "published"
              ? null
              : "Creator confirmed this post was not published.",
          ],
        );
        await c.query("UPDATE usage SET status=$2 WHERE destination_id=$1", [
          d.id,
          resolution === "published" ? "consumed" : "released",
        ]);
        await c.query(
          "INSERT INTO publish_attempts(destination_id,status,detail) VALUES($1,$2,$3)",
          [d.id, status, `Creator manually verified: ${resolution}`],
        );
      });
      return reply({ ok: true });
    }
    if (route === "billing/checkout" && request.method === "POST") {
      const { plan } = z
        .object({ plan: z.enum(["starter", "creator", "pro"]) })
        .parse(await body(request));
      return reply({ url: await checkout(userId, session.user.email, plan) });
    }
    if (route === "billing/portal" && request.method === "POST")
      return reply({ url: await portal(userId) });
    if (route === "account" && request.method === "DELETE") {
      const { confirmation } = z
        .object({ confirmation: z.literal("DELETE") })
        .parse(await body(request));
      void confirmation;
      await tx(async (c) => {
        await c.query("SELECT pg_advisory_xact_lock(hashtextextended($1,1))", [
          userId,
        ]);
        if (
          (
            await c.query(
              "SELECT id FROM destinations WHERE user_id=$1 AND status IN ('processing','attention') LIMIT 1",
              [userId],
            )
          ).rowCount
        )
          throw new AppError(
            "Resolve active or uncertain publishing jobs before deleting your account.",
          );
        const [s] = (
          await c.query(
            "SELECT * FROM subscriptions WHERE user_id=$1 FOR UPDATE",
            [userId],
          )
        ).rows;
        if (s?.stripe_subscription_id && s.status !== "canceled")
          await stripe().subscriptions.cancel(s.stripe_subscription_id);
        await c.query('DELETE FROM "user" WHERE id=$1', [userId]);
      });
      return reply({ ok: true });
    }
    throw new AppError("Not found.", 404);
  } catch (e) {
    if (e instanceof ZodError)
      return reply({ error: e.issues.map((i) => i.message).join(" ") }, 400);
    if (e instanceof AppError) return reply({ error: e.message }, e.status);
    if (e instanceof ProviderError) return reply({ error: e.message }, 502);
    if (e instanceof Error && e.message.startsWith("Missing configuration:"))
      return reply({ error: e.message }, 503);
    console.error("Request failed", {
      kind: e instanceof Error ? e.name : "UnknownError",
    });
    return reply(
      { error: "The request could not be completed. Please try again." },
      500,
    );
  }
}
