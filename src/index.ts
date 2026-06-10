#!/usr/bin/env node
import "dotenv/config";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ErrorCode,
  type CallToolResult,
} from "@modelcontextprotocol/sdk/types.js";
import { VercelClient } from "./client.js";
import { AnyToolDef, toListing, ok } from "./types.js";
import { allTools, rawTool } from "./tools/index.js";
import { isRawReadOnly } from "./tools/raw.js";

// ── Configuration from environment ──────────────────────────────────────────
const token = process.env.VERCEL_TOKEN ?? process.env.VERCEL_API_TOKEN ?? "";
const readonly = String(process.env.VERCEL_READONLY ?? "").toLowerCase() === "true";
const disableRaw = String(process.env.VERCEL_DISABLE_RAW ?? "").toLowerCase() === "true";

if (!token) {
  console.error(
    "[vercel-mcp-pro] VERCEL_TOKEN is not set. " +
      "Create one at https://vercel.com/account/settings/tokens."
  );
  process.exit(1);
}

const client = new VercelClient({
  token,
  defaultTeamId: process.env.VERCEL_TEAM_ID,
  defaultTeamSlug: process.env.VERCEL_TEAM_SLUG,
  timeoutMs: process.env.VERCEL_TIMEOUT_MS ? Number(process.env.VERCEL_TIMEOUT_MS) : undefined,
  maxRetries: process.env.VERCEL_MAX_RETRIES ? Number(process.env.VERCEL_MAX_RETRIES) : undefined,
});

// ── Assemble the active tool set ─────────────────────────────────────────────
const active: AnyToolDef[] = [...allTools];
if (!disableRaw) active.push(rawTool);

const byName = new Map<string, AnyToolDef>();
for (const t of active) {
  if (byName.has(t.name)) {
    console.error(`[vercel-mcp-pro] Duplicate tool name detected: ${t.name}`);
    process.exit(1);
  }
  byName.set(t.name, t);
}

const listing = active.map(toListing);

// ── Server ───────────────────────────────────────────────────────────────────
const server = new Server(
  { name: "vercel-mcp-pro", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: listing }));

server.setRequestHandler(CallToolRequestSchema, async (request): Promise<CallToolResult> => {
  const def = byName.get(request.params.name);
  if (!def) {
    throw new McpError(ErrorCode.MethodNotFound, `Tool not found: ${request.params.name}`);
  }

  const rawArgs = request.params.arguments ?? {};

  // Readonly gate — block writes, but always allow vercel_raw GETs.
  if (readonly && def.write) {
    const isRawGet = def.name === "vercel_raw" && isRawReadOnly(rawArgs);
    if (!isRawGet) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text:
              `Blocked: '${def.name}' is a write operation and VERCEL_READONLY=true. ` +
              `Unset VERCEL_READONLY to enable writes.`,
          },
        ],
      };
    }
  }

  // Validate args against the tool's Zod schema for actionable error messages.
  const parsed = def.schema.safeParse(rawArgs);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("; ");
    return {
      isError: true,
      content: [{ type: "text", text: `Invalid arguments for '${def.name}': ${issues}` }],
    };
  }

  try {
    const result = await def.handler(parsed.data, client);
    return ok(result) as CallToolResult;
  } catch (error: any) {
    const message =
      error?.message ??
      (typeof error === "string" ? error : JSON.stringify(error));
    return {
      isError: true,
      content: [{ type: "text", text: message }],
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(
    `[vercel-mcp-pro] ready — ${active.length} tools` +
      `${readonly ? " (READONLY)" : ""}${disableRaw ? " (raw disabled)" : ""}.`
  );
}

main().catch((err) => {
  console.error("[vercel-mcp-pro] fatal:", err);
  process.exit(1);
});
