export type Platform =
  "drive" | "youtube" | "instagram" | "facebook" | "tiktok";
export type DestinationStatus =
  | "draft"
  | "scheduled"
  | "queued"
  | "processing"
  | "published"
  | "failed"
  | "attention"
  | "paused"
  | "canceled";
export interface Connection {
  id: string;
  user_id: string;
  platform: Platform;
  external_id: string;
  label: string;
  active: boolean;
  status: string;
  token: string;
  refresh_token: string | null;
  expires_at: string | null;
  metadata: Record<string, any>;
}
export interface Media {
  id: string;
  user_id: string;
  connection_id: string;
  drive_file_id: string;
  name: string;
  mime_type: string;
  size: string;
  checksum: string;
  duration: number;
  width: number;
  height: number;
}
export interface Options {
  title?: string;
  description?: string;
  privacy?: string;
  madeForKids?: boolean;
  format?: "video" | "reel";
  allowComment?: boolean;
  allowDuet?: boolean;
  allowStitch?: boolean;
  commercial?: boolean;
  ownBrand?: boolean;
  branded?: boolean;
  consent?: boolean;
}
export interface Destination {
  id: string;
  post_id: string;
  connection_id: string;
  user_id: string;
  options: Options;
  status: DestinationStatus;
  remote_id: string | null;
  upload_state: Record<string, any>;
  error: string | null;
  attempts: number;
  consecutive_failures: number;
}
export class AppError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export class ProviderError extends Error {
  constructor(
    message: string,
    public retryable = false,
    public ambiguous = false,
  ) {
    super(message);
  }
}
