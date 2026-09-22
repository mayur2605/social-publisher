# 7. Launch and release plan

Version 1.0 · 2026-09-22 · Owner: product/launch owner

## Release decision

Current decision: **not ready for public launch**. Local implementation and documentation are available. Real-provider validation, staging, applicable provider approvals, business details, and production operations evidence are outstanding. Live billing is disabled in code. This document is a launch procedure, not approval to activate a public service or charge real customers.

## Release stages

1. **Internal test:** use authorized developer/test accounts, synthetic media, and Stripe test mode. Verify each protocol on the intended domain; keep access restricted.
2. **Controlled pilot:** invite only users permitted by provider app status after staging passes. Clearly state supported platforms, visibility limits, test billing, and recovery limitations. Record consent for test publication and support arrangements.
3. **Public registration:** enable only after every applicable gate below passes. If offering real paid subscriptions, first complete the separate live-billing review and validation. Do not present test checkout as a real purchase.
4. **Broader promotion:** expand only after observing the agreed pilot service objectives, support workload, provider quotas, and costs.

## Public-launch gate

| Gate                       | Required evidence                                                                                                                        | Owner role                      | Status                                                            |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- | ----------------------------------------------------------------- |
| L-01 Product scope         | PRD accepted; advertised account types/features match tested capabilities                                                                | Product                         | Pending release review                                            |
| L-02 Provider permissions  | Approval/access/audit evidence for each exposed scope and use case; current callback/domain settings                                     | Engineering/product             | Pending                                                           |
| L-03 Real publishing       | Private-source publication on each advertised path, long-video eligibility where offered, scheduled/recovery scenarios                   | QA                              | Pending                                                           |
| L-04 Security and privacy  | Ownership/session review, secret handling, OAuth/streaming checks, data-deletion and retention verification                              | Engineering                     | Partial local evidence; pending release review                    |
| L-05 Business and policies | Established operator/location, merchant eligibility, support contact, applicable legal/tax review, accurate terms/privacy/deletion pages | Product with qualified advisers | Pending                                                           |
| L-06 Payments              | Stripe test lifecycle passes; if charging, separate reviewed live-mode change and live configuration acceptance                          | Engineering/product             | Test integration exists; external evidence pending; live disabled |
| L-07 Operations            | Working alerts, assigned incident owner, restore/rollback drill, accepted capacity and recovery objectives                               | Operations                      | Pending                                                           |
| L-08 Quality               | Acceptance matrix complete; no critical/high defects in advertised flows; accessibility review                                           | QA                              | Partial local evidence                                            |
| L-09 Release package       | Candidate SHA/images, migrations, release notes, known limits, launch/rollback owners                                                    | Engineering                     | Pending candidate selection                                       |

An approval flag or successful mocked test is not provider approval. Recheck official platform requirements when submitting, retain actual approval evidence, and keep unapproved visibility restrictions in place. Developer apps and callback procedures are in [provider setup](../provider-setup.md).

## Controlled-pilot plan

Propose five invited creators for an initial one-week observation window after staging acceptance; the product owner may adjust this to provider test-user limits. Each creator completes onboarding, one draft, one scheduled post, and one recovery exercise using authorized accounts. Do not perform destructive exercises against valued public content.

Collect activation and task-completion observations, due-to-dispatch latency, successful/attention outcomes, support requests, and infrastructure cost. Proposed pilot acceptance: no critical defects or duplicate confirmed posts, all invited users can complete supported core flows, every unresolved failure has an owner, and capacity/cost/support findings are reviewed. A pilot with blocked core tests does not count as a successful pilot.

## Release preparation

- [ ] Freeze the candidate scope and rerun relevant tests against the exact SHA.
- [ ] Record provider app versions, approvals, account restrictions, and quotas.
- [ ] Review launch copy for unsupported guarantees such as simultaneous publication, unlimited upload, or zero infrastructure costs.
- [ ] Populate legal entity/support details and confirm deletion instructions are actionable.
- [ ] Publish a release note explaining supported account types, video constraints, scheduling behavior, billing mode, and known limitations.
- [ ] Prepare onboarding/support material for reconnect, source changes, failed posts, and billing.
- [ ] Verify backup, alert delivery, emergency access, and rollback image.

## Launch-day execution

Engineering records deployment and migration completion. QA runs smoke checks on the public hostname. Operations observes health, due jobs, failures, quota settlement, webhook delivery, memory, and rate limits. The launch owner reviews the gate evidence and explicitly authorizes opening access within the approved scope. Record the decision and timestamp in the release record; no approval is recorded yet.

For the initial observation period, assign a named responder and backup before access opens. Check at deployment, after the first scheduled batch, and at the end of the first day. Do not promise continuous support unless it is staffed.

## Stop and rollback criteria

Stop new dispatch/registration as appropriate for a confirmed cross-user disclosure, credential leak, duplicate publishing, corrupted quota/billing state, or widespread failed scheduling. Preserve metadata and remote IDs, investigate accepted remote operations, and follow the [operations procedure](08-production-operations.md). Do not replay all jobs or clear checkpoints to recover quickly.

Rollback code only when schema/job-state compatibility is known. Disable the affected feature or restrict the pilot if a provider approval is withdrawn or an API changes. Communicate actual impact and next steps through the configured support channel without exposing source media or secrets.

## Release record and post-launch review

For every release record: version/SHA, date, approver, supported scope, test evidence, provider approval references, business/payment mode, migrations, recovery evidence, known issues, and rollback target. Store secret-free operational evidence in the repo and sensitive provider/account evidence in restricted storage.

Review the first week and first month for activation, reliability, cost, support load, and retention where real billing exists. Update the roadmap from observed results. Do not add excluded product areas merely to compensate for unresolved reliability or onboarding issues.

## Current release records

The [acceptance report](../release/acceptance-report.md) currently records NO-GO. Maintain the [provider approval register](../release/provider-approvals.md) and [policy decisions](../release/policy-decisions.md) as evidence is obtained. Use the [creator guide](../help/creator-guide.md) for onboarding, after verifying it against the accepted candidate.
