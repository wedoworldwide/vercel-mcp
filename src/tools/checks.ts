import { z } from "zod";
import { defineTool, teamIdParam, teamSlugParam, scopeParams } from "../types.js";

/**
 * Checks are CI/quality gates attached to a deployment (e.g. Lighthouse,
 * tests). Useful for diagnosing why a deployment is blocked or flagged.
 */
export const checkTools = [
  defineTool({
    name: "list_checks",
    description: "List the checks (CI/quality gates) registered on a deployment.",
    schema: z.object({
      deploymentId: z.string().describe("Deployment id (dpl_...)."),
      teamId: teamIdParam,
      slug: teamSlugParam,
    }),
    handler: async (args, client) =>
      client.get(`/v1/deployments/${encodeURIComponent(args.deploymentId)}/checks`, {
        params: scopeParams(args),
      }),
  }),

  defineTool({
    name: "get_check",
    description: "Get a single check on a deployment by id (status, conclusion, output).",
    schema: z.object({
      deploymentId: z.string().describe("Deployment id (dpl_...)."),
      checkId: z.string().describe("Check id."),
      teamId: teamIdParam,
      slug: teamSlugParam,
    }),
    handler: async (args, client) =>
      client.get(`/v1/deployments/${encodeURIComponent(args.deploymentId)}/checks/${encodeURIComponent(args.checkId)}`, {
        params: scopeParams(args),
      }),
  }),

  defineTool({
    name: "create_check",
    description:
      "Register a new check on a deployment (for integrations that report CI/quality results).",
    write: true,
    schema: z.object({
      deploymentId: z.string().describe("Deployment id (dpl_...)."),
      name: z.string().describe("Check name."),
      blocking: z.boolean().describe("Whether this check blocks promotion to production."),
      detailsUrl: z.string().optional(),
      externalId: z.string().optional(),
      rerequestable: z.boolean().optional(),
      teamId: teamIdParam,
      slug: teamSlugParam,
    }),
    handler: async (args, client) => {
      const { deploymentId, teamId, slug, ...body } = args;
      return client.post(`/v1/deployments/${encodeURIComponent(deploymentId)}/checks`, {
        params: scopeParams(args),
        body,
      });
    },
  }),

  defineTool({
    name: "update_check",
    description: "Update a check's status, conclusion or output by id.",
    write: true,
    schema: z.object({
      deploymentId: z.string().describe("Deployment id (dpl_...)."),
      checkId: z.string().describe("Check id."),
      status: z.enum(["running", "completed"]).optional(),
      conclusion: z
        .enum(["canceled", "failed", "neutral", "succeeded", "skipped", "stale"])
        .optional(),
      detailsUrl: z.string().optional(),
      output: z.record(z.any()).optional().describe("Metrics/output object."),
      teamId: teamIdParam,
      slug: teamSlugParam,
    }),
    handler: async (args, client) => {
      const { deploymentId, checkId, teamId, slug, ...body } = args;
      return client.patch(
        `/v1/deployments/${encodeURIComponent(deploymentId)}/checks/${encodeURIComponent(checkId)}`,
        { params: scopeParams(args), body }
      );
    },
  }),

  defineTool({
    name: "rerequest_check",
    description: "Re-run a previously completed, rerequestable check by id.",
    write: true,
    schema: z.object({
      deploymentId: z.string().describe("Deployment id (dpl_...)."),
      checkId: z.string().describe("Check id."),
      teamId: teamIdParam,
      slug: teamSlugParam,
    }),
    handler: async (args, client) =>
      client.post(`/v1/deployments/${encodeURIComponent(args.deploymentId)}/checks/${encodeURIComponent(args.checkId)}/rerequest`, {
        params: scopeParams(args),
      }),
  }),
];
