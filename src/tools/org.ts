import * as z from 'zod/v4';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { jsonObjectSchema, spaceIdSchema } from '../schemas/common.js';
import { registerTool, type ToolDependencies, ok, requireDestructiveConfirmation } from './common.js';

function registerUnitCrud(
  server: McpServer,
  deps: ToolDependencies,
  resource: 'teams' | 'roles',
  featurePrefix: string,
): void {
  registerTool(
    server,
    deps,
    {
      name: `vika_${resource}_list`,
      description: `List ${resource} for a space.`,
      inputSchema: z.object({
        space_id: spaceIdSchema,
        query: jsonObjectSchema.optional(),
      }),
      readOnly: true,
      execute: async ({ space_id, query }) => {
        const { data, meta } = await deps.client.request({
          method: 'GET',
          path: `/spaces/${space_id}/${resource}`,
          query,
          feature: `${featurePrefix}.list`,
        });
        return ok(data, meta);
      },
    },
  );

  registerTool(
    server,
    deps,
    {
      name: `vika_${resource}_create`,
      description: `Create a ${resource.slice(0, -1)} in a space.`,
      inputSchema: z.object({
        space_id: spaceIdSchema,
        payload: jsonObjectSchema,
        confirm_destructive: z.boolean().optional(),
      }),
      execute: async ({ space_id, payload, confirm_destructive }) => {
        requireDestructiveConfirmation(confirm_destructive);
        const { data, meta } = await deps.client.request({
          method: 'POST',
          path: `/spaces/${space_id}/${resource}`,
          body: payload,
          feature: `${featurePrefix}.create`,
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
      name: `vika_${resource}_update`,
      description: `Update a ${resource.slice(0, -1)} in a space.`,
      inputSchema: z.object({
        space_id: spaceIdSchema,
        unit_id: z.string().min(1).describe('Team or role unit ID from the official API.'),
        payload: jsonObjectSchema,
        confirm_destructive: z.boolean().optional(),
      }),
      execute: async ({ space_id, unit_id, payload, confirm_destructive }) => {
        requireDestructiveConfirmation(confirm_destructive);
        const { data, meta } = await deps.client.request({
          method: 'PUT',
          path: `/spaces/${space_id}/${resource}/${unit_id}`,
          body: payload,
          feature: `${featurePrefix}.update`,
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
      name: `vika_${resource}_delete`,
      description: `Delete a ${resource.slice(0, -1)} in a space.`,
      inputSchema: z.object({
        space_id: spaceIdSchema,
        unit_id: z.string().min(1),
        confirm_destructive: z.boolean().optional(),
      }),
      execute: async ({ space_id, unit_id, confirm_destructive }) => {
        requireDestructiveConfirmation(confirm_destructive);
        const { data, meta } = await deps.client.request({
          method: 'DELETE',
          path: `/spaces/${space_id}/${resource}/${unit_id}`,
          feature: `${featurePrefix}.delete`,
          idempotent: false,
        });
        return ok(data, meta);
      },
    },
  );
}

export function registerOrgTools(server: McpServer, deps: ToolDependencies): void {
  registerUnitCrud(server, deps, 'teams', 'teams');
  registerUnitCrud(server, deps, 'roles', 'roles');
}
