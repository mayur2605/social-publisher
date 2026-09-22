# Operational checks

## Stack health

`GET /api/health` checks PostgreSQL and the last worker heartbeat. Alert on a sustained 503 and restart/redeploy the worker after checking its logs. The worker reconnects to a durable queue and discovers due destination records after restart.

```sql
SELECT id, seen_at FROM worker_heartbeats;
SELECT d.id, d.status, d.error, d.attempts, d.consecutive_failures, d.updated_at, p.scheduled_at
FROM destinations d JOIN posts p ON p.id=d.post_id
WHERE d.status IN ('attention','failed','paused')
   OR (d.status IN ('scheduled','queued','processing')
       AND p.scheduled_at < now() - interval '10 minutes')
ORDER BY d.updated_at;
```

Logs intentionally exclude tokens, request bodies, upload URLs, and signed stream links. Destination records contain user-facing errors; provider response payloads are not dumped to server logs.

## Recovery

- **Expired grant:** reconnect the relevant account, activate it if necessary, then retry the paused destination.
- **Changed/missing file:** restore the original bytes, or import the replacement and create a new post. Do not silently publish a changed source.
- **Quota/payment pause:** resolve billing or wait for allowance renewal, then retry. Choose active accounts within the new limit after a downgrade.
- **Confirmed platform failure:** Retry can create another remote operation and reuse the destination's single quota record.
- **Uncertain result:** Check status preserves the remote ID and upload checkpoint. If the remote API provides no reliable reconciliation, inspect the actual channel and use Review outcome to explicitly confirm whether it was published. Never clear `upload_state` to force a retry without confirming no publication occurred.
- **Lost YouTube chunk acknowledgement:** the next worker pass probes the resumable upload offset.
- **Repeated provider outage:** up to twelve automatic retries use exponential backoff, capped at thirty minutes. Consecutive failures are tracked separately from upload chunks and status polls; a successful adapter step resets this budget. Duplicate queue deliveries respect the saved retry time. Exhaustion requires attention and retains any uncertain quota reservation. Explicit retry resets the error budget.
- **Lost TikTok chunk acknowledgement:** the platform publish status is checked; an unresolved partial upload is held for attention, since blind chunk replay is unsafe.

## Service inspection & container commands

### Coolify / Docker Compose (Primary Hetzner Stack)

Inspect live container logs and restart failed workers without interrupting the web app:

```bash
# View real-time logs for the background publisher worker
docker compose -f docker-compose.prod.yml logs -f worker

# View web server logs
docker compose -f docker-compose.prod.yml logs -f web

# Restart the worker process (pg-boss reconnects and discovers pending jobs)
docker compose -f docker-compose.prod.yml restart worker

# Manual database backup
docker exec -t social-publisher-db pg_dump -U postgres publisher > backup_$(date +%Y%m%d).sql

# Monitor host network throughput against the 20 TB monthly limit
vnstat -m
```

### Railway (Managed PaaS Alternative)

```bash
# View service logs via Railway CLI
railway logs --service worker
railway logs --service web

# Restart worker service
railway restart --service worker
```

## Maintenance

Apply reviewed numbered migrations before deploying dependent code. Rotate tokens through reconnect flows; rotate app encryption keys only with a migration. Prune expired OAuth state and obsolete encrypted upload-session records periodically. Configure pg-boss retention according to operating needs. Keep database backups private (automated daily snapshots to Cloudflare R2 / AWS S3 on Coolify, or Railway automated backups) and set documented retention. Monitor Stripe dashboard webhook delivery and replay failed events after fixing configuration. Monitor VPS egress metrics in Hetzner Cloud Console to ensure bandwidth stays within the 20 TB tier allowance.

## Supporting controls

Use the [production operating model](lifecycle/08-production-operations.md) for ownership and cadence, the [Hetzner + Coolify runbook](deployment-hetzner-coolify.md) and [Railway deployment guide](deployment.md) for deployment steps, the [threat model](security/threat-model.md) for remaining assurance, and the [policy decisions](release/policy-decisions.md) for retention scope. No external alerts or cleanup schedules are created by these documents.
