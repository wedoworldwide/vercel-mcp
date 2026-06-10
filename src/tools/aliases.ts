import { z } from "zod";
import { defineTool, teamIdParam, teamSlugParam, scopeParams, limitParam } from "../types.js";

export const aliasTools = [
  defineTool({
    name: "list_aliases",
    description: "List aliases (custom URLs) in the account/team, optionally filtered by project.",
    schema: z.object({
      projectId: z.string().optional().describe("Filter aliases by project id."),
      limit: limitParam,
      teamId: teamIdParam,
      slug: teamSlugParam,
    }),
    handler: async (args, client) => {
      const { teamId, slug, ...rest } = args;
      return client.get(`/v4/aliases`, { params: { ...rest, ...scopeParams(args) } });
    },
  }),

  defineTool({
    name: "get_alias",
    description: "Get a single alias by id or alias name (e.g. my-app.vercel.app).",
    schema: z.object({
      idOrAlias: z.string().describe("Alias id or the alias hostname."),
      teamId: teamIdParam,
      slug: teamSlugParam,
    }),
    handler: async (args, client) =>
      client.get(`/v4/aliases/${encodeURIComponent(args.idOrAlias)}`, {
        params: scopeParams(args),
      }),
  }),

  defineTool({
    name: "assign_alias",
    description:
      "Assign an alias (hostname) to a deployment — points the custom URL at that deployment.",
    write: true,
    schema: z.object({
      deploymentId: z.string().describe("Deployment id (dpl_...) to alias."),
      alias: z.string().describe("Hostname to assign, e.g. app.example.com."),
      redirect: z.string().nullable().optional().describe("Optional redirect target."),
      teamId: teamIdParam,
      slug: teamSlugParam,
    }),
    handler: async (args, client) => {
      const body: Record<string, unknown> = { alias: args.alias };
      if (args.redirect !== undefined) body.redirect = args.redirect;
      return client.post(`/v2/deployments/${encodeURIComponent(args.deploymentId)}/aliases`, {
        params: scopeParams(args),
        body,
      });
    },
  }),

  defineTool({
    name: "delete_alias",
    description: "Remove an alias by id.",
    write: true,
    schema: z.object({
      aliasId: z.string().describe("Alias id."),
      teamId: teamIdParam,
      slug: teamSlugParam,
    }),
    handler: async (args, client) => {
      await client.del(`/v2/aliases/${encodeURIComponent(args.aliasId)}`, {
        params: scopeParams(args),
      });
      return { removed: true, aliasId: args.aliasId };
    },
  }),
];
