# 5. Validation and acceptance plan

Version 1.0 · 2026-09-22 · Owner: QA with engineering

## Evidence baseline

[Verification record](../verification.md) reports 43 unit/PostgreSQL backend tests, 8 desktop/mobile browser tests, TypeScript, and the production build passing locally. The backend tests use real PostgreSQL and Better Auth sessions; provider and Stripe responses are mocked. Browser tests create test-only sessions. Actual Google login, provider publication, Stripe-hosted checkout, container execution, and production deployment are not proven by those results.

No tests were rerun merely to write this documentation. Use the recorded baseline as historical evidence, then rerun the appropriate checks for each candidate commit.

## Test environments and data

Unit/integration and browser tests use a dedicated database whose name ends `_test`; fixtures intentionally recreate its public schema. Never point those tests at staging or production. Run suites sequentially when they share that database. Use synthetic captions/videos and authorized test accounts. For real-provider testing keep a separate staging database, credentials, domain, Stripe test products, and evidence store.

Record candidate SHA, environment, operator, timestamp, test IDs, input metadata, observed state, and redacted evidence. Never record OAuth tokens, private source URLs, or secrets. Published test URLs may be private; keep access restricted.

## Acceptance matrix

| Test ID | Requirements         | Scenario and expected result                                                                                                                                 | Existing evidence / remaining work                                                                 |
| ------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| V-01    | FR-01, NFR-01        | Forged, expired, revoked sessions rejected; sign-out invalidates session but leaves schedules; canceled Google consent safe                                  | Local session tests pass; real Google consent and protected-page review pending                    |
| V-02    | FR-02–FR-03, NFR-01  | Cross-user access denied; foreign/expired OAuth state rejected; different Google connection preserves app identity; disconnect clears grants and pauses jobs | Local integration tests pass; real multi-account consent/reconnect pending                         |
| V-03    | FR-04, FR-11, NFR-02 | Private source streams ranges; expired/forged links rejected; changed or deleted source stops publishing; originals survive deletion                         | Mocked protocol and crypto tests pass; full-size private-source proof pending                      |
| V-04    | FR-05, NFR-04        | Incompatible size/duration/options explained; required privacy/disclosures respected; desktop/mobile composer usable                                         | Validation and browser checks pass; accessibility/real creator eligibility pending                 |
| V-05    | FR-06, NFR-03        | Draft → schedule/edit/cancel; browser closed; UTC conversion and DST boundaries; cancellation vs dispatch race                                               | Local draft/calendar and timezone validation available; DST and actual process-race drills pending |
| V-06    | FR-07, NFR-03        | Duplicate delivery never repeats confirmed success; upload checkpoint recovery; partial failure; uncertain outcome requires review                           | Local protocol/worker tests pass; actual worker kill/restart and provider recovery pending         |
| V-07    | FR-08–FR-10          | Signed webhook/replay; concurrent last-slot reservation; renewal, cancellation, checkout reuse, downgrade account cap                                        | Local billing/quota tests pass; hosted lifecycle and in-flight expiry/downgrade cases pending      |
| V-08    | FR-11–FR-12          | Delete account only after resolving active work; cancel subscription, remove local records, keep originals; legal/setup pages accurate                       | Local deletion/UI checks available; staging billing deletion and legal review pending              |
| V-09    | FR-01–FR-05          | Real Google identity, Drive upload/import and another Google/YouTube identity                                                                                | Pending developer credentials and accounts                                                         |
| V-10    | FR-06–FR-07          | Real scheduled publication to each advertised platform; private source and correct metadata/settings                                                         | Pending developer credentials, authorized accounts, and applicable permissions                     |
| V-11    | FR-08–FR-10          | Real Stripe test checkout/portal, signed delivery, renewal failure/recovery, cancellation, downgrade                                                         | Pending Stripe test setup                                                                          |
| V-12    | NFR-05–NFR-06        | Containers, Hetzner + Coolify / Railway, alert delivery, restore, rollback, capacity, and cost                                                               | Compose configuration parsed; execution and production-like evidence pending                       |

