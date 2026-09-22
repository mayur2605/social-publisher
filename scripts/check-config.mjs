import nextEnv from "@next/env";
nextEnv.loadEnvConfig(process.cwd());
const groups = {
  "Core app": [
    "DATABASE_URL",
    "BETTER_AUTH_URL",
    "BETTER_AUTH_SECRET",
    "TOKEN_ENCRYPTION_KEY",
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
  ],
  "Drive picker": ["GOOGLE_PICKER_API_KEY", "GOOGLE_PROJECT_NUMBER"],
  Meta: ["META_APP_ID", "META_APP_SECRET"],
  TikTok: ["TIKTOK_CLIENT_KEY", "TIKTOK_CLIENT_SECRET"],
  "Stripe test billing": [
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "STRIPE_PRICE_STARTER",
    "STRIPE_PRICE_CREATOR",
    "STRIPE_PRICE_PRO",
    "STRIPE_PRICE_STUDIO",
  ],
  "Public legal pages": ["LEGAL_ENTITY_NAME", "SUPPORT_EMAIL"],
};
let missing = false;
for (const [name, keys] of Object.entries(groups)) {
  const absent = keys.filter((k) => !process.env[k]);
  if (absent.length) missing = true;
  console.log(
    `${name}: ${absent.length ? "missing " + absent.join(", ") : "configured"}`,
  );
}
if (
  process.env.TOKEN_ENCRYPTION_KEY &&
  Buffer.from(process.env.TOKEN_ENCRYPTION_KEY, "base64").length !== 32
) {
  missing = true;
  console.error(
    "TOKEN_ENCRYPTION_KEY must contain 32 bytes encoded as base64.",
  );
}
if (
  process.env.BETTER_AUTH_SECRET &&
  process.env.BETTER_AUTH_SECRET.length < 32
) {
  missing = true;
  console.error("BETTER_AUTH_SECRET must be at least 32 characters.");
}
if (
  process.env.STRIPE_SECRET_KEY &&
  !process.env.STRIPE_SECRET_KEY.startsWith("sk_test_")
) {
  missing = true;
  console.error("This build accepts only Stripe test-mode keys.");
}
process.exitCode = missing ? 1 : 0;
