# Railway deployment

Deployment needs an authenticated Railway account and a project. No Railway credentials are bundled in the repository.

1. Push this repository to your own Git provider and create a Railway project.
2. Add PostgreSQL. Use Railway's private database URL in both services. Enable a backup policy suitable for your launch and budget.
3. Add a worker service from this repository; select `railway.worker.toml` as its config file. It uses `Dockerfile.worker`, runs checked-in migrations as a pre-deploy command, then starts the durable scheduler. Do not enable sleeping/serverless mode.
4. Add a web service from the same repository; select `railway.web.toml`. The final stage of `Dockerfile` is the web image and runs `node server.js`.
5. Configure the secrets from `.env.example` in Railway variables, scoped to the correct environment. Both services need the same integration keys, database URL, app origin, encryption key, and review flags. Billing keys are needed by web. Keep review flags false initially.
6. Give only the web service a public domain. Set `BETTER_AUTH_URL` to its exact HTTPS origin on both services, and register all callback URLs with providers.
7. Deploy the worker first so migrations complete, then deploy the web service. Never expose the database or worker publicly.
8. Confirm `/api/health` reports `database: true, worker: true`. This endpoint is intentionally a whole-stack check; it should not gate initial web deployment while the worker is still starting.
9. Test Google login and dedicated publishing-account connections (implicit identity linking stays disabled) on the final domain. Check private media streaming, HTTP ranges, large uploads, billing test checkout, and a scheduled post with the browser closed.

CLI equivalent after creating/linking services: authenticate with `railway login`, use `railway link`, select the relevant service, and deploy with `railway up`. The dashboard config-file paths must be configured per service; uploading the repository alone does not create all three services.

## Rollback

Keep code changes backwards compatible with existing stored job states. Pause dispatch before a migration that changes job semantics. Roll back the service image independently of the database; do not reverse already-applied migrations blindly. Pending queue records and upload state remain in PostgreSQL.

## Storage and scaling

There is no permanent video store. Browser-to-Drive uploads go directly to Google. Workers/gateway stream bounded chunks and byte ranges. The worker runs up to three jobs concurrently; tune concurrency against API limits, database pool capacity, and outbound bandwidth. Keep advisory locking in place when adding worker replicas. Exactly simultaneous public appearance on different platforms is not promised.

## Acceptance record

Complete the [staging gate](lifecycle/06-staging.md), record exact runtime/image versions under the [dependency policy](engineering/dependencies.md), and update the [release acceptance report](release/acceptance-report.md). Configuration files alone do not prove deployability, restore safety, or production acceptance.
