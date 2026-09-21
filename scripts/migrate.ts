import nextEnv from "@next/env";
nextEnv.loadEnvConfig(process.cwd());
const { pool } = await import("../src/lib/db");
const { getAuth } = await import("../src/lib/auth");
const { getMigrations } = await import("better-auth/db/migration");
const fs = await import("node:fs/promises");
// Generate explicitly, review the SQL, then apply only checked-in migrations.
if (process.argv.includes("--generate-auth")) {
  const migration = await getMigrations(getAuth().options);
  const sql = await migration.compileMigrations();
  if (sql.trim() !== ";") {
    await fs.mkdir(".local", { recursive: true });
    await fs.writeFile(".local/better-auth-migration.sql", sql);
    console.log(
      "Generated .local/better-auth-migration.sql for review. Copy it to a new numbered migration before applying.",
    );
  }
  await pool.end();
  process.exit(0);
}
await pool.query(
  "CREATE TABLE IF NOT EXISTS app_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())",
);
for (const name of (await fs.readdir("migrations"))
  .filter((n) => /^\d+_/.test(n))
  .sort()) {
  const c = await pool.connect();
  try {
    await c.query("BEGIN");
    await c.query("SELECT pg_advisory_xact_lock(812919)");
    if (
      !(await c.query("SELECT 1 FROM app_migrations WHERE name=$1", [name]))
        .rowCount
    ) {
      await c.query(await fs.readFile(`migrations/${name}`, "utf8"));
      await c.query("INSERT INTO app_migrations(name) VALUES($1)", [name]);
      console.log(`Applied ${name}`);
    }
    await c.query("COMMIT");
  } catch (e) {
    await c.query("ROLLBACK");
    throw e;
  } finally {
    c.release();
  }
}
await pool.end();
