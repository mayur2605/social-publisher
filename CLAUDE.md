# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Every session:** read [AGENTS.md](AGENTS.md) and [HANDOFF.md](HANDOFF.md) first. Keep HANDOFF updated after meaningful progress, verification, decisions, blockers, and before ending or switching agents/providers. Follow its ownership rules for parallel work; preserve other agents' changes. Do not rely on a previous chat to supply project context.

## Project Overview

A Next.js social media publishing platform that schedules and publishes video content to multiple platforms (YouTube, Instagram, Facebook, TikTok). Uses Google Drive as the media source, Better Auth for authentication, PostgreSQL for data storage, pg-boss for background jobs, and Stripe for subscription billing.

## Development Commands

```bash
# Validate environment configuration (checks all required secrets present)
npm run setup:check

# Run database migrations
npm run migrate
# Or: tsx scripts/migrate.ts

# Generate Better Auth migration SQL for review (doesn't apply)
tsx scripts/migrate.ts --generate-auth

# Development server
npm run dev

# Start background worker (run in separate terminal, required for publishing)
npm run worker
# Or: tsx src/worker/index.ts

# Build
npm run build

# Start production server (copies static assets into standalone output)
npm start

# Type checking and linting
npm run typecheck
npm run lint                # Run ESLint check
npm run lint:fix            # Automatically fix ESLint errors
npm run format              # Format code with Prettier
npm run format:check        # Check code formatting with Prettier
npm run dev:session         # Seed local dev user and generate browser session cookie
# Or open http://localhost:3000/api/dev-login directly in your browser to log in

# Tests (require TEST_DATABASE_URL pointing to a database ending in _test)
npm test                    # Unit and integration tests
npm run test:integration    # Integration tests only
npm run test:e2e            # Playwright browser tests (run npm test first, install chromium if needed)

# Health check endpoint (returns 503 if worker stale)
curl http://localhost:3000/api/health
```

## Architecture

### Core Stack

- **Framework**: Next.js 16 (standalone output; application package uses ESM)
- **Database**: PostgreSQL with connection pooling (pg)
- **Auth**: Better Auth with Google OAuth
- **Background Jobs**: pg-boss, implemented in `src/lib/jobs.ts` and `src/worker/index.ts`
- **Payments**: Stripe subscriptions
- **TypeScript**: v7 with strict type checking

### Directory Structure

- `src/lib/` — Core business logic, database, auth, validation, crypto utilities
- `src/app/api/` — Next.js API routes (auth endpoints visible)
- `src/components/` — React components
- `src/worker/` — Executable worker startup and graceful shutdown
- `migrations/` — SQL migrations (numbered, applied in order)
- `scripts/` — Utility scripts (migration runner)

### Key Architectural Patterns

**Database Layer** (`src/lib/db.ts`):

- Connection pool singleton pattern with dev mode persistence
- `query<T>()` helper for type-safe queries
- `tx()` for transactional operations with automatic rollback

**Authentication** (`src/lib/auth.ts`):

- Better Auth singleton via `getAuth()`
- Google OAuth with account linking disabled
- Session lifetime: 7 days, cookie cache disabled
- Database-backed rate limiting (60 req/min)
- OAuth tokens encrypted at rest

**Migration Strategy** (`scripts/migrate.ts`):

- Better Auth owns its schema; generated SQL checked into version control for review
- App migrations in `migrations/NNN_*.sql` format, applied in sorted order
- Per-migration transactions use advisory locks; initial tracking-table creation occurs before that lock and still needs concurrent first-start testing
- Migration tracking in `app_migrations` table

**Data Model** (see `migrations/001_app.sql`):

- **connections**: OAuth tokens for external platforms (one Drive per user enforced)
- **media**: Video metadata synced from Google Drive
- **posts**: Scheduling metadata (timezone-aware)
- **destinations**: Per-platform publish targets with status FSM and retry logic
- **subscriptions**: Stripe subscription state per user
- **usage**: Period-based usage tracking (reserved/consumed/released)

**Environment Configuration** (`src/lib/env.ts`):

- `required()` helper throws on missing critical env vars
- `configured()` checks core auth/database/token-encryption prerequisites; `setup:check` checks provider/billing/legal groups separately
- `appUrl()` defaults to localhost:3000

**Type System** (`src/lib/types.ts`):

- Platform enum: drive, youtube, instagram, facebook, tiktok
- Destination status FSM: draft → scheduled → queued → processing → published (or failed/attention/paused/canceled)
- Custom error types: `AppError` (user-facing, with HTTP status), `ProviderError` (retryable/ambiguous flags for external API failures)

**Security Headers** (`next.config.ts`):

- X-Content-Type-Options, Referrer-Policy, X-Frame-Options, Permissions-Policy
- No powered-by header

## Background Job System

