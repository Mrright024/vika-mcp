import * as z from 'zod/v4';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { nodeIdSchema, spaceIdSchema } from '../schemas/common.js';
import { registerTool, type ToolDependencies, ok } from './common.js';

export function registerNodeTools(server: McpServer, deps: ToolDependencies): void {
  registerTool(
    server,
    deps,
    {
      name: 'get_nodes',
      description: 'List root nodes for a space.',
      inputSchema: z.object({
        spaceId: spaceIdSchema,
      }),
      readOnly: true,
      execute: async ({ spaceId }) => {
        const { data, meta } = await deps.client.request({
          method: 'GET',
          path: `/spaces/${spaceId}/nodes`,
          feature: 'get_nodes',
        });
        return ok(data, meta);
      },
    },
  );

  registerTool(
    server,
    deps,
    {
      name: 'search_nodes',
      description: 'Search nodes in a space through the official v2 search endpoint.',
      inputSchema: z.object({
        spaceId: spaceIdSchema,
        type: z
          .string()
          .optional()
          .describe('Official node type, for example Datasheet, Folder, Form, Mirror, or Dashboard.'),
        permissions: z.array(z.number().int()).optional(),
        query: z.string().optional(),
      }),
      readOnly: true,
      execute: async ({ spaceId, type, permissions, query }) => {
        const { data, meta } = await deps.client.request({
          method: 'GET',
          version: 'v2',
          path: `/spaces/${spaceId}/nodes`,
          query: {
            type,
            permissions: permissions?.join(','),
            query,
          },
          feature: 'search_nodes',
        });
        return ok(data, meta);
      },
    },
  );

  registerTool(
    server,
    deps,
    {
      name: 'get_node_details',
      description: 'Get details for a single node. Folder nodes may include a children array.',
      inputSchema: z.object({
        spaceId: spaceIdSchema,
        nodeId: nodeIdSchema,
      }),
      readOnly: true,
      execute: async ({ spaceId, nodeId }) => {
        const { data, meta } = await deps.client.request({
          method: 'GET',
          path: `/spaces/${spaceId}/nodes/${nodeId}`,
          feature: 'get_node_details',
        });
        return ok(data, meta);
      },
    },
  );
}
