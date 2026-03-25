import { readFile } from 'node:fs/promises';
import qs from 'qs';
import { Agent } from 'undici';

import type { AppConfig } from '../config.js';
import { CapabilityRegistry } from '../capabilities.js';
import { Logger } from '../logger.js';
import type { ApiVersion, HttpMethod, QueryParams, ResponseMeta, VikaApiEnvelope } from '../types.js';
import { featureUnavailableError, mapUpstreamError, VikaToolError } from './errors.js';

export interface RequestOptions {
  method: HttpMethod;
  path: string;
  query?: QueryParams;
  body?: unknown;
  formData?: FormData;
  version?: ApiVersion;
  feature?: string;
  idempotent?: boolean;
  headers?: Record<string, string>;
  timeoutMs?: number;
}

interface ParsedResponse<T> {
  envelope: VikaApiEnvelope<T>;
  requestId?: string;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function shouldRetry(status: number): boolean {
  return [429, 502, 503, 504].includes(status);
}

function summarizeNonJsonBody(body: string): string {
  const trimmed = body.trim();
  const stripped = trimmed.replace(/\s+/g, ' ');

  if (/SafeLine|请求已被阻断|访问请求可能对网站造成安全威胁/i.test(stripped)) {
    return 'Request blocked by SafeLine.';
  }

  if (/<html/i.test(stripped)) {
    return 'Upstream returned an HTML error page.';
  }

  return stripped.slice(0, 500);
}

function createMeta(
  status: number,
  requestId: string | undefined,
  upstreamCode: string | number | undefined,
  version: ApiVersion,
  path: string,
  attempts: number,
): ResponseMeta {
  return {
    http_status: status,
    request_id: requestId,
    upstream_code: upstreamCode,
    version,
    path,
    attempts,
  };
}

export class VikaClient {
  private readonly dispatcher?: Agent;

  private readonly fetchImpl: typeof fetch;

  public constructor(
    private readonly config: AppConfig,
    private readonly logger: Logger,
    private readonly capabilities: CapabilityRegistry,
    fetchImpl?: typeof fetch,
  ) {
    this.fetchImpl = fetchImpl ?? fetch;
    if (config.allowInsecureTls) {
      this.dispatcher = new Agent({
        connect: {
          rejectUnauthorized: false,
        },
      });
    }
  }

  public async request<T = unknown>(options: RequestOptions): Promise<{ data: T; meta: ResponseMeta }> {
    const version = options.version ?? 'v1';
    const attempts = options.idempotent ?? (options.method === 'GET') ? 3 : 1;

    if (options.feature && this.capabilities.isUnavailable(options.feature)) {
      throw featureUnavailableError(options.feature);
    }

    let lastError: unknown;

    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? this.config.timeoutMs);

      try {
        const url = this.buildUrl(options.path, version, options.query);
        const headers = new Headers({
          Authorization: `Bearer ${this.config.token}`,
          Accept: 'application/json',
          ...options.headers,
        });

        let body: BodyInit | undefined;
        if (options.formData) {
          body = options.formData;
        } else if (options.body !== undefined) {
          headers.set('Content-Type', 'application/json');
          body = JSON.stringify(options.body);
        }

        this.logger.debug('vika_request', {
          method: options.method,
          path: options.path,
          feature: options.feature,
          version,
          attempt,
        });

        const response = await this.fetchImpl(url, {
          method: options.method,
          headers,
          body,
          signal: controller.signal,
          dispatcher: this.dispatcher,
        } as RequestInit & { dispatcher?: Agent });

        const parsed = await this.parseResponse<T>(response);
        const meta = createMeta(
          response.status,
          parsed.requestId,
          parsed.envelope.code,
          version,
          options.path,
          attempt,
        );

        if (!response.ok || parsed.envelope.success === false) {
          if (options.feature && [403, 404, 501].includes(response.status)) {
            this.capabilities.markUnavailable(options.feature);
          }

          const error = mapUpstreamError({
            status: response.status,
            message: parsed.envelope.message ?? `HTTP ${response.status}`,
            upstreamCode: parsed.envelope.code,
            requestId: parsed.requestId,
            feature: options.feature,
          });

          if (attempt < attempts && error.retriable && options.method === 'GET') {
            await sleep(250 * attempt);
            continue;
          }

          throw error;
        }

        if (options.feature) {
          this.capabilities.markAvailable(options.feature);
        }

        return {
          data: (parsed.envelope.data ?? parsed.envelope) as T,
          meta,
        };
      } catch (error) {
        const normalized =
          error instanceof VikaToolError
            ? error
            : new VikaToolError({
                category: 'network',
                message: error instanceof Error ? error.message : 'Network request failed',
                retriable: true,
              });

        lastError = normalized;

        if (attempt < attempts && options.method === 'GET' && normalized.retriable) {
          await sleep(250 * attempt);
          continue;
        }

        throw normalized;
      } finally {
        clearTimeout(timeout);
      }
    }

    throw lastError instanceof Error ? lastError : new Error('Unknown request failure');
  }

  public async createSingleFileFormData(
    filePath: string,
    fileName?: string,
    mimeType?: string,
  ): Promise<FormData> {
    const buffer = await readFile(filePath);
    const name = fileName ?? filePath.split(/[\\/]/).pop() ?? 'upload.bin';
    const file = new File([buffer], name, {
      type: mimeType ?? 'application/octet-stream',
    });
    const form = new FormData();
    form.append('file', file);
    return form;
  }

  private buildUrl(path: string, version: ApiVersion, query?: QueryParams): string {
    const base = path.startsWith('http')
      ? new URL(path)
      : path.startsWith('/fusion/')
        ? new URL(path, this.config.host)
        : new URL(`${this.config.host}/fusion/${version}${path}`);

    const queryString = query
      ? qs.stringify(query, {
          arrayFormat: 'brackets',
          allowDots: false,
          encodeValuesOnly: true,
          skipNulls: true,
        })
      : '';

    if (queryString) {
      base.search = queryString;
    }

    return base.toString();
  }

  private async parseResponse<T>(response: Response): Promise<ParsedResponse<T>> {
    const requestId = response.headers.get('request-id') ?? undefined;
    const contentType = response.headers.get('content-type') ?? '';

    if (response.status === 204) {
      return {
        envelope: {
          success: true,
          data: undefined,
        },
        requestId,
      };
    }

    if (contentType.includes('application/json')) {
      const json = (await response.json()) as VikaApiEnvelope<T>;
      return {
        envelope: json,
        requestId,
      };
    }

    const text = await response.text();
    return {
      envelope: {
        success: response.ok,
        message: summarizeNonJsonBody(text),
        data: text as T,
      },
      requestId,
    };
  }
}
