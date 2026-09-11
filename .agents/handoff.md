# Handoff

## 2026-09-11 — hosted HTTP transport added

**What this fork is for.** Upstream `vercel-mcp-pro` is stdio-only. We needed a
remote MCP endpoint that ClickUp's Custom MCP can connect to, so this fork adds
a Next.js route at `/api/mcp` exposing the same 70 tools over Streamable HTTP.

**Deployed:** https://vercel-mcp-kappa.vercel.app/api/mcp (Vercel project
`vercel-mcp`, git-connected to this repo — pushes to `master` auto-deploy).

**Design decisions worth knowing before you change anything:**

- `src/` is deliberately untouched so the fork stays mergeable with upstream.
  The stdio entrypoint still builds via `npm run build:stdio`
  (`tsconfig.stdio.json` is the original upstream tsconfig).
- Tools are bridged, not rewritten. Upstream schemas are Zod v3;
  `@modelcontextprotocol/server` v2 speaks Standard Schema. Passing v3 shapes to
  `registerTool` fails to typecheck and to run. The route reuses upstream's
  `toListing()` JSON Schema output through `fromJsonSchema()`, then re-validates
  with the original Zod schema so argument errors stay readable.
- `next.config.mjs` sets `resolve.extensionAlias` for `.js` → `.ts`, because
  upstream's ESM specifiers (`./client.js`) point at TypeScript sources.
- Auth is a static bearer check accepting the token bare or `Bearer `-prefixed,
  plus `x-mcp-token`. ClickUp sends the configured header value verbatim.
- The server is stateless and SSE-framed. Do not make it session-stateful:
  ClickUp reports session-stateful or bare-JSON MCP servers as
  "Couldn't load tools".

**In flight / next session:**

- `VERCEL_TOKEN` is NOT set on the deployment. Tools return
  "VERCEL_TOKEN is not set on this deployment." until it is. It must be a
  team-scoped token created in the Vercel dashboard; the API refuses to mint
  tokens from a CLI OAuth session, and reusing the local CLI token was rejected
  as too broadly scoped for a network-reachable endpoint.
- The ClickUp Custom MCP connection has not been made (dashboard action).
- Untested end to end: deploying the WE•DO site via `create_deployment` and
  rolling it back with `rollback_deployment`. Blocked on the token above.
