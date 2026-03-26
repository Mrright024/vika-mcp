import * as z from 'zod/v4';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { datasheetIdSchema } from '../schemas/common.js';
import { registerTool, type ToolDependencies, ok } from './common.js';

export function registerViewTools(server: McpServer, deps: ToolDependencies): void {
  registerTool(
    server,
    deps,
    {
      name: 'get_views',
      description: 'List views for a datasheet.',
      inputSchema: z.object({
        datasheetId: datasheetIdSchema,
      }),
      readOnly: true,
      execute: async ({ datasheetId }) => {
        const { data, meta } = await deps.client.request({
          method: 'GET',
          path: `/datasheets/${datasheetId}/views`,
          feature: 'get_views',
        });
        return ok(data, meta);
      },
    },
  );
}
