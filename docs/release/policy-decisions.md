# Privacy, terms, and retention decision register

2026-09-22 · Owner: product owner with qualified business/legal review

The app has pre-launch [privacy](../../src/app/privacy/page.tsx), [terms](../../src/app/terms/page.tsx), and [data-deletion](../../src/app/data-deletion/page.tsx) pages. They describe current intended behavior and disclose missing operator details. They are not final jurisdiction-specific legal documents. This register identifies factual and policy decisions needed to finalize them; it does not supply legal conclusions or invented retention periods.

## Open decisions

| ID     | Decision / evidence needed                                                                | Current state                                                                                             | Action owner                    |
| ------ | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------- |
| POL-01 | Operator legal name, location, contact/address as applicable, support email               | Undecided/unconfigured                                                                                    | Product owner                   |
| POL-02 | Launch regions, eligible customers, age/account requirements, applicable legal/tax review | Not established                                                                                           | Product with qualified advisers |
| POL-03 | Hosting region and actual subprocessors, processing locations, provider contracts         | Hetzner Cloud VPS (EU or US) + Coolify planned (Railway alternative); production configuration documented | Operations/product              |
| POL-04 | Per-category retention, backup lifetime, deletion completion and exceptions               | No approved durations; no general pruning job evidenced                                                   | Product/legal/engineering       |
| POL-05 | Rights/support request intake, identity verification, escalation, response commitments    | No staffed contact/process confirmed                                                                      | Support/product                 |
| POL-06 | Billing mode, refund/cancellation terms, tax handling and merchant eligibility            | Test-only; live blocked; no real-payment policy accepted                                                  | Product/legal                   |
| POL-07 | Required cookies and any optional measurement, consent/disclosure choices                 | Better Auth sessions implemented; proposed metrics not deployed                                           | Engineering/product/legal       |
| POL-08 | Google Limited Use and other provider policy obligations against actual data use          | Existing policy statement; app-specific compliance review pending                                         | Product/engineering             |

## Data inventory and implementation review

| Category                                      | Existing purpose/storage                     | Current deletion/expiry behavior                                                                | Finalization work                                                                                    |
| --------------------------------------------- | -------------------------------------------- | ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Identity/profile and sessions                 | Better Auth PostgreSQL tables                | App user deletion cascades related records; sessions expire logically after configured lifetime | Verify every vendor route and physical expired-record cleanup; define retention                      |
| Better Auth accounts/verification/rate limits | Login grants and authentication support      | Account rows reference user; verification/rate-limit rows do not all share user FK              | Review stale rows, identifiers, IP/user-agent handling, and cleanup before claiming all data removed |
| Connection grants                             | Encrypted OAuth tokens and provider identity | Disconnect blanks token/removes refresh token; leaves connection record                         | Define identity/metadata retention; verify revocation behavior and auxiliary credentials             |
| OAuth state                                   | Owner-bound state and encrypted verifier     | One-use state deleted on exchange; expired states pruned on authorize                           | Decide scheduled cleanup for periods without activity                                                |
| Media/upload sessions                         | Drive metadata and encrypted resumable URL   | User deletion cascades local records; disconnect does not explicitly erase `upload_sessions`    | Verify session invalidation/expiry and prune obsolete capability records                             |
| Posts/destinations/attempts/usage             | Scheduling, recovery, results and quota      | User/destination cascades cover core app records                                                | Choose active/history retention; do not remove uncertain recovery evidence prematurely               |
| Subscription/webhook records                  | Stripe IDs, plan/period and deduplication    | User subscription removed; billing event IDs are not user-linked by schema                      | Define deduplication retention and provider-held billing treatment                                   |
| Logs, database backups and hosting metadata   | Operations/recovery                          | Depends on deployment; no agreed retention yet                                                  | Configure and prove retention/deletion behavior; document restore handling                           |
| Video originals/social posts                  | Creator Drive and chosen platforms           | App does not delete these                                                                       | Clearly explain separate provider controls and permissions                                           |

Encryption does not mean credentials are erased on disconnect. Audit every capability-bearing table, not only `connections`, before accepting the deletion policy. Account deletion is intentionally blocked while processing/attention jobs remain; provide a support path for safely resolving stranded operations before public launch.

## Publication checklist

- [ ] Resolve POL-01–POL-08 with recorded owner decisions and appropriate review.
- [ ] Confirm actual storage/cleanup behavior in staging; implement missing cleanup before describing it as active.
- [ ] Populate `LEGAL_ENTITY_NAME` and `SUPPORT_EMAIL`; update page wording where decided behavior differs.
- [ ] Specify the real backup/retention behavior and independent provider data handling without promising immediate removal from all systems.
- [ ] Verify public policy/deletion URLs on the approved domain and register them with providers.
- [ ] Review payment language again before any live-mode change; current pages must continue to say test-only.
- [ ] Record policy version/effective date, reviewer and deployed commit in the acceptance report.

Finalization remains blocked on factual business and operational decisions. Creating this document does not complete those decisions or change the live policy pages.
