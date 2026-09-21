import { Legal } from "@/components/legal";
export const dynamic = "force-dynamic";
export default function Deletion() {
  return (
    <Legal title="Delete your data">
      <h2>Delete the app account</h2>
      <p>
        Sign in, open Settings, type DELETE, and select Delete account. Resolve
        active or uncertain publishing jobs first. Your subscription is canceled
        and your app identity, sessions, stored tokens, connections, video
        references, schedules, and publishing records are deleted.
      </p>
      <h2>Disconnect a platform</h2>
      <p>
        Open Accounts and select Disconnect beside the account. We erase its
        stored tokens and pause affected scheduled posts. You can also revoke
        the app through the platform’s own connected-app settings.
      </p>
      <h2>Original videos and published posts</h2>
      <p>
        Drive videos and already-published social posts are not deleted by
        Social Publisher. Manage them directly in Google Drive or on the
        relevant social platform.
      </p>
    </Legal>
  );
}
