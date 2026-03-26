import * as z from 'zod/v4';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { registerTool, type ToolDependencies, ok } from './common.js';

export function registerSpaceTools(server: McpServer, deps: ToolDependencies): void {
  registerTool(
    server,
    deps,
    {
      name: 'get_spaces',
      description: 'List spaces accessible by the current token.',
      inputSchema: z.object({}),
      readOnly: true,
      execute: async () => {
        const { data, meta } = await deps.client.request({
          method: 'GET',
          path: '/spaces',
          feature: 'get_spaces',
        });
        return ok(data, meta);
      },
    },
  );
}
