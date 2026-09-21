# 6. Staging and deployment readiness

Version 1.0 · 2026-09-22 · Owner: operations with engineering

## Purpose and current state

Create an isolated, production-like environment to prove the release candidate before opening registration. Railway web/worker configuration, Dockerfiles, Compose, migrations, and `/api/health` exist. Local standalone web and pg-boss worker were exercised; Docker image execution and Railway deployment remain unverified. The last Railway access check was unauthorized.

This document defines acceptance. Follow [deployment.md](../deployment.md) for the concrete Railway service setup and [provider-setup.md](../provider-setup.md) for callbacks/scopes.

## Environment separation

| Environment       | Database and credentials                                                                        | Access and purpose                                   |
| ----------------- | ----------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| Local development | Local database; `.env.local`; test credentials                                                  | Developer exploration; no production data            |
| Automated tests   | Dedicated disposable `_test` database; synthetic secrets                                        | Destructive fixtures and mocked provider protocols   |
| Staging           | Separate PostgreSQL, encryption/auth keys, provider clients where supported, Stripe test prices | Invited test users only; real integration validation |
| Production        | Separate database/secrets, approved provider grants, reviewed billing mode                      | Public service only after phase 7 gates              |

Use Railway's private database connectivity. Expose only the HTTPS web service. Do not expose PostgreSQL or the worker publicly. Keep the worker always on. Restrict staging through provider test-user controls and deployment access controls suitable for OAuth callbacks; test those controls rather than assuming a hidden URL is protection.

## Prerequisites

- [ ] Product owner grants Railway project access and chooses a staging domain.
- [ ] Engineering records release candidate SHA and reviewed migrations.
- [ ] Provider apps, authorized test accounts, and exact HTTPS callbacks are configured.
- [ ] Secrets from `.env.example` are provisioned without sharing `.env.local` through Git.
- [ ] Operator support contact is usable; staging policies accurately describe its purpose.
- [ ] Operations assigns an alert recipient, backup budget, and rollback owner.

Web and worker share database, encryption key, app URL, and appropriate provider credentials. Billing secrets are required by web. Keep public-approval flags false until corresponding evidence exists. Run setup validation in the intended environment; an environment variable's presence alone does not prove its validity.

## Deployment sequence

1. Build and run the web/worker images locally or in CI with a test database. Verify image startup, static assets, and process signals. Configuration parsing alone does not satisfy this step.
2. Provision PostgreSQL, worker, and web services; select their respective Railway config files. Ensure the worker uses `Dockerfile.worker` and its migration pre-deploy command.
3. Back up the target database. Review migration order and compatibility with the currently deployed code; test concurrent startup on an empty database before relying on multiple deployers.
4. Deploy worker/migrations, then web. Set the exact public origin and verify registered callbacks. Never send live traffic to code that expects a missing schema.
5. Confirm service logs are free of secrets, both services use the intended database, and `/api/health` reports both components healthy. This endpoint is stack health; do not make initial web readiness depend on a worker that has not started yet.
6. Execute V-09–V-12 and applicable regression checks. Record images/commit, migration versions, provider app versions, test results, and limitations.

## Smoke acceptance

- [ ] Google sign-in/cancel/sign-out and unauthenticated API rejection work on the HTTPS domain.
- [ ] Drive import/upload/preview works privately; another Google connection does not change app identity.
- [ ] Real test subscription checkout and webhook settlement work.
- [ ] A browser-closed scheduled post reaches each advertised test destination with a result link/status.
- [ ] Disconnect and source-change failures are visible and safe.
- [ ] Mobile OAuth returns to the expected account/workspace.
- [ ] Private-range streaming works through the deployed gateway without permanent disk copies.
- [ ] Health alert fires when worker is stopped and clears after recovery.

## Restore and rollback rehearsal

Proposed pilot recovery objectives are RPO ≤24 hours and RTO ≤4 hours, pending owner acceptance and a measured drill. These are not current guarantees. Select a backup/PITR policy that meets the accepted objective; encrypt/restrict backups and set a retention period before production.

Restore to a new isolated database with dispatch stopped. Verify users, grants can decrypt with the correct key, schedules, subscriptions, and quota records. Because a backup can predate accepted remote posts, reconcile provider outcomes before allowing restored jobs to dispatch. A successful SQL restore alone does not prove safe publishing recovery. Never test restore by overwriting the production database.

For code rollback, stop dispatch if job semantics are affected, select the last compatible image, confirm schema compatibility, deploy, and repeat smoke checks. Do not automatically reverse migrations or replay uncertain operations. If compatibility is uncertain, retain the last working system and use a reviewed forward fix.

## Capacity and cost record

Record region, service sizing, three-worker concurrency, DB pool usage, memory peaks, transfer sizes, effective throughput, provider rate-limit behavior, due-job latency, and network charges. Include a large permitted file and a multi-destination job. Decide whether per-chunk scheduling delays require engineering changes before promising large-video performance.

## Phase exit

Staging passes only after reproducible image deployment, real smoke tests, alert delivery, restore/rollback rehearsal, and capacity evidence are recorded. Engineering and operations sign those results; product accepts the supported pilot scope. Any external credential/approval blocker stays explicitly blocked in the task register.
