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

## Maintenance

Apply reviewed numbered migrations before deploying dependent code. Rotate tokens through reconnect flows; rotate app encryption keys only with a migration. Prune expired OAuth state and obsolete encrypted upload-session records periodically. Configure pg-boss retention according to operating needs. Keep database backups private and set documented retention. Monitor Stripe dashboard webhook delivery and replay failed events after fixing configuration.
