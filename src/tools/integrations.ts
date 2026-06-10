import { z } from "zod";
import { defineTool, teamIdParam, teamSlugParam, scopeParams } from "../types.js";

/**
 * Integrations & log drains — connect/observe deployments with external systems.
 */
export const integrationTools = [
  defineTool({
    name: "list_integrations",
    description: "List installed integration configurations in the account/team.",
    schema: z.object({
      view: z.enum(["account", "project"]).optional().describe("Configuration view."),
      teamId: teamIdParam,
      slug: teamSlugParam,
    }),
    handler: async (args, client) => {
      const params: Record<string, unknown> = { ...scopeParams(args) };
      if (args.view) params.view = args.view;
      return client.get(`/v1/integrations/configurations`, { params });
    },
  }),

  defineTool({
    name: "list_log_drains",
    description: "List configurable log drains (where deployment logs are shipped).",
    schema: z.object({
      projectId: z.string().optional().describe("Filter by project id."),
      teamId: teamIdParam,
      slug: teamSlugParam,
    }),
    handler: async (args, client) => {
      const params: Record<string, unknown> = { ...scopeParams(args) };
      if (args.projectId) params.projectId = args.projectId;
      return client.get(`/v1/log-drains`, { params });
    },
  }),

  defineTool({
    name: "create_log_drain",
    description:
      "Create a configurable log drain that ships logs to your endpoint. Choose the sources " +
      "(build, edge, lambda, static, external) and delivery format.",
    write: true,
    schema: z.object({
      name: z.string().describe("Drain name."),
      url: z.string().describe("HTTPS endpoint to deliver logs to."),
      deliveryFormat: z.enum(["json", "ndjson", "syslog"]).optional(),
      sources: z
        .array(z.enum(["static", "lambda", "build", "edge", "external", "firewall"]))
        .min(1)
        .describe("Which log sources to drain."),
      projectIds: z.array(z.string()).optional().describe("Limit to specific projects."),
      headers: z.record(z.string()).optional().describe("Custom headers to send."),
      secret: z.string().optional().describe("Signing secret for verifying delivery."),
      teamId: teamIdParam,
      slug: teamSlugParam,
    }),
    handler: async (args, client) => {
      const { teamId, slug, ...body } = args;
      return client.post(`/v1/log-drains`, { params: scopeParams(args), body });
    },
  }),

  defineTool({
    name: "delete_log_drain",
    description: "Delete a configurable log drain by id.",
    write: true,
    schema: z.object({
      id: z.string().describe("Log drain id."),
      teamId: teamIdParam,
      slug: teamSlugParam,
    }),
    handler: async (args, client) => {
      await client.del(`/v1/log-drains/${encodeURIComponent(args.id)}`, {
        params: scopeParams(args),
      });
      return { deleted: true, id: args.id };
    },
  }),
];
