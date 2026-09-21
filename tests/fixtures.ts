import type { Connection, Media, Destination } from "../src/lib/types";
import { randomUUID, createHmac } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { pool, query } from "../src/lib/db";
import { encrypt } from "../src/lib/crypto";
export async function prepareDatabase() {
  if (!new URL(process.env.DATABASE_URL!).pathname.endsWith("_test"))
    throw new Error("Tests require a dedicated *_test database.");
  await pool.query("DROP SCHEMA public CASCADE; CREATE SCHEMA public");
  for (const f of (await readdir("migrations"))
    .filter((f) => f.endsWith(".sql"))
    .sort())
    await pool.query(await readFile(`migrations/${f}`, "utf8"));
}
export async function actor(name = "Test Creator") {
  const id = randomUUID(),
    token = randomUUID();
  await query(
    'INSERT INTO "user"(id,name,email,"emailVerified") VALUES($1,$2,$3,true)',
    [id, name, `${id}@example.test`],
  );
  await query(
    'INSERT INTO session(id,token,"userId","expiresAt","updatedAt") VALUES($1,$2,$3,now()+interval \'1 day\',now())',
    [randomUUID(), token, id],
  );
  const signature = createHmac("sha256", process.env.BETTER_AUTH_SECRET!)
    .update(token)
    .digest("base64");
  const cookie = `better-auth.session_token=${encodeURIComponent(`${token}.${signature}`)}`;
  return { id, token, cookie };
}
export async function fixture(userId: string, platform = "youtube") {
  const [drive] = await query<Connection>(
    `INSERT INTO connections(user_id,platform,external_id,label,token) VALUES($1,'drive',$2,'Creator Drive',$3) RETURNING *`,
    [userId, randomUUID(), encrypt("drive-token")],
  );
  const [channel] = await query<Connection>(
    `INSERT INTO connections(user_id,platform,external_id,label,token) VALUES($1,$2,$3,'Creator channel',$4) RETURNING *`,
    [userId, platform, randomUUID(), encrypt("channel-token")],
  );
  const [media] = await query<Media>(
    `INSERT INTO media(user_id,connection_id,drive_file_id,name,mime_type,size,checksum,duration,width,height) VALUES($1,$2,'video-file','A day in the studio.mp4','video/mp4',8,'checksum',30,1080,1920) RETURNING *`,
    [userId, drive.id],
  );
  await query(
    `INSERT INTO subscriptions(user_id,plan,status,period_start,period_end) VALUES($1,'starter','active',date_trunc('month',now()),date_trunc('month',now())+interval '1 month')`,
    [userId],
  );
  const [post] = await query(
    `INSERT INTO posts(user_id,media_id,caption,timezone,scheduled_at) VALUES($1,$2,'A new studio day','Asia/Kolkata',now()-interval '1 minute') RETURNING *`,
    [userId, media.id],
  );
  const [destination] = await query<Destination>(
    `INSERT INTO destinations(user_id,post_id,connection_id,status,options) VALUES($1,$2,$3,'scheduled',$4) RETURNING *`,
    [
      userId,
      post.id,
      channel.id,
      { title: "Studio day", privacy: "private", madeForKids: false },
    ],
  );
  return { drive, channel, media, post, destination };
}
