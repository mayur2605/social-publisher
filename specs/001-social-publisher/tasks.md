# Task register: Social Publisher first release

Date: 2026-09-22 · Baseline: `7265f91` · Owners are roles until assigned by the product owner.

Checked tasks state only what is evidenced. Historical checks are not a claim that the current release candidate passed them again. Follow [plan](plan.md), [requirements](spec.md), and [lifecycle gates](../../docs/lifecycle/README.md).

## Documentation and product definition

- [x] T001 [Product] Document all eight lifecycle phases, PRD requirement IDs, acceptance plan, and release gates in `docs/lifecycle/`.
- [x] T002 [Engineering] Add constitution, feature specification, implementation plan, and this task register. These were initially manual artifacts; subsequent tooling installation is recorded separately in T043.
- [ ] T003 [Product] Conduct discovery experiments H-01–H-05 and record a pilot go/revise/stop decision. Depends on T001.
- [ ] T004 [Product] Establish business country/entity, support contact, legal review, and merchant eligibility; retain the live-billing block until separately reviewed.

## Existing local implementation

- [x] T005 [US1] Implement Better Auth Google configuration and PostgreSQL sessions; local forged/expired/revoked/sign-out tests exist.
- [x] T006 [US1] Implement dedicated owner-scoped connections, encrypted tokens, refresh handling, and disconnected-state behavior.
- [x] T007 [US2] Implement Drive upload/import/private streaming, metadata/checksum records, composer, and validation.
- [x] T008 [US3] Implement pg-boss scheduling, destination checkpoints, locking, retry budget, results, cancellation, and explicit outcome review.
- [x] T009 [US4] Implement Stripe test checkout/portal/webhooks, plans, account limits, and atomic usage reservation/settlement.
- [x] T010 [US5] Implement legal/setup screens and account deletion with local-original preservation checks.
- [x] T011 [QA] Record historical local evidence: 42 backend tests, 8 browser tests, TypeScript/build, worker health, and Compose configuration parsing in `docs/verification.md`.
- [x] T012 [Operations] Supply Docker/Compose/Railway configuration and provider/deployment/operations runbooks. Container execution/deployment is not included in this checkbox.

## Engineering hardening

- [ ] T013 [US1/E-01] Review/add protected-page session checks and prove page/API ownership/session boundaries. Engineering; V-01/V-02.
- [ ] T014 [US3/US4/E-02] Reproduce entitlement expiry/downgrade during remote processing; ensure safe reconciliation and correct quota settlement. Engineering; V-06/V-07.
- [ ] T015 [US3/E-03] Perform actual worker-kill, cancellation/disconnect race, and ambiguous-acceptance tests; fix defects without clearing remote evidence. Engineering/QA; V-05/V-06.
- [ ] T016 [US2/US3/E-04] Measure large-file transfer throughput/memory and full-size resume; optimize chunk dispatch if needed. Engineering; depends on T021; V-03/V-12.
- [ ] T017 [US2/E-06] Complete keyboard/screen-reader/contrast/mobile OAuth review and fix blocking accessibility defects. QA/engineering; V-04.
- [ ] T018 [E-08] Add CI for typecheck, isolated-DB tests, browser checks as appropriate, and production build. Engineering; keep secrets/test DB isolated.
- [ ] T019 [E-09] Add history pagination and verify request/resource limits before the chosen pilot exceeds current bounds. Engineering; document any scoped deferral.
- [ ] T020 [E-10] Decide and implement retention/pruning, support procedures, and minimal product/operational metrics. Product/operations; depends on T004.

## Real provider and billing acceptance

- [ ] T021 [US1/US2] Configure Google developer credentials, Picker, consent/test users; complete real sign-in and separate-account Drive/YouTube flows. Product/engineering; V-09.
- [ ] T022 [US3/E-05] Configure Meta app/test Pages/professional Instagram accounts; validate Video, Reel, and signed-source fetch paths. Product/engineering; V-10.
- [ ] T023 [US3/E-05] Configure TikTok app/test creators; validate creator settings, consent, private posting, and scheduled flow under approved use case. Product/engineering; V-10.
- [ ] T024 [US3/E-05] Validate YouTube private upload/status, supported long-video eligibility, and recovery; record public-visibility audit status. Engineering; depends on T021; V-10.
- [ ] T025 [US4] Configure Stripe test prices/webhook/portal and run hosted checkout, renewal/failure, cancellation, downgrade, deletion, and replay cases. Product/QA; V-11.
- [ ] T026 [US2/US3] Prove private Drive transfers without permanent app video storage, interrupted uploads/full Drive/missing source, browser-closed scheduling, and DST boundaries on staging. QA; depends on T021–T024; V-03/V-05/V-10.
- [ ] T027 [Product/engineering] Obtain and record applicable platform reviews/approvals; keep unsupported public capabilities disabled. Depends on working flows T021–T024.

