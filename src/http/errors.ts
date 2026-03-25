import type { ResponseMeta, ToolErrorCategory, ToolErrorShape } from '../types.js';

export class VikaToolError extends Error {
  public readonly category: ToolErrorCategory;

  public readonly httpStatus?: number;

  public readonly upstreamCode?: string | number;

  public readonly requestId?: string;

  public readonly retriable: boolean;

  public constructor(args: {
    category: ToolErrorCategory;
    message: string;
    httpStatus?: number;
    upstreamCode?: string | number;
    requestId?: string;
    retriable?: boolean;
  }) {
    super(args.message);
    this.name = 'VikaToolError';
    this.category = args.category;
    this.httpStatus = args.httpStatus;
    this.upstreamCode = args.upstreamCode;
    this.requestId = args.requestId;
    this.retriable = args.retriable ?? false;
  }

  public toShape(): ToolErrorShape {
    return {
      category: this.category,
      http_status: this.httpStatus,
      upstream_code: this.upstreamCode,
      message: this.message,
      request_id: this.requestId,
      retriable: this.retriable,
    };
  }
}

export function destructiveGuardError(message = 'Destructive tools require confirm_destructive=true.'): VikaToolError {
  return new VikaToolError({
    category: 'destructive_guard',
    message,
    retriable: false,
  });
}

export function featureUnavailableError(feature: string, args?: Partial<ResponseMeta> & { message?: string }): VikaToolError {
  return new VikaToolError({
    category: 'feature_unavailable',
    message: args?.message ?? `Feature "${feature}" is unavailable on this deployment.`,
    httpStatus: args?.http_status,
    upstreamCode: args?.upstream_code,
    requestId: args?.request_id,
    retriable: false,
  });
}

export function mapUpstreamError(args: {
  status: number;
  message: string;
  upstreamCode?: string | number;
  requestId?: string;
  feature?: string;
}): VikaToolError {
  if (args.feature && [403, 404, 501].includes(args.status)) {
    return featureUnavailableError(args.feature, {
      http_status: args.status,
      upstream_code: args.upstreamCode,
      request_id: args.requestId,
      message: args.message,
    });
  }

  if (args.status === 401) {
    return new VikaToolError({
      category: 'authentication',
      message: args.message,
      httpStatus: 401,
      upstreamCode: args.upstreamCode,
      requestId: args.requestId,
    });
  }

  if (args.status === 403) {
    return new VikaToolError({
      category: 'authorization',
      message: args.message,
      httpStatus: 403,
      upstreamCode: args.upstreamCode,
      requestId: args.requestId,
    });
  }

  if (args.status === 404) {
    return new VikaToolError({
      category: 'not_found',
      message: args.message,
      httpStatus: 404,
      upstreamCode: args.upstreamCode,
      requestId: args.requestId,
    });
  }

  if (args.status === 409) {
    return new VikaToolError({
      category: 'conflict',
      message: args.message,
      httpStatus: 409,
      upstreamCode: args.upstreamCode,
      requestId: args.requestId,
    });
  }

  if (args.status === 422 || args.status === 400) {
    return new VikaToolError({
      category: 'validation',
      message: args.message,
      httpStatus: args.status,
      upstreamCode: args.upstreamCode,
      requestId: args.requestId,
    });
  }

  if (args.status === 429) {
    return new VikaToolError({
      category: 'rate_limit',
      message: args.message,
      httpStatus: 429,
      upstreamCode: args.upstreamCode,
      requestId: args.requestId,
      retriable: true,
    });
  }

  return new VikaToolError({
    category: args.status >= 500 ? 'upstream' : 'validation',
    message: args.message,
    httpStatus: args.status,
    upstreamCode: args.upstreamCode,
    requestId: args.requestId,
    retriable: [502, 503, 504].includes(args.status),
  });
}

export function normalizeUnknownError(error: unknown): VikaToolError {
  if (error instanceof VikaToolError) {
    return error;
  }

  if (error instanceof Error) {
    return new VikaToolError({
      category: 'network',
      message: error.message,
      retriable: true,
    });
  }

  return new VikaToolError({
    category: 'upstream',
    message: 'Unknown error',
    retriable: false,
  });
}
