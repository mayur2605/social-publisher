# Release acceptance report

Report date: 2026-09-22 · Product: Social Publisher · Decision: **NO-GO for public production**

This is a populated readiness record, not a blank sign-off template. Application code baseline is `7265f91`; documentation baseline was `4d76eab` before this review. No production candidate, hosted environment, release approver, or public release date has been designated. A documentation commit does not become an accepted application release automatically.

## Evidence summary

| Evidence                           | Result                                                     | Scope and limitation                                                                               |
| ---------------------------------- | ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Backend suite                      | Historical local pass: 43 tests                            | Real PostgreSQL and Better Auth session handling; mocked provider/Stripe responses                 |
| Browser suite                      | Historical local pass: 8 tests                             | Desktop/mobile Chromium workflows with test-created sessions; not real Google consent              |
| TypeScript and build               | Historical local pass                                      | Local build; not a container or production deployment guarantee                                    |
| Local service health               | Previously observed healthy                                | Standalone web and worker; not a current production SLA                                            |
| Docker Compose                     | Configuration parsed                                       | `compose.yaml` and `docker-compose.prod.yml` validated; images not executed in recorded validation |
| Dependency advisory query          | 2026-09-22: zero advisories returned by `npm audit --json` | Snapshot of registry-known advisories; not a full code, container, license, or supply-chain audit  |
| Real Google/Drive/social flows     | Not run                                                    | Developer credentials and authorized accounts pending                                              |
| Hosted Stripe test lifecycle       | Not run                                                    | Test products, portal, webhook setup pending                                                       |
| Production deploy/restore/rollback | Not run                                                    | Hetzner + Coolify / Railway infrastructure setup pending                                           |
| Platform approvals                 | Not evidenced                                              | See [approval register](provider-approvals.md)                                                     |
| Accessibility/load/security review | Partial source/test evidence                               | Remaining findings in [documentation audit](../documentation-audit.md) and threat model            |

Application tests were not rerun as part of authoring these documents. Preserve their historical dates and rerun against the actual candidate before acceptance. Source and test details are in [verification](../verification.md); scenario definitions are in [V-01–V-12](../lifecycle/05-validation.md).

## Release gates

| Gate                       | Current outcome                | Evidence needed to change it                                                                     |
| -------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------ |
| L-01 Scope and advertising | Pending product release review | Final advertised capabilities match accepted tests                                               |
| L-02 Provider permissions  | Blocked                        | Actual app-specific scopes/access/audit decisions                                                |
| L-03 Real publishing       | Blocked                        | Real private-source, scheduled, and recovery results for each advertised path                    |
| L-04 Security/privacy      | Incomplete                     | Close critical SEC findings, review vendor auth surface, approve retention and deletion behavior |
| L-05 Business/policies     | Blocked                        | Operator/location/contact decisions and appropriate legal review                                 |
| L-06 Payments              | Incomplete; live disabled      | Hosted test evidence; separately reviewed live support if charging                               |
| L-07 Operations            | Blocked                        | Deployed alert, backup, restore, rollback, capacity and named response owner                     |
| L-08 Quality               | Partial                        | Candidate regression, accessibility, DST and crash/race evidence                                 |
| L-09 Release package       | Not assembled                  | Candidate SHA/images, migrations, known limitations and compatible rollback target               |

## Known limitations requiring disposition

Protected-page guards and enabled vendor-auth routes need review; in-flight entitlement expiry must still allow safe outcome settlement; upload-session resume is currently browser-memory dependent; large-file transfer timing and source revision races need tests; workspace history is limited to 100 records; first-deploy migration concurrency, retention/pruning, CI, and deployed abuse limits are not proven. These are tracked in the task register rather than silently waived.

## Decisions and ownership

Mayur is the product owner. Engineering, QA, operations, and business/legal reviewer roles still need named release signatories. Nobody has signed a production approval in this report. Internal testing can continue with authorized accounts within actual provider restrictions; that does not authorize broader public access or live payments.

For each new execution append test ID, candidate SHA, environment, operator/date, expected/observed behavior, result, redacted evidence reference, and defect/task. Keep approvals with account identifiers or private media in restricted storage. Only replace NO-GO after all gates applicable to the explicitly stated release scope pass and the launch owner records a decision.
