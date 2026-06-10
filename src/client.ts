import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from "axios";

export interface VercelClientOptions {
  token: string;
  /** Default team/scope id (or slug) injected as ?teamId / ?slug on every call. */
  defaultTeamId?: string;
  defaultTeamSlug?: string;
  timeoutMs?: number;
  maxRetries?: number;
}

const BASE = "https://api.vercel.com";

export interface RequestOptions {
  params?: Record<string, unknown>;
  body?: unknown;
  headers?: Record<string, string>;
  /** Set false to skip auto-injecting the configured team scope. Default true. */
  scope?: boolean;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Thin, resilient Vercel REST client.
 *
 * Vercel versions each endpoint independently (/v6/deployments, /v13/deployments,
 * /v9/projects, ...), so the caller passes the FULL path including the version
 * segment. The configured team scope is auto-injected as ?teamId (and ?slug)
 * unless already present or explicitly disabled.
 *
 * - Retries on 429 (respecting Retry-After) and transient 5xx / network errors.
 * - Normalizes Vercel error payloads into actionable messages.
 */
export class VercelClient {
  private http: AxiosInstance;
  private maxRetries: number;
  readonly defaultTeamId?: string;
  readonly defaultTeamSlug?: string;

  constructor(opts: VercelClientOptions) {
    if (!opts.token) {
      throw new Error(
        "VERCEL_TOKEN is required. Create one at https://vercel.com/account/settings/tokens."
      );
    }
    this.defaultTeamId = opts.defaultTeamId;
    this.defaultTeamSlug = opts.defaultTeamSlug;
    this.maxRetries = opts.maxRetries ?? 3;
    this.http = axios.create({
      baseURL: BASE,
      timeout: opts.timeoutMs ?? 60000,
      headers: {
        Authorization: `Bearer ${opts.token}`,
        "Content-Type": "application/json",
      },
      // We handle non-2xx ourselves to craft good messages.
      validateStatus: () => true,
    });
  }

  /** Merge the configured team scope into query params (without overriding explicit values). */
  private withScope(params: Record<string, unknown> | undefined): Record<string, unknown> | undefined {
    const merged: Record<string, unknown> = { ...(params ?? {}) };
    if (this.defaultTeamId && merged.teamId === undefined && merged.slug === undefined) {
      merged.teamId = this.defaultTeamId;
    }
    if (this.defaultTeamSlug && merged.slug === undefined && merged.teamId === undefined) {
      merged.slug = this.defaultTeamSlug;
    }
    return Object.keys(merged).length ? merged : undefined;
  }

  async request<T = any>(
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
    path: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const url = path.startsWith("/") ? path : `/${path}`;
    const params = options.scope === false ? options.params : this.withScope(options.params);

    const config: AxiosRequestConfig = {
      method,
      url,
      params,
    };
    if (options.body !== undefined) config.data = options.body;
    if (options.headers) config.headers = options.headers;

    let attempt = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      let res;
      try {
        res = await this.http.request<T>(config);
      } catch (err) {
        if (attempt < this.maxRetries) {
          await sleep(this.backoff(attempt));
          attempt++;
          continue;
        }
        const e = err as AxiosError;
        throw new Error(`Network error calling Vercel ${method} ${path}: ${e.message}`);
      }

      if (res.status === 429 && attempt < this.maxRetries) {
        const retryAfter = Number(res.headers["retry-after"]);
        const wait = Number.isFinite(retryAfter) ? retryAfter * 1000 : this.backoff(attempt);
        await sleep(wait);
        attempt++;
        continue;
      }

      if (res.status >= 500 && attempt < this.maxRetries) {
        await sleep(this.backoff(attempt));
        attempt++;
        continue;
      }

      if (res.status >= 400) {
        throw new Error(this.formatError(method, path, res.status, res.data));
      }

      return res.data as T;
    }
  }

  private backoff(attempt: number): number {
    return Math.min(8000, 500 * 2 ** attempt) + Math.floor(Math.random() * 250);
  }

  private formatError(method: string, path: string, status: number, data: any): string {
    let detail = "";
    // Vercel errors are shaped { error: { code, message } }.
    const err = data?.error ?? data;
    if (err && typeof err === "object") {
      const code = err.code ? ` (code: ${err.code})` : "";
      detail = err.message ? `${err.message}${code}` : JSON.stringify(err);
    } else if (typeof data === "string") {
      detail = data;
    }
    const hints: Record<number, string> = {
      400: "Bad request — check your parameters against the Vercel API reference.",
      401: "Check that VERCEL_TOKEN is valid and not expired.",
      403: "Your token lacks permission, or the resource belongs to a team — set VERCEL_TEAM_ID.",
      404: "Resource not found — verify the id/name and that your token/team can see it.",
      429: "Rate limited by Vercel. Reduce request volume or retry later.",
    };
    const hint = hints[status] ? ` Hint: ${hints[status]}` : "";
    return `Vercel API ${method} ${path} failed (HTTP ${status}): ${detail}.${hint}`;
  }

  // ── Convenience verbs ────────────────────────────────────────────────────
  get<T = any>(path: string, options?: RequestOptions) {
    return this.request<T>("GET", path, options);
  }
  post<T = any>(path: string, options?: RequestOptions) {
    return this.request<T>("POST", path, options);
  }
  put<T = any>(path: string, options?: RequestOptions) {
    return this.request<T>("PUT", path, options);
  }
  patch<T = any>(path: string, options?: RequestOptions) {
    return this.request<T>("PATCH", path, options);
  }
  del<T = any>(path: string, options?: RequestOptions) {
    return this.request<T>("DELETE", path, options);
  }
}
