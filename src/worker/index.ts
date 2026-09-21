import nextEnv from "@next/env";
nextEnv.loadEnvConfig(process.cwd());
const { startWorker } = await import("../lib/jobs");
const stop = await startWorker();
console.log("Social Publisher worker is running.");
for (const signal of ["SIGTERM", "SIGINT"])
  process.on(signal, async () => {
    await stop();
    process.exit(0);
  });
