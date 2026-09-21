import { betterAuth, type BetterAuthOptions } from "better-auth";
import { pool } from "./db";
import { appUrl } from "./env";
let instance: ReturnType<typeof betterAuth> | undefined;
export function getAuth() {
  const options: BetterAuthOptions = {
    database: pool,
    baseURL: appUrl(),
    secret: process.env.BETTER_AUTH_SECRET,
    trustedOrigins: [appUrl()],
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID || "",
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        prompt: "select_account",
      },
    },
    account: { encryptOAuthTokens: true, accountLinking: { enabled: false } },
    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
      cookieCache: { enabled: false },
    },
    advanced: { useSecureCookies: appUrl().startsWith("https:") },
    rateLimit: { enabled: true, storage: "database", window: 60, max: 60 },
  };
  return (instance ??= betterAuth(options));
}
