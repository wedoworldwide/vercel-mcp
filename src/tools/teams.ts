import { z } from "zod";
import { defineTool, teamIdParam, teamSlugParam, scopeParams, limitParam } from "../types.js";

export const teamTools = [
  defineTool({
    name: "get_user",
    description: "Get the authenticated user (account behind VERCEL_TOKEN).",
    schema: z.object({}),
    handler: async (_args, client) => client.get(`/v2/user`, { scope: false }),
  }),

  defineTool({
    name: "list_teams",
    description: "List the teams the authenticated user belongs to.",
    schema: z.object({
      limit: limitParam,
    }),
    handler: async (args, client) =>
      client.get(`/v2/teams`, { params: { limit: args.limit }, scope: false }),
  }),

  defineTool({
    name: "get_team",
    description: "Get a single team by id or slug.",
    schema: z.object({
      teamId: teamIdParam,
      slug: teamSlugParam,
    }),
    handler: async (args, client) => {
      if (args.teamId) return client.get(`/v2/teams/${args.teamId}`, { scope: false });
      const params: Record<string, unknown> = {};
      if (args.slug) params.slug = args.slug;
      return client.get(`/v2/teams`, { params, scope: false });
    },
  }),

  defineTool({
    name: "list_team_members",
    description: "List the members of a team.",
    schema: z.object({
      limit: limitParam,
      teamId: teamIdParam,
      slug: teamSlugParam,
    }),
    handler: async (args, client) => {
      const id = args.teamId ?? client.defaultTeamId;
      if (!id) {
        throw new Error("teamId is required (or set VERCEL_TEAM_ID).");
      }
      return client.get(`/v2/teams/${id}/members`, {
        params: { limit: args.limit },
        scope: false,
      });
    },
  }),
];
