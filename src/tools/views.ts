import * as z from 'zod/v4';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { datasheetIdSchema, jsonObjectSchema } from '../schemas/common.js';
import { registerTool, type ToolDependencies, ok, requireDestructiveConfirmation } from './common.js';

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

  registerTool(
    server,
    deps,
    {
      name: 'create_view',
      description: 'Create a new view for a datasheet.',
      inputSchema: z.object({
        datasheetId: datasheetIdSchema,
        payload: jsonObjectSchema.describe('View definition including name and type.'),
      }),
      execute: async ({ datasheetId, payload }) => {
        const { data, meta } = await deps.client.request({
          method: 'POST',
          path: `/datasheets/${datasheetId}/views`,
          body: payload,
          feature: 'create_view',
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
      name: 'delete_view',
      description: 'Delete a view from a datasheet.',
      inputSchema: z.object({
        datasheetId: datasheetIdSchema,
        viewId: z.string().min(1).describe('View ID to delete.'),
        confirm_destructive: z.boolean().optional(),
      }),
      execute: async ({ datasheetId, viewId, confirm_destructive }) => {
        requireDestructiveConfirmation(confirm_destructive);
        const { data, meta } = await deps.client.request({
          method: 'DELETE',
          path: `/datasheets/${datasheetId}/views/${viewId}`,
          feature: 'delete_view',
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
      name: 'update_view',
      description: 'Edit or reposition a view in a datasheet.',
      inputSchema: z.object({
        datasheetId: datasheetIdSchema,
        viewId: z.string().min(1).describe('View ID to update.'),
        payload: jsonObjectSchema.describe('View properties to update.'),
      }),
      execute: async ({ datasheetId, viewId, payload }) => {
        const { data, meta } = await deps.client.request({
          method: 'PATCH',
          path: `/datasheets/${datasheetId}/views/${viewId}`,
          body: payload,
          feature: 'update_view',
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
      name: 'copy_view',
      description: 'Copy a view within a datasheet.',
      inputSchema: z.object({
        datasheetId: datasheetIdSchema,
        viewId: z.string().min(1).describe('Source view ID to copy.'),
        payload: jsonObjectSchema.optional().describe('Copy options, e.g. new view name.'),
      }),
      execute: async ({ datasheetId, viewId, payload }) => {
        const { data, meta } = await deps.client.request({
          method: 'POST',
          path: `/datasheets/${datasheetId}/views/${viewId}/copy`,
          body: payload,
          feature: 'copy_view',
          idempotent: false,
        });
        return ok(data, meta);
      },
    },
  );
}
