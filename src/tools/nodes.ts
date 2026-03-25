import * as z from 'zod/v4';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { nodeIdSchema, optionalStringArraySchema, spaceIdSchema } from '../schemas/common.js';
import { registerTool, type ToolDependencies, ok } from './common.js';

export function registerNodeTools(server: McpServer, deps: ToolDependencies): void {
  registerTool(
    server,
    deps,
    {
      name: 'vika_nodes_list',
      description: 'List root nodes for a space.',
      inputSchema: z.object({
        space_id: spaceIdSchema,
      }),
      readOnly: true,
      execute: async ({ space_id }) => {
        const { data, meta } = await deps.client.request({
          method: 'GET',
          path: `/spaces/${space_id}/nodes`,
          feature: 'nodes.list',
        });
        return ok(data, meta);
      },
    },
  );

  registerTool(
    server,
    deps,
    {
      name: 'vika_nodes_children_list',
      description: 'List child nodes for a given folder or node by reading its detail payload.',
      inputSchema: z.object({
        space_id: spaceIdSchema,
        node_id: nodeIdSchema,
      }),
      readOnly: true,
      execute: async ({ space_id, node_id }) => {
        const { data, meta } = await deps.client.request<{ children?: unknown[] }>({
          method: 'GET',
          path: `/spaces/${space_id}/nodes/${node_id}`,
          feature: 'nodes.children',
        });

        return ok(
          {
            node: data,
            children: data.children ?? [],
          },
          meta,
        );
      },
    },
  );

  registerTool(
    server,
    deps,
    {
      name: 'vika_nodes_search',
      description: 'Search nodes in a space via the official v2 search endpoint.',
      inputSchema: z.object({
        space_id: spaceIdSchema,
        type: z.number().int().optional().describe('Node type: datasheet=0, mirror=1, folder=2, form=3, dashboard=4.'),
        permissions: z.array(z.number().int()).optional(),
        query: z.string().optional(),
      }),
      readOnly: true,
      execute: async ({ space_id, type, permissions, query }) => {
        const { data, meta } = await deps.client.request({
          method: 'GET',
          version: 'v2',
          path: `/spaces/${space_id}/nodes`,
          query: {
            type,
            permissions,
            query,
          },
          feature: 'nodes.search',
        });
        return ok(data, meta);
      },
    },
  );

  registerTool(
    server,
    deps,
    {
      name: 'vika_resolve_node',
      description: 'Resolve a node by exact name or explicit node_id.',
      inputSchema: z.object({
        space_id: spaceIdSchema,
        node_id: nodeIdSchema.optional(),
        node_name: z.string().min(1).optional(),
        parent_id: nodeIdSchema.optional(),
        type: z.number().int().optional(),
        permissions: z.array(z.number().int()).optional(),
      }),
      readOnly: true,
      execute: async ({ space_id, node_id, node_name, parent_id, type, permissions }) => {
        const resolved = await deps.resolvers.resolveNode({
          spaceId: space_id,
          nodeId: node_id,
          nodeName: node_name,
          parentId: parent_id,
          type,
          permissions,
        });
        return ok(resolved);
      },
    },
  );

  registerTool(
    server,
    deps,
    {
      name: 'vika_resolve_datasheet',
      description: 'Resolve a datasheet node by exact name or explicit node_id.',
      inputSchema: z.object({
        space_id: spaceIdSchema,
        node_id: nodeIdSchema.optional(),
        node_name: z.string().min(1).optional(),
        parent_id: nodeIdSchema.optional(),
        permissions: z.array(z.number().int()).optional(),
      }),
      readOnly: true,
      execute: async ({ space_id, node_id, node_name, parent_id, permissions }) => {
        const resolved = await deps.resolvers.resolveDatasheet({
          spaceId: space_id,
          nodeId: node_id,
          nodeName: node_name,
          parentId: parent_id,
          permissions,
        });
        return ok(resolved);
      },
    },
  );
}
