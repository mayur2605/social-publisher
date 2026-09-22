# Social Publisher: idea to production

Version 1.0 · 2026-09-22 · Product owner: Mayur Kulkarni

These eight documents describe the agreed product, the existing implementation, and the work required to launch and operate it. Completing the documents does **not** mean all delivery phases have passed. The implementation baseline is commit `7265f91`; local test evidence is recorded in [verification](../verification.md).

| Phase | Document                                                 | Delivery status                                                          |
| ----- | -------------------------------------------------------- | ------------------------------------------------------------------------ |
| 1     | [Discovery and product opportunity](01-discovery.md)     | Product hypothesis defined; customer and commercial research pending     |
| 2     | [Product requirements document (PRD)](02-prd.md)         | Agreed scope documented; acceptance partly verified locally              |
| 3     | [Technical specification](03-technical-specification.md) | Architecture implemented; production behavior still needs validation     |
| 4     | [Implementation roadmap](04-implementation-roadmap.md)   | Local implementation available; hardening and external setup open        |
| 5     | [Validation and acceptance](05-validation.md)            | 42 backend and 8 browser tests previously passed; external tests pending |
| 6     | [Staging and deployment](06-staging.md)                  | Configuration prepared; deployment and restore rehearsal pending         |
| 7     | [Launch and release](07-launch.md)                       | Public launch blocked on the listed release gates                        |
| 8     | [Production operations](08-production-operations.md)     | Operating procedures defined; production service not established         |

## How to use this set

Read in phase order for context. Use the [implementation roadmap](04-implementation-roadmap.md) for delivery dependencies and the [task register](../../specs/001-social-publisher/tasks.md) for actionable work. Requirement IDs `FR-*` and `NFR-*` originate in the PRD; validation IDs `V-*` originate in phase 5. Keep those identifiers stable when editing.

Statuses mean: **implemented** has repository code; **locally verified** has local execution evidence; **pending** needs work or evidence; **blocked** has a named prerequisite. A checkbox is checked only for its exact stated deliverable, not an entire provider integration inferred from mocked tests.

Owner roles are responsibilities, not staffing claims: product/launch owner is Mayur; engineering, QA, operations, and business/legal responsibilities must be assigned before the relevant gate. Suggested performance and recovery targets are proposals until measured and accepted. No dates or approvals are promised.

## Specification workflow

The repository now includes a [constitution](../../.specify/memory/constitution.md), [feature specification](../../specs/001-social-publisher/spec.md), [implementation plan](../../specs/001-social-publisher/plan.md), and [tasks](../../specs/001-social-publisher/tasks.md). These are manually authored planning artifacts following the specification → plan → tasks separation described by [GitHub Spec Kit](https://github.com/github/spec-kit). The Specify CLI, agent commands, and generated workflow scripts are **not installed** by this documentation change.

For future changes: describe the user outcome and acceptance first; update the technical plan and migration implications; create a scoped task; implement and record evidence; then reassess the relevant phase gate. Do not regenerate these documents in a way that marks outstanding work complete.

## Supporting runbooks

- [Local setup and configuration](../../README.md)
- [Provider app registration and callbacks](../provider-setup.md)
- [Railway deployment procedure](../deployment.md)
- [Operational diagnostics and recovery](../operations.md)
- [Recorded verification results and limitations](../verification.md)

When code and desired behavior differ, record the difference in the roadmap and validation plan rather than silently treating the implementation as the requirement.

## Supporting architecture and release assurance

The [complete documentation index](../README.md) links the API contract, design specification, threat model, dependency policy, provider approvals, acceptance report, creator guide, policy decisions and [documentation audit](../documentation-audit.md). The [official Spec Kit alignment review](../spec-kit-review.md) records what was checked and why these manual artifacts are not an installed toolchain.
