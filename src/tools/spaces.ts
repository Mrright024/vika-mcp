import * as z from 'zod/v4';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { jsonObjectSchema, spaceIdSchema } from '../schemas/common.js';
import { registerTool, type ToolDependencies, ok } from './common.js';

export function registerSpaceTools(server: McpServer, deps: ToolDependencies): void {
  registerTool(
    server,
    deps,
    {
      name: 'vika_spaces_list',
      description: 'List spaces accessible by the current token.',
      inputSchema: z.object({}),
      readOnly: true,
      execute: async () => {
        const { data, meta } = await deps.client.request({
          method: 'GET',
          path: '/spaces',
          feature: 'spaces.list',
        });
        return ok(data, meta);
      },
    },
  );

  registerTool(
    server,
    deps,
    {
      name: 'vika_members_list',
      description: 'List members in a space. Parameters are passed through to the official members endpoint.',
      inputSchema: z.object({
        space_id: spaceIdSchema,
        query: jsonObjectSchema.optional().describe('Optional query parameters forwarded to the API.'),
      }),
      readOnly: true,
      execute: async ({ space_id, query }) => {
        const { data, meta } = await deps.client.request({
          method: 'GET',
          path: `/spaces/${space_id}/members`,
          query,
          feature: 'members.list',
        });
        return ok(data, meta);
      },
    },
  );
}
