export const plans = {
  starter: {
    name: "Starter",
    price: 9,
    accounts: 4,
    posts: 60,
    maxVideoBytes: 2 * 1024 ** 3,
    bandwidthBytes: 40 * 1024 ** 3,
    maxShortFormBytes: 500 * 1024 * 1024,
  },
  creator: {
    name: "Creator",
    price: 19,
    accounts: 10,
    posts: 200,
    maxVideoBytes: 2 * 1024 ** 3,
    bandwidthBytes: 120 * 1024 ** 3,
    maxShortFormBytes: 500 * 1024 * 1024,
  },
  pro: {
    name: "Pro",
    price: 39,
    accounts: 25,
    posts: 600,
    maxVideoBytes: 2 * 1024 ** 3,
    bandwidthBytes: 300 * 1024 ** 3,
    maxShortFormBytes: 500 * 1024 * 1024,
  },
  studio: {
    name: "Studio",
    price: 79,
    accounts: 50,
    posts: 1500,
    maxVideoBytes: 10 * 1024 ** 3,
    bandwidthBytes: 750 * 1024 ** 3,
    maxShortFormBytes: 500 * 1024 * 1024,
  },
} as const;
export type Plan = keyof typeof plans;
export const isPlan = (v: string): v is Plan => Object.hasOwn(plans, v);
export function maxVideoBytesForPlan(plan?: string | null): number {
  return plan && isPlan(plan) ? plans[plan].maxVideoBytes : 2 * 1024 ** 3;
}
export function maxBandwidthBytesForPlan(plan?: string | null): number {
  return plan && isPlan(plan) ? plans[plan].bandwidthBytes : 40 * 1024 ** 3;
}
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
