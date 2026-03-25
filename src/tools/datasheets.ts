import * as z from 'zod/v4';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { datasheetIdSchema, jsonObjectSchema, nodeIdSchema, spaceIdSchema } from '../schemas/common.js';
import { registerTool, type ToolDependencies, ok, requireDestructiveConfirmation } from './common.js';

export function registerDatasheetTools(server: McpServer, deps: ToolDependencies): void {
  registerTool(
    server,
    deps,
    {
      name: 'vika_datasheets_create',
      description: 'Create a datasheet in a space.',
      inputSchema: z.object({
        space_id: spaceIdSchema,
        payload: jsonObjectSchema,
        confirm_destructive: z.boolean().optional(),
      }),
      execute: async ({ space_id, payload, confirm_destructive }) => {
        requireDestructiveConfirmation(confirm_destructive);
        const { data, meta } = await deps.client.request({
          method: 'POST',
          path: `/spaces/${space_id}/datasheets`,
          body: payload,
          feature: 'datasheets.create',
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
      name: 'vika_attachment_upload',
      description: 'Upload a single file to a datasheet attachment endpoint.',
      inputSchema: z.object({
        datasheet_id: datasheetIdSchema,
        file_path: z.string().min(1),
        file_name: z.string().optional(),
        mime_type: z.string().optional(),
      }),
      execute: async ({ datasheet_id, file_path, file_name, mime_type }) => {
        const form = await deps.client.createSingleFileFormData(file_path, file_name, mime_type);
        const { data, meta } = await deps.client.request({
          method: 'POST',
          path: `/datasheets/${datasheet_id}/attachments`,
          formData: form,
          feature: 'attachments.upload',
          idempotent: false,
          timeoutMs: 120_000,
        });
        return ok(data, meta);
      },
    },
  );

  registerTool(
    server,
    deps,
    {
      name: 'vika_embedlinks_list',
      description: 'List embed links for a datasheet node.',
      inputSchema: z.object({
        space_id: spaceIdSchema,
        node_id: nodeIdSchema.describe('Datasheet node ID.'),
      }),
      readOnly: true,
      execute: async ({ space_id, node_id }) => {
        const { data, meta } = await deps.client.request({
          method: 'GET',
          path: `/spaces/${space_id}/nodes/${node_id}/embedlinks`,
          feature: 'embedlinks.list',
        });
        return ok(data, meta);
      },
    },
  );

  registerTool(
    server,
    deps,
    {
      name: 'vika_embedlinks_create',
      description: 'Create an embed link for a datasheet node.',
      inputSchema: z.object({
        space_id: spaceIdSchema,
        node_id: nodeIdSchema,
        payload: jsonObjectSchema,
      }),
      execute: async ({ space_id, node_id, payload }) => {
        const { data, meta } = await deps.client.request({
          method: 'POST',
          path: `/spaces/${space_id}/nodes/${node_id}/embedlinks`,
          body: payload,
          feature: 'embedlinks.create',
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
      name: 'vika_embedlinks_delete',
      description: 'Delete an embed link for a datasheet node.',
      inputSchema: z.object({
        space_id: spaceIdSchema,
        node_id: nodeIdSchema,
        link_id: z.string().min(1),
        confirm_destructive: z.boolean().optional(),
      }),
      execute: async ({ space_id, node_id, link_id, confirm_destructive }) => {
        requireDestructiveConfirmation(confirm_destructive);
        const { data, meta } = await deps.client.request({
          method: 'DELETE',
          path: `/spaces/${space_id}/nodes/${node_id}/embedlinks/${link_id}`,
          feature: 'embedlinks.delete',
          idempotent: false,
        });
        return ok(data, meta);
      },
    },
  );
}
