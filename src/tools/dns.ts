import { z } from "zod";
import { defineTool, teamIdParam, teamSlugParam, scopeParams, limitParam } from "../types.js";

const DNS_TYPES = ["A", "AAAA", "ALIAS", "CAA", "CNAME", "HTTPS", "MX", "SRV", "TXT", "NS"] as const;

export const dnsTools = [
  defineTool({
    name: "list_dns_records",
    description: "List the DNS records Vercel manages for a domain.",
    schema: z.object({
      domain: z.string().describe("Domain name."),
      limit: limitParam,
      teamId: teamIdParam,
      slug: teamSlugParam,
    }),
    handler: async (args, client) => {
      const { domain, teamId, slug, ...rest } = args;
      return client.get(`/v4/domains/${encodeURIComponent(domain)}/records`, {
        params: { ...rest, ...scopeParams(args) },
      });
    },
  }),

  defineTool({
    name: "create_dns_record",
    description:
      "Create a DNS record for a domain. For MX set `mxPriority`; for SRV pass the `srv` object.",
    write: true,
    schema: z.object({
      domain: z.string().describe("Domain name."),
      type: z.enum(DNS_TYPES).describe("Record type."),
      name: z.string().describe("Subdomain/name ('' or '@' for the apex)."),
      value: z.string().optional().describe("Record value (e.g. IP, target, text)."),
      ttl: z.number().optional().describe("TTL in seconds."),
      mxPriority: z.number().optional().describe("Priority for MX records."),
      srv: z.record(z.any()).optional().describe("SRV fields { priority, weight, port, target }."),
      comment: z.string().optional(),
      teamId: teamIdParam,
      slug: teamSlugParam,
    }),
    handler: async (args, client) => {
      const { domain, teamId, slug, ...body } = args;
      return client.post(`/v2/domains/${encodeURIComponent(domain)}/records`, {
        params: scopeParams(args),
        body,
      });
    },
  }),

  defineTool({
    name: "update_dns_record",
    description: "Update an existing DNS record by record id.",
    write: true,
    schema: z.object({
      recordId: z.string().describe("DNS record id (rec_...)."),
      name: z.string().optional(),
      type: z.enum(DNS_TYPES).optional(),
      value: z.string().optional(),
      ttl: z.number().optional(),
      mxPriority: z.number().optional(),
      srv: z.record(z.any()).optional(),
      comment: z.string().optional(),
      teamId: teamIdParam,
      slug: teamSlugParam,
    }),
    handler: async (args, client) => {
      const { recordId, teamId, slug, ...body } = args;
      return client.patch(`/v1/domains/records/${encodeURIComponent(recordId)}`, {
        params: scopeParams(args),
        body,
      });
    },
  }),

  defineTool({
    name: "delete_dns_record",
    description: "Delete a DNS record from a domain by record id.",
    write: true,
    schema: z.object({
      domain: z.string().describe("Domain name."),
      recordId: z.string().describe("DNS record id (rec_...)."),
      teamId: teamIdParam,
      slug: teamSlugParam,
    }),
    handler: async (args, client) => {
      await client.del(
        `/v2/domains/${encodeURIComponent(args.domain)}/records/${encodeURIComponent(args.recordId)}`,
        { params: scopeParams(args) }
      );
      return { deleted: true, recordId: args.recordId };
    },
  }),
];
