import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  createHmac,
  timingSafeEqual,
} from "node:crypto";
import { required } from "./env";
function key() {
  const k = Buffer.from(required("TOKEN_ENCRYPTION_KEY"), "base64");
  if (k.length !== 32)
    throw new Error("TOKEN_ENCRYPTION_KEY must be 32 bytes, base64 encoded");
  return k;
}
export function encrypt(value: string) {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", key(), iv);
  return [
    "v1",
    iv.toString("base64url"),
    Buffer.concat([c.update(value, "utf8"), c.final()]).toString("base64url"),
    c.getAuthTag().toString("base64url"),
  ].join(".");
}
export function decrypt(value: string) {
  const [v, iv, data, tag] = value.split(".");
  if (v !== "v1" || !tag) throw new Error("Invalid encrypted value");
  const c = createDecipheriv(
    "aes-256-gcm",
    key(),
    Buffer.from(iv, "base64url"),
  );
  c.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([
    c.update(Buffer.from(data, "base64url")),
    c.final(),
  ]).toString();
}
export function signMedia(id: string, expires: number) {
  return createHmac("sha256", key())
    .update(`${id}:${expires}`)
    .digest("base64url");
}
export function verifyMedia(
  id: string,
  expires: number,
  signature: string,
  now = Date.now(),
) {
  if (
    !Number.isSafeInteger(expires) ||
    expires < now ||
    expires > now + 25 * 60 * 60 * 1000
  )
    return false;
  const a = Buffer.from(signMedia(id, expires));
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}
