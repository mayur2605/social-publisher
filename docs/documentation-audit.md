# Documentation consistency and production-readiness audit

2026-09-22 · Review type: first-party documentation and source cross-check

## Verdict and scope

The documents now describe a consistent intended product and explicitly distinguish current code from required production work. **The application is not production-ready.** This review corrects documentation and exposes gaps; it does not implement the listed hardening, obtain approvals, or execute real-provider tests.

Reviewed all repository-owned Markdown and documentation artifacts, including README, CLAUDE, eight lifecycle phases, Spec Kit-style artifacts/checklist, runbooks, OpenAPI, and the supporting security/design/dependency/release/help documents. Compared them with auth/API/connection/Drive/worker/billing/UI source, migration schema, dependency lockfile, Docker/Railway/Compose configuration, and test definitions. Public policy page source was reviewed for consistency; legal finalization remains pending. Vendor/generated/ignored files were not treated as project documentation to rewrite.

Application baseline: `7265f91`. Pre-review docs baseline: `4d76eab`. Preserve earlier user edits to CLAUDE command guidance while correcting stale architecture descriptions. No application source or dependency versions were changed by this review.

## Corrections and remaining findings

| Finding                                                                                | Documentation resolution                                                                                   | Implementation follow-up                                                                         |
| -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| CLAUDE described CommonJS and placeholder worker despite ESM/implemented worker        | Corrected architecture, worker, configuration checks and library paths                                     | None for this wording correction                                                                 |
| Retry policy described total attempts instead of consecutive failures                  | Corrected shared engineering guidance; ordinary progress and error budgets distinct                        | Existing retry tests are historical evidence                                                     |
| Deployment said account linking although implicit identity linking is disabled         | Changed wording to dedicated publishing-account connections                                                | T013/T021 validate actual identity boundaries                                                    |
| Recovery guidance implied a new post was the only route after uncertain initialization | Documented Check status vs explicit Review outcome and safe retry                                          | T039 assesses outcome assertion abuse and duplicate creation                                     |
| Resume described generically although UI state is page-memory only                     | Creator guide, technical spec and acceptance report now disclose limitation                                | T037 product decision and implementation/test                                                    |
| “Delete all app records” can obscure auxiliary auth/upload/event tables and backups    | Added concrete policy inventory and threat review                                                          | T038/T020 cleanup/vendor-route audit before final policy claims                                  |
| No exact app API contract                                                              | Added 21 app route patterns / 23 operations with response types and edge conditions                        | Vendor Better Auth routes remain separately documented, not asserted as a complete generated API |
| No design/dependency assurance documents                                               | Added real CSS/component baseline, state acceptance, runtime/lockfile inventory and update policy          | T017/T040/T041 evidence remains open                                                             |
| Spec Kit documents could be confused with installed tooling                            | Original review identified absent tooling; subsequent T043 installation is verified in the Spec Kit record | T043 installed; workflow execution/convergence is still not claimed                              |
| Local passing tests could be confused with launch acceptance                           | Added explicit NO-GO report and pending provider/business records                                          | T021–T035 external acceptance and operations                                                     |

## Requirement → design/code → evidence → open task

