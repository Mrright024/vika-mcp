import * as z from 'zod/v4';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { jsonObjectSchema } from '../schemas/common.js';
import { registerTool, type ToolDependencies, ok } from './common.js';

export function registerAiTools(server: McpServer, deps: ToolDependencies): void {
  registerTool(
    server,
    deps,
    {
      name: 'vika_ai_request',
      description:
        'Generic AI-category request wrapper. Use a relative path under /ai and the documented method/payload for your deployment.',
      inputSchema: z.object({
        method: z.enum(['GET', 'POST', 'PATCH', 'PUT', 'DELETE']),
        relative_path: z.string().min(1).describe('Relative path under /fusion/v1/ai, without the /ai prefix.'),
        query: jsonObjectSchema.optional(),
        payload: jsonObjectSchema.optional(),
      }),
      execute: async ({ method, relative_path, query, payload }) => {
        const normalizedPath = relative_path.replace(/^\/+/, '');
        const { data, meta } = await deps.client.request({
          method,
          path: `/ai/${normalizedPath}`,
          query,
          body: payload,
          feature: 'ai',
          idempotent: method === 'GET',
        });
        return ok(data, meta);
      },
    },
  );
}
