import nextEnv from "@next/env";
nextEnv.loadEnvConfig(process.cwd());
import { randomUUID, createHmac } from "node:crypto";
const { pool, query } = await import("../src/lib/db");
const { encrypt } = await import("../src/lib/crypto");

async function seed() {
  const [existingUser] = await query(
    "SELECT id, name, email FROM \"user\" WHERE email='dev@socialpublisher.local'",
  );

  let userId: string;
  if (existingUser) {
    userId = existingUser.id;
    console.log("Using existing local dev user:", existingUser.email);
  } else {
    userId = randomUUID();
    await query(
      'INSERT INTO "user"(id,name,email,"emailVerified") VALUES($1,$2,$3,true)',
      [userId, "Maya Creator (Local Dev)", "dev@socialpublisher.local"],
    );
    console.log("Created local dev user: dev@socialpublisher.local");
  }

  // Create a fresh 7-day session
  const token = randomUUID();
  await query(
    'INSERT INTO session(id,token,"userId","expiresAt","updatedAt") VALUES($1,$2,$3,now()+interval \'7 days\',now())',
    [randomUUID(), token, userId],
  );

  const signature = createHmac("sha256", process.env.BETTER_AUTH_SECRET!)
    .update(token)
    .digest("base64");
  const cookieValue = `${token}.${signature}`;
  const fullCookie = `better-auth.session_token=${encodeURIComponent(cookieValue)}`;

  // Ensure sample Drive & social accounts exist
  const [drive] = await query(
    "SELECT id FROM connections WHERE user_id=$1 AND platform='drive'",
    [userId],
  );
  if (!drive) {
    const [cDrive] = await query(
      `INSERT INTO connections(user_id,platform,external_id,label,token,status,active)
       VALUES($1,'drive',$2,$3,$4,'connected',true) RETURNING id`,
      [userId, randomUUID(), "Maya's Google Drive", encrypt("dev-drive-token")],
    );
    const [cYoutube] = await query(
      `INSERT INTO connections(user_id,platform,external_id,label,token,status,active)
       VALUES($1,'youtube',$2,$3,$4,'connected',true) RETURNING id`,
      [
        userId,
        randomUUID(),
        "Maya Vlogs (YouTube)",
        encrypt("dev-youtube-token"),
      ],
    );
    const [cInstagram] = await query(
      `INSERT INTO connections(user_id,platform,external_id,label,token,status,active)
       VALUES($1,'instagram',$2,$3,$4,'connected',true) RETURNING id`,
      [
        userId,
        randomUUID(),
        "@mayacreator (Instagram Reels)",
        encrypt("dev-instagram-token"),
      ],
    );
    const [cTiktok] = await query(
      `INSERT INTO connections(user_id,platform,external_id,label,token,status,active)
       VALUES($1,'tiktok',$2,$3,$4,'connected',true) RETURNING id`,
      [
        userId,
        randomUUID(),
        "@mayacreator (TikTok)",
        encrypt("dev-tiktok-token"),
      ],
    );

    // Add sample videos
    const [media] = await query(
      `INSERT INTO media(user_id,connection_id,drive_file_id,name,mime_type,size,checksum,duration,width,height)
       VALUES($1,$2,'sample-drive-file-1','Summer Travel Vlog 4K.mp4','video/mp4',52428800,'md5sample123',180,1920,1080)
       RETURNING id`,
      [userId, cDrive.id],
    );

    // Active creator plan subscription
    await query(
      `INSERT INTO subscriptions(user_id,plan,status,period_start,period_end)
       VALUES($1,'creator','active',date_trunc('month',now()),date_trunc('month',now())+interval '1 month')
       ON CONFLICT(user_id) DO UPDATE SET status='active', plan='creator'`,
      [userId],
    );

    // Scheduled post
    const [post] = await query(
      `INSERT INTO posts(user_id,media_id,caption,timezone,scheduled_at)
       VALUES($1,$2,'Exploring the coast this summer! 🌊🏖️ #travel #vlog','Asia/Kolkata',now()+interval '2 days')
       RETURNING id`,
      [userId, media.id],
    );

    await query(
      `INSERT INTO destinations(user_id,post_id,connection_id,status,options)
       VALUES($1,$2,$3,'scheduled',$4)`,
      [
        userId,
        post.id,
        cYoutube.id,
        { title: "Summer Coast Vlog", privacy: "private", madeForKids: false },
      ],
    );
    await query(
      `INSERT INTO destinations(user_id,post_id,connection_id,status,options)
       VALUES($1,$2,$3,'scheduled',$4)`,
      [userId, post.id, cInstagram.id, { format: "reel" }],
    );
  }

  console.log("\n========================================================");
  console.log("Local Dev Session Ready!");
  console.log("========================================================");
  console.log("User: Maya Creator (dev@socialpublisher.local)");
  console.log("Session Cookie:");
  console.log(fullCookie);
  console.log(
    "\nTo use in Chrome / Browser DevTools Console on http://localhost:3000:",
  );
  console.log(
    `document.cookie = "${fullCookie}; path=/; max-age=604800"; location.reload();`,
  );
  console.log("========================================================\n");

  await pool.end();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
