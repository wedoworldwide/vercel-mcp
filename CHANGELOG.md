# Changelog

All notable changes to this project are documented here. Format based on
[Keep a Changelog](https://keepachangelog.com/); this project adheres to
[Semantic Versioning](https://semver.org/).

## [1.0.0] - 2026-06-09

### Added
- Initial release — **70 tools** covering the Vercel REST API:
  - **Deployments** (11): list, get, create, cancel, delete, events, files, file contents, promote, rollback, promote aliases
  - **Projects** (7): list, get, create, update, delete, pause, unpause
  - **Environment variables** (6): list, get, create, bulk create (with upsert), update, delete
  - **Domains** (9): account + project-scoped management, config, verify
  - **DNS** (4): list, create, update, delete records
  - **Aliases** (4): list, get, assign, delete
  - **Certificates** (4): get, issue, upload, remove
  - **Logs** (2): build logs, runtime logs
  - **Checks** (5): list, get, create, update, rerequest
  - **Webhooks** (3): list, create, delete
  - **Edge Config** (6): list, get, items, create, update items, delete
  - **Teams & User** (4): user, teams, team, members
  - **Integrations & Log Drains** (4): integrations, log drains CRUD
  - **`vercel_raw`** escape hatch for 100% API coverage
- `VERCEL_READONLY` safety mode (blocks writes; allows reads and `vercel_raw` GETs)
- Automatic team scoping via `VERCEL_TEAM_ID` / `VERCEL_TEAM_SLUG`
- Resilient client: retries on 429 (`Retry-After`), 5xx and network errors with exponential backoff + jitter
- Bundled `/vercel` Claude Code skill that drives the Vercel CLI for terminal deploys
- Configuration for Claude Code, Cursor and Claude Desktop

### Security
- `vercel_raw` path sanitization: requires a version segment, blocks scheme/host/traversal/control characters; host pinned to `api.vercel.com`
- Token travels only in the `Authorization` header (never in query strings or logs)
- Documented security model: readonly does not block secret reads; `VERCEL_TEAM_ID` is a scope, not a boundary
