# Creator guide

Social Publisher · Pre-launch guide · Updated 2026-09-22

Social Publisher is being prepared for testing. Availability depends on configured services, eligible accounts, and provider permissions. Billing currently uses test mode and does not collect real payments. Some accounts can publish only privately until the applicable reviews are complete.

## Get started

1. Sign in with Google. This creates your Social Publisher identity.
2. Open **Accounts** and connect **Google Drive**. You can choose a different Google account from the one used to sign in. Only one Drive account can be connected at a time; disconnect the current one before changing it.
3. Connect the social accounts you own or are authorized to manage. YouTube uses channels; Facebook uses Pages; Instagram requires an eligible professional account with the linked-Page setup used by this app; TikTok requires an authorized eligible account.
4. Open **Library** to upload or select your prepared video.
5. Configure a test subscription in **Billing** before scheduling or publishing. Drafts can be prepared without active publishing access.

If the app displays setup instructions instead of sign-in, the operator must finish configuration. You cannot fix missing app credentials from your social account settings.

## Add a video

Choose **Upload video** to send a file directly to an app-created “Social Publisher” folder in your Drive. The app accepts MP4/MOV up to 2 GiB on Starter/Creator/Pro, and up to 10 GiB on Studio (for YouTube and Facebook Video). Short-form vertical videos (Instagram Reels, Facebook Reels, TikTok) are capped at 500 MB to protect upload performance and cloud egress. The app does not edit or convert videos.

Keep the upload page open until the transfer completes. If a transfer is interrupted and **Resume upload** is available, fix the connection or Drive storage issue and resume. Current resume information is held in that page's memory: refreshing, navigating away, or closing the page can lose it. Check Drive for a completed file before starting again. This limitation is separate from scheduled publishing, which runs in the background after a source is ready.

Choose **Choose from Drive** to select an existing file. If Drive is still processing its metadata, wait and select it again. After a completed upload the app may ask you to select the file once processing finishes. Your original stays in Drive; the app stores its reference and streams it when publishing.

Keep the original file unchanged and accessible until all destinations finish. Replacing, deleting, or revoking access to it can stop publication.

## Compose and schedule

Open the composer, choose a library video, preview it, select destinations, and enter a shared caption. Expand destination settings to override title/description and required options.

- YouTube needs a title, visibility, and whether the video is made for kids.
- TikTok needs an explicit privacy choice, posting consent, and applicable interaction/commercial-content choices. Allowed settings depend on the connected account.
- Facebook offers Video and Reel formats. The app's Reel path accepts a narrower length/orientation range; use Video where appropriate for longer material.
- Instagram and other destinations may reject a video that another destination can accept. Correct the settings or remove the incompatible destination before scheduling.

Use **Save draft** while preparing. For scheduling, choose the intended timezone and a future date/time; allow at least one minute of lead time. Review the timezone displayed with the saved post. Daylight-saving transitions need particular care; ambiguous local times are not yet covered by full acceptance testing.

Publish-now begins the workflow as soon as the worker can process it. A scheduled time starts the publishing workflow; platforms may make videos visible later after processing. Exact simultaneous appearance is not guaranteed.

Once scheduled, you may close the browser or sign out. Use **Posts** or **Calendar** to inspect the saved schedule. **Edit** and **Cancel** are available only while the job is still eligible; publication that has already started or reached a platform cannot be undone by canceling here.

## Understand each destination result

| State              | Meaning / action                                                                               |
| ------------------ | ---------------------------------------------------------------------------------------------- |
| Draft              | Saved but not scheduled                                                                        |
| Scheduled / queued | Waiting for dispatch                                                                           |
| Processing         | Transfer or platform processing in progress; allow time                                        |
| Published          | Confirmed or explicitly reviewed as published; use **View post** when a link is available      |
| Failed             | A failure was confirmed; resolve the cause, then **Retry**                                     |
| Paused             | A prerequisite needs attention, such as reconnecting or subscription allowance                 |
| Attention          | The app cannot safely conclude the outcome; inspect the destination before deciding what to do |
| Canceled           | The app canceled eligible work before dispatch                                                 |

One destination can succeed while another fails. Retry the affected destination, not the entire video, to avoid reposting successes.

For **Attention**, try **Check status** if the app has a remote identifier. If it cannot check automatically, open the actual platform account and inspect its posts/uploads. Use **Review outcome** only after checking: confirm published if it exists, or not published only when you are sure no publication is pending or completed. The app relies on your confirmation; an incorrect “not published” decision followed by retry can duplicate a post.

## Connections and billing

Reconnect an account whose access expired or was revoked, then retry affected paused work. **Disconnect** removes stored connection grants and pauses affected pending posts. It does not delete your originals or already-published posts, and it cannot retract a request already accepted remotely.

| Plan        | Monthly USD price | Active social accounts | Destination posts / month | Bandwidth pool | Max video size                   |
| :---------- | :---------------- | :--------------------- | :------------------------ | :------------- | :------------------------------- |
| **Starter** | $9                | 4                      | 60                        | 40 GB          | 2 GB (YouTube) / 500 MB (Reels)  |
| **Creator** | $19               | 10                     | 200                       | 120 GB         | 2 GB (YouTube) / 500 MB (Reels)  |
| **Pro**     | $39               | 25                     | 600                       | 300 GB         | 2 GB (YouTube) / 500 MB (Reels)  |
| **Studio**  | $79               | 50                     | 1,500                     | 750 GB         | 10 GB (YouTube) / 500 MB (Reels) |

These are planned subscription prices; checkout is currently test-only. Drive does not count toward your social-account limit. One video posted to four accounts counts as four destination posts. Allowance is reserved while processing, consumed on confirmed publication, and released on confirmed failure. An uncertain outcome retains its reservation until resolved. Retrying a destination does not charge its allowance twice.

Use **Manage billing** for available subscription controls. Cancellation at period end preserves access until that period ends. Expired access pauses publishing and retains drafts. A downgrade may require choosing fewer active accounts without deleting their connection records. Live payments and a free trial are not offered by this build.

## Delete your app account

Resolve active or uncertain jobs first. Open **Settings**, type `DELETE`, and select **Delete account**. The app cancels its subscription and deletes the app account and associated records. Drive originals and already-published posts remain at their respective providers. Backup retention and payment-provider records are subject to the operator/provider policies; final operator details are still pending before launch.

## Troubleshooting and support

| Problem                       | First step                                                                                                                  |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Drive storage is full         | Free capacity or change your Drive plan, then resume if the page still has the upload session                               |
| Video metadata is not ready   | Wait for Drive processing, then choose the file again                                                                       |
| Source changed or unavailable | Restore the original unchanged file/access, or import a replacement and create a new post after reviewing existing outcomes |
| Account limit reached         | Deactivate a social account or select an appropriate plan                                                                   |
| Monthly allowance reached     | Wait for renewal or use available billing controls; inspect unresolved reservations                                         |
| Private visibility only       | The account/app may be subject to provider review restrictions; do not bypass the restriction                               |
| A post appears late           | Check per-destination status; provider processing may continue after dispatch                                               |
| No publishing progress        | Contact the operator with the time/timezone, provider, visible error, and post reference                                    |

Use the support contact shown on the app's policy pages once the operator configures it. There is no confirmed support address or response-time promise yet. Never send passwords, OAuth tokens, session cookies, signed video links, or payment secrets. A redacted error screenshot is generally sufficient to begin investigation.
