# Feature specification: Social Publisher first release

Feature ID: `001-social-publisher` · Created: 2026-09-22 · Status: implemented baseline; acceptance incomplete

## User outcome

An individual creator publishes a prepared private Drive video to multiple authorized social accounts immediately or on a durable schedule, then sees a reliable outcome for every destination.

The normative requirements are [FR-01–FR-12 and NFR-01–NFR-06 in the PRD](../../docs/lifecycle/02-prd.md). This feature specification provides acceptance stories without duplicating those requirements. The [discovery document](../../docs/lifecycle/01-discovery.md) records unvalidated commercial assumptions.

## Prioritized stories

### US1 · P1 · Establish a secure creator workspace

As a creator, I can sign in, connect Drive and eligible publishing accounts, and remain in the same app identity when choosing a different Google account.

Given a valid app session, when I connect a different Google identity, then my app user ID and unrelated connections stay unchanged. Given a forged or revoked session, when I request another user's source or post, then access is rejected. Consent cancellation does not create a connection.

Requirements: FR-01–FR-03, NFR-01. Validation: V-01, V-02, V-09. Independent acceptance: real sign-in and two separate Google identities, plus authorization tests.

### US2 · P1 · Compose from a private source

As a creator, I upload directly to Drive or choose an existing file, preview it, and configure compatible destinations.

Given a private file, when I import it, then its identity/checksum/metadata are recorded without copying it permanently to the app server. Given an incompatible destination, when I schedule, then I see the reason and must correct/remove it. Given a changed file, dispatch requires attention rather than silently using replacement bytes.

Requirements: FR-04–FR-05, FR-11, NFR-02, NFR-04. Validation: V-03, V-04, V-09.

### US3 · P1 · Publish or schedule reliably

As a creator, I choose now or a timezone-aware future time and get independent results while my browser is closed.

Given a persisted schedule, when I sign out, then publishing still proceeds with integration grants. Given one successful and one failed destination, when I retry the failure, then the successful post is not recreated. Given an uncertain response, the job reconciles or requires explicit review. Pre-dispatch cancellation prevents new publication.

Requirements: FR-06–FR-07, NFR-03, NFR-05. Validation: V-05, V-06, V-10.

### US4 · P1 · Pay and use allowance correctly

As a creator, I choose a plan and manage billing while understanding account, destination-post, and monthly bandwidth pool limits.

Given one remaining slot or available bandwidth pool, concurrent dispatch reserves at most one new destination. Given a retry, its usage is not counted twice. Given period-end cancellation, access continues to the paid endpoint. Given downgrade, saved connections remain and active accounts must fit the new cap.

Requirements: FR-08–FR-10. Validation: V-07, V-11. The current deliverable uses Stripe test mode only.

### US5 · P2 · Recover and leave safely

As a creator, I can reconnect, inspect uncertain outcomes, obtain help, and delete my app account without deleting Drive originals.

Given active/uncertain publication, account deletion explains the required resolution. Given resolved work and confirmed deletion, app records are removed and originals preserved. Public policies identify the real operator and support contact before launch.

Requirements: FR-03, FR-11–FR-12, NFR-06. Validation: V-02, V-08, V-12. Lower story priority does not waive security or deletion requirements for launch.

## Edge cases and acceptance boundary

Include expired consent, full Drive storage, missing metadata, 2 GiB / 10 GiB limits, 500 MB short-form caps on Reels/TikTok, monthly bandwidth pool exhaustion, provider-specific durations, DST transitions, token refresh races, worker death, lost acknowledgements, revoked grants, partial success, duplicate callbacks/webhooks, quota contention, in-flight subscription expiry, and database restore after remote acceptance. See the [validation plan](../../docs/lifecycle/05-validation.md) for exact evidence requirements.

Feature success requires the linked acceptance matrix and release gates to pass. Current local test counts are evidence of a subset, not full acceptance. Provider approval, operator details, live billing, capacity, and recovery policies remain open as tracked in [tasks](tasks.md).
