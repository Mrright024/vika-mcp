import * as z from 'zod/v4';

import type { LogLevel } from './types.js';

const envSchema = z.object({
  VIKA_HOST: z.string().trim().min(1),
  VIKA_TOKEN: z.string().trim().min(1),
  VIKA_TIMEOUT_MS: z.string().trim().optional(),
  VIKA_ALLOW_INSECURE_TLS: z.string().trim().optional(),
  VIKA_PROXY_URL: z.string().trim().optional(),
  VIKA_LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).optional(),
});

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value === '') {
    return fallback;
  }

  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
}

function parseNumber(value: string | undefined, fallback: number): number {
  if (value === undefined || value === '') {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`Invalid positive number: ${value}`);
  }

  return parsed;
}

function normalizeHost(host: string): string {
  return host.replace(/\/+$/, '');
}

function firstNonEmpty(...values: Array<string | undefined>): string | undefined {
  for (const value of values) {
    if (value !== undefined && value !== '') {
      return value;
    }
  }

  return undefined;
}

export interface AppConfig {
  host: string;
  token: string;
  timeoutMs: number;
  allowInsecureTls: boolean;
  proxyUrl?: string;
  logLevel: LogLevel;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = envSchema.parse(env);

  return {
    host: normalizeHost(parsed.VIKA_HOST),
    token: parsed.VIKA_TOKEN,
    timeoutMs: parseNumber(parsed.VIKA_TIMEOUT_MS, 15_000),
    allowInsecureTls: parseBoolean(parsed.VIKA_ALLOW_INSECURE_TLS, false),
    proxyUrl: firstNonEmpty(parsed.VIKA_PROXY_URL),
    logLevel: parsed.VIKA_LOG_LEVEL ?? 'info',
  };
}
