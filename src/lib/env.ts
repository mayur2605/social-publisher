export function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing configuration: ${name}`);
  return value;
}
export const appUrl = () =>
  process.env.BETTER_AUTH_URL || "http://localhost:3000";
export const configured = () =>
  Boolean(
    process.env.DATABASE_URL &&
    process.env.BETTER_AUTH_SECRET &&
    process.env.TOKEN_ENCRYPTION_KEY &&
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET,
  );
