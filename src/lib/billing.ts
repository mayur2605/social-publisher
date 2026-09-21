import Stripe from "stripe";
import { query, tx } from "./db";
import { appUrl, required } from "./env";
import { AppError } from "./types";
import { isPlan, type Plan } from "./plans";
export function stripe() {
  const key = required("STRIPE_SECRET_KEY");
  if (!key.startsWith("sk_test_"))
    throw new AppError(
      "Live payments are disabled until merchant eligibility is verified.",
      503,
    );
  return new Stripe(key, { httpClient: Stripe.createFetchHttpClient() });
}
export async function checkout(userId: string, email: string, plan: Plan) {
  const client = stripe();
  return tx(async (c) => {
    await c.query(
      "INSERT INTO subscriptions(user_id) VALUES($1) ON CONFLICT DO NOTHING",
      [userId],
    );
    let s = (
      await c.query("SELECT * FROM subscriptions WHERE user_id=$1 FOR UPDATE", [
        userId,
      ])
    ).rows[0];
    if (
      s.stripe_subscription_id &&
      ["active", "trialing", "past_due"].includes(s.status)
    )
      return (
        await client.billingPortal.sessions.create({
          customer: s.stripe_customer_id,
          return_url: `${appUrl()}/billing`,
        })
      ).url;
    if (!s.stripe_customer_id) {
      const customer = await client.customers.create(
        { email, metadata: { userId } },
        { idempotencyKey: `customer:${userId}` },
      );
      s = (
        await c.query(
          "UPDATE subscriptions SET stripe_customer_id=$2 WHERE user_id=$1 RETURNING *",
          [userId, customer.id],
        )
      ).rows[0];
    }
    if (s.checkout_session_id) {
      const pending = await client.checkout.sessions.retrieve(
        s.checkout_session_id,
      );
      if (pending.status === "complete")
        return (
          await client.billingPortal.sessions.create({
            customer: s.stripe_customer_id,
            return_url: `${appUrl()}/billing`,
          })
        ).url;
      if (pending.status === "open" && s.checkout_plan === plan)
        return pending.url;
      if (pending.status === "open")
        await client.checkout.sessions.expire(pending.id);
    }
    const session = await client.checkout.sessions.create(
      {
        mode: "subscription",
        customer: s.stripe_customer_id,
        line_items: [
          {
            price: required(`STRIPE_PRICE_${plan.toUpperCase()}`),
            quantity: 1,
          },
        ],
        client_reference_id: userId,
        subscription_data: { metadata: { userId } },
        success_url: `${appUrl()}/billing?checkout=success`,
        cancel_url: `${appUrl()}/billing`,
      },
      {
        idempotencyKey: `checkout:${userId}:${plan}:${s.checkout_session_id || "first"}:${Math.floor(Date.now() / 300000)}`,
      },
    );
    await c.query(
      "UPDATE subscriptions SET checkout_session_id=$2,checkout_plan=$3 WHERE user_id=$1",
      [userId, session.id, plan],
    );
    return session.url;
  });
}
export async function portal(userId: string) {
  const [s] = await query(
    "SELECT stripe_customer_id FROM subscriptions WHERE user_id=$1",
    [userId],
  );
  if (!s?.stripe_customer_id) throw new AppError("Choose a plan first.");
  return (
    await stripe().billingPortal.sessions.create({
      customer: s.stripe_customer_id,
      return_url: `${appUrl()}/billing`,
    })
  ).url;
}
export async function webhook(body: string, signature: string) {
  const client = stripe();
  let event: Stripe.Event;
  try {
    event = client.webhooks.constructEvent(
      body,
      signature,
      required("STRIPE_WEBHOOK_SECRET"),
    );
  } catch {
    throw new AppError("Invalid webhook signature.", 400);
  }
  if (event.livemode) throw new AppError("Live billing events are disabled.");
  await tx(async (c) => {
    if (
      !(
        await c.query(
          "INSERT INTO billing_events(id) VALUES($1) ON CONFLICT DO NOTHING RETURNING id",
          [event.id],
        )
      ).rowCount
    )
      return;
    if (!event.type.startsWith("customer.subscription.")) return;
    const data = event.data.object as Stripe.Subscription;
    const customer =
      typeof data.customer === "string" ? data.customer : data.customer.id;
    const [owner] = (
      await c.query(
        "SELECT user_id,stripe_subscription_id FROM subscriptions WHERE stripe_customer_id=$1 FOR UPDATE",
        [customer],
      )
    ).rows;
    if (!owner) return;
    if (
      event.type === "customer.subscription.deleted" &&
      owner.stripe_subscription_id &&
      owner.stripe_subscription_id !== data.id
    )
      return;
    // Read authoritative current state to make out-of-order delivery harmless.
    const s =
      event.type === "customer.subscription.deleted"
        ? data
        : await client.subscriptions.retrieve(data.id);
    if (
      owner.stripe_subscription_id &&
      owner.stripe_subscription_id !== s.id &&
      ["canceled", "incomplete_expired"].includes(s.status)
    )
      return;
    const item = s.items.data[0];
    const plan = Object.keys({ starter: 1, creator: 1, pro: 1 }).find(
      (p) => process.env[`STRIPE_PRICE_${p.toUpperCase()}`] === item?.price.id,
    );
    if (!plan || !isPlan(plan))
      throw new AppError("Unknown subscription price.");
    await c.query(
      `UPDATE subscriptions SET stripe_subscription_id=$2,plan=$3,status=$4,period_start=$5,period_end=$6,cancel_at_period_end=$7,checkout_session_id=null,checkout_plan=null,updated_at=now() WHERE user_id=$1`,
      [
        owner.user_id,
        s.id,
        plan,
        s.status,
        new Date(item.current_period_start * 1000),
        new Date(item.current_period_end * 1000),
        s.cancel_at_period_end,
      ],
    );
  });
}
