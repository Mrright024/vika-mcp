import * as z from 'zod/v4';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { datasheetIdSchema, fieldIdSchema, jsonObjectSchema, spaceIdSchema, viewIdSchema } from '../schemas/common.js';
import { registerTool, type ToolDependencies, ok, requireDestructiveConfirmation } from './common.js';

export function registerFieldTools(server: McpServer, deps: ToolDependencies): void {
  registerTool(
    server,
    deps,
    {
      name: 'get_fields',
      description: 'List fields for a datasheet.',
      inputSchema: z.object({
        datasheetId: datasheetIdSchema,
        viewId: viewIdSchema.optional(),
      }),
      readOnly: true,
      execute: async ({ datasheetId, viewId }) => {
        const { data, meta } = await deps.client.request({
          method: 'GET',
          path: `/datasheets/${datasheetId}/fields`,
          query: { viewId },
          feature: 'get_fields',
        });
        return ok(data, meta);
      },
    },
  );

  registerTool(
    server,
    deps,
    {
      name: 'create_fields',
      description: 'Create a field in a datasheet.',
      inputSchema: z.object({
        spaceId: spaceIdSchema,
        datasheetId: datasheetIdSchema,
        type: z.string().min(1).describe('Field type, for example SingleText, Number, DateTime.'),
        name: z.string().min(1).describe('Field name.'),
        property: jsonObjectSchema.optional().describe('Field properties matching the field type.'),
      }),
      execute: async ({ spaceId, datasheetId, type, name, property }) => {
        const { data, meta } = await deps.client.request({
          method: 'POST',
          path: `/spaces/${spaceId}/datasheets/${datasheetId}/fields`,
          body: { type, name, property },
          feature: 'create_fields',
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
      name: 'delete_fields',
      description: 'Delete a field from a datasheet.',
      inputSchema: z.object({
        spaceId: spaceIdSchema,
        datasheetId: datasheetIdSchema,
        fieldId: fieldIdSchema,
        confirm_destructive: z.boolean().optional(),
      }),
      execute: async ({ spaceId, datasheetId, fieldId, confirm_destructive }) => {
        requireDestructiveConfirmation(confirm_destructive);
        const { data, meta } = await deps.client.request({
          method: 'DELETE',
          path: `/spaces/${spaceId}/datasheets/${datasheetId}/fields/${fieldId}`,
          feature: 'delete_fields',
          idempotent: false,
        });
        return ok(data, meta);
      },
    },
  );
}
