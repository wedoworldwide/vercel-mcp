import { createMcpHandler } from 'mcp-handler';
import { fromJsonSchema, type JsonSchemaType } from '@modelcontextprotocol/server';

import { VercelClient } from '@/src/client.js';
import { allTools, rawTool } from '@/src/tools/index.js';
import { isRawReadOnly } from '@/src/tools/raw.js';
import { toListing, type AnyToolDef } from '@/src/types.js';

export const runtime = 'nodejs';
// Deployment creation and log fetches are the slow calls; the rest are sub-second.
export const maxDuration = 300;

type ToolResult = { content: Array<{ type: 'text'; text: string }>; isError?: boolean };

function ok(data: unknown): ToolResult {
  const text = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
  return { content: [{ type: 'text', text }] };
}

function fail(message: string): ToolResult {
  return { content: [{ type: 'text', text: message }], isError: true };
}

const flag = (name: string) => String(process.env[name] ?? '').toLowerCase() === 'true';

/**
 * Built per request rather than at module scope so a missing token surfaces as a
 * readable tool error instead of a cold-start crash that takes tools/list with it.
 */
function getClient(): VercelClient {
  const token = process.env.VERCEL_TOKEN ?? process.env.VERCEL_API_TOKEN ?? '';
  if (!token) throw new Error('VERCEL_TOKEN is not set on this deployment.');
  return new VercelClient({
    token,
    defaultTeamId: process.env.VERCEL_TEAM_ID,
    defaultTeamSlug: process.env.VERCEL_TEAM_SLUG,
    timeoutMs: process.env.VERCEL_TIMEOUT_MS ? Number(process.env.VERCEL_TIMEOUT_MS) : undefined,
    maxRetries: process.env.VERCEL_MAX_RETRIES ? Number(process.env.VERCEL_MAX_RETRIES) : undefined,
  });
}

/** Mirrors the stdio server's readonly gate: writes blocked, vercel_raw GETs still allowed. */
function blockedByReadonly(def: AnyToolDef, args: unknown): boolean {
  if (!flag('VERCEL_READONLY') || !def.write) return false;
  return !(def.name === 'vercel_raw' && isRawReadOnly(args ?? {}));
}

const activeTools: AnyToolDef[] = [
  ...allTools,
  ...(flag('VERCEL_DISABLE_RAW') ? [] : [rawTool as AnyToolDef]),
];

/**
 * The upstream tools carry Zod v3 schemas, while the handler's SDK speaks
 * Standard Schema. Reuse upstream's own zod-to-JSON-Schema conversion
 * (toListing) and bridge it with fromJsonSchema, so the hosted tool contract is
 * byte-identical to the stdio server's. Arguments are still validated against
 * the original Zod schema below, which is what produces the readable errors.
 */
function inputSchemaFor(def: AnyToolDef) {
  const { inputSchema } = toListing(def);
  const { $schema, ...rest } = inputSchema as Record<string, unknown>;
  return fromJsonSchema(rest as JsonSchemaType);
}

const mcpHandler = createMcpHandler((server) => {
  for (const def of activeTools) {
    server.registerTool(
      def.name,
      { description: def.description, inputSchema: inputSchemaFor(def) },
      async (args: unknown) => {
        if (blockedByReadonly(def, args)) {
          return fail(
            `Blocked: '${def.name}' is a write operation and VERCEL_READONLY=true on this deployment.`,
          );
        }
        const parsed = def.schema.safeParse(args ?? {});
        if (!parsed.success) {
          const issues = parsed.error.issues
            .map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
            .join('; ');
          return fail(`Invalid arguments for '${def.name}': ${issues}`);
        }
        try {
          return ok(await def.handler(parsed.data, getClient()));
        } catch (err) {
          return fail(err instanceof Error ? err.message : String(err));
        }
      },
    );
  }
}, {
  serverInfo: { name: 'vercel-mcp', version: '1.0.0' },
});

/**
 * Static bearer-token guard. ClickUp's "Authorization header" auth sends the
 * configured value verbatim, which may or may not carry a `Bearer ` prefix —
 * accept both so the connection cannot be configured subtly wrong.
 */
function extractToken(req: Request): string | null {
  const auth = req.headers.get('authorization');
  if (auth) {
    const m = auth.match(/^Bearer\s+(.+)$/i);
    return (m ? m[1] : auth).trim();
  }
  const custom = req.headers.get('x-mcp-token');
  return custom ? custom.trim() : null;
}

async function guarded(req: Request): Promise<Response> {
  const expected = process.env.MCP_AUTH_TOKEN;
  if (!expected) {
    return Response.json(
      { error: 'server_misconfigured', message: 'MCP_AUTH_TOKEN is not set' },
      { status: 500 },
    );
  }
  if (extractToken(req) !== expected) {
    return Response.json({ error: 'unauthorized' }, { status: 401 });
  }
  return mcpHandler(req);
}

export { guarded as GET, guarded as POST, guarded as DELETE };
