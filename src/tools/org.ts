import * as z from 'zod/v4';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { jsonObjectSchema, paginationShape, spaceIdSchema } from '../schemas/common.js';
import { registerTool, type ToolDependencies, ok, requireDestructiveConfirmation } from './common.js';

function registerRoleCrud(server: McpServer, deps: ToolDependencies): void {
  registerTool(
    server,
    deps,
    {
      name: 'list_roles',
      description: 'List roles for a space.',
      inputSchema: z.object({
        spaceId: spaceIdSchema,
        ...paginationShape,
      }),
      readOnly: true,
      execute: async ({ spaceId, pageSize, pageNum }) => {
        const { data, meta } = await deps.client.request({
          method: 'GET',
          path: `/spaces/${spaceId}/roles`,
          query: { pageSize, pageNum },
          feature: 'list_roles',
        });
        return ok(data, meta);
      },
    },
  );

  registerTool(
    server,
    deps,
    {
      name: 'create_a_role',
      description: 'Create a role in a space.',
      inputSchema: z.object({
        spaceId: spaceIdSchema,
        payload: jsonObjectSchema,
      }),
      execute: async ({ spaceId, payload }) => {
        const { data, meta } = await deps.client.request({
          method: 'POST',
          path: `/spaces/${spaceId}/roles`,
          body: payload,
          feature: 'create_a_role',
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
      name: 'update_a_role',
      description: 'Update a role in a space.',
      inputSchema: z.object({
        spaceId: spaceIdSchema,
        roleId: z.string().min(1).describe('Role unit ID from the official API.'),
        payload: jsonObjectSchema,
      }),
      execute: async ({ spaceId, roleId, payload }) => {
        const { data, meta } = await deps.client.request({
          method: 'PUT',
          path: `/spaces/${spaceId}/roles/${roleId}`,
          body: payload,
          feature: 'update_a_role',
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
      name: 'delete_a_role',
      description: 'Delete a role in a space.',
      inputSchema: z.object({
        spaceId: spaceIdSchema,
        roleId: z.string().min(1),
        confirm_destructive: z.boolean().optional(),
      }),
      execute: async ({ spaceId, roleId, confirm_destructive }) => {
        requireDestructiveConfirmation(confirm_destructive);
        const { data, meta } = await deps.client.request({
          method: 'DELETE',
          path: `/spaces/${spaceId}/roles/${roleId}`,
          feature: 'delete_a_role',
          idempotent: false,
        });
        return ok(data, meta);
      },
    },
  );
}

export function registerOrgTools(server: McpServer, deps: ToolDependencies): void {
  registerTool(
    server,
    deps,
    {
      name: 'get_a_member',
      description: 'Get a member in a space.',
      inputSchema: z.object({
        spaceId: spaceIdSchema,
        memberId: z.string().min(1),
        sensitiveData: z.boolean().optional(),
      }),
      readOnly: true,
      execute: async ({ spaceId, memberId, sensitiveData }) => {
        const { data, meta } = await deps.client.request({
          method: 'GET',
          path: `/spaces/${spaceId}/members/${memberId}`,
          query: { sensitiveData },
          feature: 'get_a_member',
        });
        return ok(data, meta);
      },
    },
  );

  registerTool(
    server,
    deps,
    {
      name: 'update_a_member',
      description: 'Update a member in a space.',
      inputSchema: z.object({
        spaceId: spaceIdSchema,
        memberId: z.string().min(1),
        payload: jsonObjectSchema,
      }),
      execute: async ({ spaceId, memberId, payload }) => {
        const { data, meta } = await deps.client.request({
          method: 'PUT',
          path: `/spaces/${spaceId}/members/${memberId}`,
          body: payload,
          feature: 'update_a_member',
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
      name: 'delete_a_member',
      description: 'Delete a member from a space.',
      inputSchema: z.object({
        spaceId: spaceIdSchema,
        memberId: z.string().min(1),
        confirm_destructive: z.boolean().optional(),
      }),
      execute: async ({ spaceId, memberId, confirm_destructive }) => {
        requireDestructiveConfirmation(confirm_destructive);
        const { data, meta } = await deps.client.request({
          method: 'DELETE',
          path: `/spaces/${spaceId}/members/${memberId}`,
          feature: 'delete_a_member',
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
      name: 'list_the_team_members',
      description: 'List members under a team.',
      inputSchema: z.object({
        spaceId: spaceIdSchema,
        teamId: z.string().min(1),
        ...paginationShape,
        sensitiveData: z.boolean().optional(),
      }),
      readOnly: true,
      execute: async ({ spaceId, teamId, pageSize, pageNum, sensitiveData }) => {
        const { data, meta } = await deps.client.request({
          method: 'GET',
          path: `/spaces/${spaceId}/teams/${teamId}/members`,
          query: { pageSize, pageNum, sensitiveData },
          feature: 'list_the_team_members',
        });
        return ok(data, meta);
      },
    },
  );

  registerTool(
    server,
    deps,
    {
      name: 'list_teams',
      description: 'List child teams under a team. Use teamId=0 for top-level teams.',
      inputSchema: z.object({
        spaceId: spaceIdSchema,
        teamId: z.string().min(1).default('0'),
        ...paginationShape,
      }),
      readOnly: true,
      execute: async ({ spaceId, teamId, pageSize, pageNum }) => {
        const { data, meta } = await deps.client.request({
          method: 'GET',
          path: `/spaces/${spaceId}/teams/${teamId}/children`,
          query: { pageSize, pageNum },
          feature: 'list_teams',
        });
        return ok(data, meta);
      },
    },
  );

  registerTool(
    server,
    deps,
    {
      name: 'create_a_team',
      description: 'Create a team in a space.',
      inputSchema: z.object({
        spaceId: spaceIdSchema,
        payload: jsonObjectSchema,
      }),
      execute: async ({ spaceId, payload }) => {
        const { data, meta } = await deps.client.request({
          method: 'POST',
          path: `/spaces/${spaceId}/teams`,
          body: payload,
          feature: 'create_a_team',
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
      name: 'update_a_team',
      description: 'Update a team in a space.',
      inputSchema: z.object({
        spaceId: spaceIdSchema,
        teamId: z.string().min(1),
        payload: jsonObjectSchema,
      }),
      execute: async ({ spaceId, teamId, payload }) => {
        const { data, meta } = await deps.client.request({
          method: 'PUT',
          path: `/spaces/${spaceId}/teams/${teamId}`,
          body: payload,
          feature: 'update_a_team',
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
      name: 'delete_a_team',
      description: 'Delete a team in a space.',
      inputSchema: z.object({
        spaceId: spaceIdSchema,
        teamId: z.string().min(1),
        confirm_destructive: z.boolean().optional(),
      }),
      execute: async ({ spaceId, teamId, confirm_destructive }) => {
        requireDestructiveConfirmation(confirm_destructive);
        const { data, meta } = await deps.client.request({
          method: 'DELETE',
          path: `/spaces/${spaceId}/teams/${teamId}`,
          feature: 'delete_a_team',
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
      name: 'list_units_under_the_role',
      description: 'List member and team units under a role.',
      inputSchema: z.object({
        spaceId: spaceIdSchema,
        roleId: z.string().min(1),
      }),
      readOnly: true,
      execute: async ({ spaceId, roleId }) => {
        const { data, meta } = await deps.client.request({
          method: 'GET',
          path: `/spaces/${spaceId}/roles/${roleId}/units`,
          feature: 'list_units_under_the_role',
        });
        return ok(data, meta);
      },
    },
  );

  registerRoleCrud(server, deps);
}
