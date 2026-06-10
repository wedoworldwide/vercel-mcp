import { AnyToolDef } from "../types.js";
import { deploymentTools } from "./deployments.js";
import { projectTools } from "./projects.js";
import { envTools } from "./env.js";
import { domainTools } from "./domains.js";
import { dnsTools } from "./dns.js";
import { aliasTools } from "./aliases.js";
import { certTools } from "./certs.js";
import { logTools } from "./logs.js";
import { checkTools } from "./checks.js";
import { webhookTools } from "./webhooks.js";
import { edgeConfigTools } from "./edge-config.js";
import { teamTools } from "./teams.js";
import { integrationTools } from "./integrations.js";
import { rawTool } from "./raw.js";

/** Every typed tool, in a stable order, excluding vercel_raw (added conditionally). */
export const allTools: AnyToolDef[] = [
  ...deploymentTools,
  ...projectTools,
  ...envTools,
  ...domainTools,
  ...dnsTools,
  ...aliasTools,
  ...certTools,
  ...logTools,
  ...checkTools,
  ...webhookTools,
  ...edgeConfigTools,
  ...teamTools,
  ...integrationTools,
];

export { rawTool };
