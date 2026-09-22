# 2. Product requirements document

Version 1.0 · 2026-09-22 · Owner: product owner · Product: Social Publisher

## Outcome and scope

An individual creator signs in with Google, connects a separate Drive grant and multiple publishing accounts, chooses one prepared video, and publishes or schedules it to selected destinations. The creator can see which destinations succeeded, failed, or need attention without reposting successful destinations.

Release one uses English, monthly USD subscriptions, MP4/MOV up to 2 GiB on Starter/Creator/Pro and up to 10 GiB on Studio (subject to stricter destination limits: 500 MB short-form cap on Instagram Reels, Facebook Reels, and TikTok to protect cloud egress margins), and one connected Drive per user. Supported destinations are YouTube channels, authorized TikTok accounts, Facebook Pages, and Instagram professional accounts through the chosen Meta linked-Page flow. Personal Facebook profiles are excluded. Video editing, transcoding, AI generation, teams, engagement analytics, and a free trial are excluded.

## User journeys

1. **First use:** sign in → connect Drive → connect eligible social accounts → import/upload a video → select a subscription in test mode → create the first post.
2. **Publish:** preview source → select destinations → shared caption and per-destination options → fix compatibility errors → publish now → monitor individual results.
3. **Schedule:** save draft → select local date/time and timezone → review → schedule → close browser → worker dispatches → inspect results later.
4. **Recover:** open failed/attention result → reconnect, restore source, or review provider outcome → retry only when safe. Keep successful destinations unchanged.
5. **Leave:** cancel subscription while retaining paid-period access, or explicitly delete the app account after resolving active/uncertain work. Preserve Drive originals and existing social posts.

## Functional requirements and acceptance

| ID    | Requirement                               | Acceptance criterion                                                                                                                                                                                                                  |
| ----- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-01 | Google app identity using Better Auth     | Valid sign-in establishes a database session; canceled consent creates no usable session; sign-out invalidates it; forged/expired/revoked sessions cannot read protected data                                                         |
| FR-02 | Separate publishing grants                | Connecting another Google/YouTube identity preserves the signed-in app user and unrelated connections; each connection has an owner and explicit provider identity                                                                    |
| FR-03 | Accounts and connection health            | Connect one Drive and multiple eligible social accounts; show active/reconnect/disconnected state; disconnect clears stored grants and pauses affected pending destinations                                                           |
| FR-04 | Private Drive source                      | Direct resumable upload or Picker import stores source identity, checksum, size, and metadata; interrupted uploads can be resumed; app holds no permanent video copy                                                                  |
| FR-05 | Composer and validation                   | Preview video; select unique destinations; save captions and per-platform settings; reject incompatible scheduled/now posts with a destination-specific explanation (including 500 MB short-form caps)                                |
| FR-06 | Durable scheduling                        | Draft, publish-now, timezone-aware schedule, list/calendar, edit/reschedule, and pre-dispatch cancellation work; persisted jobs continue without a browser session                                                                    |
| FR-07 | Per-destination results and safe recovery | Persist remote IDs and upload checkpoints; show processing, published link, failure, or attention; no automatic duplicate of a confirmed success; reconcile uncertain outcomes before new side effects                                |
| FR-08 | Subscription lifecycle                    | Test checkout, billing portal, upgrades, renewals, cancellation, and replay-safe signed webhooks update access; cancellation keeps paid-period access; expired access pauses new publishing                                           |
| FR-09 | Server-side quotas                        | Count each destination once; reserve at dispatch, consume on publication, release on confirmed failure; enforce both monthly post count and cumulative monthly bandwidth pool; concurrent work cannot exceed allowance; retries reuse |
| FR-10 | Plan account limits                       | Enforce active social-account cap; Drive does not count; downgrade requires choosing active accounts within the cap while keeping connection records                                                                                  |
| FR-11 | Source integrity and deletion             | Missing/inaccessible/changed source needs attention; deleting local records or account never deletes Drive originals; account deletion resolves active work and cancels billing first                                                 |
| FR-12 | Setup, legal, and readiness               | Explicit setup state for absent credentials; privacy, terms, and deletion instructions are available; approved scopes, operator identity, support contact, and live-billing eligibility gate launch                                   |

