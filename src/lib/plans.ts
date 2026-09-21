export const plans = {
  starter: { name: "Starter", price: 9, accounts: 4, posts: 60 },
  creator: { name: "Creator", price: 19, accounts: 10, posts: 200 },
  pro: { name: "Pro", price: 39, accounts: 25, posts: 600 },
} as const;
export type Plan = keyof typeof plans;
export const isPlan = (v: string): v is Plan => Object.hasOwn(plans, v);
export function entitled(
  sub: { status: string; period_end: string | Date } | undefined,
  now = Date.now(),
) {
  return (
    !!sub &&
    ["active", "trialing"].includes(sub.status) &&
    new Date(sub.period_end).getTime() > now
  );
}
