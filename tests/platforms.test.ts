import { beforeAll, afterAll, afterEach, it, expect, vi } from "vitest";
import { pool, query } from "../src/lib/db";
import { adapters, type Context } from "../src/lib/publishers";
import { actor, fixture, prepareDatabase } from "./fixtures";
import { ProviderError } from "../src/lib/types";
import { checkout } from "../src/lib/billing";
beforeAll(prepareDatabase);
afterAll(() => pool.end());
afterEach(() => vi.unstubAllGlobals());
async function context(platform: string): Promise<Context> {
  const u = await actor(),
    f = await fixture(u.id, platform);
  return {
    connection: f.channel,
    destination: f.destination,
    media: f.media,
    caption: "Original video",
  };
}
it("Instagram persists the container before publishing and reconciles publication", async () => {
  const ctx = await context("instagram");
  const fetcher = vi
    .fn()
    .mockResolvedValueOnce(Response.json({ id: "container-1" }))
    .mockResolvedValueOnce(Response.json({ status_code: "FINISHED" }))
    .mockResolvedValueOnce(Response.json({ id: "ig-post-1" }))
    .mockResolvedValueOnce(
      Response.json({ permalink: "https://www.instagram.com/reel/one/" }),
    );
  vi.stubGlobal("fetch", fetcher);
  expect((await adapters.instagram.upload(ctx)).status).toBe("pending");
  expect(ctx.destination.remote_id).toBe("container-1");
  const form = fetcher.mock.calls[0][1].body as URLSearchParams;
  const stream = new URL(form.get("video_url")!);
  expect(stream.pathname).toBe(`/api/media/stream/${ctx.destination.id}`);
  expect(stream.searchParams.get("signature")).toBeTruthy();
  expect(form.toString()).not.toContain("drive-token");
  expect(await adapters.instagram.publish(ctx)).toMatchObject({
    status: "published",
    id: "ig-post-1",
  });
  expect(
    (
      await query("SELECT upload_state FROM destinations WHERE id=$1", [
        ctx.destination.id,
      ])
    )[0].upload_state.publishedId,
  ).toBe("ig-post-1");
});
it("Instagram does not blindly repeat an interrupted publish request", async () => {
  const ctx = await context("instagram");
  ctx.destination.remote_id = "container-2";
  ctx.destination.upload_state = { phase: "publishing" };
  const fetcher = vi
    .fn()
    .mockResolvedValue(Response.json({ status_code: "FINISHED" }));
  vi.stubGlobal("fetch", fetcher);
  expect((await adapters.instagram.reconcile(ctx)).status).toBe("attention");
  expect(fetcher).toHaveBeenCalledTimes(1);
});
it("TikTok persists publish ID, streams bytes and confirms asynchronous success", async () => {
  const ctx = await context("tiktok");
  ctx.destination.options = { privacy: "SELF_ONLY", consent: true };
  const fetcher = vi
    .fn()
    .mockResolvedValueOnce(
      Response.json({
        data: {
          privacy_level_options: ["SELF_ONLY"],
          max_video_post_duration_sec: 60,
        },
        error: { code: "ok" },
      }),
    )
    .mockResolvedValueOnce(
      Response.json({
        data: {
          publish_id: "tt-job",
          upload_url: "https://open-upload.tiktokapis.com/video/upload",
        },
        error: { code: "ok" },
      }),
    )
    .mockResolvedValueOnce(
      Response.json({
        data: { status: "PROCESSING_UPLOAD" },
        error: { code: "ok" },
      }),
    )
    .mockResolvedValueOnce(
      Response.json({
        size: 8,
        md5Checksum: "checksum",
        capabilities: { canDownload: true },
      }),
    )
    .mockResolvedValueOnce(
      new Response("12345678", {
        status: 206,
        headers: { "Content-Range": "bytes 0-7/8", "Content-Length": "8" },
      }),
    )
    .mockResolvedValueOnce(new Response(null, { status: 201 }))
    .mockResolvedValueOnce(
      Response.json({
        data: {
          status: "PUBLISH_COMPLETE",
          publicaly_available_post_id: ["tt-post"],
        },
        error: { code: "ok" },
      }),
    );
  vi.stubGlobal("fetch", fetcher);
  expect((await adapters.tiktok.upload(ctx)).status).toBe("pending");
  expect(ctx.destination.remote_id).toBe("tt-job");
  expect(ctx.destination.upload_state.offset).toBe(8);
  expect(await adapters.tiktok.reconcile(ctx)).toMatchObject({
    status: "published",
    id: "tt-post",
  });
});
it("TikTok keeps a lost upload acknowledgement for review", async () => {
  const ctx = await context("tiktok");
  ctx.destination.remote_id = "tt-job";
  ctx.destination.upload_state = { sending: true, offset: 0 };
  const fetcher = vi.fn().mockResolvedValue(
    Response.json({
      data: { status: "PROCESSING_UPLOAD" },
      error: { code: "ok" },
    }),
  );
  vi.stubGlobal("fetch", fetcher);
  expect((await adapters.tiktok.reconcile(ctx)).status).toBe("attention");
  expect(fetcher).toHaveBeenCalledTimes(1);
});
it("Facebook Reel follows start, upload, finish and status phases", async () => {
  const ctx = await context("facebook");
  ctx.destination.options = { format: "reel" };
  const fetcher = vi
    .fn()
    .mockResolvedValueOnce(
      Response.json({
        video_id: "fb-reel",
        upload_url: "https://rupload.facebook.com/video-upload",
      }),
    )
    .mockResolvedValueOnce(Response.json({ success: true }))
    .mockResolvedValueOnce(
      Response.json({ status: { uploading_phase: { status: "complete" } } }),
    )
    .mockResolvedValueOnce(Response.json({ success: true }))
    .mockResolvedValueOnce(
      Response.json({
        status: { publishing_phase: { status: "complete" } },
        permalink_url: "/reel/fb-reel",
      }),
    );
  vi.stubGlobal("fetch", fetcher);
  for (let i = 0; i < 3; i++)
    expect((await adapters.facebook.publish(ctx)).status).toBe("pending");
  expect(await adapters.facebook.reconcile(ctx)).toMatchObject({
    status: "published",
    url: "https://www.facebook.com/reel/fb-reel",
  });
  expect(
    (fetcher.mock.calls[3][1].body as URLSearchParams).get("upload_phase"),
  ).toBe("finish");
});
it("Facebook long video uses the video endpoint and waits for ready status", async () => {
  const ctx = await context("facebook");
  ctx.destination.options = { format: "video", title: "A longer film" };
  const fetcher = vi
    .fn()
    .mockResolvedValueOnce(Response.json({ id: "long-video" }))
    .mockResolvedValueOnce(
      Response.json({
        status: { video_status: "ready" },
        permalink_url: "/watch/long-video",
      }),
    );
  vi.stubGlobal("fetch", fetcher);
  expect((await adapters.facebook.upload(ctx)).status).toBe("pending");
  expect(fetcher.mock.calls[0][0]).toContain("/videos");
  expect((await adapters.facebook.reconcile(ctx)).status).toBe("published");
});
it("checkout requests reuse an open session instead of creating duplicate subscriptions", async () => {
  process.env.STRIPE_SECRET_KEY = "sk_test_fixture";
  process.env.STRIPE_PRICE_STARTER = "price_starter";
  const u = await actor();
  await fixture(u.id);
  await query(
    "UPDATE subscriptions SET status='incomplete',stripe_customer_id='cus_checkout',stripe_subscription_id=null WHERE user_id=$1",
    [u.id],
  );
  const fetcher = vi
    .fn()
    .mockResolvedValueOnce(
      Response.json({
        id: "cs_one",
        url: "https://checkout.stripe.com/c/pay/test",
        status: "open",
      }),
    )
    .mockResolvedValueOnce(
      Response.json({
        id: "cs_one",
        url: "https://checkout.stripe.com/c/pay/test",
        status: "open",
      }),
    );
  vi.stubGlobal("fetch", fetcher);
  const results = await Promise.all([
    checkout(u.id, "creator@example.test", "starter"),
    checkout(u.id, "creator@example.test", "starter"),
  ]);
  expect(results[0]).toBe(results[1]);
  expect(
    fetcher.mock.calls.filter((c) => c[1]?.method === "POST"),
  ).toHaveLength(1);
});
