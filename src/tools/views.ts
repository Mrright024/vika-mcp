import * as z from 'zod/v4';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { datasheetIdSchema, jsonObjectSchema, spaceIdSchema, viewIdSchema } from '../schemas/common.js';
import { registerTool, type ToolDependencies, ok, requireDestructiveConfirmation } from './common.js';

export function registerViewTools(server: McpServer, deps: ToolDependencies): void {
  registerTool(
    server,
    deps,
    {
      name: 'vika_views_list',
      description: 'List views for a datasheet.',
      inputSchema: z.object({
        datasheet_id: datasheetIdSchema,
      }),
      readOnly: true,
      execute: async ({ datasheet_id }) => {
        const { data, meta } = await deps.client.request({
          method: 'GET',
          path: `/datasheets/${datasheet_id}/views`,
          feature: 'views.list',
        });
        return ok(data, meta);
      },
    },
  );

  registerTool(
    server,
    deps,
    {
      name: 'vika_views_create',
      description: 'Create a view in a datasheet.',
      inputSchema: z.object({
        space_id: spaceIdSchema,
        datasheet_id: datasheetIdSchema,
        payload: jsonObjectSchema,
        confirm_destructive: z.boolean().optional(),
      }),
      execute: async ({ space_id, datasheet_id, payload, confirm_destructive }) => {
        requireDestructiveConfirmation(confirm_destructive);
        const { data, meta } = await deps.client.request({
          method: 'POST',
          path: `/spaces/${space_id}/datasheets/${datasheet_id}/views`,
          body: payload,
          feature: 'views.create',
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
      name: 'vika_views_update',
      description: 'Update a datasheet view.',
      inputSchema: z.object({
        space_id: spaceIdSchema,
        datasheet_id: datasheetIdSchema,
        view_id: viewIdSchema,
        payload: jsonObjectSchema,
        confirm_destructive: z.boolean().optional(),
      }),
      execute: async ({ space_id, datasheet_id, view_id, payload, confirm_destructive }) => {
        requireDestructiveConfirmation(confirm_destructive);
        const { data, meta } = await deps.client.request({
          method: 'PATCH',
          path: `/spaces/${space_id}/datasheets/${datasheet_id}/views/${view_id}`,
          body: payload,
          feature: 'views.update',
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
      name: 'vika_views_delete',
      description: 'Delete a datasheet view.',
      inputSchema: z.object({
        space_id: spaceIdSchema,
        datasheet_id: datasheetIdSchema,
        view_id: viewIdSchema,
        confirm_destructive: z.boolean().optional(),
      }),
      execute: async ({ space_id, datasheet_id, view_id, confirm_destructive }) => {
        requireDestructiveConfirmation(confirm_destructive);
        const { data, meta } = await deps.client.request({
          method: 'DELETE',
          path: `/spaces/${space_id}/datasheets/${datasheet_id}/views/${view_id}`,
          feature: 'views.delete',
          idempotent: false,
        });
        return ok(data, meta);
      },
    },
  );
}
