import { z } from "zod";
import type { Media, Options, Platform } from "./types";
export const optionSchema = z
  .object({
    title: z.string().max(100).optional(),
    description: z.string().max(5000).optional(),
    privacy: z.string().max(50).optional(),
    madeForKids: z.boolean().optional(),
    format: z.enum(["video", "reel"]).optional(),
    allowComment: z.boolean().optional(),
    allowDuet: z.boolean().optional(),
    allowStitch: z.boolean().optional(),
    commercial: z.boolean().optional(),
    ownBrand: z.boolean().optional(),
    branded: z.boolean().optional(),
    consent: z.boolean().optional(),
  })
  .strict();
export const postSchema = z.object({
  mediaId: z.string().uuid(),
  caption: z.string().max(5000),
  timezone: z.string().refine((v) => {
    try {
      new Intl.DateTimeFormat("en", { timeZone: v });
      return true;
    } catch {
      return false;
    }
  }, "Invalid timezone"),
  scheduledAt: z.string().datetime({ offset: true }).nullable(),
  mode: z.enum(["draft", "schedule", "now"]),
  destinations: z
    .array(z.object({ connectionId: z.string().uuid(), options: optionSchema }))
    .min(1)
    .max(25),
});
export function validateMedia(
  media: Pick<Media, "size" | "mime_type" | "duration" | "width" | "height">,
  platform: Platform,
  options: Options,
  caption: string,
  creator?: Record<string, any>,
  maxAllowedBytes: number = 2 * 1024 ** 3,
) {
  const errors: string[] = [];
  const bytes = Number(media.size);
  if (!["video/mp4", "video/quicktime"].includes(media.mime_type))
    errors.push("Use an MP4 or MOV video.");
  if (!Number.isFinite(bytes) || bytes <= 0 || bytes > maxAllowedBytes)
    errors.push(
      maxAllowedBytes > 2 * 1024 ** 3
        ? "The app accepts videos up to 10 GB."
        : "The app accepts videos up to 2 GB.",
    );
  if (
    !Number.isFinite(media.duration) ||
    media.duration <= 0 ||
    media.width <= 0 ||
    media.height <= 0
  )
    errors.push(
      "Video metadata is not ready. Try importing again after Drive finishes processing.",
    );
  if (platform === "youtube") {
    if (!options.title?.trim()) errors.push("YouTube needs a title.");
    if (!["private", "unlisted", "public"].includes(options.privacy || ""))
      errors.push("Choose YouTube visibility.");
    if (options.madeForKids === undefined)
      errors.push("Choose whether the video is made for kids.");
    if (media.duration > 43200)
      errors.push("YouTube videos cannot exceed 12 hours.");
  }
  if (platform === "instagram") {
    if (bytes > 1024 ** 3) errors.push("Instagram Reels must be at most 1 GB.");
    if (media.duration < 3 || media.duration > 900)
      errors.push("Instagram Reels must be between 3 seconds and 15 minutes.");
    if ((options.description ?? caption).length > 2200)
      errors.push("Instagram captions must be at most 2,200 characters.");
  }
  if (platform === "facebook") {
    if (options.format === "reel") {
      if (bytes > 1024 ** 3)
        errors.push(
          "Facebook Reels must be at most 1 GB; choose Video for longer content.",
        );
      if (media.duration < 3 || media.duration > 90)
        errors.push(
          "This Facebook Reels integration accepts 3–90 seconds; choose Video for longer content.",
        );
      if (media.height < media.width)
        errors.push("Use a portrait video for Facebook Reels.");
    }
  }
  if (platform === "tiktok") {
    if (bytes > 2 * 1024 ** 3) errors.push("TikTok accepts videos up to 2 GB.");
    if (!options.consent) errors.push("Agree to TikTok’s posting terms.");
    if (!options.privacy) errors.push("Choose TikTok privacy.");
    if ((options.description ?? caption).length > 2200)
      errors.push("TikTok captions must be at most 2,200 characters.");
    if (options.commercial && !options.ownBrand && !options.branded)
      errors.push("Choose the commercial content type.");
    if (options.branded && options.privacy === "SELF_ONLY")
      errors.push("Branded content cannot be private.");
    if (creator) {
      if (!creator.privacy_level_options?.includes(options.privacy))
        errors.push("TikTok privacy options changed. Review this destination.");
      if (media.duration > creator.max_video_post_duration_sec)
        errors.push("This video exceeds this TikTok account’s duration limit.");
      for (const [flag, permission] of [
        ["comment_disabled", "allowComment"],
        ["duet_disabled", "allowDuet"],
        ["stitch_disabled", "allowStitch"],
      ] as const)
        if (creator[flag] && options[permission])
          errors.push(
            `TikTok has disabled ${permission.replace("allow", "").toLowerCase()} for this account.`,
          );
    }
  }
  return errors;
}
