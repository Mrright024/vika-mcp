import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as z from 'zod/v4';

import type { VikaClient } from '../http/client.js';
import { destructiveGuardError, normalizeUnknownError } from '../http/errors.js';
import { Logger } from '../logger.js';
import { ResolverService } from '../resolvers.js';
import type { ToolEnvelope, ToolFailure, ToolSuccess } from '../types.js';

export interface ToolDependencies {
  client: VikaClient;
  logger: Logger;
  resolvers: ResolverService;
}

export interface ToolDefinition<TSchema extends z.ZodTypeAny> {
  name: string;
  description: string;
  inputSchema: TSchema;
  readOnly?: boolean;
  execute: (args: z.infer<TSchema>, deps: ToolDependencies) => Promise<ToolEnvelope>;
}

export function ok<T>(data: T, meta?: ToolSuccess<T>['meta']): ToolSuccess<T> {
  return {
    ok: true,
    data,
    meta,
  };
}

export function fail(error: ToolFailure['error']): ToolFailure {
  return {
    ok: false,
    error,
  };
}

export function requireDestructiveConfirmation(confirmDestructive: boolean | undefined): void {
  if (confirmDestructive !== true) {
    throw destructiveGuardError();
  }
}

export function toCallToolResult(payload: ToolEnvelope): CallToolResult {
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(payload, null, 2),
      },
    ],
    structuredContent: payload as unknown as Record<string, unknown>,
  };
}

export function registerTool<TSchema extends z.ZodTypeAny>(
  server: McpServer,
  deps: ToolDependencies,
  definition: ToolDefinition<TSchema>,
): void {
  (server.registerTool as unknown as (
    name: string,
    config: {
      description: string;
      inputSchema: TSchema;
      annotations: {
        readOnlyHint: boolean;
        openWorldHint: boolean;
      };
    },
    cb: (args: unknown) => Promise<CallToolResult>,
  ) => void)(
    definition.name,
    {
      description: definition.description,
      inputSchema: definition.inputSchema,
      annotations: {
        readOnlyHint: definition.readOnly ?? false,
        openWorldHint: false,
      },
    },
    async (args: unknown) => {
      try {
        const payload = await definition.execute(args as z.infer<TSchema>, deps);
        return toCallToolResult(payload);
      } catch (error) {
        deps.logger.error('tool_failure', {
          tool: definition.name,
          error,
        });
        return toCallToolResult(fail(normalizeUnknownError(error).toShape()));
      }
    },
  );
}
