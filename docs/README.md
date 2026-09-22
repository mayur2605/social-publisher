# Documentation index

Social Publisher · Reviewed 2026-09-22

For a new agent session or provider switch, read [AGENTS.md](../AGENTS.md) and the current [HANDOFF.md](../HANDOFF.md) first. HANDOFF is the shared progress/ownership checkpoint; the documents below remain the authoritative requirements and evidence.

Start with the [audit and requirement traceability](documentation-audit.md) for current consistency findings and the [release acceptance report](release/acceptance-report.md) for readiness. The app is implemented locally; public production remains NO-GO pending external validation and the recorded engineering/business gates.

## Idea to production

1. [Discovery](lifecycle/01-discovery.md): customer/problem hypotheses and commercial validation.
2. [PRD](lifecycle/02-prd.md): scope, user journeys, FR/NFR acceptance and pricing.
3. [Technical specification](lifecycle/03-technical-specification.md): architecture, data model, interfaces, worker state and known gaps.
4. [Roadmap](lifecycle/04-implementation-roadmap.md): milestones, dependencies, decisions and engineering priorities.
5. [Validation](lifecycle/05-validation.md): local/real test matrix and evidence standards.
6. [Staging](lifecycle/06-staging.md): environment separation, deployment, restore, capacity and rollback.
7. [Launch](lifecycle/07-launch.md): provider/business gates, pilot and release decision.
8. [Operations](lifecycle/08-production-operations.md): ownership, monitoring, incidents, data lifecycle and improvement.

## Detailed implementation and assurance

| Area                                | Documents                                                                                                                                                     |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Architecture / database / decisions | [Technical spec](lifecycle/03-technical-specification.md), [roadmap decisions](lifecycle/04-implementation-roadmap.md), [reviewed migrations](../migrations/) |
| API                                 | [Reference and auth boundary](api/README.md), [OpenAPI 3.1 contract](api/openapi.json)                                                                        |
| Design                              | [Product design and interaction specification](design/product-design.md)                                                                                      |
| Security                            | [Threat model and open risks](security/threat-model.md)                                                                                                       |
| Dependencies/build                  | [Inventory, advisory snapshot and update policy](engineering/dependencies.md)                                                                                 |
| Provider approvals                  | [Actual-status register](release/provider-approvals.md), [setup procedure](provider-setup.md)                                                                 |
| Policies                            | [Business/privacy/retention decisions](release/policy-decisions.md); app policy source remains pre-launch                                                     |
| Release evidence                    | [Acceptance report](release/acceptance-report.md), [historical local verification](verification.md)                                                           |
| Creator support                     | [Creator guide](help/creator-guide.md)                                                                                                                        |
| Deployment/operations               | [Production deployment](deployment.md) ([Hetzner + Coolify guide](deployment-hetzner-coolify.md)), [diagnostic/recovery runbook](operations.md)               |

## Specification-driven workflow

[Constitution](../.specify/memory/constitution.md) → [feature spec](../specs/001-social-publisher/spec.md) → [plan](../specs/001-social-publisher/plan.md) → [tasks](../specs/001-social-publisher/tasks.md), with a [requirement-quality checklist](../specs/001-social-publisher/checklists/requirements.md). The [official GitHub Spec Kit review](spec-kit-review.md) records the installed Spec Kit 1.0.9 Codex integration, verification, and use with the existing feature.

## Source-of-truth rules

- PRD defines intended behavior; code describes current implementation. A gap is recorded, not erased by weakening the requirement.
- OpenAPI describes app-owned wire behavior; vendor-auth behavior is a separate reviewed boundary.
- Task checkboxes record the exact completed deliverable; reports own dated evidence. Do not claim production pass from local mocks or documentation completeness.
- Product/business decisions belong to the named owner; security and dependency snapshots are not certifications.
- When behavior changes, update requirement/spec, plan/task, API/design/help/policy if affected, and actual verification evidence together.
- Exclude generated/vendor docs (`node_modules`, build output), ignored local evidence and secrets from repository documentation audits. Preserve their authoritative vendor source rather than rewriting them.
