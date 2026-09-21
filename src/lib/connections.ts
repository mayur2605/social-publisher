import { createHash, randomBytes } from "node:crypto";
import type { PoolClient } from "pg";
import { query, tx } from "./db";
import { encrypt, decrypt } from "./crypto";
import { appUrl, required } from "./env";
import { json, bearer } from "./http";
import { AppError, type Connection, type Platform } from "./types";
import { plans, isPlan } from "./plans";
export const graph = () =>
  `https://graph.facebook.com/${process.env.META_API_VERSION || "v23.0"}`;
const googleScopes: Record<string, string> = {
  drive: "https://www.googleapis.com/auth/drive.file",
  youtube:
    "https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly",
};
export async function authorize(userId: string, provider: string) {
  if (!["drive", "youtube", "meta", "tiktok"].includes(provider))
    throw new AppError("Unknown connection provider.");
  const state = randomBytes(32).toString("base64url"),
    verifier = randomBytes(48).toString("base64url");
  const callback = `${appUrl()}/api/connections/callback/${provider}`;
  let url: URL;
  if (provider === "drive" || provider === "youtube") {
    url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    url.search = new URLSearchParams({
      client_id: required("GOOGLE_CLIENT_ID"),
      redirect_uri: callback,
      response_type: "code",
      scope: `openid email profile ${googleScopes[provider]}`,
      access_type: "offline",
      prompt: "consent select_account",
      state,
      code_challenge: createHash("sha256").update(verifier).digest("base64url"),
      code_challenge_method: "S256",
    }).toString();
  } else if (provider === "meta") {
    url = new URL(
      `https://www.facebook.com/${process.env.META_API_VERSION || "v23.0"}/dialog/oauth`,
    );
    url.search = new URLSearchParams({
      client_id: required("META_APP_ID"),
      redirect_uri: callback,
      response_type: "code",
      state,
      scope:
        "pages_show_list,pages_read_engagement,pages_manage_posts,instagram_basic,instagram_content_publish",
    }).toString();
  } else {
    url = new URL("https://www.tiktok.com/v2/auth/authorize/");
    url.search = new URLSearchParams({
      client_key: required("TIKTOK_CLIENT_KEY"),
      redirect_uri: callback,
      response_type: "code",
      scope: "user.info.basic,video.publish",
      state,
    }).toString();
  }
  await query("DELETE FROM oauth_states WHERE expires_at<now()");
  await query(
    "INSERT INTO oauth_states(id,user_id,provider,verifier,expires_at) VALUES($1,$2,$3,$4,now()+interval '10 minutes')",
    [state, userId, provider, encrypt(verifier)],
  );
  return url.toString();
}
async function save(
  c: PoolClient,
  userId: string,
  platform: Platform,
  id: string,
  label: string,
  token: string,
  refresh: string | null,
  expires: number | null,
  metadata: Record<string, any> = {},
) {
  const [sub] = (
    await c.query("SELECT plan FROM subscriptions WHERE user_id=$1", [userId])
  ).rows;
  const plan = isPlan(sub?.plan) ? sub.plan : "starter";
  const existing = (
    await c.query(
      "SELECT id,active,status FROM connections WHERE user_id=$1 AND platform=$2 AND external_id=$3",
      [userId, platform, id],
    )
  ).rows[0];
  const count = Number(
    (
      await c.query(
        "SELECT count(*) FROM connections WHERE user_id=$1 AND platform!='drive' AND active=true AND status!='disconnected'",
        [userId],
      )
    ).rows[0].count,
  );
  if (platform === "drive") {
    const other = (
      await c.query(
        "SELECT id FROM connections WHERE user_id=$1 AND platform='drive' AND external_id!=$2 AND status!='disconnected'",
        [userId, id],
      )
    ).rows[0];
    if (other)
      throw new AppError(
        "Disconnect your current Drive before connecting a different account.",
      );
  }
  const active =
    platform === "drive" ||
    (existing?.status !== "disconnected" && !!existing?.active) ||
    count < plans[plan as keyof typeof plans].accounts;
  await c.query(
    `INSERT INTO connections(user_id,platform,external_id,label,token,refresh_token,expires_at,metadata,active) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)
 ON CONFLICT(user_id,platform,external_id) DO UPDATE SET label=EXCLUDED.label,token=EXCLUDED.token,refresh_token=COALESCE(EXCLUDED.refresh_token,connections.refresh_token),expires_at=EXCLUDED.expires_at,status='connected',active=EXCLUDED.active,metadata=connections.metadata||EXCLUDED.metadata`,
    [
      userId,
      platform,
      id,
      label,
      encrypt(token),
      refresh ? encrypt(refresh) : null,
      expires ? new Date(Date.now() + expires * 1000) : null,
      metadata,
      active,
    ],
  );
}
export async function callback(
  userId: string,
  provider: string,
  state: string,
  code: string,
) {
  const [entry] = await query(
    "DELETE FROM oauth_states WHERE id=$1 AND user_id=$2 AND provider=$3 AND expires_at>now() RETURNING *",
    [state, userId, provider],
  );
  if (!entry)
    throw new AppError(
      "This connection request expired or was already used. Try again.",
    );
  const redirect_uri = `${appUrl()}/api/connections/callback/${provider}`;
  const records: Array<
    [
      Platform,
      string,
      string,
      string,
      string | null,
      number | null,
      Record<string, any>,
    ]
  > = [];
  if (provider === "drive" || provider === "youtube") {
    const token = await json("https://oauth2.googleapis.com/token", {
      method: "POST",
      body: new URLSearchParams({
        client_id: required("GOOGLE_CLIENT_ID"),
        client_secret: required("GOOGLE_CLIENT_SECRET"),
        redirect_uri,
        code,
        code_verifier: decrypt(entry.verifier),
        grant_type: "authorization_code",
      }),
    });
    const profile = await json(
      "https://openidconnect.googleapis.com/v1/userinfo",
      { headers: bearer(token.access_token) },
    );
    if (provider === "drive")
      records.push([
        "drive",
        profile.sub,
        profile.email,
        token.access_token,
        token.refresh_token,
        token.expires_in,
        {},
      ]);
    else {
      const channels = await json(
        "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true",
        { headers: bearer(token.access_token) },
      );
      for (const channel of channels.items ?? [])
        records.push([
          "youtube",
          channel.id,
          channel.snippet.title,
          token.access_token,
          token.refresh_token,
          token.expires_in,
          {},
        ]);
      if (!records.length)
        throw new AppError(
          "No YouTube channel was found on this Google account.",
        );
    }
  } else if (provider === "meta") {
    const short = await json(`${graph()}/oauth/access_token`, {
      method: "POST",
      body: new URLSearchParams({
        client_id: required("META_APP_ID"),
        client_secret: required("META_APP_SECRET"),
        redirect_uri,
        code,
      }),
    });
    const token = await json(`${graph()}/oauth/access_token`, {
      method: "POST",
      body: new URLSearchParams({
        grant_type: "fb_exchange_token",
        client_id: required("META_APP_ID"),
        client_secret: required("META_APP_SECRET"),
        fb_exchange_token: short.access_token,
      }),
    });
    let after: string | undefined;
    do {
      const pages = await json(
        `${graph()}/me/accounts?fields=id,name,access_token,instagram_business_account{id,username}&limit=100${after ? `&after=${encodeURIComponent(after)}` : ""}`,
        { headers: bearer(token.access_token) },
      );
      for (const page of pages.data ?? []) {
        records.push([
          "facebook",
          page.id,
          page.name,
          page.access_token,
          null,
          null,
          {},
        ]);
        if (page.instagram_business_account)
          records.push([
            "instagram",
            page.instagram_business_account.id,
            page.instagram_business_account.username || page.name,
            page.access_token,
            null,
            null,
            { pageId: page.id },
          ]);
      }
      after = pages.paging?.next ? pages.paging?.cursors?.after : undefined;
    } while (after);
    if (!records.length)
      throw new AppError(
        "No eligible Facebook Pages or linked professional Instagram accounts were found.",
      );
  } else if (provider === "tiktok") {
    const token = await json("https://open.tiktokapis.com/v2/oauth/token/", {
      method: "POST",
      body: new URLSearchParams({
        client_key: required("TIKTOK_CLIENT_KEY"),
        client_secret: required("TIKTOK_CLIENT_SECRET"),
        code,
        grant_type: "authorization_code",
        redirect_uri,
      }),
    });
    const profile = await json(
      "https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name",
      { headers: bearer(token.access_token) },
    );
    records.push([
      "tiktok",
      token.open_id,
      profile.data.user.display_name,
      token.access_token,
      token.refresh_token,
      token.expires_in,
      {},
    ]);
  }
  await tx(async (c) => {
    await c.query('SELECT id FROM "user" WHERE id=$1 FOR UPDATE', [userId]);
    for (const r of records) await save(c, userId, ...r);
  });
}
export async function accessToken(connection: Connection): Promise<string> {
  if (connection.status === "disconnected" || !connection.active)
    throw new AppError("This account is disconnected or inactive.");
  if (
    !connection.expires_at ||
    new Date(connection.expires_at).getTime() > Date.now() + 120000
  )
    return decrypt(connection.token);
  if (!connection.refresh_token) {
    await query("UPDATE connections SET status='reconnect' WHERE id=$1", [
      connection.id,
    ]);
    throw new AppError("Reconnect this account before publishing.");
  }
  try {
    return await tx(async (c) => {
      const current = (
        await c.query("SELECT * FROM connections WHERE id=$1 FOR UPDATE", [
          connection.id,
        ])
      ).rows[0] as Connection;
      if (current.status === "disconnected" || !current.active)
        throw new AppError("This account was disconnected.");
      if (
        current.expires_at &&
        new Date(current.expires_at).getTime() > Date.now() + 120000
      )
        return decrypt(current.token);
      const t =
        current.platform === "tiktok"
          ? await json("https://open.tiktokapis.com/v2/oauth/token/", {
              method: "POST",
              body: new URLSearchParams({
                client_key: required("TIKTOK_CLIENT_KEY"),
                client_secret: required("TIKTOK_CLIENT_SECRET"),
                grant_type: "refresh_token",
                refresh_token: decrypt(current.refresh_token!),
              }),
            })
          : await json("https://oauth2.googleapis.com/token", {
              method: "POST",
              body: new URLSearchParams({
                client_id: required("GOOGLE_CLIENT_ID"),
                client_secret: required("GOOGLE_CLIENT_SECRET"),
                grant_type: "refresh_token",
                refresh_token: decrypt(current.refresh_token!),
              }),
            });
      await c.query(
        "UPDATE connections SET token=$2,refresh_token=$3,expires_at=$4,status='connected' WHERE id=$1",
        [
          current.id,
          encrypt(t.access_token),
          t.refresh_token ? encrypt(t.refresh_token) : current.refresh_token,
          new Date(Date.now() + t.expires_in * 1000),
        ],
      );
      return t.access_token;
    });
  } catch (e) {
    if (e instanceof AppError || !(e as any).retryable)
      await query("UPDATE connections SET status='reconnect' WHERE id=$1", [
        connection.id,
      ]);
    throw e;
  }
}
export async function getConnection(userId: string, id: string) {
  const [c] = await query<Connection>(
    "SELECT * FROM connections WHERE user_id=$1 AND id=$2",
    [userId, id],
  );
  if (!c) throw new AppError("Account not found.", 404);
  return c;
}
export async function creatorInfo(connection: Connection) {
  const token = await accessToken(connection);
  return (
    await json(
      "https://open.tiktokapis.com/v2/post/publish/creator_info/query/",
      {
        method: "POST",
        headers: { ...bearer(token), "Content-Type": "application/json" },
        body: "{}",
      },
    )
  ).data;
}
export async function disconnect(userId: string, id: string) {
  await tx(async (c) => {
    await c.query("SELECT pg_advisory_xact_lock(hashtextextended($1,1))", [
      userId,
    ]);
    const result = await c.query(
      "UPDATE connections SET status='disconnected',active=false,token='',refresh_token=null WHERE id=$1 AND user_id=$2 RETURNING platform",
      [id, userId],
    );
    if (!result.rowCount) throw new AppError("Account not found.", 404);
    await c.query(
      `UPDATE destinations SET status='paused',error='An account was disconnected.',updated_at=now() WHERE user_id=$1 AND status IN ('scheduled','queued','draft') AND (connection_id=$2 OR post_id IN (SELECT p.id FROM posts p JOIN media m ON p.media_id=m.id WHERE m.connection_id=$2))`,
      [userId, id],
    );
  });
}
