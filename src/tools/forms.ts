import * as z from 'zod/v4';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { jsonObjectSchema, nodeIdSchema, spaceIdSchema } from '../schemas/common.js';
import { registerTool, type ToolDependencies, ok } from './common.js';

export function registerFormTools(server: McpServer, deps: ToolDependencies): void {
  registerTool(
    server,
    deps,
    {
      name: 'get_form_fields',
      description: 'Query form field info for a form node.',
      inputSchema: z.object({
        spaceId: spaceIdSchema,
        formId: nodeIdSchema.describe('Form node ID.'),
      }),
      readOnly: true,
      execute: async ({ spaceId, formId }) => {
        const { data, meta } = await deps.client.request({
          method: 'GET',
          path: `/api/v1/form/${formId}/fields`,
          headers: { 'X-Space-Id': spaceId },
          feature: 'get_form_fields',
        });
        return ok(data, meta);
      },
    },
  );

  registerTool(
    server,
    deps,
    {
      name: 'submit_form',
      description: 'Submit data to a form.',
      inputSchema: z.object({
        spaceId: spaceIdSchema,
        formId: nodeIdSchema.describe('Form node ID.'),
        payload: jsonObjectSchema.describe('Form submission data keyed by field names.'),
      }),
      execute: async ({ spaceId, formId, payload }) => {
        const { data, meta } = await deps.client.request({
          method: 'POST',
          path: `/api/v1/form/${formId}/submit`,
          body: payload,
          headers: { 'X-Space-Id': spaceId },
          feature: 'submit_form',
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
      name: 'create_form_share_link',
      description: 'Generate a share link for a form.',
      inputSchema: z.object({
        spaceId: spaceIdSchema,
        formId: nodeIdSchema.describe('Form node ID.'),
        payload: jsonObjectSchema.optional().describe('Share link options.'),
      }),
      execute: async ({ spaceId, formId, payload }) => {
        const { data, meta } = await deps.client.request({
          method: 'POST',
          path: `/api/v1/form/${formId}/share`,
          body: payload,
          headers: { 'X-Space-Id': spaceId },
          feature: 'create_form_share_link',
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
      name: 'get_form_association',
      description: 'Query form and its associated datasheet info.',
      inputSchema: z.object({
        spaceId: spaceIdSchema,
        formId: nodeIdSchema.describe('Form node ID.'),
      }),
      readOnly: true,
      execute: async ({ spaceId, formId }) => {
        const { data, meta } = await deps.client.request({
          method: 'GET',
          path: `/api/v1/form/${formId}/association`,
          headers: { 'X-Space-Id': spaceId },
          feature: 'get_form_association',
        });
        return ok(data, meta);
      },
    },
  );

  registerTool(
    server,
    deps,
    {
      name: 'update_form_share',
      description: 'Update form share settings.',
      inputSchema: z.object({
        spaceId: spaceIdSchema,
        formId: nodeIdSchema.describe('Form node ID.'),
        payload: jsonObjectSchema.describe('Share settings to update.'),
      }),
      execute: async ({ spaceId, formId, payload }) => {
        const { data, meta } = await deps.client.request({
          method: 'POST',
          path: `/api/v1/form/${formId}/share/update`,
          body: payload,
          headers: { 'X-Space-Id': spaceId },
          feature: 'update_form_share',
          idempotent: false,
        });
        return ok(data, meta);
      },
    },
  );
}
