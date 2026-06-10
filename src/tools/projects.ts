import { z } from "zod";
import { defineTool, teamIdParam, teamSlugParam, scopeParams, limitParam } from "../types.js";

export const projectTools = [
  defineTool({
    name: "list_projects",
    description: "List projects in the account/team. Optionally filter by name or repo.",
    schema: z.object({
      search: z.string().optional().describe("Filter by project name substring."),
      repoUrl: z.string().optional().describe("Filter by connected Git repo URL."),
      limit: limitParam,
      teamId: teamIdParam,
      slug: teamSlugParam,
    }),
    handler: async (args, client) => {
      const { teamId, slug, ...rest } = args;
      return client.get(`/v9/projects`, { params: { ...rest, ...scopeParams(args) } });
    },
  }),

  defineTool({
    name: "get_project",
    description: "Get a project's full configuration by id or name.",
    schema: z.object({
      idOrName: z.string().describe("Project id or name."),
      teamId: teamIdParam,
      slug: teamSlugParam,
    }),
    handler: async (args, client) =>
      client.get(`/v9/projects/${encodeURIComponent(args.idOrName)}`, {
        params: scopeParams(args),
      }),
  }),

  defineTool({
    name: "create_project",
    description:
      "Create a new project. Optionally connect a Git repo via `gitRepository` " +
      "({ type:'github', repo:'org/name' }) and set the framework/build settings.",
    write: true,
    schema: z.object({
      name: z.string().describe("Project name (lowercase, hyphenated)."),
      framework: z.string().nullable().optional().describe("Framework preset, e.g. 'nextjs'."),
      gitRepository: z
        .record(z.any())
        .optional()
        .describe("Connect a repo: { type:'github'|'gitlab'|'bitbucket', repo:'org/name' }."),
      buildCommand: z.string().nullable().optional(),
      devCommand: z.string().nullable().optional(),
      installCommand: z.string().nullable().optional(),
      outputDirectory: z.string().nullable().optional(),
      rootDirectory: z.string().nullable().optional(),
      environmentVariables: z
        .array(z.record(z.any()))
        .optional()
        .describe("Initial env vars [{ key, value, type, target }]."),
      teamId: teamIdParam,
      slug: teamSlugParam,
    }),
    handler: async (args, client) => {
      const { teamId, slug, ...body } = args;
      return client.post(`/v11/projects`, { params: scopeParams(args), body });
    },
  }),

  defineTool({
    name: "update_project",
    description:
      "Update a project's settings (name, framework, build/install/dev commands, " +
      "root/output directory, node version, etc.).",
    write: true,
    schema: z.object({
      idOrName: z.string().describe("Project id or name."),
      name: z.string().optional(),
      framework: z.string().nullable().optional(),
      buildCommand: z.string().nullable().optional(),
      devCommand: z.string().nullable().optional(),
      installCommand: z.string().nullable().optional(),
      outputDirectory: z.string().nullable().optional(),
      rootDirectory: z.string().nullable().optional(),
      nodeVersion: z.string().optional(),
      publicSource: z.boolean().optional(),
      teamId: teamIdParam,
      slug: teamSlugParam,
    }),
    handler: async (args, client) => {
      const { idOrName, teamId, slug, ...body } = args;
      return client.patch(`/v9/projects/${encodeURIComponent(idOrName)}`, {
        params: scopeParams(args),
        body,
      });
    },
  }),

  defineTool({
    name: "delete_project",
    description: "Delete a project permanently. This cannot be undone.",
    write: true,
    schema: z.object({
      idOrName: z.string().describe("Project id or name."),
      teamId: teamIdParam,
      slug: teamSlugParam,
    }),
    handler: async (args, client) => {
      await client.del(`/v9/projects/${encodeURIComponent(args.idOrName)}`, {
        params: scopeParams(args),
      });
      return { deleted: true, project: args.idOrName };
    },
  }),

  defineTool({
    name: "pause_project",
    description: "Pause a project (stops serving production traffic) by project id.",
    write: true,
    schema: z.object({
      projectId: z.string().describe("Project id."),
      teamId: teamIdParam,
      slug: teamSlugParam,
    }),
    handler: async (args, client) => {
      await client.post(`/v1/projects/${args.projectId}/pause`, { params: scopeParams(args) });
      return { paused: true, projectId: args.projectId };
    },
  }),

  defineTool({
    name: "unpause_project",
    description: "Resume a previously paused project by project id.",
    write: true,
    schema: z.object({
      projectId: z.string().describe("Project id."),
      teamId: teamIdParam,
      slug: teamSlugParam,
    }),
    handler: async (args, client) => {
      await client.post(`/v1/projects/${args.projectId}/unpause`, { params: scopeParams(args) });
      return { paused: false, projectId: args.projectId };
    },
  }),
];
