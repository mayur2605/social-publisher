# Dependency and build policy

2026-09-22 · Source: `package.json`, `package-lock.json`, Dockerfiles and TypeScript configuration

## Runtime inventory

| Dependency           | Locked version   | Responsibility                            |
| -------------------- | ---------------- | ----------------------------------------- |
| Next.js / @next/env  | 16.3.5 / 16.3.5  | Web runtime/build and environment loading |
| React / React DOM    | 19.3.0 / 19.3.0  | UI rendering                              |
| Better Auth          | 1.7.5            | Identity/session/OAuth login handling     |
| pg / pg-boss         | 8.23.0 / 12.33.3 | PostgreSQL pool and durable queue         |
| Stripe               | 22.6.2           | Billing API and webhook verification      |
| Zod                  | 4.6.5            | Request/configured option validation      |
| date-fns-tz          | 3.2.0            | Timezone conversion and display           |
| Radix Themes / Icons | 3.3.0 / 1.3.2    | UI primitives, theme and icons            |

Development tooling includes TypeScript 7.0.2, Vitest 5.0.1, Playwright 1.63.0, tsx 4.23.15, Prettier 3.9.8, and type packages recorded in the lockfile. This inventory is a snapshot, not an instruction to install arbitrary latest versions.

The package uses ESM and strict TypeScript with bundler resolution. `skipLibCheck` skips dependency declaration checking; it does not establish runtime compatibility. Runtime manifest accepts Node >=22.14; docs and Dockerfiles target Node 24 LTS. Local historical tests ran on the available Node 26 runtime, so repeat image/candidate checks on the deployment runtime. Compose selects PostgreSQL 17; production version must be recorded and validated explicitly.

## Reproducibility and packaging

Commit the lockfile and use `npm ci`. Manifest caret ranges allow future versions on deliberate resolution; they do not mean the installed build floats when `npm ci` uses the lockfile. Record exact candidate SHA, lockfile change, Node version and container image digest for releases. Current base tags are mutable; pin/review image digests before relying on reproducible production images.

The web image uses Next standalone output and copies static/public assets. The worker executes TypeScript through `tsx` and currently installs development dependencies; `tsx` is operationally required by that image despite its devDependency classification. Do not prune dev dependencies without compiling the worker or moving required tooling deliberately. The migration command has the same runtime requirement. CI configuration has not yet been implemented.

## Advisory snapshot

On 2026-09-22, `npm audit --json` returned zero registry-known advisories across its dependency graph (297 total graph entries reported). Raw output is retained locally at ignored `.local/dependency-audit.json`; this document records the secret-free summary. This does not establish freedom from vulnerabilities, validate package provenance, scan OS images, or review licenses.

No packages were upgraded by this documentation review. Do not use blanket `npm audit fix --force` as a release process. Assess exploitability, direct/transitive ownership, compatibility and fixed versions; implement scoped updates with relevant tests and evidence.

## Upgrade and release checklist

- [ ] Review changes/security notices from primary maintainers and the actual lockfile diff.
- [ ] Check package provenance, license obligations, and container OS advisories; publish a candidate SBOM if adopted by operations.
- [ ] For Better Auth, review newly enabled routes/cookies and generate/review schema deltas without replacing applied migrations.
- [ ] For Next/React, read installed version documentation and verify routing, cookies, streaming, standalone assets, and browser hydration.
- [ ] For pg-boss/pg, test queue recovery, migration compatibility, pool/concurrency and restart behavior.
- [ ] For Stripe/provider changes, verify signatures/contracts, duplicate events, approval restrictions, and real-account smoke tests where affected.
- [ ] Run appropriate typecheck/backend/browser/build tests on target Node, then container startup and staging recovery.
- [ ] Record rollback compatibility and update this inventory from the accepted lockfile.

Engineering owns updates; operations owns runtime/base-image evidence. T018/T041 track CI and dependency assurance. External provider API version/approval changes are tracked separately in the [provider register](../release/provider-approvals.md).