## Reproducible local checks

```sh
npm ci
npm run typecheck
npm test
npx playwright install chromium
npm run test:e2e
npm run build
```

Supply `TEST_DATABASE_URL` for an isolated `_test` database if different from the documented local default. `npm run migrate` is a separate reviewed schema operation for the intended deployment database. Do not run schema-reset tests as a deployment health check.

## Required external scenarios

1. **Identity:** sign in, cancel consent, sign out, expire/revoke access, and select different Google identities for app login, Drive, and YouTube. Confirm user/connection IDs and no merging.
2. **Drive:** upload a small supported video, a large allowed video, and a file near the 2 GiB cap. Interrupt/resume upload, exhaust storage, remove access, delete/change source after scheduling, and verify no lasting server copy or public Drive permission.
3. **Platforms:** for each advertised account type, publish a short video and a supported longer video where eligible. Verify metadata, privacy, disclosures, resulting URL, remote status, and independently inspect the destination. Record a rejected/ineligible case as well.
4. **Scheduling:** schedule then close the browser; sign out; cross midnight/month boundaries; test DST spring gaps and fall overlaps in a timezone with DST. Confirm the saved UTC instant and local display. Define and test any ambiguity handling before acceptance.
5. **Recovery:** terminate worker after session creation, mid-transfer, after remote acceptance but before local settlement, and during a status poll. Redeliver a job; race cancellation/disconnect; ensure a successful destination is never recreated while another retries.
6. **Billing:** repeat checkout, replay events, deliver older events after newer ones, renew, fail/recover payment, cancel at period end, and downgrade with excess active accounts. Expire entitlement during an in-flight upload and inspect reservation settlement.
7. **UX:** keyboard-only task completion, visible focus, error announcements, zoom/reflow, contrast, screen-reader labels, mobile consent return, slow connection, and interrupted polling. Existing viewport tests are not a full accessibility audit.
8. **Operations:** run images, verify bounded memory under concurrent large transfers, restore database into isolation, reconcile restored remote IDs, trigger an alert, and roll back a candidate image safely.

## Proposed acceptance thresholds

At agreed pilot load, target due-to-dispatch p95 under 60 seconds, excluding intentional retries and paused/ineligible work. Measure provider processing separately; do not promise publication by that instant. Target zero observed duplicate confirmed posts, cross-user disclosures, leaked credentials, or incorrect quota double-counting in the test set. These are release criteria, not guarantees or previously measured results.

Test a representative multi-destination workload at configured concurrency three, measure memory, DB connections, egress, rate limits, latency, and oldest due job. Increase load until a bottleneck is characterized; document a supported pilot capacity instead of inventing an unlimited scale claim.

## Defects and sign-off

Critical defects include unauthorized data access, leaked grants, duplicate remote publication, and lost/corrupted billing state. Block release until fixed and retested. High defects block the affected advertised flow. Cosmetic defects may be deferred only with a recorded owner and impact. Each result is pass, fail, blocked, or not run; blocked is not pass.

Evidence entry format: `test ID | requirement | commit | environment | date/operator | steps/data | expected | actual | result | evidence location | defect/follow-up`. QA signs acceptance evidence; engineering signs fixes and deployment reproducibility; product signs any explicitly limited pilot scope. See [launch](07-launch.md) for final release authorization.

## Additional audit scenarios

Include T037–T041: refresh/navigation during an interrupted Drive upload; enabled vendor auth routes including deletion; stale upload-session and auxiliary-auth retention; provider redirects/host validation; source revision between metadata check and transfer; duplicate create-post acknowledgement loss; creator outcome assertion abuse; and target Node/container compatibility. Requirement-quality checkboxes and a zero-advisory dependency report do not substitute for these executions.
