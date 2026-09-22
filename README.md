# Social Publisher

A standalone creator workspace built with Next.js, TypeScript, Better Auth, PostgreSQL, and pg-boss. Source videos live in each creator's Google Drive. The app streams selected videos to YouTube, Instagram, Facebook, and TikTok and keeps durable, per-destination publishing state.

**Continuing with any agent/provider:** start with [AGENTS.md](AGENTS.md) and the shared [HANDOFF.md](HANDOFF.md). They provide current progress, blockers, next tasks, and coordination rules; keep the handoff updated during work and before switching providers.

## Product and delivery documentation

Use the [complete documentation index](docs/README.md) and [audit/traceability report](docs/documentation-audit.md) for architecture, design, API, security, dependency, and release evidence.

Start with the [eight-phase lifecycle guide](docs/lifecycle/README.md): discovery, PRD, technical specification, implementation roadmap, validation, staging, launch, and production operations. It distinguishes implemented code and local test evidence from pending research, provider approvals, real-account testing, and deployment.

The [feature specification](specs/001-social-publisher/spec.md), [implementation plan](specs/001-social-publisher/plan.md), [task register](specs/001-social-publisher/tasks.md), and [constitution](.specify/memory/constitution.md) provide Spec Kit-style planning artifacts. Spec Kit 1.0.9 and its Codex skills are installed. See the [installation and usage record](docs/spec-kit-review.md) for verification and setup on another machine.

## Run locally

Use Node.js 24 LTS and PostgreSQL 17 or newer.

```sh
npm ci
cp .env.example .env
# Fill the variables described below. Generate each secret locally:
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
npm run setup:check
npm run migrate
npm run dev
# In a second terminal:
npm run worker
```

The web app runs at http://localhost:3000. For the production server, run `npm run build` followed by `npm start`; the start script copies static assets into the standalone output. With missing Google configuration it displays setup instructions instead of offering a nonfunctional sign-in button. Real account connections and uploads require developer credentials; the application does not include a production authentication bypass or simulated publishing mode.

Alternatively, fill `.env`, then run `docker compose up --build`. Compose starts PostgreSQL, applies migrations, and runs web and worker services. Database files use a persistent Docker volume. No video-storage service is deployed.

### Configuration

| Variable                                                           | Purpose                                                                     |
| ------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| `DATABASE_URL`                                                     | PostgreSQL connection string shared by web and worker                       |
| `BETTER_AUTH_URL`                                                  | Exact externally reachable web origin, HTTPS in production                  |
| `BETTER_AUTH_SECRET`                                               | Random secret of at least 32 characters                                     |
| `TOKEN_ENCRYPTION_KEY`                                             | Base64-encoded 32-byte key for integration tokens and media-link signatures |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`                         | Google web OAuth client                                                     |
| `GOOGLE_PICKER_API_KEY`, `GOOGLE_PROJECT_NUMBER`                   | Restricted browser key and project number for Google Picker                 |
| `META_APP_ID`, `META_APP_SECRET`, `META_API_VERSION`               | Meta business app credentials and pinned supported API version              |
| `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET`                        | TikTok developer app credentials                                            |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`                       | Stripe test key and endpoint signing secret                                 |
| `STRIPE_PRICE_STARTER`, `STRIPE_PRICE_CREATOR`, `STRIPE_PRICE_PRO` | Monthly USD test-mode price IDs                                             |
| `LEGAL_ENTITY_NAME`, `SUPPORT_EMAIL`                               | Operator identity and support contact displayed in legal pages              |
| `YOUTUBE_PUBLIC_APPROVED`, `TIKTOK_PUBLIC_APPROVED`                | Default `false`; enable only after the corresponding review                 |

Next.js loads `.env.local` before `.env`. This working copy has generated local secrets and database settings in `.env.local`; add provider credentials there or deliberately migrate those settings when changing environments. Keep `.env` files out of version control. Never change the token-encryption key without first migrating encrypted tokens and invalidating outstanding stream links. Separate staging and production credentials and databases.

Google sign-in grants app identity only. Drive and YouTube connections use separate OAuth state and connection records, with explicit user ownership. One connected Drive is supported per creator; several YouTube channels, TikTok accounts, Facebook Pages, and Instagram professional accounts may be connected. Switching Drive requires disconnecting the prior Drive; existing media references remain tied to the old connection and need reimporting under the new one.

## Provider setup

See [docs/provider-setup.md](docs/provider-setup.md) for callbacks, scopes, review evidence, test steps, and Stripe portal configuration. Platform reviews cannot be completed by code alone.

The user explicitly selects the video, destinations, settings, and publishing time. The app uses official APIs only. Public TikTok and YouTube visibility is disabled until their approval flags are enabled. Instagram uses Meta's Facebook Login path and requires a linked Facebook Page. Facebook personal profiles are unsupported.

