# Developer apps and launch checklist

Replace `https://publisher.example.com` with `BETTER_AUTH_URL`. Keep callback URLs exact, including scheme and trailing slash behavior. Use separate local and production OAuth clients where practical.

## Google / Better Auth / Drive / YouTube

1. Create a Google Cloud project; enable Drive API, Google Picker API, and YouTube Data API v3.
2. Configure an external OAuth consent screen with your domain, app name, support email, privacy policy, terms, and authorized test users.
3. Create a Web Application OAuth client. Register:
   - `https://publisher.example.com/api/auth/callback/google`
   - `https://publisher.example.com/api/connections/callback/drive`
   - `https://publisher.example.com/api/connections/callback/youtube`
4. App login requests OpenID identity. Drive connects separately with `drive.file`. YouTube connects with `youtube.upload` and `youtube.readonly`, allowing the user to choose the intended channel. Do not add broad Drive access.
5. Create a browser API key restricted to Google Picker API and your site's HTTP referrers. Set `GOOGLE_PICKER_API_KEY` and the numeric `GOOGLE_PROJECT_NUMBER` from the same project.
6. Test sign-in, selecting a different account for Drive, creating a folder/upload, choosing an existing video, revoked consent, reconnecting, and YouTube private upload.
7. Complete Google OAuth verification for required scopes and the YouTube API audit necessary for public visibility. Testing-mode grants may expire; do not treat short-lived test authorization as production readiness.
8. Only set `YOUTUBE_PUBLIC_APPROVED=true` after approval. Confirm the channel has the verification necessary for its intended upload lengths.

## Meta

1. Create a business app with Facebook Login and the appropriate Instagram/Pages API use cases.
2. Set the valid redirect URI to `https://publisher.example.com/api/connections/callback/meta`.
3. Request only `pages_show_list`, `pages_read_engagement`, `pages_manage_posts`, `instagram_basic`, and `instagram_content_publish` for the implemented flows. Verify exact access requirements for your selected Graph API version during app review.
4. Add test Facebook Pages and linked Instagram professional accounts. Personal Facebook profiles and consumer Instagram accounts are unsupported.
5. Configure privacy (`/privacy`), terms (`/terms`), and data-deletion instructions (`/data-deletion`) in the app dashboard. This implementation supplies an instructions URL, not a Meta signed-request data-deletion callback.
6. Record a review video covering login, account selection, explicit posting consent, source preview, publishing, returned post link, and disconnect/data deletion.
7. Complete required app review, advanced-access requests, and business verification before connecting outside users.
8. Validate both Facebook Video and Reel paths, plus Instagram's URL fetch of a private Drive video through the streaming gateway, on the live HTTPS hostname.

## TikTok

1. Register an app with Login Kit and Content Posting API / Direct Post.
2. Configure `https://publisher.example.com/api/connections/callback/tiktok` and request `user.info.basic` and `video.publish`.
3. Use the app's creator-info call to render current nickname, allowed visibility, maximum duration, and disabled interactions. Privacy has no default; comment, duet, and stitch are off until explicitly enabled.
4. Verify music-use consent and commercial-content disclosures. Branded content cannot be private.
5. Start with approved test users and private visibility. Unaudited-app restrictions and creator caps apply. Submit the Direct Post audit with a recording of the actual full workflow.
6. Only enable `TIKTOK_PUBLIC_APPROVED=true` after audit approval. Test scheduled authorization and background transfer from the creator's Drive under your approved use case.

## Stripe test mode

1. Create three recurring monthly USD prices: 900, 1900, and 3900 cents. Put the IDs in the matching environment variables.
2. Register `https://publisher.example.com/api/billing/webhook` for `customer.subscription.created`, `.updated`, and `.deleted`. Copy that endpoint's signing secret.
3. Configure the billing portal with those products, invoices/payment-method management, subscription cancellation at period end, immediate upgrades with proration, and downgrades at period end. Set the return URL to `/billing`.
4. Complete a test checkout, replay webhook events, simulate renewal failure/recovery, and verify cancellation and downgrade entitlements.
5. Live payment support is deliberately blocked in code. Decide the business country and merchant eligibility, complete legal/tax setup, then make and review a separate live-billing change. Do not simply paste a live key into this build.

## Before public registration

Populate legal entity and support contact. Verify database backups and retention settings and reflect them in the privacy policy. Confirm platform approval scopes, quotas, policy pages, domain verification, TLS, and review videos. Run one real short-video and one supported long-video workflow on authorized test accounts, including a browser-closed schedule. Do not advertise these tests as passed until they have been performed using actual credentials.

## Evidence ownership

Record actual app scopes/access, approval decisions and restrictions in the [provider approval register](release/provider-approvals.md). This setup checklist is not proof of approval. Finalize operator/retention details through the [policy decision register](release/policy-decisions.md).
