import { query } from "./db";
import { accessToken } from "./connections";
import { json, request, bearer } from "./http";
import { AppError, type Connection, type Media } from "./types";
import { encrypt } from "./crypto";
export async function driveConnection(userId: string) {
  const [c] = await query<Connection>(
    "SELECT * FROM connections WHERE user_id=$1 AND platform='drive' AND status='connected' AND active=true",
    [userId],
  );
  if (!c) throw new AppError("Connect Google Drive first.");
  return c;
}
export async function metadata(c: Connection, id: string) {
  return json(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(id)}?fields=id,name,mimeType,size,md5Checksum,videoMediaMetadata,trashed,capabilities(canDownload)`,
    { headers: bearer(await accessToken(c)) },
  );
}
export async function importFile(userId: string, id: string) {
  const c = await driveConnection(userId);
  const f = await metadata(c, id);
  if (f.trashed || !f.capabilities?.canDownload)
    throw new AppError("This Drive file is not available for download.");
  if (
    !["video/mp4", "video/quicktime"].includes(f.mimeType) ||
    !f.md5Checksum ||
    !Number(f.size) ||
    Number(f.size) > 2 * 1024 ** 3
  )
    throw new AppError("Choose a ready-to-post MP4 or MOV video, up to 2 GB.");
  const v = f.videoMediaMetadata;
  if (!v?.durationMillis || !v.width || !v.height)
    throw new AppError(
      "Drive is still processing this video. Try again shortly.",
    );
  const [m] = await query<Media>(
    `INSERT INTO media(user_id,connection_id,drive_file_id,name,mime_type,size,checksum,duration,width,height) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT(user_id,connection_id,drive_file_id,checksum) DO UPDATE SET name=EXCLUDED.name RETURNING *`,
    [
      userId,
      c.id,
      f.id,
      f.name,
      f.mimeType,
      f.size,
      f.md5Checksum,
      Number(v.durationMillis) / 1000,
      v.width,
      v.height,
    ],
  );
  return m;
}
export async function initiateUpload(
  userId: string,
  name: string,
  mimeType: string,
  size: number,
) {
  if (
    !["video/mp4", "video/quicktime"].includes(mimeType) ||
    size <= 0 ||
    size > 2 * 1024 ** 3
  )
    throw new AppError("Use MP4 or MOV, up to 2 GB.");
  const c = await driveConnection(userId);
  const token = await accessToken(c);
  let folder = c.metadata.folderId;
  if (!folder) {
    const f = await json("https://www.googleapis.com/drive/v3/files", {
      method: "POST",
      headers: { ...bearer(token), "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Social Publisher",
        mimeType: "application/vnd.google-apps.folder",
      }),
    });
    folder = f.id;
    await query(
      "UPDATE connections SET metadata=metadata||$2::jsonb WHERE id=$1",
      [c.id, JSON.stringify({ folderId: folder })],
    );
  }
  const r = await request(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable",
    {
      method: "POST",
      headers: {
        ...bearer(token),
        "Content-Type": "application/json",
        "X-Upload-Content-Type": mimeType,
        "X-Upload-Content-Length": String(size),
      },
      body: JSON.stringify({ name, mimeType, parents: [folder] }),
    },
  );
  const url = r.headers.get("Location");
  if (!url?.startsWith("https://www.googleapis.com/"))
    throw new AppError("Drive did not create an upload session.");
  await query(
    "INSERT INTO upload_sessions(user_id,connection_id,session_url) VALUES($1,$2,$3)",
    [userId, c.id, encrypt(url)],
  );
  // This upload-only session URL is a capability for this one new file, not an OAuth credential.
  return { uploadUrl: url };
}
export async function source(media: Media, range?: string) {
  const [c] = await query<Connection>(
    "SELECT * FROM connections WHERE id=$1 AND user_id=$2",
    [media.connection_id, media.user_id],
  );
  if (!c) throw new AppError("Drive connection missing.");
  const f = await metadata(c, media.drive_file_id);
  if (
    f.trashed ||
    !f.capabilities?.canDownload ||
    f.md5Checksum !== media.checksum ||
    String(f.size) !== String(media.size)
  )
    throw new AppError(
      "The source video changed or is no longer available. Import it again.",
    );
  return request(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(media.drive_file_id)}?alt=media`,
    {
      headers: {
        ...bearer(await accessToken(c)),
        ...(range ? { Range: range } : {}),
      },
    },
  );
}
