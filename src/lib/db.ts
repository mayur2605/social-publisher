import { Pool, type PoolClient, type QueryResultRow } from "pg";
const globalDb = globalThis as unknown as { publisherPool?: Pool };
export const pool =
  globalDb.publisherPool ??
  new Pool({ connectionString: process.env.DATABASE_URL, max: 10 });
if (process.env.NODE_ENV !== "production") globalDb.publisherPool = pool;
export async function query<T extends QueryResultRow = QueryResultRow>(
  sql: string,
  values: unknown[] = [],
): Promise<T[]> {
  return (await pool.query<T>(sql, values)).rows;
}
export async function tx<T>(
  fn: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const c = await pool.connect();
  try {
    await c.query("BEGIN");
    const result = await fn(c);
    await c.query("COMMIT");
    return result;
  } catch (e) {
    await c.query("ROLLBACK");
    throw e;
  } finally {
    c.release();
  }
}
