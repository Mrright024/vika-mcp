import * as z from 'zod/v4';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { datasheetIdSchema, jsonObjectSchema, nodeIdSchema, spaceIdSchema } from '../schemas/common.js';
import { registerTool, type ToolDependencies, ok } from './common.js';

export function registerDatasheetTools(server: McpServer, deps: ToolDependencies): void {
  registerTool(
    server,
    deps,
    {
      name: 'upload_attachments',
      description: 'Upload a single file to a datasheet attachment endpoint.',
      inputSchema: z.object({
        datasheetId: datasheetIdSchema,
        filePath: z.string().min(1),
        fileName: z.string().optional(),
        mimeType: z.string().optional(),
      }),
      execute: async ({ datasheetId, filePath, fileName, mimeType }) => {
        const form = await deps.client.createSingleFileFormData(filePath, fileName, mimeType);
        const { data, meta } = await deps.client.request({
          method: 'POST',
          path: `/datasheets/${datasheetId}/attachments`,
          formData: form,
          feature: 'upload_attachments',
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
      name: 'get_embedlinks',
      description: 'List embed links for a datasheet node.',
      inputSchema: z.object({
        spaceId: spaceIdSchema,
        nodeId: nodeIdSchema.describe('Datasheet node ID.'),
      }),
      readOnly: true,
      execute: async ({ spaceId, nodeId }) => {
        const { data, meta } = await deps.client.request({
          method: 'GET',
          path: `/spaces/${spaceId}/nodes/${nodeId}/embedlinks`,
          feature: 'get_embedlinks',
        });
        return ok(data, meta);
      },
    },
  );

  registerTool(
    server,
    deps,
    {
      name: 'create_embedlinks',
      description: 'Create an embed link for a datasheet node.',
      inputSchema: z.object({
        spaceId: spaceIdSchema,
        nodeId: nodeIdSchema,
        payload: jsonObjectSchema,
      }),
      execute: async ({ spaceId, nodeId, payload }) => {
        const { data, meta } = await deps.client.request({
          method: 'POST',
          path: `/spaces/${spaceId}/nodes/${nodeId}/embedlinks`,
          body: payload,
          feature: 'create_embedlinks',
          idempotent: false,
        });
        return ok(data, meta);
      },
    },
  );
}
