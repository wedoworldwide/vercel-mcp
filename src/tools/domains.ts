import { z } from "zod";
import { defineTool, teamIdParam, teamSlugParam, scopeParams, limitParam } from "../types.js";

export const domainTools = [
  defineTool({
    name: "list_domains",
    description: "List all domains registered/owned in the account or team.",
    schema: z.object({
      limit: limitParam,
      teamId: teamIdParam,
      slug: teamSlugParam,
    }),
    handler: async (args, client) => {
      const { teamId, slug, ...rest } = args;
      return client.get(`/v5/domains`, { params: { ...rest, ...scopeParams(args) } });
    },
  }),

  defineTool({
    name: "get_domain",
    description: "Get details for a single account-level domain by name.",
    schema: z.object({
      domain: z.string().describe("Domain name, e.g. example.com."),
      teamId: teamIdParam,
      slug: teamSlugParam,
    }),
    handler: async (args, client) =>
      client.get(`/v5/domains/${encodeURIComponent(args.domain)}`, {
        params: scopeParams(args),
      }),
  }),

  defineTool({
    name: "get_domain_config",
    description:
      "Get the DNS/verification configuration Vercel expects for a domain (records to set at your registrar).",
    schema: z.object({
      domain: z.string().describe("Domain name."),
      teamId: teamIdParam,
      slug: teamSlugParam,
    }),
    handler: async (args, client) =>
      client.get(`/v6/domains/${encodeURIComponent(args.domain)}/config`, {
        params: scopeParams(args),
      }),
  }),

  defineTool({
    name: "add_domain",
    description: "Add (register/move) a domain to the account or team.",
    write: true,
    schema: z.object({
      name: z.string().describe("Domain name to add."),
      teamId: teamIdParam,
      slug: teamSlugParam,
    }),
    handler: async (args, client) =>
      client.post(`/v5/domains`, { params: scopeParams(args), body: { name: args.name } }),
  }),

  defineTool({
    name: "verify_domain",
    description: "Trigger verification of a domain after you've set the required DNS/TXT records.",
    write: true,
    schema: z.object({
      domain: z.string().describe("Domain name to verify."),
      teamId: teamIdParam,
      slug: teamSlugParam,
    }),
    handler: async (args, client) =>
      client.post(`/v4/domains/${encodeURIComponent(args.domain)}/verify`, {
        params: scopeParams(args),
      }),
  }),

  defineTool({
    name: "remove_domain",
    description: "Remove a domain from the account or team by name.",
    write: true,
    schema: z.object({
      domain: z.string().describe("Domain name to remove."),
      teamId: teamIdParam,
      slug: teamSlugParam,
    }),
    handler: async (args, client) => {
      await client.del(`/v6/domains/${encodeURIComponent(args.domain)}`, {
        params: scopeParams(args),
      });
      return { removed: true, domain: args.domain };
    },
  }),

  // ── Project-scoped domains ────────────────────────────────────────────────
  defineTool({
    name: "list_project_domains",
    description: "List the domains attached to a specific project.",
    schema: z.object({
      projectId: z.string().describe("Project id or name."),
      teamId: teamIdParam,
      slug: teamSlugParam,
    }),
    handler: async (args, client) =>
      client.get(`/v9/projects/${encodeURIComponent(args.projectId)}/domains`, {
        params: scopeParams(args),
      }),
  }),

  defineTool({
    name: "add_project_domain",
    description:
      "Attach a domain to a project. Optionally set a redirect or assign it to a specific git branch.",
    write: true,
    schema: z.object({
      projectId: z.string().describe("Project id or name."),
      name: z.string().describe("Domain to attach, e.g. www.example.com."),
      gitBranch: z.string().nullable().optional().describe("Bind to a preview git branch."),
      redirect: z.string().nullable().optional().describe("Redirect target domain."),
      redirectStatusCode: z.number().nullable().optional().describe("301/302/307/308."),
      teamId: teamIdParam,
      slug: teamSlugParam,
    }),
    handler: async (args, client) => {
      const { projectId, teamId, slug, ...body } = args;
      return client.post(`/v10/projects/${encodeURIComponent(projectId)}/domains`, {
        params: scopeParams(args),
        body,
      });
    },
  }),

  defineTool({
    name: "remove_project_domain",
    description: "Detach a domain from a project (does not delete the domain from the account).",
    write: true,
    schema: z.object({
      projectId: z.string().describe("Project id or name."),
      domain: z.string().describe("Domain to detach."),
      teamId: teamIdParam,
      slug: teamSlugParam,
    }),
    handler: async (args, client) => {
      await client.del(
        `/v9/projects/${encodeURIComponent(args.projectId)}/domains/${encodeURIComponent(args.domain)}`,
        { params: scopeParams(args) }
      );
      return { removed: true, projectId: args.projectId, domain: args.domain };
    },
  }),
];
