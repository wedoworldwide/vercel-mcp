import { z } from "zod";
import { defineTool, teamIdParam, teamSlugParam, scopeParams, limitParam } from "../types.js";

/**
 * Build logs and runtime logs both come from the deployment events stream
 * (/v3/deployments/{id}/events). These tools are thin, intent-named wrappers
 * so an agent can ask for "build logs" or "runtime logs" directly.
 */
export const logTools = [
  defineTool({
    name: "get_build_logs",
    description:
      "Get the BUILD logs of a deployment — what ran during the build and why it failed. " +
      "Use this first when a deployment is in ERROR state.",
    schema: z.object({
      idOrUrl: z.string().describe("Deployment id (dpl_...) or URL."),
      limit: limitParam,
      since: z.number().optional().describe("Logs after this timestamp (ms)."),
      until: z.number().optional().describe("Logs before this timestamp (ms)."),
      teamId: teamIdParam,
      slug: teamSlugParam,
    }),
    handler: async (args, client) => {
      const { idOrUrl, teamId, slug, ...rest } = args;
      return client.get(`/v3/deployments/${encodeURIComponent(idOrUrl)}/events`, {
        params: { builds: 1, ...rest, ...scopeParams(args) },
      });
    },
  }),

  defineTool({
    name: "get_runtime_logs",
    description:
      "Get RUNTIME logs/events of a deployment (serverless/edge function output, runtime errors). " +
      "Use to debug a deployment that built fine but misbehaves in production.",
    schema: z.object({
      idOrUrl: z.string().describe("Deployment id (dpl_...) or URL."),
      direction: z.enum(["forward", "backward"]).optional(),
      limit: limitParam,
      since: z.number().optional().describe("Logs after this timestamp (ms)."),
      until: z.number().optional().describe("Logs before this timestamp (ms)."),
      teamId: teamIdParam,
      slug: teamSlugParam,
    }),
    handler: async (args, client) => {
      const { idOrUrl, teamId, slug, ...rest } = args;
      return client.get(`/v3/deployments/${encodeURIComponent(idOrUrl)}/events`, {
        params: { builds: 0, ...rest, ...scopeParams(args) },
      });
    },
  }),
];
