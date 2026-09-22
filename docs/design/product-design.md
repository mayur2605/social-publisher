# Product design and interaction specification

2026-09-22 · Owner: product/design with engineering · Requirements: FR-01–FR-12, NFR-04

## Design intent and implementation baseline

A creator workspace should make the selected source, destination identity, publishing time, and outcome unambiguous. Favor readable forms and clear recovery over decorative motion. Existing implementation uses Radix Themes/components and custom CSS, English, a light theme, Arial/Helvetica, blue actions and slate text. No dark theme, brand research, Figma design system, or completed accessibility audit is claimed.

Source tokens in `src/app/globals.css` are ink `#192434`, muted `#687789`, line `#e6eaf0`, canvas `#f7f9fc`, blue `#2459dc`, and white panels. Base heading sizes are 32/19/16px; paragraphs are 15px with 1.65 line height. `layout.tsx` configures blue/slate Radix colors and medium radius. Reuse these tokens/components before adding new ones; actual contrast and responsive behavior need acceptance testing, not visual inference.

## Navigation and screen contracts

| Screen               | Primary task                                                   | Required states and safeguards                                                                                                          |
| -------------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Setup/sign-in        | Configure or establish app identity                            | Missing configuration explained; Google consent cancellation/error handled; no fake login                                               |
| Overview `/`         | Understand pending work and next step                          | Empty workspace guides connection/source setup; loading/error states distinguish unavailable data from zero posts                       |
| Accounts `/accounts` | Connect, reconnect, activate or disconnect                     | Show provider and account label; keep app identity distinct; one Drive; explicit disconnect confirmation and impact                     |
| Library `/library`   | Upload/select/preview source                                   | Upload progress and failure; Drive processing delay; empty library; no permanent app copy; disclose page-memory resume limit            |
| Compose `/compose`   | Select source/destinations, set options, save/publish/schedule | Video preview; selected account identity; per-destination errors; required privacy/disclosures; visible timezone; busy/submission state |
| Calendar `/calendar` | Review schedule by date                                        | Empty days, readable timezone, navigate to post; no implied exact remote appearance time                                                |
| Posts `/posts`       | Inspect independent destination outcomes                       | Status text plus color; links where available; only eligible edit/cancel/retry; explicit review of uncertainty                          |
| Billing `/billing`   | Choose test plan and manage access                             | Prices/limits/usage and reserved allowance clear; test-mode disclosure; inactive/expired/cancellation/downgrade states                  |
| Settings `/settings` | Sign out or delete app account                                 | Explain background schedule persistence after sign-out; `DELETE` confirmation; unresolved-job deletion error                            |
| Policies             | Understand operator/data/terms                                 | Pre-launch gaps visible until finalized; accessible support and deletion instructions                                                   |

## Interaction rules

Before publishing, the creator must be able to identify the exact video, selected accounts, timing/timezone, and platform-specific settings. Do not silently default TikTok privacy. Keep disabled provider interactions unavailable. Shared captions and overrides must make the effective text understandable. Drafts allow unfinished platform settings, while dispatch requires valid settings and entitlement.

Submission should have a busy state and prevent obvious double-clicks. A lost create-post acknowledgement must instruct inspection of existing posts rather than blind resubmission; backend creation currently has no idempotency key. Errors must retain recoverable input and explain an actionable next step. Do not replace a provider failure with a success toast because another destination succeeded.

For uncertainty, **Check status** and **Review outcome** have different meanings. Review requires checking the remote platform; it is not a shortcut to force retry. Marking not published can permit a fresh upload and duplicate an operation still processing. Deletion/disconnection copy must distinguish local data/grants from existing remote posts and originals.

## Responsive and accessibility acceptance

Target usable desktop and mobile layouts without horizontal overflow, readable preview/settings, and persistent access to primary actions. Current Playwright coverage uses desktop 1440×1000 and an iPhone-sized Chromium viewport; actual mobile browser/OAuth behavior remains to test.

Complete keyboard navigation, visible focus, labeled controls, dialog focus return, error announcements, status distinctions without color alone, zoom/reflow, contrast measurement, reduced-motion behavior if animation is added, and screen-reader workflows. Validate touch target usability and form fields when the virtual keyboard is open. Radix components help implement behavior but do not certify the complete page.

## Design review evidence and open work

Local screenshots in ignored `.local/` contain test data and were previously inspected; they are not permanent release evidence. Capture dated candidate screenshots for empty, loading, error, success, and recovery states on both viewport classes, and link them in V-04. Track any missing behavior as T017/T040 rather than claiming the desired design is fully implemented.

The [creator guide](../help/creator-guide.md) must use real labels from `workspace.tsx`. Update it whenever a label, eligibility rule, resume behavior, or recovery action changes. Product owner accepts any scope change; visual changes must preserve the security and publishing requirements.
