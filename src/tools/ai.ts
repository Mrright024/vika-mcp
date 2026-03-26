import * as z from 'zod/v4';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { jsonObjectSchema } from '../schemas/common.js';
import { registerTool, type ToolDependencies, ok } from './common.js';

export function registerAiTools(server: McpServer, deps: ToolDependencies): void {
  registerTool(
    server,
    deps,
    {
      name: 'create_chat_completions',
      description: 'Call the documented chat completions endpoint under /fusion/ai/{assistantId}/chat/completions.',
      inputSchema: z.object({
        assistantId: z.string().min(1).describe('Assistant ID from the official API path.'),
        payload: jsonObjectSchema.optional(),
      }),
      execute: async ({ assistantId, payload }) => {
        const { data, meta } = await deps.client.request({
          method: 'POST',
          path: `/fusion/ai/${assistantId}/chat/completions`,
          body: payload,
          feature: 'create_chat_completions',
          idempotent: false,
        });
        return ok(data, meta);
      },
    },
  );
}