## Staging and release

- [ ] T028 [Operations] Authenticate Railway, create isolated services/domain/secrets, and build/run the actual web/worker images. Depends on T012; phase 6.
- [ ] T029 [E-07] Test empty/concurrent migration startup, backups, isolated restore with remote reconciliation, and compatible rollback. Operations/engineering; depends on T028; V-12.
- [ ] T030 [E-08] Configure health/backlog/integration/billing alerts, test delivery, and assign primary/backup responders. Operations; depends on T028.
- [ ] T031 [Operations/QA] Record capacity, cost, recovery objectives, deployed smoke tests, and all required staging evidence. Depends on T013–T018 and T021–T030, except provider public approvals may remain pending for an authorized internal test.
- [ ] T032 [Product/QA] Conduct controlled pilot within actual provider access limits and accept results. Depends on T003, T017, T025, T026, T031.
- [ ] T033 [Product/engineering] If launching real payments, separately design/review/validate live-billing support after business eligibility. Depends on T004/T025; current code intentionally rejects live keys/events.
- [ ] T034 [Launch owner] Complete L-01–L-09 release evidence and explicitly record public-release decision. Depends on T020, T027, T032 and T033 if charging.

## Production operations

- [ ] T035 [Operations/support] Establish the phase 8 cadence, incident ownership, secret rotation, retention enforcement, and recurring restore evidence before public access.
- [ ] T036 [Product] Review first-week/first-month reliability, onboarding, support, cost, and paid-retention evidence after release; prioritize follow-up work without silently expanding scope.

## Documentation-audit follow-up

- [ ] T037 [US2] Decide and implement/test resumable Drive upload recovery across navigation/reload if required; current UI resume only survives while its page-memory state remains. Engineering/product; FR-04, V-03/V-09.
- [ ] T038 [US1/US5] Review enabled Better Auth endpoints and all capability/auxiliary records on disconnect/deletion; close any bypass or retention mismatch before final policy approval. Engineering; SEC-01/SEC-11, POL-04, V-01/V-08; complements T013/T020.
- [ ] T039 [US3/US4] Assess creator-asserted outcome abuse/accounting, source revision races, provider redirect/host boundaries, and duplicate post submission after lost responses; add controls/tests where needed. Engineering; SEC-05/SEC-07/SEC-10; complements T014/T015/T019.
- [ ] T040 [US2/US3] Validate design state coverage and resolve DST ambiguity/error rules in the UI; record keyboard, screen-reader, real-mobile and error-recovery evidence. Product/QA; complements T017/T026.
- [ ] T041 [Engineering/operations] Complete target-runtime/container, package provenance/license, OS-image and dependency-update assurance beyond the zero-advisory npm snapshot. Depends on T018/T028; NFR-06/SEC-12.
- [x] T042 [Documentation] Add API, threat, approval, release, help, policy, design, dependency and traceability records; audit first-party docs against source; check official GitHub Spec Kit guidance. Actual release acceptance remains incomplete.
- [x] T043 [Tooling] Installed official Spec Kit 1.0.9 from release tag `v1.0.9` on 2026-09-22; initialized Codex skills/shared scripts; preserved existing artifacts; selected the existing feature with the supplied prerequisite script. `specify integration status --json` reported `ok` with zero missing/modified managed files; required spec/plan/tasks checks passed. See `docs/spec-kit-review.md`. No implementation/convergence workflow was run.

## Completion evidence

When checking an open task, append or link its commit, date, operator/role, test IDs, and evidence location. Sensitive provider approval/account artifacts belong in restricted storage; link a non-secret reference. Failed, blocked, deferred, or not-run tasks stay unchecked with an explanation. Tooling installation is evidenced by T043 rather than inferred from T002. An installed workflow is not proof that its implementation or convergence phases have run.
