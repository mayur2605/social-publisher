# 1. Discovery and product opportunity

Version 1.0 · 2026-09-22 · Owner: product owner

## Problem and intended customer

Independent creators publish the same ready-to-post video to several accounts. Separate uploads, platform-specific fields, and calendar management create repetitive work and make partial failures difficult to track. Social Publisher provides one workspace to choose a private Drive video, configure destinations, and publish now or later.

The first customer is an individual creator who already uses Google Drive, owns or administers supported social accounts, and publishes regularly. Agencies requiring approvals, shared access, client workspaces, or analytics are outside the first release. This persona is an agreed design assumption; no interviews or market-size research have been completed in this repository.

## Value proposition and boundaries

One source video, multiple authorized destinations, a durable schedule, and a separate result for each destination. Google Drive remains the creator's persistent video store. The SaaS still pays for database, compute, networking, support, and any provider costs. Avoiding a video bucket is not equivalent to zero infrastructure cost.

The product accepts prepared videos. Editing, transcoding, AI generation, teams, approvals, engagement analytics, and guaranteed simultaneous publication are excluded. Platform processing and account eligibility constrain the result.

## Hypotheses to validate

| ID   | Hypothesis                                          | Experiment                                                                   | Proposed decision criterion                                                 |
| ---- | --------------------------------------------------- | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| H-01 | Repeated cross-platform uploads are a frequent pain | Interview 8–12 creators about their last three publishing sessions           | At least five independently describe the problem and an existing workaround |
| H-02 | Drive is a useful source for the target segment     | Observe onboarding and file selection with five creators                     | At least four complete selection without help after consent                 |
| H-03 | Creators will pay the agreed monthly prices         | Show a working prototype and clearly labeled pricing; record purchase intent | At least three agree to a paid pilot once legally and technically available |
| H-04 | Account setup friction is acceptable                | Observe connection of Drive and two social destinations                      | Identify all blockers; no unresolved blocker for the chosen pilot cohort    |
| H-05 | Streaming economics support the plans               | Measure network bytes, worker time, and support effort in staging            | Product owner accepts a measured cost model before commercial launch        |

These sample sizes and criteria are planning proposals, not research results or proof of demand. Record dissent and failed experiments as well as favorable responses.

## Alternatives and research method

Compare native platform schedulers, general social schedulers, and the creator's current manual process. For each alternative, collect dated evidence for supported account types, Drive handling, scheduling constraints, recovery behavior, account/post limits, monthly pricing, and approval requirements. No competitor feature or price claims have been verified here. Research official product pages and hands-on trials before using comparisons in marketing.

Interview prompts: How did you publish your last video? Which steps repeated? What went wrong? How do you know every destination succeeded? Where is the original stored? Who has account access? What do you currently spend? Ask about behavior before pitching the solution.

## Commercial baseline

Monthly USD plans are Starter $9 / 4 social accounts / 60 destination posts / 40 GB monthly bandwidth pool; Creator $19 / 10 / 200 / 120 GB bandwidth pool; Pro $39 / 25 / 600 / 300 GB bandwidth pool; Studio $79 / 50 / 1,500 / 750 GB bandwidth pool (supporting up to 10 GB video uploads for YouTube & Facebook Video). Short-form vertical formats (Instagram Reels, Facebook Reels, TikTok) enforce a 500 MB limit to guarantee 50%–70% minimum gross margins. One video sent to four accounts consumes four posts on confirmed publication. There is no free trial in the product offer. Prices are agreed defaults, not evidence of profitability or willingness to pay.

Estimate contribution per subscriber as collected revenue minus payment costs, allocated compute/database/network costs, support costs, and other variable costs. Measure streaming amplification: one Drive source may be downloaded separately per destination and fetched more than once by a provider. Outbound egress cost is minimized by running on Hetzner Cloud VPS (20,000 GB / 20 TB free monthly egress bandwidth).

## Risks and decisions

| Risk or unknown                                      | Consequence                                          | Next action / responsible role                                                                                    |
| ---------------------------------------------------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Provider approval and background-posting eligibility | Some workflows may not be available to outside users | Engineering and product: validate each approved use case                                                          |
| Business location and merchant eligibility           | Live subscriptions cannot launch                     | Product owner: establish entity/location and review eligibility                                                   |
| Reliance on private Drive originals                  | Deletion, changes, or revoked grants stop jobs       | Engineering: prove attention/reconnect flows with real accounts                                                   |
| Long-video transfer cost and delay                   | Plan margin and scheduling experience may degrade    | Mitigated by 500 MB short-form caps, monthly bandwidth pools, and 20 TB included free egress on Hetzner Cloud VPS |
| High consent/setup friction                          | Users abandon before first publish                   | Product: observe pilot onboarding                                                                                 |

## Phase exit

- [ ] Record anonymized interview evidence and prototype observations.
- [ ] Complete a dated alternatives comparison.
- [ ] Review the hypotheses and unit economics with the product owner.
- [ ] Record a go, revise, or stop decision with reasons and pilot scope.

Current decision: continue the already authorized implementation and controlled testing; commercial validation remains pending. Do not describe this phase as customer-validated.
