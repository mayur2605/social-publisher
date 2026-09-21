import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    testTimeout: 20000,
    hookTimeout: 30000,
    fileParallelism: false,
    env: {
      DATABASE_URL:
        process.env.TEST_DATABASE_URL ||
        "postgresql://publisher@127.0.0.1:55437/publisher_test",
      BETTER_AUTH_URL: "http://localhost:3000",
      BETTER_AUTH_SECRET:
        "test-only-secret-with-more-than-thirty-two-characters",
      TOKEN_ENCRYPTION_KEY: Buffer.alloc(32, 7).toString("base64"),
      GOOGLE_CLIENT_ID: "test-google-client",
      GOOGLE_CLIENT_SECRET: "test-google-secret",
    },
  },
});
