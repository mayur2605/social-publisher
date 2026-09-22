# 4. Implementation roadmap and delivery phases

Version 1.0 · 2026-09-22 · Owner: engineering with product owner

## Baseline and dependency order

The app is implemented locally and pushed to GitHub. It has not been accepted against real provider accounts or deployed to production. This roadmap sequences remaining work by evidence and dependencies, not estimated calendar dates.

```text
Discovery evidence ────────────────────────────┐
Requirements → local implementation → hardening → staging → pilot → public launch
Developer credentials → real provider tests ──┘             ↑
Business/legal decisions + provider approvals ──────────────┘
```

The [task register](../../specs/001-social-publisher/tasks.md) owns completion checkboxes. This roadmap owns milestones and exit criteria. Do not mark an entire milestone done because its code exists.

## Milestones

| Milestone               | Scope                                                                                            | Current state                                    | Exit criterion / evidence                                       |
| ----------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------ | --------------------------------------------------------------- |
| M0: Product definition  | Discovery, PRD, architecture, risks, acceptance                                                  | Documentation baseline written; research pending | Product owner records pilot decision and unresolved assumptions |
| M1: Local application   | Auth, accounts, Drive, composer, worker, billing test integration                                | Implemented; local tests passed                  | Reproducible install/migration/build and core workflow evidence |
| M2: Hardening           | Authorization, failure/race recovery, large-file behavior, capacity                              | Partial; listed gaps pending                     | V-01–V-08 reviewed with no unresolved critical defect           |
| M3: Real integrations   | Developer apps, consent, private transfers, test billing                                         | Blocked on credentials/accounts                  | V-09–V-12 evidence for every advertised destination             |
| M4: Staging             | Production services (Hetzner + Coolify / Railway), HTTPS, backups, restore, rollback, monitoring | Config prepared; execution pending               | Phase 6 gate signed with deployment and recovery evidence       |
| M5: Controlled pilot    | Selected creators, support coverage, measured outcomes                                           | Not started                                      | Pilot criteria in phase 7 met and defects triaged               |
| M6: Public production   | Provider approvals, legal, live billing review, release                                          | Blocked                                          | All public-launch gates pass                                    |
| M7: Operate and improve | Alerts, incidents, renewals, provider changes, metrics                                           | Procedure documented                             | Ongoing operational evidence, not a one-time completion         |

## Implemented work and source ownership

| Workstream                               | Requirements        | Primary source                                                                   |
| ---------------------------------------- | ------------------- | -------------------------------------------------------------------------------- |
| Identity and session protection          | FR-01, NFR-01       | `src/lib/auth.ts`, auth route, `src/lib/api.ts`                                  |
| Dedicated OAuth and encrypted grants     | FR-02–FR-03, NFR-02 | `src/lib/connections.ts`, `src/lib/crypto.ts`                                    |
| Drive upload/import/source integrity     | FR-04, FR-11        | `src/lib/drive.ts`, workspace                                                    |
| Composition and scheduling               | FR-05–FR-06         | `src/lib/validation.ts`, API, workspace                                          |
| Durable publishing and recovery          | FR-07, NFR-03       | `src/lib/jobs.ts`, `src/lib/publishers.ts`                                       |
| Billing, account limits, quotas          | FR-08–FR-10         | `src/lib/billing.ts`, `src/lib/plans.ts`, worker                                 |
| Legal/setup and deployment configuration | FR-12, NFR-06       | legal pages, Dockerfiles, docker-compose.prod.yml, Railway TOML, deploy runbooks |

## Remaining engineering backlog

Priority means **P0** blocks release integrity or security; **P1** blocks pilot acceptance or an advertised capability; **P2** improves operation and scale. Review priority after reproducing each risk.

