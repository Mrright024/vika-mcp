import * as z from 'zod/v4';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { datasheetIdSchema, jsonObjectSchema, paginationShape } from '../schemas/common.js';
import { registerTool, type ToolDependencies, ok, requireDestructiveConfirmation } from './common.js';

export function registerRecordTools(server: McpServer, deps: ToolDependencies): void {
  registerTool(
    server,
    deps,
    {
      name: 'get_records',
      description: 'List datasheet records with filtering, pagination, sorting, and view support.',
      inputSchema: z.object({
        datasheetId: datasheetIdSchema,
        ...paginationShape,
        maxRecords: z.number().int().min(1).max(1000).optional(),
        sort: jsonObjectSchema.optional(),
        recordIds: z.array(z.string()).optional(),
        viewId: z.string().optional(),
        fields: z.array(z.string()).optional(),
        filterByFormula: z.string().optional(),
        cellFormat: z.enum(['json', 'string']).optional(),
      }),
      readOnly: true,
      execute: async ({ datasheetId, sort, recordIds, fields, ...query }) => {
        const { data, meta } = await deps.client.request({
          method: 'GET',
          path: `/datasheets/${datasheetId}/records`,
          query: {
            ...query,
            sort: sort ? JSON.stringify(sort) : undefined,
            recordIds: recordIds?.join(','),
            fields: fields?.join(','),
          },
          feature: 'get_records',
        });
        return ok(data, meta);
      },
    },
  );

  registerTool(
    server,
    deps,
    {
      name: 'create_records',
      description: 'Create up to 10 records in a datasheet.',
      inputSchema: z.object({
        datasheetId: datasheetIdSchema,
        records: z.array(jsonObjectSchema).min(1).max(10),
      }),
      execute: async ({ datasheetId, records }) => {
        const { data, meta } = await deps.client.request({
          method: 'POST',
          path: `/datasheets/${datasheetId}/records`,
          body: {
            records,
          },
          feature: 'create_records',
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
      name: 'update_records',
      description: 'Update up to 10 records in a datasheet.',
      inputSchema: z.object({
        datasheetId: datasheetIdSchema,
        records: z.array(jsonObjectSchema).min(1).max(10),
      }),
      execute: async ({ datasheetId, records }) => {
        const { data, meta } = await deps.client.request({
          method: 'PATCH',
          path: `/datasheets/${datasheetId}/records`,
          body: {
            records,
          },
          feature: 'update_records',
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
      name: 'delete_records',
      description: 'Delete up to 10 records from a datasheet.',
      inputSchema: z.object({
        datasheetId: datasheetIdSchema,
        recordIds: z.array(z.string().min(1)).min(1).max(10),
        confirm_destructive: z.boolean().optional(),
      }),
      execute: async ({ datasheetId, recordIds, confirm_destructive }) => {
        requireDestructiveConfirmation(confirm_destructive);
        const { data, meta } = await deps.client.request({
          method: 'DELETE',
          path: `/datasheets/${datasheetId}/records`,
          query: {
            recordIds: recordIds.join(','),
          },
          feature: 'delete_records',
          idempotent: false,
        });
        return ok(data, meta);
      },
    },
  );
}