Videos must be MP4/MOV, at most 2 GiB, and satisfy each destination's additional restrictions. Drive supplies duration and dimensions after processing. Provider APIs perform final codec/encoding acceptance; the app does not transcode. The Facebook Reel path conservatively accepts 3–90 seconds; use its Video format for longer uploads. Keep API constraints up to date as platform versions change.

## Scheduling and recovery

Postgres stores schedules in UTC, original timezones, and separate destination records. Every ten seconds the worker discovers due jobs and enqueues them through pg-boss. A session-level advisory lock serializes processing for each destination; queue redelivery does not duplicate confirmed publications. Upload state, platform IDs, and attempts survive restarts.

YouTube resumable uploads query the received offset before the next chunk. TikTok upload acknowledgements and publish IDs are checkpointed. Instagram containers and Facebook video IDs are reconciled. An unknown outcome is held for attention rather than issuing another potentially duplicate publication. No distributed system can guarantee exactly-once side effects when a remote API does not expose an idempotency key or a recoverable ID; this app preserves uncertain jobs and their reserved quota for review.

`Check status` retains the original remote operation and reconciles it. `Retry` after a confirmed platform failure may start a fresh operation. An unknown initialization with no recoverable platform ID requires inspecting the platform and using Review outcome before retrying or intentionally creating a new post. Confirmed successes are never automatically reposted.

Deleting or changing a source video, revoking access, or exceeding a plan limit pauses work or marks it for attention. Reconnect/resolve the issue and retry the affected destination. Signing out does not stop background jobs. A request already accepted by a platform cannot be canceled from this app.

Sources are checked against Drive file ID, size, and checksum. Meta fetches a signed, expiring, destination-bound streaming URL; the gateway forwards ranges without persisting bytes. Drive originals are never made public. Resumable upload URLs and Google Picker access tokens are intentionally issued to the authenticated browser for their respective Google SDK flows; app secrets and refresh tokens never leave the server. Picker uses the limited `drive.file` grant.

## Billing

Stripe **test mode only** is enforced in server code, including webhook rejection of live events.

- Starter: $9/month, 4 active social accounts, 60 destination posts.
- Creator: $19/month, 10 accounts, 200 posts.
- Pro: $39/month, 25 accounts, 600 posts.

Drive does not count toward the social-account limit. Allowance is reserved atomically at dispatch, consumed on confirmed publication, and released on confirmed failure or cancellation before dispatch. The same destination is never counted twice. Suspended jobs with uncertain external effects retain their reservation. A new subscription period does not retroactively move a previous reservation.

Webhook signatures are verified and events deduplicated in the same transaction as entitlement updates. Current Stripe state is fetched for updates to handle out-of-order events. Expired/past-due subscriptions block publishing. Cancellation at period end preserves access until then. Downgrades retain connection records but require selecting active accounts within the new limit.

## Database migrations

`migrations/000_better_auth.generated.sql` is generated from the pinned Better Auth schema and reviewed. Remaining migrations define application records. `npm run migrate` applies checked-in SQL transactionally with an advisory migration lock. It does not silently generate production schema changes.

For a future Better Auth upgrade, generate against a development copy using `npm run migrate -- --generate-auth`, inspect the SQL, and commit the delta under a **new** numbered migration. Do not replace an already-applied migration. The generator writes `.local/better-auth-migration.sql`; copy the reviewed delta to a new numbered migration.

## Tests

The database integration tests require a dedicated PostgreSQL database whose name ends in `_test`. They intentionally recreate its public schema and never run against a production-named database.

```sh
createdb publisher_test
TEST_DATABASE_URL=postgresql://localhost/publisher_test npm test
TEST_DATABASE_URL=postgresql://localhost/publisher_test npm run test:e2e
npm run typecheck
npm run build
```

Set the database URL appropriate to your local PostgreSQL user/port. By default tests target `publisher_test` on localhost:55437. Run unit/integration tests before browser tests so the isolated schema exists. Install Chromium with `npx playwright install chromium` if needed. Browser tests use signed Better Auth sessions created only inside the test database, a local video fixture, and no real provider credentials. Provider protocol tests mock remote responses; they are not evidence of platform audit approval or a successful production upload.

## Deployment

See [docs/deployment.md](docs/deployment.md). Railway uses one public web service, one always-on worker, and PostgreSQL. No bucket or Redis service is required. Hosting, database, and network-transfer costs still apply.

## Operations

`GET /api/health` reports database and worker heartbeat health; it returns 503 if the worker is stale. Keep this as a stack health check rather than a web-only startup check. Monitor failed/attention jobs, stale worker heartbeats, due jobs that are not progressing, and Stripe webhook delivery. See [docs/operations.md](docs/operations.md) for SQL diagnostics and recovery guidance.
