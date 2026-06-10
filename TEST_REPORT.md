# Test Report — Vercel MCP Pro v1.0.0

**Date:** 2026-06-09
**Environment:** Node 22 · Windows 11
**Server:** `node dist/index.js` (stdio, JSON-RPC)
**Account:** live Vercel account (`strat-aibr`, team scope), `VERCEL_READONLY` toggled per case

## Method

The server was driven over stdio with real JSON-RPC `initialize` + `tools/call`
requests against a live Vercel account. Read tools were executed end-to-end.
Destructive/mutating tools were **not** run against production resources — they
are validated by code + security review and by the shared client/readonly paths
that the executed tools already exercise.

## Results

| Tool | Status | Notes |
|------|--------|-------|
| `get_user` | ✅ OK | Returned authenticated user |
| `list_teams` | ✅ OK | 1 team |
| `get_team` | ✅ OK | Resolves by id/slug |
| `list_team_members` | ✅ OK | — |
| `list_projects` | ✅ OK | 5 real projects with full metadata |
| `get_project` | ✅ OK | By id/name |
| `list_deployments` | ✅ OK | Filtered by `projectId`, states returned |
| `get_deployment` | ✅ OK | — |
| `get_deployment_events` / `get_build_logs` / `get_runtime_logs` | ✅ OK | Events stream reachable |
| `list_env_vars` | ✅ OK | Returned env list shape |
| `list_domains` | ✅ OK | Account domains |
| `list_aliases` | ✅ OK | — |
| `list_edge_configs` | ✅ OK | — |
| `list_webhooks` | ✅ OK | — |
| `list_integrations` / `list_log_drains` | ✅ OK | — |
| `vercel_raw` (GET `/v2/user`) | ✅ OK | Escape hatch reaches the API with auto-auth |
| `vercel_raw` (GET `/etc/passwd`) | ✅ Blocked | Rejected: "path must begin with a version segment" |
| `delete_project` (under `VERCEL_READONLY=true`) | ✅ Blocked | Readonly gate blocked the write as designed |
| Write tools (`create_*`, `update_*`, `delete_*`, `promote_*`, `rollback_*`, `assign_alias`, `issue_cert`, …) | ☑️ Validated by review | Not executed against production; share the same validated client/scope/readonly paths |

## Summary

- **Read coverage executed live:** all listing/get tools across every category — ✅
- **Safety paths executed live:** readonly write-block ✅, raw path sanitizer ✅
- **Writes:** validated by code-reviewer + security-reviewer (no critical/high findings); not run against production by design
- **Server boot:** 70 tools listed over `tools/list`, zero duplicates

## Notes / known limitations

- `VERCEL_READONLY` blocks mutations, not reads of secrets (decrypted env reads run by design).
- `VERCEL_TEAM_ID` is a default scope, not a security boundary — use a scoped token.
- File-based `create_deployment` requires inline files; for `git push → deploy` use the bundled `/vercel` CLI skill.

See [REVIEW.md](REVIEW.md) for the full quality + security audit.
