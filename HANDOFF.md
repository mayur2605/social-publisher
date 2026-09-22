# Shared agent handoff and progress

**Read this first, regardless of agent or provider. Update it as work progresses.**

Last checkpoint: **2026-09-22T02:09:08Z** · Maintainer for this checkpoint: **Codex / handoff setup**

## 1. Resume in one message

For a new agent/provider, open the same repository or its current shared branch and send:

> Read AGENTS.md and HANDOFF.md, inspect the actual Git state, and continue the next ready task within my current request. Preserve the existing implementation and decisions, coordinate any active task ownership, and keep HANDOFF.md updated with progress and verification. Do not assume historical checks prove current readiness.

Tools that honor repository instructions can discover AGENTS.md automatically. Other tools must be given that short instruction; no repeated product explanation is needed once they have repository access. This file provides continuity, **not automatic quota detection, provider routing, or a distributed lock**. No failover service or paid-provider configuration is installed by this change.

## 2. Current objective and state

Build Social Publisher from the agreed creator workflow through verified production readiness. The latest user request is to establish a shared progress/handoff mechanism for switching providers and coordinating parallel agents. That documentation/instruction mechanism is now written; no application hardening task was started during it.

- Repository: [mayur2605/social-publisher](https://github.com/mayur2605/social-publisher).
- Current branch at checkpoint: `main`; latest verified commit before this handoff addition: `f67986a` (Spec Kit installation). Use `git log -1 --format='%h %s' -- HANDOFF.md` for the actual handoff commit after it is committed; do not insert a guessed self-referential SHA.
- Application source baseline: `7265f91`; documentation audit: `92baf94`; Spec Kit installation: `f67986a`.
- Working-copy path on the current machine: `/Users/mayurkulkarni/Downloads/social-publisher`. Paths differ on other machines; resolve from the Git root.
- Application implemented locally; **public production is NO-GO**. Real-provider acceptance, staging, approvals, and engineering/business gates remain open.
- At 2026-09-22T02:05:54Z, `GET http://localhost:3000/api/health` returned `{"database":true,"worker":true}`. Recheck before relying on processes; running process/session IDs are not portable.
- No active app-code task or application diff is being handed off. The current change adds this file, agent instructions, and documentation links. Future agents must inspect Git rather than trust this snapshot forever.

## 3. Decisions to preserve

Individual creators; English; Next.js/TypeScript, PostgreSQL, Better Auth Google sign-in, separate Node/pg-boss worker, Railway deployment, Docker Compose locally. Better Auth replaces the previously proposed Auth.js; no existing user migration was identified.

App identity stays separate from Drive and social grants. One Drive account; multiple eligible YouTube channels, Facebook Pages, Instagram professional accounts through the selected linked-Page flow, and TikTok accounts. Private Drive is the only persistent source-video store. Stream to official APIs; no permanent server video copy. MP4/MOV up to 2 GiB subject to stricter destination restrictions.

Preserve upload checkpoints and remote IDs. Do not duplicate confirmed successes or clear uncertain state to force publication. Signing out must not cancel schedules. User-selected timezone is retained while instants are stored in UTC.

Monthly USD plans: Starter $9 / 4 accounts / 60 destination posts; Creator $19 / 10 / 200; Pro $39 / 25 / 600. One destination counts as one post. Reserve at dispatch, consume on publication, release on confirmed failure; retries reuse usage identity. Stripe is **test-only**; no free trial is offered. Live billing needs separate business eligibility and implementation review.

Editing/transcoding, teams, AI generation, and engagement analytics remain outside release one. Documentation completion, Spec Kit installation, and mocked tests are not production acceptance.

## 4. Authoritative context map

| Need                                   | Read                                                                                                                                                    |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Full documentation / lifecycle         | [Index](docs/README.md), [eight phases](docs/lifecycle/README.md)                                                                                       |
| Product scope and acceptance           | [PRD](docs/lifecycle/02-prd.md), [feature spec](specs/001-social-publisher/spec.md)                                                                     |
| Architecture/data model and known gaps | [Technical spec](docs/lifecycle/03-technical-specification.md), [audit](docs/documentation-audit.md)                                                    |
| Plan and canonical task status         | [Plan](specs/001-social-publisher/plan.md), [task register](specs/001-social-publisher/tasks.md)                                                        |
| API / design                           | [API](docs/api/README.md), [design](docs/design/product-design.md)                                                                                      |
| Security / dependencies                | [Threat model](docs/security/threat-model.md), [dependency policy](docs/engineering/dependencies.md)                                                    |
| Verification / release                 | [Historical results](docs/verification.md), [acceptance report](docs/release/acceptance-report.md)                                                      |
| Setup / external blockers              | [Provider setup](docs/provider-setup.md), [approval register](docs/release/provider-approvals.md), [policy decisions](docs/release/policy-decisions.md) |
| Installed Spec Kit / agent commands    | [Installation record](docs/spec-kit-review.md), [CLAUDE.md](CLAUDE.md)                                                                                  |

## 5. Completed work and verification baseline

Auth/session protection, dedicated OAuth connections, encrypted integration tokens, Drive upload/import/private streaming, composer/drafts/calendar, durable publishing adapters/worker, destination recovery, test subscriptions/quotas, legal/setup pages, and deployment configuration are implemented. See T005–T012 for precise scope.

Historical checks: **42 backend tests**, **8 desktop/mobile browser tests**, TypeScript and production build passed. Provider/Stripe protocols were mocked; Google sign-in and actual destination publishing were not verified. Docker Compose configuration parsed; container execution and Railway deployment remain unverified.

Documentation audit verified 31 first-party Markdown files, 147 local links and 23 OpenAPI operations at that historical revision; counts change as documentation grows. OpenAPI had zero validation errors and four documented route-design warnings. An npm advisory query returned zero known advisories, not a security certification.

Spec Kit 1.0.9 is installed on this machine, with ten Codex skills/shared templates/scripts tracked in Git. Integration status returned `ok`; feature prerequisite checks found existing spec/plan/tasks. No implementation or convergence workflow was run. `.specify/feature.json` is local/ignored; a new checkout must select its feature using the documented script.

## 6. Blockers and configuration

Fresh `npm run setup:check` at 2026-09-22T02:05:54Z exited 1 for missing:

- Google: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_PICKER_API_KEY`, `GOOGLE_PROJECT_NUMBER`.
- Meta: `META_APP_ID`, `META_APP_SECRET`.
- TikTok: `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET`.
- Stripe test: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_STARTER`, `STRIPE_PRICE_CREATOR`, `STRIPE_PRICE_PRO`.
- Operator: `LEGAL_ENTITY_NAME`, `SUPPORT_EMAIL`.

Local core database/auth/encryption settings exist in ignored `.env.local`; never print or commit them. They do not travel through Git. Last recorded Railway access was unauthorized; recheck only when working on deployment. Provider approvals, business country/entity, merchant eligibility, retention policy, and support ownership remain owner/external decisions.

Credential blockers do **not** block all engineering work. Continue the next ready authorized task rather than repeatedly asking for the same credentials.

## 7. Next ready tasks

These are recommendations, not claims or authorization to start all tasks. The current user request takes precedence.

| Order                | Task                                  | First concrete step                                                                                                      | Likely files / overlap                                                                    |
| -------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| 1                    | T013 + T038: auth/deletion boundaries | Review enabled Better Auth routes and protected-page behavior; reproduce an access/deletion gap before fixing            | `auth.ts`, API/page routes, integration/security tests; one owner for this shared surface |
| 2                    | T014: expiry during publication       | Add a focused failing case for subscription expiry after remote acceptance; preserve reconciliation and usage settlement | `jobs.ts`, `publishers.ts`, billing/integration tests                                     |
| Independent          | T018: CI                              | Configure target-runtime checks with isolated PostgreSQL test database and suitable browser/build steps                  | New CI config, package scripts only if needed; coordinate lockfile/config edits           |
| After relevant fixes | T015/T039: recovery and uncertainty   | Perform bounded crash/duplicate/source/remote-outcome tests with checkpoints intact                                      | Worker/adapters/tests; overlaps T014                                                      |

Do not regenerate the existing spec or mark open tasks complete merely to satisfy a tool checklist. See all remaining tasks T003–T043 in the canonical register; T044 records this handoff setup.

## 8. Active task ownership

**No active task claims after the handoff setup completes.** Before beginning another task, replace/add a real row with the owner and exact scope. Do not invent active agents.

| Task / status | Agent alias and provider if known | Branch / worktree | Owned files | Last checkpoint / next action      |
| ------------- | --------------------------------- | ----------------- | ----------- | ---------------------------------- |
| None claimed  | None                              | —                 | —           | Ready for the next authorized task |

Statuses: claimed, working, blocked, handing-off, review, done. Use a unique alias for each concurrent agent. Task IDs refer to the canonical register; the ledger is for current execution ownership only.

## 9. Switching providers or running agents together

**Sequential switch:** save a checkpoint before a known quota/context limit, list unfinished edits and exact next step, and commit/push when authorized. The replacement agent reads this file, verifies the current branch/diff and tests, then takes ownership. If quota exhaustion interrupts without warning, inspect the actual diff and last checkpoint; never assume unrecorded work succeeded. Record the recovered state before proceeding.

**Parallel work:** choose a coordinator, distinct tasks/files, and separate branches/worktrees where possible. The coordinator publishes accepted claims and maintains the shared summary; workers update their own checkpoint in their branch and send it for integration. A claimed row on an unpushed branch is not visible to other machines. Do not let two agents edit the same worktree or common file concurrently without explicit coordination.

When updating this file, reread its current contents and merge only your fields/entry. Preserve others' unresolved notes; resolve conflicts by retaining both factual contributions before reconciling the summary. Never force-push or accept an entire stale version to resolve a HANDOFF conflict. A stale timestamp is not an automatic ownership timeout: confirm the old agent is stopped or use an explicit user/coordinator takeover.

Shared tests are a separate resource: backend/browser fixtures reset a dedicated `_test` schema. Use different database names ending `_test` and different web ports, or serialize those tests. Never run them against staging/production. Do not start duplicate web/worker processes or send duplicate real-provider posts during a takeover.

This is cooperative coordination; simultaneous claims need a coordinator or an external atomic issue/lock system. It does not provide technical mutual exclusion. Agents on separate machines need the same pushed commit plus locally provisioned dependencies/secrets.

## 10. Checkpoint format and update cadence

Update after meaningful work/findings/tests, roughly every 10–15 minutes during long work, before a known quota/context limit, and before ending a session. Keep the current summary concise. Record task completion in the canonical register only with evidence. When history grows long, move older resolved entries into a dated file under `docs/progress/` and link it here; retain all active context in this file.

Each entry must contain:

- UTC time; agent alias/provider if known; task ID; branch/worktree; owner/status.
- What changed and why; changed file paths; exact commit/PR if one exists, otherwise explicit uncommitted state.
- Checks run and results, including failures and what was not run.
- Blockers or user decisions needed, without secrets or private account data.
- One concrete next action; unsafe repetitions to avoid; ownership transfer if any.

Progress can be committed with the work; do not repeatedly commit just to update a self-referencing SHA. Refer to code commits and use Git history for the handoff file's own revision. Pushed records are durable across providers; unsaved chat or uncommitted local diffs are not.

## 11. Recent progress

### 2026-09-22 — Antigravity / Gemini — Studio Plan & 10 GB Large Video Support

- Introduced high-capacity **Studio Plan** ($79/month, 50 connected accounts, 1,500 posts/month, up to 10 GB video uploads) in `src/lib/plans.ts`.
- Implemented plan-based `maxVideoBytes` entitlement enforcement in `src/lib/drive.ts` for direct Google Drive upload (`initiateUpload`) and Drive file import (`importFile`), providing clear upgrade messaging for sub-Studio subscribers.
- Updated `src/lib/validation.ts` and `src/lib/publishers.ts` with destination-aware validation: unlocks 10 GB for YouTube and long-form Facebook Video while continuing to strictly enforce platform-mandated caps (1 GB on Instagram Reels, 1 GB on Facebook Reels, 2 GB on TikTok).
- Enhanced UI in `src/components/workspace.tsx`: dynamically renders the Studio plan in the pricing grid and updates upload guidance to reflect the active subscriber's video size cap.
- Updated Stripe webhook plan resolution in `src/lib/billing.ts` to dynamically match all defined plans in `plans.ts`.
- Verified all 42 backend unit/integration tests (`npm test`), all 8 Playwright E2E browser tests (`npm run test:e2e`), TypeScript typecheck (`npm run typecheck`), ESLint (`npm run lint`), and Prettier formatting (`npm run format:check`).

### 2026-09-22 — Antigravity / Gemini — Local Development & Seed Session

- Added `scripts/dev-session.ts` and `npm run dev:session` script to provision an offline local development session and sample workspace data in the local PostgreSQL database (`publisher`).
- Added development-only auto-login route `GET /api/dev-login` (guarded by `ENABLE_DEV_LOGIN=true` in `.env.local`) enabling seamless one-click browser login without manual DevTools console or cookie manipulation.
- Updated local environment configuration in `.env.local` to enable workspace mode (`configured() === true`).
- Restarted Next.js server on `http://localhost:3000` and verified stack health (`/api/health`) and protected workspace data loading (`/api/workspace`) with local test creator `Maya Creator (dev@socialpublisher.local)`.
- Verified end-to-end browser test suite (`npm run test:e2e`: 8/8 tests passed).

### 2026-09-22 — Antigravity / Gemini — Security & Git Hygiene

- Performed repository-wide git history audit across all 6 commits (`7265f91`..`6764dff`) for leaked secrets, API keys, credentials, tokens, and sensitive files. Confirmed zero credentials or sensitive values were ever committed to git history.
- Improved `.gitignore` to comprehensively block all local environment files (`.env*`, `*.env`), private keys (`*.pem`, `*.key`, `*.pfx`, etc.), credentials, local machine/agent state (`.local/`, `.remember/`, `.claude/`), OS files (`.DS_Store`, `Thumbs.db`), IDEs, test reports, and database dumps.
- Verified ignore patterns with `git check-ignore` and ensured clean working tree status.

### 2026-09-22 — Antigravity / Gemini — Tooling: Prettier & ESLint

- Added ESLint 9 flat configuration (`eslint.config.mjs`) integrating `@next/eslint-plugin-next`, `eslint-plugin-react`, `eslint-plugin-react-hooks`, and `eslint-config-prettier`.
- Configured ESLint with `strict: 0` and compatible rule overrides for React 19 / Next.js 16.
- Added `.prettierrc` matching repository formatting conventions and `.prettierignore` protecting Spec Kit vendor manifests (`.agents`, `.specify`) and internal cache directories (`.remember`).
- Added package scripts: `npm run lint`, `npm run lint:fix`, `npm run format`, and `npm run format:check`. Updated `CLAUDE.md`.
- Verification passed: `npm run lint` (0 errors), `npm run format:check` (all files formatted), `npm run typecheck` (clean), and `npm run build` (successful production build).

### 2026-09-22 — Codex / handoff setup — T044

- Added shared HANDOFF and repository-wide AGENTS instructions, with entry links for Claude and the documentation indexes. Includes ownership, parallel-work and quota-interruption recovery protocols.
- Confirmed clean baseline `f67986a` before this documentation change. No app-code edits or production side effects.
- Fresh checks: local stack health passed; setup checker reported the missing configuration names above. Application test suites were not rerun for this documentation-only change.
- Handoff checks passed: six changed documentation files, 79 local links, 44 unique task IDs, agent entry links and Git whitespace. Publication is recorded by this change's Git commit; use repository history to verify remote availability. Next authorized engineering task can begin at T013/T038 or another user-selected ready task. No task is silently assigned to a new provider.
