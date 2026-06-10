import { z, ZodTypeAny } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { VercelClient } from "./client.js";

/** MCP text content result. */
export interface ToolResult {
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
}

export type ToolHandler<S extends ZodTypeAny> = (
  args: z.infer<S>,
  client: VercelClient
) => Promise<unknown>;

export interface ToolDef<S extends ZodTypeAny = ZodTypeAny> {
  name: string;
  description: string;
  /** Marks the tool as a write operation — blocked when VERCEL_READONLY=true. */
  write?: boolean;
  schema: S;
  handler: ToolHandler<S>;
}

/**
 * Schema-erased view of a tool, used for heterogeneous collections/registries
 * where the precise Zod schema of each tool can't be tracked in the array type.
 */
export interface AnyToolDef {
  name: string;
  description: string;
  write?: boolean;
  schema: ZodTypeAny;
  handler: (args: any, client: VercelClient) => Promise<unknown>;
}

/**
 * Declares a tool. Centralizes the boilerplate so every tool file stays terse.
 * Handlers just return JS data; serialization to MCP text content is handled
 * by the registry.
 */
export function defineTool<S extends ZodTypeAny>(def: ToolDef<S>): ToolDef<S> {
  return def;
}

/** Build the MCP `tools` listing entry (name/description/inputSchema). */
export function toListing(def: AnyToolDef) {
  const jsonSchema = zodToJsonSchema(def.schema, { target: "jsonSchema7" });
  return {
    name: def.name,
    description: def.description,
    inputSchema: jsonSchema as Record<string, unknown>,
  };
}

/** Wrap arbitrary data into the MCP text-content result shape. */
export function ok(data: unknown): ToolResult {
  const text = typeof data === "string" ? data : JSON.stringify(data, null, 2);
  return { content: [{ type: "text", text }] };
}

// ── Shared Zod fragments ────────────────────────────────────────────────────

/** Explicit per-call team scope override (otherwise VERCEL_TEAM_ID is used). */
export const teamIdParam = z
  .string()
  .optional()
  .describe("Team ID to scope the request. Falls back to VERCEL_TEAM_ID when omitted.");

export const teamSlugParam = z
  .string()
  .optional()
  .describe("Team slug to scope the request (alternative to teamId).");

/** Merge explicit team scope params into a query object. */
export function scopeParams(args: { teamId?: string; slug?: string }): Record<string, unknown> {
  const p: Record<string, unknown> = {};
  if (args.teamId) p.teamId = args.teamId;
  if (args.slug) p.slug = args.slug;
  return p;
}

export const limitParam = z
  .number()
  .int()
  .positive()
  .optional()
  .describe("Maximum number of items to return.");
