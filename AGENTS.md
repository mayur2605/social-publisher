# Instructions for every agent working in this repository

## Start here on every task or provider switch

1. Read [HANDOFF.md](HANDOFF.md) before planning or editing. It is the shared current-state checkpoint across agents/providers; do not depend on previous chat history.
2. Inspect the current branch, `git status`, recent commits, and task ownership in HANDOFF. Preserve existing user/agent changes. Verify the checkout is current without overwriting dirty work.
3. Read the relevant PRD/spec/plan and code linked from HANDOFF. Intended requirements and actual implementation may differ; keep those gaps explicit.
4. Claim the bounded task and intended files in HANDOFF before edits. Follow its coordination protocol when another agent is active. This instruction does not authorize spawning agents or triggering external actions beyond the user's request.

## Keep the handoff current

Update **HANDOFF.md** after a meaningful implementation step, new finding/decision, completed verification, scope change, or blocker. Save a small checkpoint during long tasks (aim for every 10–15 minutes), and always update it before ending a work session, yielding to another agent, or approaching a known quota/context limit. Do not wait until all work is finished; a sudden interruption may prevent a final update.

Each checkpoint must identify task, agent alias/provider if known, branch/worktree, changed paths, exact completed work, tests with pass/fail/not-run status, remaining work, blockers, and the next executable action. Never invent a model/provider identity, test result, approval, or commit SHA.

Keep the top summary current and concise. Append a dated factual entry to recent progress; retain unresolved handoff details. Update the canonical task register and affected requirements/API/design/help docs when behavior changes. HANDOFF summarizes execution state; it does not replace product specifications or test evidence.

Include the relevant handoff update in the same work commit when practical. Push it when publishing is authorized so a different machine/provider can read it. If code cannot yet be committed, list the uncommitted files and explicitly say they are only on this checkout. A repository file cannot transfer an unpushed diff to another machine.

## Parallel work and recovery

Use nonoverlapping task/file ownership, separate worktrees or branches, and isolated disposable test databases where needed. HANDOFF is a cooperative ledger, not a lock service. A designated coordinator integrates overlapping changes and owns the shared current summary during concurrent work; each agent still supplies its checkpoint. Do not overwrite another agent's row or replace the file wholesale from a stale version.

An expired timestamp alone does not prove an agent stopped. Confirm takeover through the owner/coordinator or an explicit user handoff before changing owned files. If an agent vanished, inspect working tree/commits and verify partial work before marking tasks complete or restarting side effects.

## Product and verification boundaries

- Better Auth owns app identity; Drive/social OAuth connections remain separate and owner-scoped.
- Preserve private Drive originals and remote identifiers; do not blind-retry an uncertain publication.
- Stripe remains test-only until a separately authorized and reviewed live-mode change.
- Do not run schema-reset tests against anything except a dedicated `_test` database. Parallel test agents need different databases and browser ports.
- Distinguish code implemented, tests passed locally, real-provider acceptance, and provider approval. Production remains blocked until the release gates pass.
- Never put credentials, cookies, signed media/upload URLs, real user media/content, or full environment files in HANDOFF or Git. Store only configuration names and redacted evidence references.
- Spec Kit's installed vendor-managed skills/scripts/templates should not be reformatted casually; integration manifests check them. Its workflows are not automatically completed by installation.

For app commands and architecture, see [CLAUDE.md](CLAUDE.md) and [README.md](README.md). Before changing Next.js code, read the relevant installed version's guide under `node_modules/next/dist/docs/`. Higher-priority user and agent-runtime instructions continue to apply.