| ID   | Priority | Deliverable                                       | Owner role / dependency                  | Definition of done                                                                                                           |
| ---- | -------- | ------------------------------------------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| E-01 | P0       | Protected-page/session authorization review       | Engineering; M1                          | Anonymous shell vs protected content behavior explicit; add server-page guards where required; cross-user/session tests pass |
| E-02 | P0       | Entitlement expiry during in-flight publication   | Engineering; provider mocks then staging | Remote results settle without duplicate side effects or incorrect quota release; no unauthorized fresh dispatch              |
| E-03 | P0       | Crash, cancellation, and uncertain-outcome drills | Engineering/QA                           | Terminate worker at checkpoint boundaries; prove recovery and no duplicate confirmed success                                 |
| E-04 | P1       | Large-file throughput and memory                  | Engineering; real Drive and destinations | 2 GiB source (10 GiB on Studio) measured within provider limits; 500 MB short-form limits enforced; memory bounded           |
| E-05 | P1       | Provider eligibility and API-version review       | Engineering; developer apps              | Current official requirements and approved account types recorded for each path                                              |
| E-06 | P1       | Accessibility and mobile acceptance               | QA                                       | Keyboard, focus, labels, errors, screen-reader and real-device review with fixed blocking defects                            |
| E-07 | P0       | Backup/restore, migration concurrency, rollback   | Operations/engineering; staging          | Restore to isolated DB, reconcile jobs, prove recovery objectives and safe service rollback                                  |
| E-08 | P1       | Monitoring and release automation                 | Operations/engineering                   | Alerts actually deliver; CI runs applicable tests/build with an isolated DB; recovery owner assigned                         |
| E-09 | P2       | Workspace pagination and API resource limits      | Engineering; pilot usage                 | Users can access older records; large requests and history do not exhaust service resources                                  |
| E-10 | P1       | Retention, support, and minimal metrics           | Product/operations                       | Retention and support policy approved, reflected in pages, and enforced; metrics avoid content/secrets                       |

## External prerequisites

The product owner must provide or authorize access to Google, Meta, TikTok, Stripe test, and Hetzner/Coolify or Railway accounts. Configure secrets in local `.env.local` or hosting environment variables; never put credentials in planning documents, tickets, commits, or chat. `npm run setup:check` reports missing names without revealing values.

Business country, operator legal name, support address, merchant eligibility, provider review submissions, launch domain, backup budget, and pilot users require owner decisions. Documentation cannot stand in for those decisions. The [provider setup](../provider-setup.md) runbook contains callbacks and configuration steps.

## Definition of done and change management

A task is done when its requirement and acceptance condition are identified; code/docs are reviewed; applicable tests pass; migrations and recovery implications are covered; secrets are excluded; and evidence is linked. Real-provider tasks require actual authorized account results, not only mocks.

Use focused branches and reviewable changes for remaining implementation. Record affected requirement, migration, tests, and rollout/rollback in each PR. If a requirement changes, update PRD and spec first, preserve IDs, and add a decision entry. Do not expand into teams, editing, AI, or analytics without a separate product decision.

## Decision register

| Decision                                                           | Status   | Rationale / follow-up                                                          |
| ------------------------------------------------------------------ | -------- | ------------------------------------------------------------------------------ |
| Better Auth replaces proposed Auth.js                              | Agreed   | No existing user migration identified                                          |
| Drive-only persistent source video storage                         | Agreed   | Creator retains originals; compute/network costs remain                        |
| PostgreSQL + pg-boss + separate worker (Hetzner Coolify / Railway) | Agreed   | Durable browser-independent scheduling                                         |
| English, individual creators, monthly USD, no trial                | Agreed   | First-release boundaries                                                       |
| Live billing                                                       | Blocked  | Entity/location and eligibility decision, then separately reviewed code change |
| Production capacity and service objectives                         | Proposed | Measure during staging; accept before pilot                                    |

Roadmap changes must retain evidence history and explain any deferred advertised feature. A subset pilot may proceed only with scope and access explicitly limited to what has passed validation.

## Documentation audit additions

Tasks T037–T041 cover upload resume across page lifetime, vendor-auth/auxiliary-record review, provider/source/outcome risks, UX/DST acceptance, and dependency/runtime assurance. They refine the existing hardening milestones rather than add new product scope. T042 records documentation work only; T043 records the completed Spec Kit tooling adoption; no feature implementation was triggered by installation. See the [audit matrix](../documentation-audit.md) for requirement-to-code-to-evidence mapping.
