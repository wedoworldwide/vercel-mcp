# Quality & Security Review — Vercel MCP Pro v1.0.0

**Date:** 2026-06-09
**Reviewers:** automated code-reviewer + security-reviewer agents (>80% confidence threshold)

## Executive summary

| Dimension | Status | Findings |
|-----------|--------|----------|
| Security (code) | ✅ | 0 critical · 4 medium (hardened/documented) · 4 low |
| Code quality | ✅ | 0 critical · 0 high · 2 medium (fixed) · 3 low |
| MCP patterns | ✅ | Consistent across all 70 tools |
| Documentation | ✅ | README + explicit security model |

## Certification: 🏆 Approved for production

No critical or high findings in the code. The only critical item was operational
(a live token pasted during the session) — addressed by rotating the token; the
`.env` holding it is gitignored and never committed.

## Fixed in this release

- `bulk_create_env_vars` now supports `upsert` (avoided whole-batch failure on re-sync) + `.max(100)`
- `encodeURIComponent` standardized on **every** user-derived path segment (deployments, aliases, checks, dns, env, certs, edge-config, webhooks, log-drains)
- `assertSafeRawPath` hardened: requires a version segment (`/vN/…`), blocks backslashes and control chars (defense-in-depth vs SSRF / internal endpoints)
- README "Security model" section: readonly does not block secret reads; `VERCEL_TEAM_ID` is a scope, not a boundary; token = production credential
- More robust error fallback in `index.ts` (no `[object Object]`)

## Validated strengths

- Resilient client (backoff + jitter, `Retry-After`, retry on 5xx/network); `withScope` never duplicates `teamId`
- Actionable error handling with per-status hints (401/403/404/429)
- Fail-safe readonly gate; `vercel_raw` GET allowed safely
- Endpoint versions checked one by one against the live Vercel API
- No `exec`/`eval`/`fs` — no command/path injection surface; token only in the `Authorization` header

## Residual low-severity items (optional)

- Server `version` hardcoded vs `package.json` (refinement)
- Truncate API error detail; add `.max()` to more arrays
- Run `npm audit` in the release flow

## Security model (by design — documented, not bugs)

- Readonly blocks mutations, not reads of secrets (`list_env_vars` decrypt, `get_env_var`, `get_edge_config_items`).
- `VERCEL_TEAM_ID` is a default scope; the real boundary is the token's own scope.
