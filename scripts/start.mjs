import { cp, access } from "node:fs/promises";
import nextEnv from "@next/env";
nextEnv.loadEnvConfig(process.cwd());
process.env.HOSTNAME = process.env.APP_BIND_HOST || "0.0.0.0";
try {
  await access(".next/standalone/server.js");
} catch {
  console.error("Run npm run build before starting the production server.");
  process.exit(1);
}
await cp("public", ".next/standalone/public", { recursive: true });
await cp(".next/static", ".next/standalone/.next/static", { recursive: true });
await import("../.next/standalone/server.js");