| Requirement                  | Design / primary implementation                        | Evidence scope                                        | Remaining task anchors   |
| ---------------------------- | ------------------------------------------------------ | ----------------------------------------------------- | ------------------------ |
| FR-01 Google identity        | Auth boundary; `auth.ts`, auth handler, page shell/API | V-01 local session checks                             | T013/T021/T038           |
| FR-02 Identity separation    | Dedicated OAuth; `connections.ts`                      | V-02 mocked other-Google identity                     | T021/T027                |
| FR-03 Account health         | Accounts UI; connection state/refresh/disconnect       | V-02 local token/ownership tests                      | T022–T024/T038           |
| FR-04 Private Drive source   | Library; `drive.ts`, upload UI                         | V-03 local protocol mocks                             | T016/T021/T026/T037      |
| FR-05 Composer/validation    | Composer design; `validation.ts`/API                   | V-04 local validation/browser tests                   | T017/T022–T024/T040      |
| FR-06 Durable schedule       | Calendar/posts; `jobs.ts`, UTC/timezone fields         | V-05 partial browser/worker tests                     | T015/T026/T040           |
| FR-07 Results/recovery       | Result-state design; adapters/jobs/outcome API         | V-06 local checkpoints/duplicate delivery             | T014/T015/T024/T039      |
| FR-08 Subscription lifecycle | Billing UI; `billing.ts`                               | V-07 local signed event/checkout tests                | T014/T025/T033           |
| FR-09 Quotas                 | Transactional subscription/usage locks                 | V-07 local contention/idempotency                     | T014/T025/T039           |
| FR-10 Account caps           | Accounts/billing; active-account checks                | Local rule implementation; external downgrade pending | T025                     |
| FR-11 Integrity/deletion     | Source metadata; app account deletion gate             | V-03/V-08 partial local tests                         | T026/T038/T039           |
| FR-12 Setup/legal            | Setup checker, policy pages, provider runbook          | Local setup/UI only                                   | T004/T020/T027/T034      |
| NFR-01 Authorization/secrets | Threat SEC-01–SEC-03; auth/API/crypto                  | Partial local controls                                | T013/T038/T039           |
| NFR-02 Privacy               | Private streaming, encrypted grants                    | Partial V-03 protocols                                | T020/T026/T038/T039      |
| NFR-03 Reliability           | Durable queue, locks, checkpoints                      | Partial V-05/V-06                                     | T014/T015/T029           |
| NFR-04 Accessibility         | Product design, Radix workspace                        | Viewport checks, not full audit                       | T017/T040                |
| NFR-05 Performance           | Worker cadence/concurrency, range streams              | Proposed targets; unmeasured full-size capacity       | T016/T030/T031           |
| NFR-06 Operability           | Deployment/operations/dependency policy                | Configuration and local process evidence              | T018/T028–T031/T035/T041 |

## Phase readiness

Discovery is hypothesis-based; no completed customer research. PRD/spec/plan are present; open policy/behavior choices remain in the requirement checklist. Architecture and local implementation exist; security/recovery/performance gaps remain actionable. Local validation is historical and partial; real-provider and hosted-billing tests are pending. Staging, container execution, backup/restore, rollout and monitoring are not proven. Provider approvals and business/live-payment eligibility remain unrecorded. Production operations are planned, not staffed or installed by documentation.

This distinction applies across all eight phases. No phase should be shown as complete merely because its document exists.

## Review checks and limitations

Executed documentation checks: **31 first-party Markdown files**, **147 local Markdown links**, **186 OpenAPI references**, **23 unique API operation IDs**, **43 unique task IDs**, and **eight numbered lifecycle phases**. All local targets/references resolved. Redocly CLI 2.53.3 validated the OpenAPI document with zero errors and four warnings: three overlapping-template warnings and one callback-without-2xx warning. The callback correctly documents its actual 302 response. Markdown/JSON formatting and Git whitespace checks are part of this documentation change.

Resolve all relative Markdown links and OpenAPI `$ref` targets; check unique task/requirement IDs, method/path parameter definitions, formatting and Git whitespace; compare locked dependency versions to inventory. Validate OpenAPI with Redocly's minimal rules. Its remaining expected design warnings concern overlapping route templates and the real redirect-only OAuth callback; do not invent a 200 response or change runtime routes solely to silence those warnings.

The npm advisory snapshot returned zero known advisories. Public official references were checked for OpenAPI, Spec Kit, Drive, YouTube, TikTok and Stripe; Meta pages were inaccessible through the browsing tool, so current Meta requirements remain marked unverified. No penetration testing, license audit, provider approval, legal sign-off, or new application regression execution is claimed.

The [acceptance report](release/acceptance-report.md) owns release status; the [task register](../specs/001-social-publisher/tasks.md) owns remaining work. Re-audit affected documents whenever code, provider contracts, dependencies, approvals, deployment or product scope changes. Record a candidate SHA and actual results before changing readiness claims.
