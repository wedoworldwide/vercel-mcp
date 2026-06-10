/**
 * Sanitize a raw API path for the vercel_raw escape hatch. Must be a clean
 * path on the Vercel API host (api.vercel.com) — no scheme, no host, no
 * traversal. The version segment is part of the path (e.g. "/v9/projects").
 */
export function assertSafeRawPath(path: string): void {
  if (typeof path !== "string" || path.length === 0) {
    throw new Error("path is required.");
  }
  if (!path.startsWith("/")) {
    throw new Error('path must start with "/" (e.g. "/v9/projects").');
  }
  if (path.startsWith("//")) {
    throw new Error('path must not start with "//".');
  }
  if (path.includes("://")) {
    throw new Error("path must be a relative API path, not a full URL.");
  }
  if (path.includes("..")) {
    throw new Error('path must not contain ".." (path traversal).');
  }
  if (path.includes("@")) {
    throw new Error('path must not contain "@".');
  }
  if (path.includes("\\")) {
    throw new Error('path must not contain backslashes.');
  }
  // eslint-disable-next-line no-control-regex
  if (/[\x00-\x1f\x7f]/.test(path)) {
    throw new Error("path must not contain control characters.");
  }
  // Defense in depth: every Vercel REST endpoint is versioned (/v1.../v13...).
  // Require the first segment to be a version, so the escape hatch can only
  // ever target the documented API surface on api.vercel.com.
  if (!/^\/v\d+(\/|$|\?)/.test(path)) {
    throw new Error(
      'path must begin with a version segment, e.g. "/v9/projects" or "/v13/deployments/dpl_xxx".'
    );
  }
}