**Worker Architecture** (`src/worker/index.ts`, `src/lib/jobs.ts`):

- pg-boss queue with 3 local workers, 10-second tick scheduler
- Advisory locks prevent concurrent processing: per-destination lock (id) + per-user shared lock (user_id)
- Destinations lease for 3 minutes during processing via `lease_until`
- Automatic retry uses consecutive failures: 15 * 2^(failures - 1), capped at 1800s, up to 12 automatic retries; successful steps reset the error budget
- Worker heartbeat tracked in `worker_heartbeats` table

**Publishing State Machine**:

```
draft → scheduled → queued → processing → published
                    ↓           ↓
                 paused    attention/failed
```

**Platform Adapters** (`src/lib/publishers.ts`):

- Each platform implements: `validate()`, `upload()`, `publish()`, `reconcile()`
- Resumable uploads tracked in `upload_state` JSONB field
- YouTube/TikTok: chunked uploads with checkpoints; Facebook Video/Reels use the implemented URL/session flows with saved remote IDs
- Instagram: file-URL ingest (signed 24h URLs via `signedSource()`)
- Upload hosts validated via `uploadHost()` — rejects unexpected domains

**Error Handling**:

- `AppError`: user-facing, pauses destination when no upload_state
- `ProviderError`: retryable flag controls retry, ambiguous flag (YouTube) triggers polling
- Long-running pending results have a separate attempts guard; exhausted consecutive-error retries and uncertain/non-retryable results can require attention

## Usage & Billing

**Subscription Model** (`src/lib/billing.ts`, `src/lib/plans.ts`):

- Stripe test-mode only enforced (rejects live keys)
- Plans: starter/creator/pro with per-plan account limits and monthly post quotas
- Usage reservation via `reserve()` — checks entitlement, active accounts, quota; locks subscription row
- Usage states: reserved (queued) → consumed (published) or released (failed/paused with no progress)
- Idempotent webhook handling via `billing_events` table
- Out-of-order Stripe events handled by re-fetching authoritative state

## OAuth & Connection Management

**Multi-Platform OAuth** (`src/lib/connections.ts`):

- Google (Drive, YouTube), Meta (Facebook, Instagram via Pages), TikTok
- PKCE flow for Google, standard OAuth for Meta/TikTok
- Tokens encrypted at rest (`src/lib/crypto.ts`), auto-refresh 2min before expiry
- One Drive per user enforced; publishing platforms limited by subscription plan
- Connection status: connected → reconnect (refresh failed) → disconnected
- Disconnecting pauses affected draft/scheduled/queued destinations; an in-flight remote operation cannot be retracted and is reviewed by later worker steps

**Token Refresh**:

- Transaction-locked token refresh prevents duplicate refreshes
- Falls back to "reconnect" status on non-retryable refresh failures

## Platform-Specific Constraints

**Validation** (`src/lib/validation.ts`, `validateMedia()`):

- **YouTube**: requires title, privacy (private/unlisted/public), madeForKids flag; max 12hrs
- **Instagram**: Reels only; 1GB max, 3s–15min, 2200 char caption
- **Facebook Reels**: 3–90s, portrait orientation required
- **TikTok**: requires consent, privacy; 2200 char caption; validates against creator_info (duration limit, disabled features)
- Public publishing gated by env flags: `YOUTUBE_PUBLIC_APPROVED`, `TIKTOK_PUBLIC_APPROVED`

**Drive Integration** (`src/lib/drive.ts`):

- MP4/MOV only, 2GB max
- Validates checksum + size on every download (detects file changes/deletion)
- Resumable uploads create capability URLs (not OAuth credentials)
- Auto-creates "Social Publisher" folder in user's Drive

## Documentation and readiness

Use [the documentation index](docs/README.md) and [audit/traceability report](docs/documentation-audit.md). Requirements remain authoritative even where implementation is incomplete. The app has local test evidence, not production acceptance. Spec Kit 1.0.9 is installed with Codex skills in `.agents/skills`; existing planning artifacts are preserved. Use the current feature pointer and [installation record](docs/spec-kit-review.md). Installation is not an implementation/convergence run. Preserve the existing command guidance when updating this file.

## Important Notes

- All timestamps use `timestamptz` — respect user timezones when scheduling
- OAuth tokens encrypted; use `encrypt()`/`decrypt()` from `src/lib/crypto.ts`
- Subscriptions use Stripe webhooks; `billing_events` table ensures idempotency
- Worker must run separately from Next.js app for publishing to occur
- One non-disconnected Google Drive connection per user enforced by a partial unique index
- Authentication rate limiting is database-backed (Better Auth); this is not general application API rate limiting
- Never process destinations without acquiring advisory locks (data corruption risk)
- `upload_state` checkpoints allow resuming multi-chunk uploads after worker restart

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
