# Application API reference

Version 1.0 · Reviewed 2026-09-22 · Application source baseline: `7265f91`

[openapi.json](openapi.json) describes all 21 app-owned route patterns and 23 method operations in [the application handler](../../src/lib/api.ts), including streaming GET/HEAD variants. It uses [OpenAPI 3.1](https://spec.openapis.org/oas/v3.1.0.html). Import the file into an OpenAPI viewer or client tool to inspect request and response schemas. This documentation change does not expose Swagger UI or add a new runtime endpoint.

## Authentication and request conventions

This is a same-origin browser API. Better Auth sets an HTTP-only session cookie: `better-auth.session_token` locally over HTTP, or `__Secure-better-auth.session_token` under the current HTTPS configuration. The two schemes in OpenAPI are alternatives. Do not construct session cookies yourself or put tokens in URLs. There is no supported public API-key or bearer-token authentication interface.

Authenticated mutations require `Origin` equal to the origin of `BETTER_AUTH_URL`. JSON request bodies use `Content-Type: application/json`. The API checks declared body length and then the text length against 100,000; this is not a streaming ingress limit. The Stripe webhook bypasses the application JSON helper and verifies its raw request body. Rate/ingress hardening is tracked in the [threat model](../security/threat-model.md).

JSON application responses use `Cache-Control: no-store`. Errors generally have `{ "error": "message" }`. Treat statuses and current resource state as authoritative; do not branch on exact message text. The OpenAPI shared errors describe possible application failures rather than a guarantee that every status occurs on every path. Database/SDK failures may become generic 500 errors.

## Better Auth boundary

`/api/auth/[...all]` delegates GET/POST to the installed Better Auth handler. The following app flows are used by the React client; their complete optional fields, errors, and enabled vendor routes belong to the locked library version, not the app-owned schema:

| Flow                   | Route                           | App usage and response                                                                                                             |
| ---------------------- | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Google sign-in         | POST `/api/auth/sign-in/social` | Client calls `signIn.social` with `provider: "google"` and callback URL; library creates the consent flow and redirect information |
| Google identity return | GET `/api/auth/callback/google` | Provider code/state/error handled by Better Auth; library validates consent, establishes session, and redirects                    |
| Current session        | GET `/api/auth/get-session`     | Client calls `useSession`; response contains session/user or null for no session                                                   |
| Sign out               | POST `/api/auth/sign-out`       | Client calls `signOut`; session revoked and cookie cleared; successful response includes `success: true`                           |

Missing core configuration returns application 503 before delegation. Library responses may include `code`/`message` errors and rate-limit responses rather than the app's `{error}` format. Keep the installed library and its client aligned through `package-lock.json`. Local sources reviewed include `node_modules/better-auth/dist/api/routes/{sign-in,session,sign-out,callback}.mjs` and cookie configuration.

This table is not an allowlist of all vendor routes. Audit the actually enabled account/profile/session endpoints before release, especially any user-deletion path that could bypass the app's billing/job deletion workflow. Do not assume disabling account linking disables every vendor endpoint. Future machine-readable auth coverage should be generated/reviewed from the installed library rather than guessed.

## Important contract details

- `PATCH /posts/:id` is a full editable-post replacement, not a partial field update. It returns **201** just like creation, and replaces destination records. Started publication cannot be edited.
- `POST /posts` has no client idempotency key. If its acknowledgement is lost, inspect the workspace before submitting again. Worker destination locking does not deduplicate separately created posts.
- Workspace returns up to 100 posts and 100 media; there is no pagination parameter yet. PostgreSQL bigint/count values are decimal strings. Timestamps are serialized ISO instants.
- Schedule timestamps include an offset and a separate chosen timezone. Schedule mode requires at least one minute of lead time; publish-now uses the server's current instant.
- Drafts can retain incomplete platform settings. Publish-now and scheduling validate eligibility/settings and subscription access server-side.
- Drive upload initiation returns a sensitive resumable capability; video bytes go directly to Drive. Picker configuration intentionally returns a scoped access token to the authenticated browser. Neither belongs in logs or analytics.
- Media endpoints support only a single `bytes=start-end` or `bytes=start-` range. Suffix/multipart ranges are unsupported. Invalid local syntax returns 416; upstream Drive failures can become 502. HEAD has no body even on an error.
- Signed source requests require both signature and expiry and a permitted destination state. They are not authenticated browser previews. Do not share them as permanent video links.
- `retry` preserves checkpoints for attention/paused destinations and clears them only after a confirmed failed state. Attention without a remote ID requires creator outcome review. `resolve` trusts the creator's explicit assertion; it is not independent platform verification.
- Stripe webhook signature verification needs the exact raw body. Valid signed replay is acknowledged without repeating entitlement changes. Live keys/events remain disabled.

## Safe local example

From the app's browser console after sign-in, this reads only the current user's workspace:

```js
const response = await fetch("/api/workspace", { credentials: "same-origin" });
const workspace = await response.json();
```

Use the UI for test mutations or a restricted test environment. Do not copy session secrets into sample commands or committed API collections. Example UUIDs in the [technical spec](../lifecycle/03-technical-specification.md) are illustrative and cannot access real records.

## Maintaining the contract

Validation on 2026-09-22 used Redocly CLI 2.53.3 (`lint --extends minimal docs/api/openapi.json`): zero errors, four design warnings. Three flag overlapping path templates; the implementation dispatches by route order and validates provider names/IDs. One expects a 2xx callback response even though this callback succeeds with a 302 redirect. These warnings are retained as documented route-design considerations, not hidden with fabricated responses.

For a handler/schema change, update the matching OpenAPI operation, response projection, error behavior, and lifecycle requirement. Resolve every `$ref` and validate the OpenAPI file before merge. Runtime validation still comes from the source's Zod/business rules: some cross-field/provider conditions are expressed in descriptions rather than JSON Schema. A valid OpenAPI document does not prove the implementation conforms; check representative responses and integration tests separately.
