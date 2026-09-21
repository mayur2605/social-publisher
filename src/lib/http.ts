import { ProviderError } from "./types";
export async function request(url: string, init: RequestInit = {}) {
  let r: Response;
  try {
    r = await fetch(url, {
      ...init,
      signal: init.signal ?? AbortSignal.timeout(60000),
    });
  } catch {
    throw new ProviderError(
      "The platform connection timed out.",
      true,
      init.method === "POST",
    );
  }
  if (!r.ok) {
    const status = r.status;
    await r.body?.cancel();
    throw new ProviderError(
      status === 401 || status === 403
        ? "The platform denied access. Reconnect the account or check its permissions."
        : status === 429
          ? "The platform rate limit was reached."
          : `The platform returned HTTP ${status}.`,
      status === 429 || status >= 500,
      !!init.method && init.method !== "GET" && status >= 500,
    );
  }
  return r;
}
export async function json<T = any>(
  url: string,
  init: RequestInit = {},
): Promise<T> {
  const r = await request(url, init);
  const data = await r.json();
  if (data.error?.code && data.error.code !== "ok")
    throw new ProviderError(
      `Platform error: ${String(data.error.code)
        .replace(/[^a-zA-Z0-9_]/g, "")
        .slice(0, 80)}`,
      /rate_limit|internal/.test(data.error.code),
    );
  return data;
}
export const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });
export function uploadHost(
  url: string,
  platform: "youtube" | "tiktok" | "facebook",
) {
  const u = new URL(url);
  const hosts =
    platform === "youtube"
      ? ["www.googleapis.com", "upload.youtube.com"]
      : platform === "tiktok"
        ? ["open-upload.tiktokapis.com"]
        : ["rupload.facebook.com"];
  if (u.protocol !== "https:" || !hosts.includes(u.hostname))
    throw new ProviderError("Platform returned an unexpected upload host.");
  return url;
}
