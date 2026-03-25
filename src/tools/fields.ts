import * as z from 'zod/v4';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { datasheetIdSchema, fieldIdSchema, jsonObjectSchema, spaceIdSchema } from '../schemas/common.js';
import { registerTool, type ToolDependencies, ok, requireDestructiveConfirmation } from './common.js';

export function registerFieldTools(server: McpServer, deps: ToolDependencies): void {
  registerTool(
    server,
    deps,
    {
      name: 'vika_fields_list',
      description: 'List fields for a datasheet.',
      inputSchema: z.object({
        datasheet_id: datasheetIdSchema,
      }),
      readOnly: true,
      execute: async ({ datasheet_id }) => {
        const { data, meta } = await deps.client.request({
          method: 'GET',
          path: `/datasheets/${datasheet_id}/fields`,
          feature: 'fields.list',
        });
        return ok(data, meta);
      },
    },
  );

  registerTool(
    server,
    deps,
    {
      name: 'vika_fields_create',
      description: 'Create a field in a datasheet.',
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
          path: `/spaces/${space_id}/datasheets/${datasheet_id}/fields`,
          body: payload,
          feature: 'fields.create',
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
      name: 'vika_fields_update',
      description: 'Update a field in a datasheet. This is a best-effort wrapper over the documented field detail endpoint.',
      inputSchema: z.object({
        space_id: spaceIdSchema,
        datasheet_id: datasheetIdSchema,
        field_id: fieldIdSchema,
        payload: jsonObjectSchema,
        confirm_destructive: z.boolean().optional(),
      }),
      execute: async ({ space_id, datasheet_id, field_id, payload, confirm_destructive }) => {
        requireDestructiveConfirmation(confirm_destructive);
        const { data, meta } = await deps.client.request({
          method: 'PATCH',
          path: `/spaces/${space_id}/datasheets/${datasheet_id}/fields/${field_id}`,
          body: payload,
          feature: 'fields.update',
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
      name: 'vika_fields_delete',
      description: 'Delete a field in a datasheet.',
      inputSchema: z.object({
        space_id: spaceIdSchema,
        datasheet_id: datasheetIdSchema,
        field_id: fieldIdSchema,
        confirm_destructive: z.boolean().optional(),
      }),
      execute: async ({ space_id, datasheet_id, field_id, confirm_destructive }) => {
        requireDestructiveConfirmation(confirm_destructive);
        const { data, meta } = await deps.client.request({
          method: 'DELETE',
          path: `/spaces/${space_id}/datasheets/${datasheet_id}/fields/${field_id}`,
          feature: 'fields.delete',
          idempotent: false,
        });
        return ok(data, meta);
      },
    },
  );
}
