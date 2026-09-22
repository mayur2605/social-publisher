import { describe, it, expect } from "vitest";
import { encrypt, decrypt, signMedia, verifyMedia } from "../src/lib/crypto";
import { validateMedia, postSchema } from "../src/lib/validation";
import { entitled } from "../src/lib/plans";
const media = {
  size: "1048576",
  mime_type: "video/mp4",
  duration: 30,
  width: 1080,
  height: 1920,
};
describe("video and authorization safeguards", () => {
  it("encrypts tokens with unique authenticated ciphertext", () => {
    const a = encrypt("secret"),
      b = encrypt("secret");
    expect(a).not.toBe(b);
    expect(a).not.toContain("secret");
    expect(decrypt(a)).toBe("secret");
    const parts = a.split(".");
    parts[2] = "A" + parts[2].slice(1);
    expect(() => decrypt(parts.join("."))).toThrow();
  });
  it("binds signed media URLs to a job and expiration", () => {
    const exp = Date.now() + 60000,
      s = signMedia("job-a", exp);
    expect(verifyMedia("job-a", exp, s)).toBe(true);
    expect(verifyMedia("job-b", exp, s)).toBe(false);
    expect(verifyMedia("job-a", exp, s, exp + 1)).toBe(false);
    expect(verifyMedia("job-a", exp, "x")).toBe(false);
  });
  it("requires YouTube title, privacy and kids disclosure", () => {
    expect(validateMedia(media, "youtube", {}, "")).toHaveLength(3);
    expect(
      validateMedia(
        media,
        "youtube",
        { title: "Hello", privacy: "private", madeForKids: false },
        "",
      ),
    ).toEqual([]);
  });
  it("rejects oversized and too-long Reels without blocking eligible YouTube videos", () => {
    const long = { ...media, duration: 1800 };
    expect(validateMedia(long, "instagram", {}, "").length).toBeGreaterThan(0);
    expect(
      validateMedia(
        long,
        "youtube",
        { title: "Long video", privacy: "private", madeForKids: false },
        "",
      ),
    ).toEqual([]);
    expect(
      validateMedia(
        { ...media, size: String(3 * 1024 ** 3) },
        "youtube",
        {},
        "",
      ).join(),
    ).toContain("2 GB");
    // Studio plan (up to 10 GB) allows 5 GB for YouTube, but platform limits still reject for Instagram and TikTok
    const fiveGb = { ...media, size: String(5 * 1024 ** 3) };
    expect(
      validateMedia(
        fiveGb,
        "youtube",
        { title: "Big 4K Video", privacy: "private", madeForKids: false },
        "",
        undefined,
        10 * 1024 ** 3,
      ),
    ).toEqual([]);
    expect(
      validateMedia(
        fiveGb,
        "instagram",
        {},
        "",
        undefined,
        10 * 1024 ** 3,
      ).join(),
    ).toContain("1 GB");
    expect(
      validateMedia(
        fiveGb,
        "tiktok",
        { privacy: "SELF_ONLY", consent: true },
        "",
        undefined,
        10 * 1024 ** 3,
      ).join(),
    ).toContain("2 GB");
    expect(
      validateMedia(
        { ...media, size: String(11 * 1024 ** 3) },
        "youtube",
        {},
        "",
        undefined,
        10 * 1024 ** 3,
      ).join(),
    ).toContain("10 GB");
  });
  it("requires TikTok consent and respects live creator settings", () => {
    expect(
      validateMedia(
        media,
        "tiktok",
        {
          privacy: "SELF_ONLY",
          consent: true,
          branded: true,
          allowComment: true,
        },
        "",
        {
          privacy_level_options: ["SELF_ONLY"],
          max_video_post_duration_sec: 15,
          comment_disabled: true,
        },
      ).join(" "),
    ).toMatch(/Branded content/);
    expect(
      validateMedia(media, "tiktok", { privacy: "SELF_ONLY" }, "").join(),
    ).toContain("Agree");
  });
  it("rejects invalid timezones and empty destinations", () => {
    expect(
      postSchema.safeParse({
        mediaId: crypto.randomUUID(),
        caption: "",
        timezone: "Wrong/Zone",
        scheduledAt: null,
        mode: "now",
        destinations: [],
      }).success,
    ).toBe(false);
  });
  it("keeps canceled-at-period-end access but stops expired and unpaid accounts", () => {
    expect(
      entitled({ status: "active", period_end: new Date(Date.now() + 10000) }),
    ).toBe(true);
    expect(entitled({ status: "active", period_end: new Date(0) })).toBe(false);
    expect(
      entitled({
        status: "past_due",
        period_end: new Date(Date.now() + 10000),
      }),
    ).toBe(false);
  });
});
