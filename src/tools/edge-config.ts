import { z } from "zod";
import { defineTool, teamIdParam, teamSlugParam, scopeParams } from "../types.js";

export const edgeConfigTools = [
  defineTool({
    name: "list_edge_configs",
    description: "List all Edge Config stores in the account/team.",
    schema: z.object({
      teamId: teamIdParam,
      slug: teamSlugParam,
    }),
    handler: async (args, client) =>
      client.get(`/v1/edge-config`, { params: scopeParams(args) }),
  }),

  defineTool({
    name: "get_edge_config",
    description: "Get metadata for a single Edge Config store by id.",
    schema: z.object({
      edgeConfigId: z.string().describe("Edge Config id (ecfg_...)."),
      teamId: teamIdParam,
      slug: teamSlugParam,
    }),
    handler: async (args, client) =>
      client.get(`/v1/edge-config/${encodeURIComponent(args.edgeConfigId)}`, { params: scopeParams(args) }),
  }),

  defineTool({
    name: "get_edge_config_items",
    description: "Read all key/value items stored in an Edge Config.",
    schema: z.object({
      edgeConfigId: z.string().describe("Edge Config id (ecfg_...)."),
      teamId: teamIdParam,
      slug: teamSlugParam,
    }),
    handler: async (args, client) =>
      client.get(`/v1/edge-config/${encodeURIComponent(args.edgeConfigId)}/items`, { params: scopeParams(args) }),
  }),

  defineTool({
    name: "create_edge_config",
    description: "Create a new Edge Config store.",
    write: true,
    schema: z.object({
      slug: z.string().describe("Slug/name for the Edge Config store."),
      teamId: teamIdParam,
    }),
    handler: async (args, client) =>
      client.post(`/v1/edge-config`, {
        params: scopeParams({ teamId: args.teamId }),
        body: { slug: args.slug },
      }),
  }),

  defineTool({
    name: "update_edge_config_items",
    description:
      "Upsert/delete items in an Edge Config in one PATCH. Pass operations " +
      "[{ operation:'create'|'update'|'upsert'|'delete', key, value? }].",
    write: true,
    schema: z.object({
      edgeConfigId: z.string().describe("Edge Config id (ecfg_...)."),
      items: z
        .array(
          z.object({
            operation: z.enum(["create", "update", "upsert", "delete"]),
            key: z.string(),
            value: z.any().optional(),
          })
        )
        .min(1)
        .describe("Item operations to apply."),
      teamId: teamIdParam,
      slug: teamSlugParam,
    }),
    handler: async (args, client) =>
      client.patch(`/v1/edge-config/${encodeURIComponent(args.edgeConfigId)}/items`, {
        params: scopeParams(args),
        body: { items: args.items },
      }),
  }),

  defineTool({
    name: "delete_edge_config",
    description: "Delete an Edge Config store by id.",
    write: true,
    schema: z.object({
      edgeConfigId: z.string().describe("Edge Config id (ecfg_...)."),
      teamId: teamIdParam,
      slug: teamSlugParam,
    }),
    handler: async (args, client) => {
      await client.del(`/v1/edge-config/${encodeURIComponent(args.edgeConfigId)}`, { params: scopeParams(args) });
      return { deleted: true, edgeConfigId: args.edgeConfigId };
    },
  }),
];
