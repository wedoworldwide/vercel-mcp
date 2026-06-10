import { z } from "zod";
import { defineTool, teamIdParam, teamSlugParam, scopeParams } from "../types.js";

const ENV_TARGETS = ["production", "preview", "development"] as const;
const ENV_TYPES = ["plain", "secret", "encrypted", "sensitive", "system"] as const;

export const envTools = [
  defineTool({
    name: "list_env_vars",
    description:
      "List environment variables for a project. By default values are decrypted only where " +
      "your token allows. Use `decrypt:true` to request decrypted values.",
    schema: z.object({
      projectId: z.string().describe("Project id or name."),
      decrypt: z.boolean().optional().describe("Return decrypted values where permitted."),
      gitBranch: z.string().optional().describe("Filter to a specific preview git branch."),
      teamId: teamIdParam,
      slug: teamSlugParam,
    }),
    handler: async (args, client) => {
      const params: Record<string, unknown> = { ...scopeParams(args) };
      if (args.decrypt) params.decrypt = "true";
      if (args.gitBranch) params.gitBranch = args.gitBranch;
      return client.get(`/v9/projects/${encodeURIComponent(args.projectId)}/env`, { params });
    },
  }),

  defineTool({
    name: "get_env_var",
    description: "Get a single environment variable (and its decrypted value where allowed) by id.",
    schema: z.object({
      projectId: z.string().describe("Project id or name."),
      envId: z.string().describe("Environment variable id."),
      teamId: teamIdParam,
      slug: teamSlugParam,
    }),
    handler: async (args, client) =>
      client.get(
        `/v1/projects/${encodeURIComponent(args.projectId)}/env/${encodeURIComponent(args.envId)}`,
        { params: scopeParams(args) }
      ),
  }),

  defineTool({
    name: "create_env_var",
    description:
      "Create an environment variable on a project. `target` is which environments it applies to " +
      "(production/preview/development). `type` defaults to 'encrypted'.",
    write: true,
    schema: z.object({
      projectId: z.string().describe("Project id or name."),
      key: z.string().describe("Variable name, e.g. API_KEY."),
      value: z.string().describe("Variable value."),
      target: z
        .array(z.enum(ENV_TARGETS))
        .min(1)
        .describe("Environments this var applies to."),
      type: z.enum(ENV_TYPES).optional().describe("Variable type. Default encrypted."),
      gitBranch: z.string().nullable().optional().describe("Limit to a specific preview branch."),
      comment: z.string().optional().describe("Optional note."),
      teamId: teamIdParam,
      slug: teamSlugParam,
    }),
    handler: async (args, client) => {
      const { projectId, teamId, slug, ...body } = args;
      return client.post(`/v10/projects/${encodeURIComponent(projectId)}/env`, {
        params: scopeParams(args),
        body,
      });
    },
  }),

  defineTool({
    name: "bulk_create_env_vars",
    description:
      "Create multiple environment variables in one call. Pass an array of " +
      "{ key, value, target, type?, gitBranch?, comment? } objects. Set upsert:true " +
      "to overwrite keys that already exist (otherwise existing keys cause a conflict).",
    write: true,
    schema: z.object({
      projectId: z.string().describe("Project id or name."),
      variables: z
        .array(
          z.object({
            key: z.string(),
            value: z.string(),
            target: z.array(z.enum(ENV_TARGETS)).min(1),
            type: z.enum(ENV_TYPES).optional(),
            gitBranch: z.string().nullable().optional(),
            comment: z.string().optional(),
          })
        )
        .min(1)
        .max(100)
        .describe("Env vars to create."),
      upsert: z
        .boolean()
        .optional()
        .describe("Overwrite existing keys instead of failing on conflict."),
      teamId: teamIdParam,
      slug: teamSlugParam,
    }),
    handler: async (args, client) => {
      const params: Record<string, unknown> = { ...scopeParams(args) };
      if (args.upsert) params.upsert = "true";
      return client.post(`/v10/projects/${encodeURIComponent(args.projectId)}/env`, {
        params,
        body: args.variables,
      });
    },
  }),

  defineTool({
    name: "update_env_var",
    description: "Update an existing environment variable (value, target, type, comment) by id.",
    write: true,
    schema: z.object({
      projectId: z.string().describe("Project id or name."),
      envId: z.string().describe("Environment variable id."),
      key: z.string().optional(),
      value: z.string().optional(),
      target: z.array(z.enum(ENV_TARGETS)).optional(),
      type: z.enum(ENV_TYPES).optional(),
      gitBranch: z.string().nullable().optional(),
      comment: z.string().optional(),
      teamId: teamIdParam,
      slug: teamSlugParam,
    }),
    handler: async (args, client) => {
      const { projectId, envId, teamId, slug, ...body } = args;
      return client.patch(
        `/v9/projects/${encodeURIComponent(projectId)}/env/${encodeURIComponent(envId)}`,
        { params: scopeParams(args), body }
      );
    },
  }),

  defineTool({
    name: "delete_env_var",
    description: "Delete an environment variable from a project by id.",
    write: true,
    schema: z.object({
      projectId: z.string().describe("Project id or name."),
      envId: z.string().describe("Environment variable id."),
      teamId: teamIdParam,
      slug: teamSlugParam,
    }),
    handler: async (args, client) => {
      await client.del(
        `/v9/projects/${encodeURIComponent(args.projectId)}/env/${encodeURIComponent(args.envId)}`,
        { params: scopeParams(args) }
      );
      return { deleted: true, envId: args.envId };
    },
  }),
];
