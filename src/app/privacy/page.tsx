import { Legal } from "@/components/legal";
export const dynamic = "force-dynamic";
export default function Privacy() {
  return (
    <Legal title="Privacy policy">
      <p>
        Social Publisher helps you publish videos from your Google Drive to the
        social accounts you explicitly connect.
      </p>
      <h2>Information we use</h2>
      <p>
        We store your Google sign-in name and email, session records,
        connected-account identifiers, encrypted access credentials, video
        metadata, captions, schedules, publishing results, subscription
        identifiers, and usage records.
      </p>
      <h2>Your videos</h2>
      <p>
        Original videos remain in your Google Drive. We access only videos
        uploaded through the app or explicitly selected with Google Picker.
        Video data is streamed to the destinations you choose; we do not retain
        a separate video-storage copy. Expiring media links may be supplied to
        platforms so they can fetch a selected video.
      </p>
      <h2>How data is shared</h2>
      <p>
        Google, Meta, TikTok, Stripe, and our hosting provider process
        information needed to operate the features you use. We do not sell your
        personal information or use your videos to train AI models. Google API
        data is used only to provide the publishing functionality, consistent
        with the Google API Services User Data Policy, including Limited Use
        requirements.
      </p>
      <h2>Retention and control</h2>
      <p>
        App records are retained while your account exists. Disconnecting
        removes stored authorization for that connection and pauses affected
        posts. Deleting your account removes associated app records. Your Drive
        originals, already-published social posts, and records retained
        independently by payment providers remain with those providers. Hosting
        backups may retain deleted records until their configured
        backup-retention period expires.
      </p>
      <h2>Security</h2>
      <p>
        Integration tokens are encrypted at rest. Sessions and ownership checks
        protect app records. You can revoke authorization through each connected
        platform’s account settings.
      </p>
    </Legal>
  );
}
