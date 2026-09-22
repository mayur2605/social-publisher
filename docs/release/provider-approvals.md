# Provider approval and integration register

Reviewed 2026-09-22 · Owner: product owner with engineering · Release gate: L-02/L-03

No provider approval has been evidenced in this repository. The records below reflect configured code paths and required follow-up, not confirmation that developer apps or reviews exist. Keep secrets, tester identities, review videos, and private dashboard screenshots in restricted storage; commit only redacted evidence references.

## Current register

| ID    | Integration / implemented grant                                                                                                       | Callback path                       | Review and evidence state                                                                        | Release restriction / next action                                                                    |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| PA-01 | Google identity via Better Auth: OpenID identity                                                                                      | `/api/auth/callback/google`         | Credentials missing at last setup check; consent app status and domain verification not recorded | Configure app/test users; test consent/sign-out and review applicable verification                   |
| PA-02 | Drive/Picker: `openid email profile` plus `drive.file`                                                                                | `/api/connections/callback/drive`   | Project, restricted Picker key, and real upload/import evidence pending                          | Verify narrowly selected files, private storage and reconnect; record approved consent configuration |
| PA-03 | YouTube: `openid email profile`, `youtube.upload`, `youtube.readonly`                                                                 | `/api/connections/callback/youtube` | Upload/audit status and real test channel evidence pending                                       | Keep `YOUTUBE_PUBLIC_APPROVED=false`; verify upload eligibility and audit requirements               |
| PA-04 | Meta Facebook Pages: `pages_show_list`, `pages_read_engagement`, `pages_manage_posts`                                                 | `/api/connections/callback/meta`    | App/access/business-review status unrecorded; Page Video/Reel tests pending                      | Verify the exact scopes/access for the selected Graph version and account; no outside-user promise   |
| PA-05 | Instagram professional accounts through Facebook Login: `instagram_basic`, `instagram_content_publish` plus relevant Page permissions | `/api/connections/callback/meta`    | Linked Page/account eligibility, app review and content-publishing evidence pending              | Validate chosen account flow and signed-source fetch on deployed HTTPS hostname                      |
| PA-06 | TikTok: `user.info.basic`, `video.publish`                                                                                            | `/api/connections/callback/tiktok`  | App, Direct Post audit, allowed testers, scheduling use case and real post evidence pending      | Keep `TIKTOK_PUBLIC_APPROVED=false`; confirm permitted test visibility and background flow           |
| PA-07 | Stripe test subscriptions and webhook                                                                                                 | `/api/billing/webhook`              | Test prices, endpoint signing secret, portal and hosted tests pending                            | Live keys/events blocked in code; merchant eligibility and separate live-mode review pending         |

Prefix each callback with the exact `BETTER_AUTH_URL` origin. Register local/staging/production clients separately where supported; an approval from one app/environment must not be assumed to cover another. Code currently defaults Meta requests to Graph `v23.0`; confirm its support and required permissions before real testing rather than treating the default as a verified current recommendation.

## Evidence required to advance a record

Use states **unconfigured → configured/test access → submitted → approved with restrictions**, or **rejected/expired/revoked** where applicable. Some services do not use this exact review workflow; record the actual dashboard status instead of inventing a submission.

For each record capture: environment and app/project reference; owner; exact scopes and API version; registered origins/callbacks; domain/policy URLs; tester/account-type limits; review submission date/reference; returned decision and restrictions; expiry/review date if supplied; redacted evidence location; last successful real test IDs/date/commit; and next action. None of those approval fields has been filled with assumed values here.

1. Configure the application following [provider setup](../provider-setup.md).
2. Test actual consent and publishing using authorized accounts and preserve V-09/V-10/V-11 evidence.
3. Prepare a review demonstration: sign-in, account selection, private source selection, platform settings/consent, post result, disconnect, and deletion instructions.
4. Submit only the implemented use case and permissions. Record feedback and fix/retest gaps.
5. Change approval flags only after the corresponding decision and real-account validation are recorded. Meta access is governed by its app permissions; there is no equivalent generic approval flag in this code.
6. Reassess on app-mode/scope/domain/API changes or provider revocation; pause affected public claims until reviewed.

## Official references and verification limits

- [Drive scopes](https://developers.google.com/workspace/drive/api/guides/api-specific-auth): `drive.file` limits access to files used with the app; inspect the current verification requirements for the full requested scope set.
- [YouTube videos.insert](https://developers.google.com/youtube/v3/docs/videos/insert): qualifying unverified projects have private-only upload restrictions; an applicable audit is required to lift them.
- [TikTok Direct Post getting started](https://developers.tiktok.com/docs/en/content-posting-api-get-started): review/audit requirements constrain unaudited clients. Test the actual approved app configuration.
- [Meta app review](https://developers.facebook.com/docs/app-review/) and [Instagram content publishing with Facebook Login](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-facebook-login/content-publishing/): reference locations for manual verification. These pages could not be retrieved in this documentation session; exact current requirements remain unverified.
- [Stripe webhooks](https://docs.stripe.com/webhooks): verify signatures against the raw body and maintain reliable event delivery. Successful webhook validation is not merchant-eligibility approval.

The Google, TikTok, and Stripe pages above were consulted on the review date. Reading public documentation does not establish this application's approval or account eligibility. Recheck before submission and each affected release.
