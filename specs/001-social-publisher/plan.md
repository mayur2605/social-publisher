# Implementation plan: Social Publisher first release

Feature: [001-social-publisher](spec.md) · Date: 2026-09-22

## Technical context

Use the existing Next.js/TypeScript/React application, Better Auth and PostgreSQL identity/session storage, dedicated encrypted OAuth grants, Node/pg-boss worker, official social APIs, Drive private sources, and Stripe test subscriptions. Deploy separate Railway web/worker/PostgreSQL services. No durable server video store or Redis is required by the chosen design.

The authoritative architecture, database model, API contracts, state machine, and known gaps are in [technical specification](../../docs/lifecycle/03-technical-specification.md). This plan does not propose replacing the implemented stack or regenerating the repository.

## Constitution check

| Principle            | Planned implementation/evidence                                                        |
| -------------------- | -------------------------------------------------------------------------------------- |
| Creator privacy      | Drive streaming and checksum validation; real source/range/storage test V-03/V-09      |
| Identity boundaries  | Better Auth plus separate connection OAuth; page/API ownership review V-01/V-02        |
| Durable side effects | Checkpoints, locks, due times, explicit attention; crash/recovery tests V-05/V-06      |
| Atomic usage         | Subscription row locking and unique usage destination; V-07 including in-flight expiry |
| Honest evidence      | Keep historical local evidence separate from real-provider acceptance                  |
| Controlled delivery  | Reviewed migrations, isolated test DB, staging restore/rollback, secret exclusion      |

No principle exception is proposed. Incomplete evidence is tracked as work rather than recorded as a pass.

## Delivery sequence

1. Preserve the existing source baseline and complete the requirements/task mapping.
2. Address E-01–E-03 authorization and recovery risks with reproducible cases and targeted changes.
3. Configure developer credentials and perform real identity/Drive/provider and Stripe test flows. Recheck current account eligibility and official API contracts before changing adapters.
4. Measure large-file behavior and improve throughput only while preserving checkpoints and bounded memory.
5. Complete accessibility, resource-limit, monitoring, and retention work required for the selected pilot.
6. Build/run containers; deploy staging; rehearse migrations, restore, and compatible rollback.
7. Conduct the controlled pilot and review launch gates. Enable public/live features only within established approvals and separately reviewed payment scope.

Detailed dependencies and exits are in the [roadmap](../../docs/lifecycle/04-implementation-roadmap.md); execution checkboxes are in [tasks](tasks.md).

## Code and verification map

Identity: `src/lib/auth.ts`, auth route, API, page shell. Connections/source: `connections.ts`, `drive.ts`, `crypto.ts`. Publishing: `validation.ts`, `publishers.ts`, `jobs.ts`. Billing: `billing.ts`, `plans.ts`. UX: `workspace.tsx` and application routes. Deployment: Dockerfiles, Compose, Railway TOML and `scripts/migrate.ts`.

Use `tests/security.test.ts` for pure security/validation behavior; `integration.test.ts` for DB/session/concurrency; `platforms.test.ts` for protocol/checkpoint behavior; `billing.test.ts` for Stripe events/checkout; browser tests for workflows and viewport regressions. Add missing targeted tests alongside fixes, then capture external evidence under the validation plan. Do not reset staging with automated-test fixtures.

## Migration and rollout policy

Baseline migrations are 000–003. New schema changes use new numbered files with backwards-compatible rollout where possible. Preserve existing encrypted grants, destination identity, usage records, and remote checkpoints. Stop dispatch for an incompatible state transition; reconcile remote outcomes before resuming. Document key changes and rollback limitations explicitly.

## Open dependencies

Provider credentials/test accounts, actual approval scopes, Railway access/domain, business identity/location, support coverage, retention policy, measured capacity, and payment eligibility are unresolved. They are not code placeholders: their owners and release consequences are tracked in the lifecycle roadmap and launch gate.
