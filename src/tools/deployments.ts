import { z } from "zod";
import { defineTool, teamIdParam, teamSlugParam, scopeParams, limitParam } from "../types.js";

export const deploymentTools = [
  defineTool({
    name: "list_deployments",
    description:
      "List deployments, most recent first. Filter by project, target (production/preview), " +
      "state, or time window. Use this to see deploy history and find a deployment id.",
    schema: z.object({
      projectId: z.string().optional().describe("Filter by project id or name."),
      target: z.enum(["production", "preview"]).optional().describe("Filter by deploy target."),
      state: z
        .string()
        .optional()
        .describe("Comma-separated states: BUILDING, ERROR, INITIALIZING, QUEUED, READY, CANCELED."),
      app: z.string().optional().describe("Filter by deployment app name."),
      since: z.number().optional().describe("Only deployments created after this timestamp (ms)."),
      until: z.number().optional().describe("Only deployments created before this timestamp (ms)."),
      limit: limitParam,
      teamId: teamIdParam,
      slug: teamSlugParam,
    }),
    handler: async (args, client) => {
      const { teamId, slug, ...rest } = args;
      return client.get(`/v6/deployments`, { params: { ...rest, ...scopeParams(args) } });
    },
  }),

  defineTool({
    name: "get_deployment",
    description: "Get full details of one deployment by id or URL (state, build, meta, aliases).",
    schema: z.object({
      idOrUrl: z.string().describe("Deployment id (dpl_...) or its URL."),
      teamId: teamIdParam,
      slug: teamSlugParam,
    }),
    handler: async (args, client) =>
      client.get(`/v13/deployments/${encodeURIComponent(args.idOrUrl)}`, {
        params: scopeParams(args),
      }),
  }),

  defineTool({
    name: "create_deployment",
    description:
      "Create a new deployment. The simplest path is to deploy from a connected Git source: " +
      "pass `name` (project) and a `gitSource` ({ type, repoId/org+repo, ref }). For file-based " +
      "deploys, provide `files`. For most workflows the /vercel CLI skill is easier — use this when " +
      "you need API-driven, headless deploys.",
    write: true,
    schema: z.object({
      name: z.string().describe("Project name this deployment belongs to."),
      project: z.string().optional().describe("Project id (if different from name)."),
      target: z.enum(["production", "preview", "staging"]).optional().describe("Deploy target."),
      gitSource: z
        .record(z.any())
        .optional()
        .describe(
          "Git source, e.g. { type: 'github', repoId: 123, ref: 'main' } or { type:'github', org, repo, ref }."
        ),
      files: z
        .array(z.record(z.any()))
        .optional()
        .describe("Inline files [{ file, data }] for file-based deploys."),
      meta: z.record(z.any()).optional().describe("Arbitrary metadata key/values."),
      projectSettings: z.record(z.any()).optional().describe("Override project build settings."),
      teamId: teamIdParam,
      slug: teamSlugParam,
    }),
    handler: async (args, client) => {
      const { teamId, slug, ...body } = args;
      return client.post(`/v13/deployments`, { params: scopeParams(args), body });
    },
  }),

  defineTool({
    name: "cancel_deployment",
    description: "Cancel an in-progress (BUILDING/QUEUED) deployment.",
    write: true,
    schema: z.object({
      id: z.string().describe("Deployment id (dpl_...)."),
      teamId: teamIdParam,
      slug: teamSlugParam,
    }),
    handler: async (args, client) =>
      client.patch(`/v12/deployments/${encodeURIComponent(args.id)}/cancel`, {
        params: scopeParams(args),
      }),
  }),

  defineTool({
    name: "delete_deployment",
    description: "Delete a deployment by id (or by URL via the `url` param).",
    write: true,
    schema: z.object({
      id: z.string().describe("Deployment id (dpl_...)."),
      url: z.string().optional().describe("Optionally delete by deployment URL instead."),
      teamId: teamIdParam,
      slug: teamSlugParam,
    }),
    handler: async (args, client) => {
      const params: Record<string, unknown> = { ...scopeParams(args) };
      if (args.url) params.url = args.url;
      return client.del(`/v13/deployments/${encodeURIComponent(args.id)}`, { params });
    },
  }),

  defineTool({
    name: "get_deployment_events",
    description:
      "Get the build/runtime event log of a deployment (this is where build logs and errors live). " +
      "Use to diagnose failed builds and runtime bugs. Returns log lines with text, type and timestamps.",
    schema: z.object({
      idOrUrl: z.string().describe("Deployment id (dpl_...) or URL."),
      builds: z.boolean().optional().describe("Include build events. Default true."),
      direction: z.enum(["forward", "backward"]).optional().describe("Log order."),
      limit: limitParam,
      since: z.number().optional().describe("Events after this timestamp (ms)."),
      until: z.number().optional().describe("Events before this timestamp (ms)."),
      teamId: teamIdParam,
      slug: teamSlugParam,
    }),
    handler: async (args, client) => {
      const { idOrUrl, teamId, slug, ...rest } = args;
      return client.get(`/v3/deployments/${encodeURIComponent(idOrUrl)}/events`, {
        params: { ...rest, ...scopeParams(args) },
      });
    },
  }),

  defineTool({
    name: "list_deployment_files",
    description: "List the file tree of a deployment.",
    schema: z.object({
      id: z.string().describe("Deployment id (dpl_...)."),
      teamId: teamIdParam,
      slug: teamSlugParam,
    }),
    handler: async (args, client) =>
      client.get(`/v6/deployments/${encodeURIComponent(args.id)}/files`, {
        params: scopeParams(args),
      }),
  }),

  defineTool({
    name: "get_deployment_file_contents",
    description: "Get the contents of a single file within a deployment by file id.",
    schema: z.object({
      id: z.string().describe("Deployment id (dpl_...)."),
      fileId: z.string().describe("File id (from list_deployment_files)."),
      teamId: teamIdParam,
      slug: teamSlugParam,
    }),
    handler: async (args, client) =>
      client.get(
        `/v7/deployments/${encodeURIComponent(args.id)}/files/${encodeURIComponent(args.fileId)}`,
        { params: scopeParams(args) }
      ),
  }),

  defineTool({
    name: "promote_deployment",
    description:
      "Promote an existing deployment to production for a project (instant promotion, no rebuild). " +
      "This is how you ship a previously-built preview to prod.",
    write: true,
    schema: z.object({
      projectId: z.string().describe("Project id or name."),
      deploymentId: z.string().describe("Deployment id to promote (dpl_...)."),
      teamId: teamIdParam,
      slug: teamSlugParam,
    }),
    handler: async (args, client) =>
      client.post(
        `/v10/projects/${encodeURIComponent(args.projectId)}/promote/${encodeURIComponent(args.deploymentId)}`,
        { params: scopeParams(args) }
      ),
  }),

  defineTool({
    name: "rollback_deployment",
    description:
      "Roll a project's production back to a previous deployment (instant rollback). " +
      "Pass the deployment id you want to roll back to.",
    write: true,
    schema: z.object({
      projectId: z.string().describe("Project id or name."),
      deploymentId: z.string().describe("Deployment id to roll back to (dpl_...)."),
      teamId: teamIdParam,
      slug: teamSlugParam,
    }),
    handler: async (args, client) =>
      client.post(
        `/v9/projects/${encodeURIComponent(args.projectId)}/rollback/${encodeURIComponent(args.deploymentId)}`,
        { params: scopeParams(args) }
      ),
  }),

  defineTool({
    name: "get_promote_aliases",
    description:
      "Check the status of the most recent promote/rollback for a project (which aliases were assigned).",
    schema: z.object({
      projectId: z.string().describe("Project id or name."),
      teamId: teamIdParam,
      slug: teamSlugParam,
    }),
    handler: async (args, client) =>
      client.get(`/v1/projects/${encodeURIComponent(args.projectId)}/promote/aliases`, {
        params: scopeParams(args),
      }),
  }),
];
