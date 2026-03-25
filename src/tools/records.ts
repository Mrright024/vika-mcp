import * as z from 'zod/v4';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import {
  datasheetIdSchema,
  jsonObjectSchema,
  optionalStringArraySchema,
  paginationShape,
  recordIdSchema,
} from '../schemas/common.js';
import { registerTool, type ToolDependencies, ok, requireDestructiveConfirmation } from './common.js';

const fieldKeySchema = z.enum(['id', 'name']).optional();

export function registerRecordTools(server: McpServer, deps: ToolDependencies): void {
  registerTool(
    server,
    deps,
    {
      name: 'vika_records_list',
      description: 'List datasheet records with filtering, pagination, sorting, and view support.',
      inputSchema: z.object({
        datasheet_id: datasheetIdSchema,
        ...paginationShape,
        maxRecords: z.number().int().min(1).max(1000).optional(),
        sort: z.array(jsonObjectSchema).optional(),
        recordIds: z.array(z.string()).optional(),
        viewId: z.string().optional(),
        fields: z.array(z.string()).optional(),
        filterByFormula: z.string().optional(),
        cellFormat: z.enum(['json', 'string']).optional(),
        fieldKey: fieldKeySchema,
      }),
      readOnly: true,
      execute: async ({ datasheet_id, ...query }) => {
        const { data, meta } = await deps.client.request({
          method: 'GET',
          path: `/datasheets/${datasheet_id}/records`,
          query,
          feature: 'records.list',
        });
        return ok(data, meta);
      },
    },
  );

  registerTool(
    server,
    deps,
    {
      name: 'vika_record_get',
      description: 'Get a single record by record_id using the official recordIds query parameter.',
      inputSchema: z.object({
        datasheet_id: datasheetIdSchema,
        record_id: recordIdSchema,
        fieldKey: fieldKeySchema,
      }),
      readOnly: true,
      execute: async ({ datasheet_id, record_id, fieldKey }) => {
        const { data, meta } = await deps.client.request<{ records?: unknown[] }>({
          method: 'GET',
          path: `/datasheets/${datasheet_id}/records`,
          query: {
            recordIds: [record_id],
            fieldKey,
          },
          feature: 'records.get',
        });

        return ok(
          {
            record: data.records?.[0] ?? null,
            raw: data,
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
      name: 'vika_records_create',
      description: 'Create up to 10 records in a datasheet.',
      inputSchema: z.object({
        datasheet_id: datasheetIdSchema,
        records: z.array(jsonObjectSchema).min(1).max(10),
        fieldKey: fieldKeySchema,
      }),
      execute: async ({ datasheet_id, records, fieldKey }) => {
        const { data, meta } = await deps.client.request({
          method: 'POST',
          path: `/datasheets/${datasheet_id}/records`,
          query: {
            fieldKey,
          },
          body: {
            records,
            fieldKey,
          },
          feature: 'records.create',
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
      name: 'vika_records_update',
      description: 'Update up to 10 records in a datasheet.',
      inputSchema: z.object({
        datasheet_id: datasheetIdSchema,
        records: z.array(jsonObjectSchema).min(1).max(10),
        fieldKey: fieldKeySchema,
      }),
      execute: async ({ datasheet_id, records, fieldKey }) => {
        const { data, meta } = await deps.client.request({
          method: 'PATCH',
          path: `/datasheets/${datasheet_id}/records`,
          query: {
            fieldKey,
          },
          body: {
            records,
            fieldKey,
          },
          feature: 'records.update',
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
      name: 'vika_records_delete',
      description: 'Delete up to 10 records from a datasheet.',
      inputSchema: z.object({
        datasheet_id: datasheetIdSchema,
        record_ids: z.array(z.string().min(1)).min(1).max(10),
        confirm_destructive: z.boolean().optional(),
      }),
      execute: async ({ datasheet_id, record_ids, confirm_destructive }) => {
        requireDestructiveConfirmation(confirm_destructive);
        const { data, meta } = await deps.client.request({
          method: 'DELETE',
          path: `/datasheets/${datasheet_id}/records`,
          query: {
            recordIds: record_ids,
          },
          feature: 'records.delete',
          idempotent: false,
        });
        return ok(data, meta);
      },
    },
  );
}
