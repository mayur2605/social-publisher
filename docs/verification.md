# Verification record

Validated locally on 2026-09-22.

| Check                                 | Result                                                                                                                      |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| TypeScript / production build         | Passed                                                                                                                      |
| Unit and PostgreSQL integration tests | 42 passed                                                                                                                   |
| Desktop and mobile browser tests      | 8 passed                                                                                                                    |
| Better Auth session validation        | Forged, expired, and revoked sessions rejected                                                                              |
| Draft workflow                        | Created, edited, scheduled, and canceled through the browser                                                                |
| Worker                                | pg-boss started and wrote a healthy heartbeat                                                                               |
| Streaming                             | Private Drive range forwarding tested with mocked provider responses                                                        |
| Platform adapters                     | YouTube resumption; Instagram container/publish; Facebook Video/Reels; TikTok upload/status protocols tested with mocks     |
| Billing                               | Signed events, replay, renewal/cancellation, historical events, and concurrent checkout reuse tested with Stripe HTTP mocks |
| Docker Compose configuration          | Parsed successfully using the installed docker-compose CLI                                                                  |

## Not yet verified externally

- Real Google sign-in and Drive uploads/imports: developer credentials are not configured.
- Actual posting to the four platforms and their review/audit approvals: developer accounts and authorized test accounts are needed.
- Stripe-hosted test checkout and portal: Stripe test account/price IDs are needed.
- Container image build/run: Docker daemon was unavailable during implementation; configuration was validated, and the standalone Node build was exercised locally.
- Railway deployment: CLI reported `Unauthorized. Please login with railway login`.

`npm run setup:check` lists missing variable names without printing secrets. See provider-setup.md and deployment.md for the remaining external setup.

Browser screenshots in the working copy's ignored `.local/` directory use test-only data and a small local video fixture. Tests run against a dedicated `_test` database and do not post to real social accounts.
