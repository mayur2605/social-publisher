import { beforeAll, afterAll, afterEach, it, expect, vi } from "vitest";
import Stripe from "stripe";
import { webhook } from "../src/lib/billing";
import { pool, query } from "../src/lib/db";
import { actor, fixture, prepareDatabase } from "./fixtures";
beforeAll(async () => {
  process.env.STRIPE_SECRET_KEY = "sk_test_unit";
  process.env.STRIPE_WEBHOOK_SECRET = "whsec_unit";
  process.env.STRIPE_PRICE_STARTER = "price_starter";
  process.env.STRIPE_PRICE_CREATOR = "price_creator";
  await prepareDatabase();
});
afterAll(() => pool.end());
afterEach(() => vi.unstubAllGlobals());
async function deliver(id: string, type: string, sub: any) {
  const payload = JSON.stringify({
    id,
    type,
    livemode: false,
    data: { object: sub },
  });
  const signature = Stripe.webhooks.generateTestHeaderString({
    payload,
    secret: "whsec_unit",
  });
  await webhook(payload, signature);
}
function subscription(status = "active", price = "price_creator") {
  return {
    id: "sub_unit",
    customer: "cus_unit",
    status,
    cancel_at_period_end: false,
    items: {
      data: [
        {
          price: { id: price },
          current_period_start: Math.floor(Date.now() / 1000) - 10,
          current_period_end: Math.floor(Date.now() / 1000) + 86400,
        },
      ],
    },
  };
}
it("verifies webhook signatures", async () => {
  await expect(webhook("{}", "invalid")).rejects.toThrow("signature");
});
it("deduplicates signed events and handles upgrades, failed renewal and cancellation", async () => {
  const u = await actor();
  await fixture(u.id);
  await query(
    "UPDATE subscriptions SET stripe_customer_id='cus_unit',stripe_subscription_id='sub_unit' WHERE user_id=$1",
    [u.id],
  );
  const active = subscription();
  const fetcher = vi
    .fn()
    .mockImplementation(() => Promise.resolve(Response.json(active)));
  vi.stubGlobal("fetch", fetcher);
  await deliver(
    "evt_upgrade",
    "customer.subscription.updated",
    subscription("active", "price_starter"),
  );
  await deliver("evt_upgrade", "customer.subscription.updated", active);
  expect(fetcher).toHaveBeenCalledTimes(1);
  expect(
    (
      await query("SELECT plan,status FROM subscriptions WHERE user_id=$1", [
        u.id,
      ])
    )[0],
  ).toEqual({ plan: "creator", status: "active" });
  active.status = "past_due";
  await deliver("evt_due", "customer.subscription.updated", active);
  expect(
    (
      await query("SELECT status FROM subscriptions WHERE user_id=$1", [u.id])
    )[0].status,
  ).toBe("past_due");
  active.status = "active";
  active.cancel_at_period_end = true;
  await deliver("evt_end", "customer.subscription.updated", active);
  expect(
    (
      await query(
        "SELECT status,cancel_at_period_end FROM subscriptions WHERE user_id=$1",
        [u.id],
      )
    )[0],
  ).toEqual({ status: "active", cancel_at_period_end: true });
  await deliver("evt_cancel", "customer.subscription.deleted", {
    ...active,
    status: "canceled",
  });
  expect(
    (
      await query("SELECT status FROM subscriptions WHERE user_id=$1", [u.id])
    )[0].status,
  ).toBe("canceled");
});
it("an old deletion event cannot cancel a replacement subscription", async () => {
  const [s] = await query(
    "SELECT * FROM subscriptions WHERE stripe_customer_id='cus_unit'",
  );
  await query(
    "UPDATE subscriptions SET stripe_subscription_id='sub_new',status='active' WHERE user_id=$1",
    [s.user_id],
  );
  await deliver(
    "evt_old_deleted",
    "customer.subscription.deleted",
    subscription("canceled"),
  );
  expect(
    (
      await query(
        "SELECT status,stripe_subscription_id FROM subscriptions WHERE user_id=$1",
        [s.user_id],
      )
    )[0],
  ).toEqual({ status: "active", stripe_subscription_id: "sub_new" });
});
