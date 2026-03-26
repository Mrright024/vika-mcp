export type ApiVersion = 'v1' | 'v2';

export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export type ToolErrorCategory =
  | 'authentication'
  | 'authorization'
  | 'not_found'
  | 'rate_limit'
  | 'validation'
  | 'conflict'
  | 'feature_unavailable'
  | 'network'
  | 'upstream'
  | 'destructive_guard';

export interface ToolErrorShape {
  category: ToolErrorCategory;
  http_status?: number;
  upstream_code?: string | number;
  message: string;
  request_id?: string;
  retriable: boolean;
}

export interface ResponseMeta {
  http_status: number;
  request_id?: string;
  upstream_code?: string | number;
  version: ApiVersion;
  path: string;
  attempts: number;
}

export interface ToolSuccess<T = unknown> {
  ok: true;
  data: T;
  meta?: ResponseMeta;
}

export interface ToolFailure {
  ok: false;
  error: ToolErrorShape;
}

export type ToolEnvelope<T = unknown> = ToolSuccess<T> | ToolFailure;

export type QueryValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | QueryValue[]
  | Record<string, unknown>;

export type QueryParams = Record<string, unknown>;

export interface VikaApiEnvelope<T = unknown> {
  success?: boolean;
  code?: string | number;
  message?: string;
  data?: T;
}

export interface NodeSummary {
  id: string;
  name: string;
  type: string;
  icon?: string;
  isFav?: boolean;
  parentId?: string;
  permission?: number;
}

export interface NodeDetail extends NodeSummary {
  children?: NodeSummary[];
}

export interface ResolvedNode {
  space_id: string;
  node_id: string;
  name: string;
  type: string;
  parent_id?: string;
  permission?: number;
}

export interface ResolvedDatasheet extends ResolvedNode {
  datasheet_id: string;
}
