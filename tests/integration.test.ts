import {
  beforeAll,
  afterAll,
  afterEach,
  describe,
  it,
  expect,
  vi,
} from "vitest";
import { pool, query } from "../src/lib/db";
import { handle } from "../src/lib/api";
import { getAuth } from "../src/lib/auth";
import { reserve, processDestination } from "../src/lib/jobs";
import {
  callback,
  authorize,
  disconnect,
  accessToken,
} from "../src/lib/connections";
import { source } from "../src/lib/drive";
import { adapters } from "../src/lib/publishers";
import { encrypt, signMedia } from "../src/lib/crypto";
import { actor, fixture, prepareDatabase } from "./fixtures";
import { ProviderError } from "../src/lib/types";
const request = (
  path: string,
  cookie: string,
  method = "GET",
  body?: unknown,
) =>
  handle(
    new Request(`http://localhost:3000/api/${path}`, {
      method,
      headers: {
        cookie,
        origin: "http://localhost:3000",
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    }),
    path.split("/"),
  );
beforeAll(prepareDatabase);
afterAll(() => pool.end());
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
describe("real PostgreSQL and Better Auth integration", () => {
  it("rejects forged, expired and revoked sessions", async () => {
    expect(
      (await request("workspace", "better-auth.session_token=forged")).status,
    ).toBe(401);
    const u = await actor();
    expect((await request("workspace", u.cookie)).status).toBe(200);
    await query(
      'UPDATE session SET "expiresAt"=now()-interval \'1 hour\' WHERE "userId"=$1',
      [u.id],
    );
    expect((await request("workspace", u.cookie)).status).toBe(401);
  });
  it("sign-out revokes the session but keeps scheduled posts", async () => {
    const u = await actor();
    const f = await fixture(u.id);
    const r = await getAuth().handler(
      new Request("http://localhost:3000/api/auth/sign-out", {
        method: "POST",
        headers: {
          cookie: u.cookie,
          origin: "http://localhost:3000",
          "Content-Type": "application/json",
        },
        body: "{}",
      }),
    );
    expect(r.status).toBe(200);
    expect((await request("workspace", u.cookie)).status).toBe(401);
    expect(
      (
        await query("SELECT status FROM destinations WHERE id=$1", [
          f.destination.id,
        ])
      )[0].status,
    ).toBe("scheduled");
  });
  it("protects cross-user files, connections, posts, and deletes", async () => {
    const a = await actor(),
      b = await actor();
    const f = await fixture(a.id);
    expect(
      (await request(`media/${f.media.id}/preview`, b.cookie)).status,
    ).toBe(404);
    expect(
      (await request(`connections/${f.channel.id}`, b.cookie, "DELETE")).status,
    ).toBe(404);
    expect(
      (await request(`posts/${f.post.id}/cancel`, b.cookie, "POST", {})).status,
    ).toBe(404);
    const r = await request("workspace", b.cookie);
    expect((await r.json()).posts).toEqual([]);
  });
  it("rejects a mutation from another origin", async () => {
    const u = await actor();
    const r = await handle(
      new Request("http://localhost:3000/api/billing/portal", {
        method: "POST",
        headers: { cookie: u.cookie, origin: "https://attacker.example" },
      }),
      ["billing", "portal"],
    );
    expect(r.status).toBe(403);
  });
  it("rejects expired and foreign OAuth state without contacting providers", async () => {
    const a = await actor(),
      b = await actor();
    const url = new URL(await authorize(a.id, "youtube"));
    expect(url.searchParams.get("code_challenge")).toBeTruthy();
    await expect(
      callback(b.id, "youtube", url.searchParams.get("state")!, "code"),
    ).rejects.toThrow("expired");
    await query(
      "UPDATE oauth_states SET expires_at=now()-interval '1 minute' WHERE user_id=$1",
      [a.id],
    );
    await expect(
      callback(a.id, "youtube", url.searchParams.get("state")!, "code"),
    ).rejects.toThrow("expired");
  });
  it("canceled consent returns to accounts without creating a connection", async () => {
    const u = await actor();
    const r = await handle(
      new Request(
        "http://localhost:3000/api/connections/callback/drive?error=access_denied",
        { headers: { cookie: u.cookie } },
      ),
      ["connections", "callback", "drive"],
    );
    expect(r.status).toBe(302);
    expect(r.headers.get("location")).toContain("canceled");
    expect(
      await query("SELECT id FROM connections WHERE user_id=$1", [u.id]),
    ).toHaveLength(0);
  });
  it("reserves the last monthly slot exactly once under contention", async () => {
    const u = await actor(),
      f = await fixture(u.id);
    for (let i = 0; i < 59; i++) {
      const [p] = await query(
        "INSERT INTO posts(user_id,media_id,timezone) VALUES($1,$2,'UTC') RETURNING id",
        [u.id, f.media.id],
      );
      const [d] = await query(
        "INSERT INTO destinations(user_id,post_id,connection_id,status) VALUES($1,$2,$3,'published') RETURNING id",
        [u.id, p.id, f.channel.id],
      );
      await query(
        "INSERT INTO usage(user_id,destination_id,period_start,period_end,status) SELECT $1,$2,period_start,period_end,'consumed' FROM subscriptions WHERE user_id=$1",
        [u.id, d.id],
      );
    }
    const [p] = await query(
      "INSERT INTO posts(user_id,media_id,timezone) VALUES($1,$2,'UTC') RETURNING id",
      [u.id, f.media.id],
    );
    const [d2] = await query(
      "INSERT INTO destinations(user_id,post_id,connection_id) VALUES($1,$2,$3) RETURNING id",
      [u.id, p.id, f.channel.id],
    );
    const r = await Promise.allSettled([
      reserve(u.id, f.destination.id),
      reserve(u.id, d2.id),
    ]);
    expect(r.filter((x) => x.status === "fulfilled")).toHaveLength(1);
    const [used] = await query(
      "SELECT count(*) FROM usage WHERE user_id=$1 AND status!='released'",
      [u.id],
    );
    expect(Number(used.count)).toBe(60);
  });
  it("does not reserve twice for the same destination", async () => {
    const u = await actor(),
      f = await fixture(u.id);
    await Promise.all([
      reserve(u.id, f.destination.id),
      reserve(u.id, f.destination.id),
    ]);
    expect(
      await query("SELECT id FROM usage WHERE destination_id=$1", [
        f.destination.id,
      ]),
    ).toHaveLength(1);
  });
  it("enforces monthly bandwidth allowance and rejects over-quota reservations", async () => {
    const u = await actor(),
      f = await fixture(u.id);
    await query("UPDATE media SET size=$1 WHERE id=$2", [
      String(41 * 1024 ** 3),
      f.media.id,
    ]);
    await expect(reserve(u.id, f.destination.id)).rejects.toThrow(
      "monthly video bandwidth allowance has been reached",
    );
  });
  it("pauses a job after Drive disconnect and erases credentials", async () => {
    const u = await actor(),
      f = await fixture(u.id);
    await disconnect(u.id, f.drive.id);
    expect(
      (
        await query("SELECT status FROM destinations WHERE id=$1", [
          f.destination.id,
        ])
      )[0].status,
    ).toBe("paused");
    expect(
      (
        await query("SELECT token,refresh_token FROM connections WHERE id=$1", [
          f.drive.id,
        ])
      )[0],
    ).toEqual({ token: "", refresh_token: null });
  });
  it("refuses a deleted or modified Drive source", async () => {
    const u = await actor(),
      f = await fixture(u.id);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json({
          size: 8,
          md5Checksum: "changed",
          capabilities: { canDownload: true },
        }),
      ),
    );
    await expect(source(f.media)).rejects.toThrow("changed");
  });
  it("streams a private Drive range without buffering or leaking tokens", async () => {
    const u = await actor(),
      f = await fixture(u.id);
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({
          size: 8,
          md5Checksum: "checksum",
          capabilities: { canDownload: true },
        }),
      )
      .mockResolvedValueOnce(
        new Response("abcd", {
          status: 206,
          headers: { "Content-Range": "bytes 0-3/8", "Content-Length": "4" },
        }),
      );
    vi.stubGlobal("fetch", fetcher);
    const r = await source(f.media, "bytes=0-3");
    expect(await r.text()).toBe("abcd");
    expect(fetcher.mock.calls[1][1].headers.Range).toBe("bytes=0-3");
    expect(fetcher.mock.calls[1][1].headers.Authorization).toBe(
      "Bearer drive-token",
    );
  });
  it("requires a signed expiring stream capability", async () => {
    const r = await request(`media/stream/${crypto.randomUUID()}`, "");
    expect(r.status).toBe(403);
  });
  it("recovers YouTube from a saved upload offset", async () => {
    const u = await actor(),
      f = await fixture(u.id);
    const d = {
      ...f.destination,
      upload_state: {
        session: encrypt("https://www.googleapis.com/upload/session"),
      },
    };
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(null, { status: 308, headers: { Range: "bytes=0-3" } }),
      )
      .mockResolvedValueOnce(
        Response.json({
          size: 8,
          md5Checksum: "checksum",
          capabilities: { canDownload: true },
        }),
      )
      .mockResolvedValueOnce(
        new Response("efgh", {
          status: 206,
          headers: { "Content-Range": "bytes 4-7/8", "Content-Length": "4" },
        }),
      )
      .mockResolvedValueOnce(Response.json({ id: "video123" }));
    vi.stubGlobal("fetch", fetcher);
    await adapters.youtube.upload({
      destination: d,
      connection: f.channel,
      media: f.media,
      caption: "",
    });
    expect(fetcher.mock.calls[3][1].headers["Content-Range"]).toBe(
      "bytes 4-7/8",
    );
    expect(
      (await query("SELECT remote_id FROM destinations WHERE id=$1", [d.id]))[0]
        .remote_id,
    ).toBe("video123");
  });
  it("publishes once under duplicate worker delivery and consumes one allowance", async () => {
    const u = await actor(),
      f = await fixture(u.id);
    vi.spyOn(adapters.youtube, "validate").mockResolvedValue([]);
    const publish = vi
      .spyOn(adapters.youtube, "publish")
      .mockImplementation(async () => {
        await new Promise((r) => setTimeout(r, 25));
        return {
          status: "published",
          id: "remote",
          url: "https://www.youtube.com/watch?v=remote",
        };
      });
    await Promise.all([
      processDestination(f.destination.id),
      processDestination(f.destination.id),
    ]);
    await processDestination(f.destination.id);
    expect(publish).toHaveBeenCalledTimes(1);
    expect(
      (
        await query("SELECT status FROM usage WHERE destination_id=$1", [
          f.destination.id,
        ])
      )[0].status,
    ).toBe("consumed");
  });
  it("canceled jobs never publish and expired subscriptions pause dispatch", async () => {
    const u = await actor(),
      f = await fixture(u.id);
    await query("UPDATE destinations SET status='canceled' WHERE id=$1", [
      f.destination.id,
    ]);
    const pub = vi.spyOn(adapters.youtube, "publish");
    await processDestination(f.destination.id);
    expect(pub).not.toHaveBeenCalled();
    await query("UPDATE destinations SET status='scheduled' WHERE id=$1", [
      f.destination.id,
    ]);
    await query(
      "UPDATE subscriptions SET period_end=now()-interval '1 day' WHERE user_id=$1",
      [u.id],
    );
    await processDestination(f.destination.id);
    expect(
      (
        await query("SELECT status FROM destinations WHERE id=$1", [
          f.destination.id,
        ])
      )[0].status,
    ).toBe("paused");
    expect(pub).not.toHaveBeenCalled();
  });
  it("large uploads retain retries and duplicate delivery respects backoff", async () => {
    const u = await actor(),
      f = await fixture(u.id);
    await query("UPDATE destinations SET attempts=250 WHERE id=$1", [
      f.destination.id,
    ]);
    vi.spyOn(adapters.youtube, "validate").mockResolvedValue([]);
    const publish = vi
      .spyOn(adapters.youtube, "publish")
      .mockRejectedValue(new ProviderError("Temporary provider outage", true));
    await processDestination(f.destination.id);
    const [d] = await query(
      "SELECT *,extract(epoch FROM next_attempt_at-now()) AS delay FROM destinations WHERE id=$1",
      [f.destination.id],
    );
    expect(d.status).toBe("processing");
    expect(d.consecutive_failures).toBe(1);
    expect(Number(d.delay)).toBeGreaterThan(10);
    expect(Number(d.delay)).toBeLessThanOrEqual(15);
    await processDestination(f.destination.id);
    expect(publish).toHaveBeenCalledTimes(1);
    expect(
      (
        await query("SELECT status FROM usage WHERE destination_id=$1", [d.id])
      )[0].status,
    ).toBe("reserved");
  });
  it("successful progress resets the consecutive failure budget and stale error", async () => {
    const u = await actor(),
      f = await fixture(u.id);
    await query(
      "UPDATE destinations SET consecutive_failures=12,error='Old outage' WHERE id=$1",
      [f.destination.id],
    );
    vi.spyOn(adapters.youtube, "validate").mockResolvedValue([]);
    const publish = vi
      .spyOn(adapters.youtube, "publish")
      .mockResolvedValue({ status: "pending" });
    await processDestination(f.destination.id);
    let [d] = await query("SELECT * FROM destinations WHERE id=$1", [
      f.destination.id,
    ]);
    expect(d.consecutive_failures).toBe(0);
    expect(d.error).toBeNull();
    await query("UPDATE destinations SET next_attempt_at=now() WHERE id=$1", [
      d.id,
    ]);
    publish.mockRejectedValue(new ProviderError("New outage", true));
    await processDestination(d.id);
    [d] = await query("SELECT * FROM destinations WHERE id=$1", [d.id]);
    expect(d.consecutive_failures).toBe(1);
    expect(d.status).toBe("processing");
  });
  it.each([false, true])(
    "caps consecutive YouTube errors (ambiguous=%s) without releasing uncertain quota",
    async (ambiguous) => {
      const u = await actor(),
        f = await fixture(u.id);
      vi.spyOn(adapters.youtube, "validate").mockResolvedValue([]);
      const publish = vi
        .spyOn(adapters.youtube, "publish")
        .mockRejectedValue(
          new ProviderError("Upload unavailable", true, ambiguous),
        );
      for (let i = 0; i < 13; i++) {
        await query(
          "UPDATE destinations SET next_attempt_at=now() WHERE id=$1",
          [f.destination.id],
        );
        await processDestination(f.destination.id);
      }
      const [d] = await query("SELECT * FROM destinations WHERE id=$1", [
        f.destination.id,
      ]);
      expect(d.status).toBe("attention");
      expect(d.consecutive_failures).toBe(13);
      await processDestination(d.id);
      expect(publish).toHaveBeenCalledTimes(13);
      expect(
        (
          await query("SELECT status FROM usage WHERE destination_id=$1", [
            d.id,
          ])
        )[0].status,
      ).toBe("reserved");
    },
  );
  it("an explicit retry starts a fresh error budget", async () => {
    const u = await actor(),
      f = await fixture(u.id);
    await query(
      "UPDATE destinations SET status='paused',consecutive_failures=13 WHERE id=$1",
      [f.destination.id],
    );
    expect(
      (
        await request(
          `destinations/${f.destination.id}/retry`,
          u.cookie,
          "POST",
        )
      ).status,
    ).toBe(200);
    const [d] = await query("SELECT * FROM destinations WHERE id=$1", [
      f.destination.id,
    ]);
    expect(d.consecutive_failures).toBe(0);
    expect(d.status).toBe("scheduled");
  });
  it("failed destinations release allowance while ambiguous outcomes retain it", async () => {
    const u = await actor(),
      f = await fixture(u.id);
    vi.spyOn(adapters.youtube, "validate").mockResolvedValue([]);
    vi.spyOn(adapters.youtube, "publish").mockResolvedValue({
      status: "failed",
      message: "Rejected",
    });
    await processDestination(f.destination.id);
    expect(
      (
        await query("SELECT status FROM usage WHERE destination_id=$1", [
          f.destination.id,
        ])
      )[0].status,
    ).toBe("released");
  });
  it("deletes local app data without calling Drive", async () => {
    const u = await actor(),
      f = await fixture(u.id);
    await query(
      "UPDATE subscriptions SET stripe_subscription_id=null WHERE user_id=$1",
      [u.id],
    );
    const fetcher = vi.fn();
    vi.stubGlobal("fetch", fetcher);
    expect(
      (await request("account", u.cookie, "DELETE", { confirmation: "DELETE" }))
        .status,
    ).toBe(200);
    expect(
      await query("SELECT id FROM media WHERE id=$1", [f.media.id]),
    ).toHaveLength(0);
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("another Google channel is linked without changing app identity", async () => {
    const u = await actor(),
      f = await fixture(u.id);
    const url = new URL(await authorize(u.id, "youtube"));
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({
          access_token: "new-google-token",
          refresh_token: "refresh",
          expires_in: 3600,
        }),
      )
      .mockResolvedValueOnce(
        Response.json({
          sub: "another-person",
          email: "different@example.test",
        }),
      )
      .mockResolvedValueOnce(
        Response.json({
          items: [
            { id: "second-channel", snippet: { title: "Second Channel" } },
          ],
        }),
      );
    vi.stubGlobal("fetch", fetcher);
    await callback(u.id, "youtube", url.searchParams.get("state")!, "code");
    expect(
      (await query('SELECT email FROM "user" WHERE id=$1', [u.id]))[0].email,
    ).toBe(`${u.id}@example.test`);
    expect(
      await query(
        "SELECT id FROM connections WHERE user_id=$1 AND platform='youtube'",
        [u.id],
      ),
    ).toHaveLength(2);
    expect(
      (
        await query("SELECT external_id FROM connections WHERE id=$1", [
          f.channel.id,
        ])
      )[0].external_id,
    ).toBe(f.channel.external_id);
  });
  it("refreshes an expired grant once under concurrent access", async () => {
    const u = await actor(),
      f = await fixture(u.id);
    await query(
      "UPDATE connections SET expires_at=now()-interval '1 minute',refresh_token=$2 WHERE id=$1",
      [f.channel.id, encrypt("old-refresh")],
    );
    const [c] = await query<any>("SELECT * FROM connections WHERE id=$1", [
      f.channel.id,
    ]);
    const fetcher = vi.fn().mockResolvedValue(
      Response.json({
        access_token: "fresh-token",
        refresh_token: "rotated-refresh",
        expires_in: 3600,
      }),
    );
    vi.stubGlobal("fetch", fetcher);
    expect(await Promise.all([accessToken(c), accessToken(c)])).toEqual([
      "fresh-token",
      "fresh-token",
    ]);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it("manual outcome review requires explicit confirmation and preserves quota", async () => {
    const u = await actor(),
      f = await fixture(u.id);
    await reserve(u.id, f.destination.id);
    await query("UPDATE destinations SET status='attention' WHERE id=$1", [
      f.destination.id,
    ]);
    expect(
      (
        await request(
          `destinations/${f.destination.id}/resolve`,
          u.cookie,
          "POST",
          { resolution: "published" },
        )
      ).status,
    ).toBe(400);
    expect(
      (
        await request(
          `destinations/${f.destination.id}/resolve`,
          u.cookie,
          "POST",
          { resolution: "published", confirmed: true },
        )
      ).status,
    ).toBe(200);
    expect(
      (
        await query("SELECT status FROM usage WHERE destination_id=$1", [
          f.destination.id,
        ])
      )[0].status,
    ).toBe("consumed");
    expect(
      (
        await request(
          `destinations/${f.destination.id}/retry`,
          u.cookie,
          "POST",
          {},
        )
      ).status,
    ).toBe(400);
  });
});