## Platform behavior

YouTube requires title, visibility, and made-for-kids selection. TikTok requires current creator settings, explicit privacy choice, posting consent, and applicable interaction/commercial disclosures. Facebook offers Video and Reel paths. Instagram uses its supported professional-account flow. Application limits in [validation code](../../src/lib/validation.ts) are an implementation baseline; QA must recheck provider rules and account-specific eligibility before each release. Public visibility remains gated by applicable approvals.

## Plans

| Plan        | Monthly USD | Active social accounts | Destination posts / month | Monthly bandwidth pool | Max video size                   |
| :---------- | :---------- | :--------------------- | :------------------------ | :--------------------- | :------------------------------- |
| **Starter** | $9          | 4                      | 60                        | 40 GB                  | 2 GB (YouTube) / 500 MB (Reels)  |
| **Creator** | $19         | 10                     | 200                       | 120 GB                 | 2 GB (YouTube) / 500 MB (Reels)  |
| **Pro**     | $39         | 25                     | 600                       | 300 GB                 | 2 GB (YouTube) / 500 MB (Reels)  |
| **Studio**  | $79         | 50                     | 1,500                     | 750 GB                 | 10 GB (YouTube) / 500 MB (Reels) |

The billing period comes from the subscription, not the creator's calendar timezone. Uncertain external outcomes retain reservations until resolved. Renewals must not charge a retry twice. Live Stripe keys/events are rejected by the current implementation.

## Nonfunctional requirements

| ID     | Requirement                   | Acceptance or proposed target                                                                                                                                                                                |
| ------ | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| NFR-01 | Authorization and secrets     | Enforce ownership on every protected resource; server-side session checks on protected data/operations; no refresh tokens, secrets, or signed source URLs in logs                                            |
| NFR-02 | Privacy                       | Encrypted integration tokens, narrow Drive scope, expiring job-scoped media URLs with ranges, and no durable server video storage; authenticated Picker access token is an intentional browser capability    |
| NFR-03 | Reliability                   | Durable queue, checkpoints, bounded transient retries, duplicate delivery protection, and race-safe cancellation/disconnection; never promise exact simultaneous publication                                 |
| NFR-04 | Usability and accessibility   | Complete core flows on desktop/mobile; keyboard access, labeled controls, focus visibility, readable errors, and screen-reader review before public release                                                  |
| NFR-05 | Performance and observability | Proposed staging target: eligible due jobs begin dispatch within 60 seconds at agreed pilot load; measure large-file memory/throughput and alert on overdue jobs; provider processing is measured separately |
| NFR-06 | Operability                   | Separate web/worker/database, reviewed migrations, verified restore and rollback, documented support and retention policies before production                                                                |

## Product measures

Proposed events are sign-in completed, connection completed, media selected, schedule created, dispatch started, destination confirmed, destination attention, and checkout completed. Collect minimal internal IDs and timing, not video contents, captions, tokens, or signed URLs. Instrumentation and a consent/privacy review are pending.

Measure activation (new creators who schedule or publish), time to first confirmed post, confirmed publication rate excluding user-canceled work, overdue dispatch rate, unresolved attention age, and paid retention. These are operational/product metrics, not the excluded engagement analytics feature. Establish baselines in the pilot before setting commercial goals.

## Release acceptance and change control

The [validation matrix](05-validation.md) links requirements to evidence; the [launch gate](07-launch.md) determines readiness. A feature being coded is not acceptance. Product owner resolves scope changes; engineering records API/schema implications; QA adds evidence. Business identity, jurisdiction, actual provider approvals, measured capacity, and retention policy remain open decisions with assigned roles in the roadmap.
