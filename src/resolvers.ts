import { VikaClient } from './http/client.js';
import { VikaToolError } from './http/errors.js';
import type { NodeDetail, NodeSummary, ResolvedDatasheet, ResolvedNode } from './types.js';

export const NODE_TYPE = {
  DATASHEET: 0,
  MIRROR: 1,
  FOLDER: 2,
  FORM: 3,
  DASHBOARD: 4,
} as const;

interface ResolveNodeArgs {
  spaceId: string;
  nodeId?: string;
  nodeName?: string;
  parentId?: string;
  type?: number;
  permissions?: number[];
}

export class ResolverService {
  public constructor(private readonly client: VikaClient) {}

  public async resolveNode(args: ResolveNodeArgs): Promise<ResolvedNode> {
    if (args.nodeId) {
      const { data } = await this.client.request<NodeDetail>({
        method: 'GET',
        path: `/spaces/${args.spaceId}/nodes/${args.nodeId}`,
        feature: 'nodes.get',
      });

      return {
        space_id: args.spaceId,
        node_id: data.id,
        name: data.name,
        type: data.type,
      };
    }

    if (!args.nodeName) {
      throw new VikaToolError({
        category: 'validation',
        message: 'Either nodeId or nodeName is required.',
      });
    }

    if (args.parentId) {
      const { data } = await this.client.request<NodeDetail>({
        method: 'GET',
        path: `/spaces/${args.spaceId}/nodes/${args.parentId}`,
        feature: 'nodes.children',
      });

      const children = data.children ?? [];
      const exactChildren = children.filter(
        (node) => node.name === args.nodeName && (args.type === undefined || node.type === args.type),
      );
      return this.expectSingleNode(args.spaceId, exactChildren, args.nodeName, args.parentId);
    }

    const { data } = await this.client.request<{ nodes: NodeSummary[] }>({
      method: 'GET',
      version: 'v2',
      path: `/spaces/${args.spaceId}/nodes`,
      query: {
        type: args.type,
        permissions: args.permissions,
        query: args.nodeName,
      },
      feature: 'nodes.search',
    });

    const exactMatches = (data.nodes ?? []).filter(
      (node) =>
        node.name === args.nodeName &&
        (args.type === undefined || node.type === args.type) &&
        (args.parentId === undefined || node.parentId === args.parentId),
    );

    return this.expectSingleNode(args.spaceId, exactMatches, args.nodeName, args.parentId);
  }

  public async resolveDatasheet(args: Omit<ResolveNodeArgs, 'type'>): Promise<ResolvedDatasheet> {
    const node = await this.resolveNode({
      ...args,
      type: NODE_TYPE.DATASHEET,
    });

    return {
      ...node,
      datasheet_id: node.node_id,
    };
  }

  private expectSingleNode(
    spaceId: string,
    nodes: NodeSummary[],
    nodeName: string,
    parentId?: string,
  ): ResolvedNode {
    if (nodes.length === 0) {
      throw new VikaToolError({
        category: 'not_found',
        message: `Node "${nodeName}" was not found in space ${spaceId}${parentId ? ` under parent ${parentId}` : ''}.`,
      });
    }

    if (nodes.length > 1) {
      throw new VikaToolError({
        category: 'validation',
        message: `Node "${nodeName}" is ambiguous. Provide parent_id or node_id.`,
      });
    }

    const node = nodes[0]!;
    return {
      space_id: spaceId,
      node_id: node.id,
      name: node.name,
      type: node.type,
      parent_id: node.parentId,
      permission: node.permission,
    };
  }
}
