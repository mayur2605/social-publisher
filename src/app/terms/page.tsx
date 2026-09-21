import { Legal } from "@/components/legal";
export const dynamic = "force-dynamic";
export default function Terms() {
  return (
    <Legal title="Terms of service">
      <p>
        Use Social Publisher only with accounts and content you are authorized
        to manage. You retain ownership of your videos and grant the app
        permission to transfer selected content to the destinations you choose.
      </p>
      <h2>Publishing and availability</h2>
      <p>
        Platform account eligibility, review requirements, API limits, and
        processing times apply. Scheduled times begin the publishing workflow
        and do not guarantee simultaneous visibility across platforms. Keep
        source files available in Drive until publishing is complete.
      </p>
      <h2>Subscriptions</h2>
      <p>
        Starter is $9/month for 4 accounts and 60 destination posts; Creator is
        $19/month for 10 accounts and 200 posts; Pro is $39/month for 25
        accounts and 600 posts. One successful destination publication consumes
        one post. Retries do not count twice. Current billing uses test mode and
        does not collect real payments.
      </p>
      <p>
        Cancellation preserves access through the paid period. An expired
        subscription pauses publishing and retains drafts. A downgrade may
        require selecting fewer active accounts.
      </p>
      <h2>Content responsibilities</h2>
      <p>
        You are responsible for rights to video, music, captions, and other
        submitted content, along with required audience and commercial-content
        disclosures. Follow the terms of each destination platform.
      </p>
      <h2>Account deletion</h2>
      <p>
        You can delete your account in Settings after resolving active
        publishing jobs. Deletion cancels the app subscription and removes app
        records; it does not remove original files or posts from connected
        platforms.
      </p>
    </Legal>
  );
}
