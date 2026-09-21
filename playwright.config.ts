import { defineConfig, devices } from "@playwright/test";
const env = {
  DATABASE_URL:
    process.env.TEST_DATABASE_URL ||
    "postgresql://publisher@127.0.0.1:55437/publisher_test",
  BETTER_AUTH_URL: "http://localhost:3100",
  BETTER_AUTH_SECRET: "test-only-secret-with-more-than-thirty-two-characters",
  TOKEN_ENCRYPTION_KEY: Buffer.alloc(32, 7).toString("base64"),
  GOOGLE_CLIENT_ID: "test-google-client",
  GOOGLE_CLIENT_SECRET: "test-google-secret",
  NEXT_TELEMETRY_DISABLED: "1",
};
Object.assign(process.env, env);
export default defineConfig({
  testDir: "tests/browser",
  fullyParallel: false,
  workers: 1,
  use: { baseURL: "http://localhost:3100", trace: "retain-on-failure" },
  projects: [
    {
      name: "desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 1000 },
      },
    },
    {
      name: "mobile",
      use: { ...devices["iPhone 13"], defaultBrowserType: "chromium" },
    },
  ],
  webServer: {
    command: "npm run dev -- --port 3100",
    url: "http://localhost:3100",
    reuseExistingServer: false,
    timeout: 60000,
    env,
  },
});
