# 8. Production operations and continuous improvement

Version 1.0 · 2026-09-22 · Owner: operations; product owner assigns named responders

## Operating baseline

Production is not yet deployed. This document defines the operating model to establish before launch. The current app has a stack health endpoint, worker heartbeat, destination error/status records, and SQL diagnostics in [operations.md](../operations.md). Alert routing, on-call coverage, automated retention, and measured service objectives are not proven by those features alone.

## Responsibilities

| Role                  | Responsibility                                                                      |
| --------------------- | ----------------------------------------------------------------------------------- |
| Service owner         | Accept service objectives, budget, risk, and release readiness                      |
| Engineering responder | Investigate application/provider failures; implement and verify fixes               |
| Operations responder  | Monitor services, deployment, backups, recovery, access, and costs                  |
| Support owner         | Explain user impact, handle reconnect/billing/deletion requests, escalate incidents |
| Product owner         | Review pilot outcomes and prioritize changes within scope                           |

One person may hold multiple roles, but name a primary and backup before public access. Maintain emergency credentials through the platform's secret/access controls, not the repository.

## Monitoring and proposed service objectives

Targets below are proposals for the pilot, to be measured and accepted before any customer commitment. External platform processing and user-caused pauses are reported separately from app dispatch reliability.

| Signal                           | Initial alert/target proposal                                         | Response                                                             |
| -------------------------------- | --------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `/api/health` / worker freshness | Page assigned responder after a sustained 2-minute unhealthy interval | Check DB and worker; restore service and inspect due backlog         |
| Oldest eligible due destination  | Warn above 5 minutes; investigate above 10 minutes                    | Check queue, leases, limits, subscription and connection eligibility |
| Dispatch latency                 | p95 under 60 seconds at agreed pilot load                             | Measure before committing capacity; separate retries/paused jobs     |
| Attention/failure count          | Alert on a new pattern or unusual rise vs pilot baseline              | Group by provider and error class; inspect uncertain operations      |
| Duplicate confirmed publication  | Zero tolerated incidents                                              | Stop affected dispatch and investigate checkpoints/remote IDs        |
| Webhook delivery and entitlement | Alert on persistent delivery failure or inconsistent access           | Check Stripe events/signatures and replay verified events safely     |
| Memory, pool, disk, egress       | Thresholds set from staging measurements and budget                   | Tune concurrency; inspect leaks or excessive repeated transfers      |
| Backups and restores             | Backup freshness meets accepted RPO; periodic restore meets RTO       | Treat stale backup or failed restore as an operational incident      |

Alerts must be configured in the hosting/monitoring system, delivered to a real responder, and tested. This document does not create a monitor or schedule automation.

## Incident procedure

1. Record incident start, reporter, affected environment/providers, severity, and candidate deployment changes. Never paste secrets or private signed URLs into incident notes.
2. Assess scope with health, destination IDs/status, queue state, billing events, and provider status. Distinguish app delay from platform processing and invalid user grants.
3. Contain harm: stop the affected worker/service if necessary to prevent new side effects; restrict affected access. Preserve database state, remote IDs, and upload checkpoints.
4. Reconcile uncertain provider outcomes before retrying. A stopped worker may have already sent a request; stopping it cannot retract an accepted publication.
5. Restore compatible code/service or apply a reviewed fix. Validate a controlled job and quota settlement before resuming the backlog.
6. Support communicates known impact and remediation. For a security/privacy incident, involve the service owner and qualified advisers to determine applicable obligations.
7. Record timeline, cause, impact, recovery, and prevention tasks. Link the regression test and update runbooks.

Critical incidents include cross-user disclosure, leaked refresh tokens, duplicate publishing, or incorrect financial/usage state. Broad availability loss is high severity. An isolated expired creator grant normally belongs in user recovery unless systemic.

## Recovery playbook

| Condition                          | Safe action                                                                                                       |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Expired or revoked grant           | Ask creator to reconnect; validate identity; retry affected paused work                                           |
| Changed or missing source          | Restore original bytes or create a new post with replacement; never silently swap source                          |
| Quota/expired subscription         | Resolve eligibility; preserve drafts; check uncertain reservations before retry                                   |
| Provider timeout after side effect | Reconcile saved remote ID/session; if unknown, require creator outcome review                                     |
| Confirmed provider failure         | Retry the failed destination using its existing usage identity                                                    |
| Worker restart                     | Allow durable discovery/queue recovery; check locks and due time rather than resetting all states                 |
| Database restore                   | Keep dispatch stopped, verify encryption keys, reconcile remote outcomes since snapshot, then resume deliberately |

The current app may require resolving processing/attention destinations before account deletion. Support should explain this and guide safe resolution; never force-delete uncertain evidence as a shortcut.

## Data and secret lifecycle

Production must define retention for account data, attempt logs, OAuth state, upload sessions, usage/billing records, and backups. Values are undecided pending business/legal review; do not publish invented retention promises. Implement pruning and verify restore copies respect the accepted policy. Drive originals are not deleted by app account deletion; provider-held posts and billing records may have their own lifecycle.

Keep auth and encryption secrets in environment secret storage. Encryption-key rotation requires migrating existing encrypted grants/session URLs and addressing outstanding signed capabilities. Practice on a copy before production. Provider-secret rotation should include token-refresh and background-job checks. Revoke compromised grants, restrict access, and document reauthorization impact.

Logs must exclude raw tokens, session cookies, captions/video contents, resumable upload URLs, and signed streaming links. Use internal IDs, coarse error classes, timing, and status for diagnosis. Restrict support/admin access and audit access changes.

## Routine operating cadence

- **Daily during pilot:** review health, overdue/attention destinations, webhook failures, and support requests.
- **Weekly:** review failure patterns, provider quotas, capacity/egress, dependency/security findings, and unresolved defects.
- **Monthly:** review product activation and paid retention if applicable, cost per active creator/destination, access permissions, and restore evidence.
- **Before API/dependency upgrades:** verify official provider changes, pin/review versions, run affected protocol tests and real-account smoke checks, and update approvals if necessary.
- **Before each release:** apply the phase 7 gate appropriate to its impact; keep rollback and schema compatibility explicit.

These are proposed responsibilities, not installed scheduled tasks. Assign actual cadence and responders during staging.

## Continuous improvement

Use observed incidents and user friction to update the roadmap. Prioritize safe publishing, correct billing, and easy recovery before excluded feature areas. Every reliability fix should link to a requirement, a reproduced failure or measured bottleneck, and validation evidence. Maintain a release history and periodically verify that documentation still matches code and approved platform behavior.
