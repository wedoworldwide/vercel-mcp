import { z } from "zod";
import { defineTool, teamIdParam, teamSlugParam, scopeParams } from "../types.js";

export const certTools = [
  defineTool({
    name: "get_cert",
    description: "Get a TLS certificate by id.",
    schema: z.object({
      id: z.string().describe("Certificate id."),
      teamId: teamIdParam,
      slug: teamSlugParam,
    }),
    handler: async (args, client) =>
      client.get(`/v7/certs/${encodeURIComponent(args.id)}`, { params: scopeParams(args) }),
  }),

  defineTool({
    name: "issue_cert",
    description:
      "Issue (provision) a new TLS certificate for one or more domains. Vercel handles the ACME flow.",
    write: true,
    schema: z.object({
      cns: z.array(z.string()).min(1).describe("Common names / domains to cover."),
      teamId: teamIdParam,
      slug: teamSlugParam,
    }),
    handler: async (args, client) =>
      client.post(`/v7/certs`, { params: scopeParams(args), body: { cns: args.cns } }),
  }),

  defineTool({
    name: "upload_cert",
    description:
      "Upload a custom TLS certificate (your own cert/key/CA chain) instead of having Vercel issue one.",
    write: true,
    schema: z.object({
      cert: z.string().describe("PEM-encoded certificate."),
      key: z.string().describe("PEM-encoded private key."),
      ca: z.string().optional().describe("PEM-encoded CA chain."),
      skipValidation: z.boolean().optional(),
      teamId: teamIdParam,
      slug: teamSlugParam,
    }),
    handler: async (args, client) => {
      const { teamId, slug, ...body } = args;
      return client.put(`/v7/certs`, { params: scopeParams(args), body });
    },
  }),

  defineTool({
    name: "remove_cert",
    description: "Delete a TLS certificate by id.",
    write: true,
    schema: z.object({
      id: z.string().describe("Certificate id."),
      teamId: teamIdParam,
      slug: teamSlugParam,
    }),
    handler: async (args, client) => {
      await client.del(`/v7/certs/${encodeURIComponent(args.id)}`, { params: scopeParams(args) });
      return { removed: true, id: args.id };
    },
  }),
];
