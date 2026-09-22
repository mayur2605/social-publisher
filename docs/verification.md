# Verification record

Validated locally on 2026-09-22.

| Check                                 | Result                                                                                                                      |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| TypeScript / production build         | Passed                                                                                                                      |
| Unit and PostgreSQL integration tests | 43 passed (including monthly bandwidth pool enforcement, 500 MB short-form caps, and Studio 10 GB limits)                   |
| Desktop and mobile browser tests      | 8 passed                                                                                                                    |
| Better Auth session validation        | Forged, expired, and revoked sessions rejected                                                                              |
| Draft workflow                        | Created, edited, scheduled, and canceled through the browser                                                                |
| Worker                                | pg-boss started and wrote a healthy heartbeat                                                                               |
| Streaming                             | Private Drive range forwarding tested with mocked provider responses                                                        |
| Platform adapters                     | YouTube resumption; Instagram container/publish; Facebook Video/Reels; TikTok upload/status protocols tested with mocks     |
| Billing                               | Signed events, replay, renewal/cancellation, historical events, and concurrent checkout reuse tested with Stripe HTTP mocks |
| Docker Compose configuration          | Parsed successfully using docker-compose CLI (`compose.yaml` and `docker-compose.prod.yml`)                                 |

## Not yet verified externally

- Real Google sign-in and Drive uploads/imports: developer credentials are not configured.
- Actual posting to the four platforms and their review/audit approvals: developer accounts and authorized test accounts are needed.
- Stripe-hosted test checkout and portal: Stripe test account/price IDs are needed.
- Container image build/run: Docker daemon was unavailable during implementation; configuration was validated, and the standalone Node build was exercised locally.
- Production deployment: Hetzner Cloud VPS + Coolify and Railway configurations prepared; external server provisioning and staging rehearsals pending.

`npm run setup:check` lists missing variable names without printing secrets. See provider-setup.md and deployment.md for the remaining external setup.

Browser screenshots in the working copy's ignored `.local/` directory use test-only data and a small local video fixture. Tests run against a dedicated `_test` database and do not post to real social accounts.

## Documentation and dependency review (2026-09-22)

The [documentation audit](documentation-audit.md) checks first-party docs against application source and the original plan. An npm advisory query returned zero known advisories at review time; see [dependency policy](engineering/dependencies.md) for scope and limitations. This documentation review reflects the verified 43 backend / 8 browser results above, and does not certify production readiness.
