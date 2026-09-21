import { query } from "./db";
import { accessToken, creatorInfo, graph } from "./connections";
import { source } from "./drive";
import { json, request, bearer, uploadHost } from "./http";
import { encrypt, decrypt, signMedia } from "./crypto";
import { appUrl } from "./env";
import {
  ProviderError,
  type Connection,
  type Destination,
  type Media,
  type Options,
} from "./types";
import { validateMedia } from "./validation";
export type PublishResult = {
  status: "pending" | "published" | "failed" | "attention";
  id?: string;
  url?: string;
  message?: string;
};
export interface Context {
  destination: Destination;
  connection: Connection;
  media: Media;
  caption: string;
}
export interface PlatformAdapter {
  validate(ctx: Context): Promise<string[]>;
  upload(ctx: Context): Promise<PublishResult>;
  publish(ctx: Context): Promise<PublishResult>;
  reconcile(ctx: Context): Promise<PublishResult>;
}
async function checkpoint(
  d: Destination,
  state: Record<string, any>,
  remoteId?: string,
) {
  d.upload_state = { ...d.upload_state, ...state };
  if (remoteId) d.remote_id = remoteId;
  await query(
    "UPDATE destinations SET upload_state=$2,remote_id=$3,updated_at=now() WHERE id=$1",
    [d.id, d.upload_state, d.remote_id],
  );
}
function signedSource(d: Destination) {
  const expires = Date.now() + 24 * 60 * 60 * 1000;
  return `${appUrl()}/api/media/stream/${d.id}?expires=${expires}&signature=${signMedia(d.id, expires)}`;
}
async function streamUpload(
  url: string,
  headers: Record<string, string>,
  media: Media,
  start: number,
  end: number,
) {
  const data = await source(media, `bytes=${start}-${end}`);
  if (
    data.status !== 206 ||
    data.headers.get("content-range") !== `bytes ${start}-${end}/${media.size}`
  ) {
    await data.body?.cancel();
    throw new ProviderError("Drive returned an unexpected byte range.");
  }
  try {
    return await fetch(url, {
      method: "PUT",
      headers: {
        ...headers,
        "Content-Length": String(end - start + 1),
        "Content-Range": `bytes ${start}-${end}/${media.size}`,
      },
      body: data.body,
      duplex: "half",
      signal: AbortSignal.timeout(120000),
    } as RequestInit);
  } catch {
    throw new ProviderError(
      "Upload acknowledgement was lost; checking platform status.",
      true,
      true,
    );
  }
}
async function youtube(ctx: Context): Promise<PublishResult> {
  const { destination: d, connection: c, media: m } = ctx;
  const token = await accessToken(c);
  const o = d.options;
  if (d.remote_id) {
    const data = await json(
      `https://www.googleapis.com/youtube/v3/videos?part=status,processingDetails&id=${encodeURIComponent(d.remote_id)}`,
      { headers: bearer(token) },
    );
    const video = data.items?.[0];
    if (!video)
      return {
        status: "attention",
        message:
          "YouTube has not returned this upload. Check the channel before retrying.",
      };
    if (["failed", "rejected", "deleted"].includes(video.status?.uploadStatus))
      return {
        status: "failed",
        message: "YouTube rejected or removed this upload.",
      };
    if (video.status?.uploadStatus === "processed")
      return {
        status: "published",
        id: d.remote_id,
        url: `https://www.youtube.com/watch?v=${d.remote_id}`,
      };
    return { status: "pending" };
  }
  if (!d.upload_state.session) {
    const r = await request(
      "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
      {
        method: "POST",
        headers: {
          ...bearer(token),
          "Content-Type": "application/json",
          "X-Upload-Content-Length": String(m.size),
          "X-Upload-Content-Type": m.mime_type,
        },
        body: JSON.stringify({
          snippet: {
            title: o.title,
            description: o.description ?? ctx.caption,
            categoryId: "22",
          },
          status: {
            privacyStatus: o.privacy,
            selfDeclaredMadeForKids: o.madeForKids,
          },
        }),
      },
    );
    const session = r.headers.get("Location");
    if (!session)
      throw new ProviderError("YouTube did not return an upload session.");
    uploadHost(session, "youtube");
    await checkpoint(d, { session: encrypt(session) });
  }
  const session = uploadHost(decrypt(d.upload_state.session), "youtube");
  // Query the server offset before every chunk, including after a worker restart.
  const status = await fetch(session, {
    method: "PUT",
    headers: {
      ...bearer(token),
      "Content-Length": "0",
      "Content-Range": `bytes */${m.size}`,
    },
    signal: AbortSignal.timeout(60000),
  });
  if (status.ok) {
    const result = await status.json();
    if (!result.id)
      return {
        status: "attention",
        message: "YouTube upload completed without a video ID.",
      };
    await checkpoint(d, { complete: true }, result.id);
    return { status: "pending" };
  }
  if (status.status !== 308) {
    await status.body?.cancel();
    if (status.status === 404 || status.status === 410)
      return {
        status: "attention",
        message:
          "YouTube upload session expired. Check the channel before creating a new post.",
      };
    throw new ProviderError(
      `YouTube upload status returned HTTP ${status.status}.`,
      true,
    );
  }
  const range = status.headers.get("Range");
  await status.body?.cancel();
  const start = range ? Number(range.split("-").at(-1)) + 1 : 0;
  const end = Math.min(start + 8 * 1024 * 1024, Number(m.size)) - 1;
  if (start > end)
    return {
      status: "attention",
      message: "YouTube has all bytes but has not confirmed the video ID.",
    };
  await checkpoint(d, { sending: true });
  const response = await streamUpload(
    session,
    { ...bearer(token), "Content-Type": m.mime_type },
    m,
    start,
    end,
  );
  if (response.ok) {
    const result = await response.json();
    if (result.id)
      await checkpoint(d, { complete: true, sending: false }, result.id);
  } else if (response.status !== 308) {
    await response.body?.cancel();
    throw new ProviderError(
      `YouTube upload returned HTTP ${response.status}.`,
      true,
      true,
    );
  } else await response.body?.cancel();
  return { status: "pending" };
}
async function tiktok(ctx: Context): Promise<PublishResult> {
  const { destination: d, connection: c, media: m } = ctx;
  const token = await accessToken(c),
    o = d.options;
  if (!d.remote_id) {
    if (d.upload_state.initializing)
      return {
        status: "attention",
        message:
          "TikTok initialization was interrupted. Verify your TikTok account before creating another post.",
      };
    const errors = validateMedia(
      m,
      "tiktok",
      o,
      ctx.caption,
      await creatorInfo(c),
    );
    if (errors.length) return { status: "failed", message: errors.join(" ") };
    const chunk = 10 * 1024 * 1024,
      count = Math.max(1, Math.floor(Number(m.size) / chunk)),
      size = count === 1 ? Number(m.size) : chunk;
    await checkpoint(d, { initializing: true });
    const r = await json(
      "https://open.tiktokapis.com/v2/post/publish/video/init/",
      {
        method: "POST",
        headers: { ...bearer(token), "Content-Type": "application/json" },
        body: JSON.stringify({
          post_info: {
            title: o.description ?? ctx.caption,
            privacy_level: o.privacy,
            disable_comment: !o.allowComment,
            disable_duet: !o.allowDuet,
            disable_stitch: !o.allowStitch,
            brand_content_toggle: !!o.branded,
            brand_organic_toggle: !!o.ownBrand,
          },
          source_info: {
            source: "FILE_UPLOAD",
            video_size: Number(m.size),
            chunk_size: size,
            total_chunk_count: count,
          },
        }),
      },
    );
    uploadHost(r.data.upload_url, "tiktok");
    await checkpoint(
      d,
      {
        initializing: false,
        session: encrypt(r.data.upload_url),
        offset: 0,
        chunk: size,
        count,
        sending: false,
      },
      r.data.publish_id,
    );
  }
  const info = await json(
    "https://open.tiktokapis.com/v2/post/publish/status/fetch/",
    {
      method: "POST",
      headers: { ...bearer(token), "Content-Type": "application/json" },
      body: JSON.stringify({ publish_id: d.remote_id }),
    },
  );
  if (info.data.status === "PUBLISH_COMPLETE")
    return {
      status: "published",
      id:
        info.data.publicaly_available_post_id?.[0] ||
        info.data.publicly_available_post_id?.[0] ||
        d.remote_id!,
    };
  if (info.data.status === "FAILED")
    return {
      status: "failed",
      message: `TikTok rejected this post (${String(info.data.fail_reason || "unknown").slice(0, 100)}).`,
    };
  if (
    info.data.status !== "PROCESSING_UPLOAD" ||
    d.upload_state.offset >= Number(m.size)
  )
    return { status: "pending" };
  if (d.upload_state.sending)
    return {
      status: "attention",
      message:
        "TikTok did not acknowledge the last chunk. Publication status will need to be checked before retrying.",
    };
  const start = d.upload_state.offset;
  const remaining = Number(m.size) - start;
  const end =
    remaining < 2 * d.upload_state.chunk
      ? Number(m.size) - 1
      : start + d.upload_state.chunk - 1;
  await checkpoint(d, { sending: true });
  const result = await streamUpload(
    uploadHost(decrypt(d.upload_state.session), "tiktok"),
    { "Content-Type": m.mime_type },
    m,
    start,
    end,
  );
  if (!result.ok) {
    await result.body?.cancel();
    throw new ProviderError(
      `TikTok upload returned HTTP ${result.status}.`,
      false,
      true,
    );
  }
  await result.body?.cancel();
  await checkpoint(d, { sending: false, offset: end + 1 });
  return { status: "pending" };
}
async function instagram(ctx: Context): Promise<PublishResult> {
  const { destination: d, connection: c } = ctx;
  const token = await accessToken(c);
  if (!d.remote_id) {
    const data = await json(`${graph()}/${c.external_id}/media`, {
      method: "POST",
      headers: bearer(token),
      body: new URLSearchParams({
        media_type: "REELS",
        video_url: signedSource(d),
        caption: d.options.description ?? ctx.caption,
        share_to_feed: "true",
      }),
    });
    await checkpoint(d, { phase: "processing" }, data.id);
    return { status: "pending" };
  }
  const info = await json(
    `${graph()}/${d.remote_id}?fields=status_code,status`,
    { headers: bearer(token) },
  );
  if (info.status_code === "PUBLISHED")
    return {
      status: "published",
      id: d.upload_state.publishedId || d.remote_id,
      url: d.upload_state.permalink,
    };
  if (["ERROR", "EXPIRED"].includes(info.status_code))
    return {
      status: "failed",
      message: "Instagram could not process this video container.",
    };
  if (info.status_code !== "FINISHED") return { status: "pending" };
  if (d.upload_state.phase === "publishing")
    return {
      status: "attention",
      message:
        "Instagram has not confirmed the publish request. Check the account before publishing again.",
    };
  await checkpoint(d, { phase: "publishing" });
  const result = await json(`${graph()}/${c.external_id}/media_publish`, {
    method: "POST",
    headers: bearer(token),
    body: new URLSearchParams({ creation_id: d.remote_id }),
  });
  await checkpoint(d, { publishedId: result.id });
  const item = await json(`${graph()}/${result.id}?fields=permalink`, {
    headers: bearer(token),
  });
  await checkpoint(d, { permalink: item.permalink });
  return { status: "published", id: result.id, url: item.permalink };
}
async function facebook(ctx: Context): Promise<PublishResult> {
  const { destination: d, connection: c } = ctx;
  const token = await accessToken(c);
  const reel = d.options.format === "reel";
  if (!d.remote_id) {
    if (d.upload_state.initializing)
      return {
        status: "attention",
        message:
          "Facebook did not confirm initialization. Check the Page before creating a new post.",
      };
    await checkpoint(d, { initializing: true });
    if (reel) {
      const r = await json(`${graph()}/${c.external_id}/video_reels`, {
        method: "POST",
        headers: bearer(token),
        body: new URLSearchParams({ upload_phase: "start" }),
      });
      uploadHost(r.upload_url, "facebook");
      await checkpoint(
        d,
        {
          initializing: false,
          session: encrypt(r.upload_url),
          phase: "created",
        },
        r.video_id,
      );
    } else {
      const r = await json(`${graph()}/${c.external_id}/videos`, {
        method: "POST",
        headers: bearer(token),
        body: new URLSearchParams({
          file_url: signedSource(d),
          description: d.options.description ?? ctx.caption,
          title: d.options.title || "",
          published: "true",
        }),
      });
      await checkpoint(d, { initializing: false, phase: "processing" }, r.id);
    }
    return { status: "pending" };
  }
  if (reel && d.upload_state.phase === "created") {
    await checkpoint(d, { phase: "uploading" });
    await json(uploadHost(decrypt(d.upload_state.session), "facebook"), {
      method: "POST",
      headers: { Authorization: `OAuth ${token}`, file_url: signedSource(d) },
    });
    await checkpoint(d, { phase: "uploaded" });
    return { status: "pending" };
  }
  const info = await json(
    `${graph()}/${d.remote_id}?fields=status,permalink_url`,
    { headers: bearer(token) },
  );
  const status = info.status;
  if (
    status?.publishing_phase?.status === "complete" ||
    (!reel && status?.video_status === "ready")
  )
    return {
      status: "published",
      id: d.remote_id,
      url: info.permalink_url
        ? new URL(info.permalink_url, "https://www.facebook.com").toString()
        : `https://www.facebook.com/${d.remote_id}`,
    };
  if (
    status?.video_status === "error" ||
    [
      status?.uploading_phase?.status,
      status?.processing_phase?.status,
      status?.publishing_phase?.status,
    ].includes("error")
  )
    return {
      status: "failed",
      message: "Facebook could not process this video.",
    };
  if (
    reel &&
    ["uploaded", "uploading"].includes(d.upload_state.phase) &&
    status?.uploading_phase?.status === "complete"
  ) {
    await checkpoint(d, { phase: "publishing" });
    await json(`${graph()}/${c.external_id}/video_reels`, {
      method: "POST",
      headers: bearer(token),
      body: new URLSearchParams({
        upload_phase: "finish",
        video_id: d.remote_id,
        video_state: "PUBLISHED",
        description: d.options.description ?? ctx.caption,
        title: d.options.title || "",
      }),
    });
    await checkpoint(d, { phase: "processing" });
  }
  return { status: "pending" };
}
const run = { youtube, tiktok, instagram, facebook };
export const adapters: Record<
  Exclude<Connection["platform"], "drive">,
  PlatformAdapter
> = Object.fromEntries(
  Object.entries(run).map(([platform, fn]) => [
    platform,
    {
      validate: async (ctx: Context) => {
        const errors = validateMedia(
          ctx.media,
          ctx.connection.platform,
          ctx.destination.options,
          ctx.caption,
          platform === "tiktok" ? await creatorInfo(ctx.connection) : undefined,
        );
        if (
          platform === "tiktok" &&
          process.env.TIKTOK_PUBLIC_APPROVED !== "true" &&
          ctx.destination.options.privacy !== "SELF_ONLY"
        )
          errors.push(
            "TikTok public publishing is not approved. Choose Only me.",
          );
        if (
          platform === "youtube" &&
          process.env.YOUTUBE_PUBLIC_APPROVED !== "true" &&
          ctx.destination.options.privacy !== "private"
        )
          errors.push(
            "YouTube public publishing is not approved. Choose Private.",
          );
        return errors;
      },
      upload: fn,
      publish: fn,
      reconcile: fn,
    },
  ]),
) as any;
