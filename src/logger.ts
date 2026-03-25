import type { LogLevel } from './types.js';

const WEIGHTS: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function sanitizeValue(key: string, value: unknown): unknown {
  const lowered = key.toLowerCase();
  if (lowered.includes('token') || lowered.includes('authorization')) {
    return '[REDACTED]';
  }

  if (lowered.includes('content') && typeof value === 'string' && value.length > 120) {
    return `[OMITTED:${value.length}]`;
  }

  if (typeof value === 'bigint') {
    return value.toString();
  }

  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
    };
  }

  if (value instanceof Uint8Array) {
    return `[Uint8Array:${value.byteLength}]`;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(key, item));
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([childKey, childValue]) => [childKey, sanitizeValue(childKey, childValue)]),
    );
  }

  return value;
}

export class Logger {
  public constructor(
    private readonly level: LogLevel,
    private readonly bindings: Record<string, unknown> = {},
  ) {}

  public child(bindings: Record<string, unknown>): Logger {
    return new Logger(this.level, { ...this.bindings, ...bindings });
  }

  public debug(message: string, context?: Record<string, unknown>): void {
    this.log('debug', message, context);
  }

  public info(message: string, context?: Record<string, unknown>): void {
    this.log('info', message, context);
  }

  public warn(message: string, context?: Record<string, unknown>): void {
    this.log('warn', message, context);
  }

  public error(message: string, context?: Record<string, unknown>): void {
    this.log('error', message, context);
  }

  private log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
    if (WEIGHTS[level] < WEIGHTS[this.level]) {
      return;
    }

    const bindings = sanitizeValue('bindings', this.bindings);
    const payload = {
      ts: new Date().toISOString(),
      level,
      message,
      ...(bindings && typeof bindings === 'object' ? bindings : {}),
      ...(context ? { context: sanitizeValue('context', context) } : {}),
    };

    process.stderr.write(`${JSON.stringify(payload)}\n`);
  }
}
