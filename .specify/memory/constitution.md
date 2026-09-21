# Social Publisher engineering constitution

Version 1.0.0 · Adopted as documentation baseline: 2026-09-22

## Principles

1. **Creator ownership and privacy.** Drive originals remain private and creator-owned. Persist metadata and encrypted grants, not another video copy. Deletion of the app account must not delete originals or remote posts.
2. **Identity boundaries.** Better Auth owns app identity and sessions. Provider connections are separate owner-scoped records. Another connected Google account never implicitly changes or merges the app user.
3. **Durable and reviewable side effects.** Scheduling survives sign-out and worker restart. Save upload/remote identifiers before subsequent operations. Reconcile ambiguity; do not blindly retry a potentially successful publication.
4. **Correct billing under concurrency.** Reserve/consume/release usage atomically for each destination. Retries must not double charge. Uncertain outcomes keep their reservation until resolved. Live billing requires a separate business and engineering review.
5. **Evidence over completion claims.** Distinguish implemented, locally verified, externally verified, blocked, and not run. Provider mocks are not actual publishing or approval evidence. Documentation completion does not imply production readiness.
6. **Explicit scope and reversible delivery.** Preserve the agreed first-release scope. Review migrations, maintain rollback compatibility, exclude secrets from Git, and use meaningful tests for security, concurrency, recovery, and provider boundaries.

## Governance

The [PRD](../../docs/lifecycle/02-prd.md) owns product requirements, the [technical specification](../../docs/lifecycle/03-technical-specification.md) owns architecture, and the [tasks](../../specs/001-social-publisher/tasks.md) track execution. User instructions govern product choices; this document creates no additional permission workflow. A change that affects these principles must explain its rationale, affected requirements, migration/recovery implications, and validation.

Amend by a reviewed repository change, updating version and date. Check constitution consistency in technical plans and release review. The original plan's unresolved goals remain pending until evidenced; do not silently redefine requirements to fit current code.
