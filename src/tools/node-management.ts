import * as z from 'zod/v4';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { jsonObjectSchema, nodeIdSchema, spaceIdSchema } from '../schemas/common.js';
import { registerTool, type ToolDependencies, ok, requireDestructiveConfirmation } from './common.js';

export function registerNodeManagementTools(server: McpServer, deps: ToolDependencies): void {
  registerTool(
    server,
    deps,
    {
      name: 'create_node',
      description: 'Create a node (folder, form, mirror, or dashboard) under a space.',
      inputSchema: z.object({
        spaceId: spaceIdSchema,
        nodeName: z.string().min(1).optional().describe('Node name.'),
        type: z.string().min(1).describe('Node type: 1=folder, 2=datasheet, 3=form, 4=dashboard, 5=mirror.'),
        preNodeId: z.string().optional().describe('Position after this node. Empty means first position.'),
        parentId: z.string().optional().describe('Parent folder node ID.'),
        extra: jsonObjectSchema.optional().describe('Extra config, e.g. {datasheetId, viewId} for form/mirror creation.'),
        checkDuplicateName: z.boolean().optional().describe('Reject if a node with the same name already exists.'),
      }),
      execute: async ({ spaceId, nodeName, type, preNodeId, parentId, extra, checkDuplicateName }) => {
        const { data, meta } = await deps.client.request({
          method: 'POST',
          path: '/api/v1/node/create',
          body: { nodeName, type, preNodeId, parentId, extra, checkDuplicateName },
          headers: { 'X-Space-Id': spaceId },
          feature: 'create_node',
          idempotent: false,
        });
        return ok(data, meta);
      },
    },
  );

  registerTool(
    server,
    deps,
    {
      name: 'update_node',
      description: 'Update a node name, icon, or cover.',
      inputSchema: z.object({
        spaceId: spaceIdSchema,
        nodeId: nodeIdSchema,
        payload: jsonObjectSchema,
      }),
      execute: async ({ spaceId, nodeId, payload }) => {
        const { data, meta } = await deps.client.request({
          method: 'POST',
          path: `/api/v1/node/update/${nodeId}`,
          body: payload,
          headers: { 'X-Space-Id': spaceId },
          feature: 'update_node',
          idempotent: false,
        });
        return ok(data, meta);
      },
    },
  );

  registerTool(
    server,
    deps,
    {
      name: 'delete_node',
      description: 'Delete a node from a space.',
      inputSchema: z.object({
        spaceId: spaceIdSchema,
        nodeId: nodeIdSchema,
        confirm_destructive: z.boolean().optional(),
      }),
      execute: async ({ spaceId, nodeId, confirm_destructive }) => {
        requireDestructiveConfirmation(confirm_destructive);
        const { data, meta } = await deps.client.request({
          method: 'POST',
          path: `/api/v1/node/delete/${nodeId}`,
          headers: { 'X-Space-Id': spaceId },
          feature: 'delete_node',
          idempotent: false,
        });
        return ok(data, meta);
      },
    },
  );

  registerTool(
    server,
    deps,
    {
      name: 'copy_node',
      description: 'Copy a node to a target location.',
      inputSchema: z.object({
        spaceId: spaceIdSchema,
        payload: jsonObjectSchema.describe('Copy options including source nodeId and target parentId.'),
      }),
      execute: async ({ spaceId, payload }) => {
        const { data, meta } = await deps.client.request({
          method: 'POST',
          path: '/api/v1/node/copy',
          body: payload,
          headers: { 'X-Space-Id': spaceId },
          feature: 'copy_node',
          idempotent: false,
        });
        return ok(data, meta);
      },
    },
  );

  registerTool(
    server,
    deps,
    {
      name: 'move_node',
      description: 'Move a node to a target folder.',
      inputSchema: z.object({
        spaceId: spaceIdSchema,
        payload: jsonObjectSchema.describe('Move options including source nodeId and target parentId.'),
      }),
      execute: async ({ spaceId, payload }) => {
        const { data, meta } = await deps.client.request({
          method: 'POST',
          path: '/api/v1/node/move',
          body: payload,
          headers: { 'X-Space-Id': spaceId },
          feature: 'move_node',
          idempotent: false,
        });
        return ok(data, meta);
      },
    },
  );

  registerTool(
    server,
    deps,
    {
      name: 'recover_node',
      description: 'Recover a node from the recycle bin.',
      inputSchema: z.object({
        spaceId: spaceIdSchema,
        payload: jsonObjectSchema.describe('Recover options including nodeId.'),
      }),
      execute: async ({ spaceId, payload }) => {
        const { data, meta } = await deps.client.request({
          method: 'POST',
          path: '/api/v1/node/rubbish/recover',
          body: payload,
          headers: { 'X-Space-Id': spaceId },
          feature: 'recover_node',
          idempotent: false,
        });
        return ok(data, meta);
      },
    },
  );

  registerTool(
    server,
    deps,
    {
      name: 'get_node_showcase',
      description: 'Get node showcase details by nodeId.',
      inputSchema: z.object({
        spaceId: spaceIdSchema,
        nodeId: nodeIdSchema,
      }),
      readOnly: true,
      execute: async ({ spaceId, nodeId }) => {
        const { data, meta } = await deps.client.request({
          method: 'GET',
          path: '/api/v1/node/showcase',
          query: { nodeId },
          headers: { 'X-Space-Id': spaceId },
          feature: 'get_node_showcase',
        });
        return ok(data, meta);
      },
    },
  );
}
