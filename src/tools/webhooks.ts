import { z } from "zod";
import { defineTool, teamIdParam, teamSlugParam, scopeParams } from "../types.js";

const WEBHOOK_EVENTS = [
  "deployment.created",
  "deployment.succeeded",
  "deployment.ready",
  "deployment.promoted",
  "deployment.canceled",
  "deployment.error",
  "deployment.check-rerequested",
  "project.created",
  "project.removed",
  "domain.created",
  "integration-configuration.permission-upgraded",
  "integration-configuration.removed",
  "integration-configuration.scope-change-confirmed",
] as const;

export const webhookTools = [
  defineTool({
    name: "list_webhooks",
    description: "List webhooks configured in the account/team.",
    schema: z.object({
      projectId: z.string().optional().describe("Filter webhooks by project id."),
      teamId: teamIdParam,
      slug: teamSlugParam,
    }),
    handler: async (args, client) => {
      const params: Record<string, unknown> = { ...scopeParams(args) };
      if (args.projectId) params.projectId = args.projectId;
      return client.get(`/v1/webhooks`, { params });
    },
  }),

  defineTool({
    name: "create_webhook",
    description:
      "Create a webhook that POSTs to your endpoint on the chosen events. Optionally scope it to projects.",
    write: true,
    schema: z.object({
      url: z.string().describe("HTTPS endpoint that will receive events."),
      events: z.array(z.enum(WEBHOOK_EVENTS)).min(1).describe("Events to subscribe to."),
      projectIds: z.array(z.string()).optional().describe("Limit to specific project ids."),
      teamId: teamIdParam,
      slug: teamSlugParam,
    }),
    handler: async (args, client) => {
      const { teamId, slug, ...body } = args;
      return client.post(`/v1/webhooks`, { params: scopeParams(args), body });
    },
  }),

  defineTool({
    name: "delete_webhook",
    description: "Delete a webhook by id.",
    write: true,
    schema: z.object({
      id: z.string().describe("Webhook id."),
      teamId: teamIdParam,
      slug: teamSlugParam,
    }),
    handler: async (args, client) => {
      await client.del(`/v1/webhooks/${encodeURIComponent(args.id)}`, {
        params: scopeParams(args),
      });
      return { deleted: true, id: args.id };
    },
  }),
];
