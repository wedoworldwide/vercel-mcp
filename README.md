# Vercel MCP Pro ▲

> The most complete **Vercel** MCP server — **70 tools** covering the entire Vercel REST API (deployments, projects, env vars, domains, DNS, aliases, certs, logs, checks, webhooks, edge config, teams) plus a `vercel_raw` escape hatch and a **readonly** safety mode.

[![npm version](https://img.shields.io/npm/v/vercel-mcp-pro.svg?style=flat-square)](https://www.npmjs.com/package/vercel-mcp-pro)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)
[![GitHub Stars](https://img.shields.io/github/stars/helbertparanhos/vercel-mcp-pro?style=flat-square)](https://github.com/helbertparanhos/vercel-mcp-pro/stargazers)
[![GitHub Forks](https://img.shields.io/github/forks/helbertparanhos/vercel-mcp-pro?style=flat-square)](https://github.com/helbertparanhos/vercel-mcp-pro/network/members)
[![GitHub Issues](https://img.shields.io/github/issues/helbertparanhos/vercel-mcp-pro?style=flat-square)](https://github.com/helbertparanhos/vercel-mcp-pro/issues)
[![Glama Quality](https://glama.ai/mcp/servers/helbertparanhos/vercel-mcp-pro/badges/score.svg)](https://glama.ai/mcp/servers/helbertparanhos/vercel-mcp-pro)

[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![MCP](https://img.shields.io/badge/MCP-Model%20Context%20Protocol-000000?style=flat-square)](https://modelcontextprotocol.io/)
[![Claude Code](https://img.shields.io/badge/Claude%20Code-D97706?style=flat-square)](https://claude.ai/code)
[![Cursor](https://img.shields.io/badge/Cursor-Compatible-4F46E5?style=flat-square)](https://cursor.sh)
[![Claude Desktop](https://img.shields.io/badge/Claude%20Desktop-Compatible-D97706?style=flat-square)](https://claude.ai/download)

[![Instagram](https://img.shields.io/badge/@helbertparanhos-E4405F?style=flat-square&logo=instagram&logoColor=white)](https://www.instagram.com/helbertparanhos)
[![YouTube](https://img.shields.io/badge/stratacademy-FF0000?style=flat-square&logo=youtube&logoColor=white)](https://www.youtube.com/@stratacademy)
[![LinkedIn](https://img.shields.io/badge/helbert--paranhos-0077B5?style=flat-square&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/helbert-paranhos/)
[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20A%20Coffee-FFDD00?style=flat-square&logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/helbertparanhos)
[![Strat Academy](https://img.shields.io/badge/Strat%20Academy-8B5CF6?style=flat-square)](https://stratacademy.com.br)

Works in **any MCP client** — Claude Code, Claude Desktop, Cursor, ChatGPT — using a Vercel access **token** (no OAuth flow required). Ships with an optional `/vercel` skill that drives the Vercel **CLI** for terminal deploys.

## Why this and not the official one?

| | Official `mcp.vercel.com` | **vercel-mcp-pro** |
|---|---|---|
| Auth | OAuth (approved clients only) | Token (works everywhere, self-hosted) |
| Coverage | Docs search, manage projects/deployments, analyze logs | **Full REST API**: env, domains, DNS, aliases, certs, webhooks, edge config, checks, log drains… |
| Escape hatch | — | `vercel_raw` → any endpoint, 100% coverage |
| Safety | — | `VERCEL_READONLY=true` blocks all writes |

## Install

```bash
npx -y vercel-mcp-pro
```

Or clone and build locally:

```bash
git clone https://github.com/helbertparanhos/vercel-mcp-pro
cd vercel-mcp-pro
npm install && npm run build
```

## Configuration

1. Create a token at **https://vercel.com/account/settings/tokens**.
2. Copy `.env.example` → `.env` and fill it in:

| Variable | Required | Description |
|----------|----------|-------------|
| `VERCEL_TOKEN` | ✅ | Personal or team access token. |
| `VERCEL_TEAM_ID` | — | Default team scope (injected as `?teamId`). Leave empty for personal account. |
| `VERCEL_TEAM_SLUG` | — | Scope by team slug (alternative to `VERCEL_TEAM_ID`). |
| `VERCEL_READONLY` | — | `true` blocks all write/delete tools (and only allows `vercel_raw` GETs). |
| `VERCEL_DISABLE_RAW` | — | `true` removes the `vercel_raw` escape hatch. |
| `VERCEL_TIMEOUT_MS` | — | Request timeout (default 60000). |
| `VERCEL_MAX_RETRIES` | — | Retries on 429/5xx/network (default 3). |

## Add to your client

### Claude Code

```bash
claude mcp add vercel-mcp-pro -- npx -y vercel-mcp-pro
```

Or in this project's `.claude/settings.json` → `mcpServers`:

```json
"vercel": {
  "command": "node",
  "args": ["projects/vercel-mcp-pro/dist/index.js"],
  "env": {
    "VERCEL_TOKEN": "your_token",
    "VERCEL_TEAM_ID": "team_xxx"
  }
}
```

### Claude Desktop

`%APPDATA%\Claude\claude_desktop_config.json` (Windows) / `~/Library/Application Support/Claude/claude_desktop_config.json` (Mac):

```json
{
  "mcpServers": {
    "vercel": {
      "command": "npx",
      "args": ["-y", "vercel-mcp-pro"],
      "env": { "VERCEL_TOKEN": "your_token", "VERCEL_TEAM_ID": "team_xxx" }
    }
  }
}
```

### Cursor

Paste the same config into `.cursor/mcp.json`.

## Tools (70)

### Deployments (11)
`list_deployments` · `get_deployment` · `create_deployment` · `cancel_deployment` · `delete_deployment` · `get_deployment_events` · `list_deployment_files` · `get_deployment_file_contents` · `promote_deployment` · `rollback_deployment` · `get_promote_aliases`

### Projects (7)
`list_projects` · `get_project` · `create_project` · `update_project` · `delete_project` · `pause_project` · `unpause_project`

### Environment Variables (6)
`list_env_vars` · `get_env_var` · `create_env_var` · `bulk_create_env_vars` · `update_env_var` · `delete_env_var`

### Domains (9)
`list_domains` · `get_domain` · `get_domain_config` · `add_domain` · `verify_domain` · `remove_domain` · `list_project_domains` · `add_project_domain` · `remove_project_domain`

### DNS (4)
`list_dns_records` · `create_dns_record` · `update_dns_record` · `delete_dns_record`

### Aliases (4)
`list_aliases` · `get_alias` · `assign_alias` · `delete_alias`

### Certificates (4)
`get_cert` · `issue_cert` · `upload_cert` · `remove_cert`

### Logs (2)
`get_build_logs` · `get_runtime_logs`

### Checks (5)
`list_checks` · `get_check` · `create_check` · `update_check` · `rerequest_check`

### Webhooks (3)
`list_webhooks` · `create_webhook` · `delete_webhook`

### Edge Config (6)
`list_edge_configs` · `get_edge_config` · `get_edge_config_items` · `create_edge_config` · `update_edge_config_items` · `delete_edge_config`

### Teams & User (4)
`get_user` · `list_teams` · `get_team` · `list_team_members`

### Integrations & Log Drains (4)
`list_integrations` · `list_log_drains` · `create_log_drain` · `delete_log_drain`

### Escape hatch (1)
`vercel_raw` — call **any** Vercel REST endpoint (method + full versioned path + params + body). Guarantees 100% coverage even for niche/new endpoints (marketplace, sandboxes, feature-flags, access-groups, rolling-release…). Auto-injects your team scope; honored by readonly mode for GETs.

## Common recipes

**Diagnose a failed deploy**
```
list_deployments(projectId:"my-app", state:"ERROR")  →  get_build_logs(idOrUrl:"dpl_...")
```

**Ship a preview to production (no rebuild)**
```
promote_deployment(projectId:"my-app", deploymentId:"dpl_...")
```

**Roll back fast**
```
rollback_deployment(projectId:"my-app", deploymentId:"dpl_previous")
```

**Add an env var to all environments**
```
create_env_var(projectId:"my-app", key:"API_KEY", value:"…", target:["production","preview","development"])
```

**Anything not covered**
```
vercel_raw(method:"GET", path:"/v1/security/firewall/config", params:{ projectId:"my-app" })
```

## The `/vercel` CLI skill (bundled)

For terminal-driven deploys, this repo also ships a Claude Code skill in [`skill/`](skill/) that drives the official **Vercel CLI** (`vercel deploy`, `vercel logs`, `vercel env`, `vercel rollback`). The MCP gives full API coverage in any client; the skill gives the smoothest `git push → deploy` loop in the terminal. They complement each other — see [`skill/SKILL.md`](skill/SKILL.md).

## Safety

- `VERCEL_READONLY=true` blocks every write/delete tool — only reads and `vercel_raw` GETs run. Ideal for audits and exploration.
- The `vercel_raw` path is sanitized (must start with a version segment like `/v9/…`; no scheme/host/traversal/control chars) and constrained to `api.vercel.com`.
- Auth, retries (429 with `Retry-After`, 5xx, network) and rate-limiting are handled for you. The token only ever travels in the `Authorization` header — never in a query string or log.

### Security model — read this before trusting the guards

- **`VERCEL_READONLY` blocks *mutations*, not *reads of secrets*.** Read tools like `list_env_vars` (with `decrypt:true`), `get_env_var` and `get_edge_config_items` return decrypted values and still run in readonly mode — that's their purpose. If your environment must never surface secrets to the model, don't expose those tools / run against a least-privilege token.
- **`VERCEL_TEAM_ID` is a convenience scope, not a security boundary.** It sets the default team, but a caller can pass a different `teamId`/`slug` per call (including via `vercel_raw`). The real boundary is the **token's own scope** — use a token limited to the team/projects you intend to automate.
- **Treat the token as production credentials.** It grants the same access as your Vercel account/team. Prefer a scoped token, keep it in `.env` (gitignored) or your client's secret store, and rotate it if it's ever shared or pasted into a chat.

## License

MIT © Helbert Paranhos / Strat Academy
