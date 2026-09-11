# Hosted deployment (Streamable HTTP)

This fork adds a hosted HTTP transport on top of the upstream stdio server so
remote MCP clients — ClickUp Custom MCP, in our case — can use the same 70 tools
without anything running on a laptop.

Upstream `src/` is untouched. The stdio server still builds and runs exactly as
before (`npm run build:stdio` → `dist/index.js`).

## What was added

| Path | Purpose |
|---|---|
| `app/api/mcp/route.ts` | The MCP endpoint. Registers every upstream tool and applies the auth guard. |
| `app/page.tsx`, `app/layout.tsx` | Minimal landing page so the deployment has a root route. |
| `next.config.mjs` | Resolves the upstream `./foo.js` ESM specifiers to their `.ts` sources. |
| `tsconfig.stdio.json` | The original upstream tsconfig, used by `build:stdio`. |

## How the tools are bridged

Upstream defines each tool with a **Zod v3** schema, while the hosted SDK
(`@modelcontextprotocol/server` v2) speaks Standard Schema. Rather than rewrite
70 schemas, the route reuses upstream's own `toListing()` (Zod → JSON Schema) and
feeds it through `fromJsonSchema()`. Arguments are then validated a second time
against the original Zod schema, which is what produces the actionable
`Invalid arguments for 'x': field: message` errors.

The upshot: the hosted tool contract is identical to the stdio one, and adding a
tool upstream requires no change here.

## Environment variables

| Variable | Required | Notes |
|---|---|---|
| `VERCEL_TOKEN` | yes | Vercel API token. Scope it to the team, not the personal account. |
| `MCP_AUTH_TOKEN` | yes | Shared secret clients send in `Authorization`. Requests without it get a 401. |
| `VERCEL_TEAM_ID` | recommended | Default team scope for every call. |
| `VERCEL_READONLY` | no | `true` blocks all write tools (GET-only `vercel_raw` still allowed). |
| `VERCEL_DISABLE_RAW` | no | `true` removes the `vercel_raw` escape hatch from the tool list. |

## Connecting from ClickUp

Add a Custom MCP with URL `https://<deployment>/api/mcp` and "Authorization
header" auth set to the `MCP_AUTH_TOKEN` value. The guard accepts the value bare
or with a `Bearer ` prefix, so either configuration works.

Responses are SSE-framed and the server is stateless (no `mcp-session-id`), which
is what ClickUp requires — a bare-JSON or session-stateful server shows up there
as "Couldn't load tools".
