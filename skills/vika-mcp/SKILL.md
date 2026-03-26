---
name: vika-mcp
description: Use when an agent needs to work with Vika through the configured vika-mcp MCP server. The MCP tool names mirror the official Vika API reference page slugs in snake_case. Prefer these tools over direct HTTP when the server is available.
---

# Vika MCP

Use this skill to operate Vika through the `vika-mcp` MCP tools instead of composing raw HTTP requests.

## Hard Rules

- Prefer `vika-mcp` tools over direct API calls whenever the MCP server is available.
- Keep tool selection aligned with the public Vika API reference.
- Resolve targets with `get_spaces`, `search_nodes`, and `get_node_details` before mutating records when the user provides names instead of IDs.
- Read `get_fields` before record writes unless the user already supplied verified field names and values.
- Use `get_records` with `recordIds` for narrow reads instead of inventing an extra single-record flow.
- Treat `403` from node, member, or folder reads as a resource-level permission issue, not as proof the whole endpoint family is unavailable.
- Require clear user intent before using any tool that needs `confirm_destructive: true`.

## Default Workflow

1. Confirm the `vika-mcp` MCP server is configured and reachable.
2. If `spaceId` is unknown, call `get_spaces`.
3. If `nodeId` or `datasheetId` is unknown, call `search_nodes` and, when needed, `get_node_details`.
4. Before record mutations, call `get_fields`.
5. For reads, use `get_records`.
6. For writes, use `create_records` or `update_records`.
7. For attachments, upload first with `upload_attachments`, then patch the record with the returned attachment payload.
8. For org operations or delete operations, read [references/workflows.md](references/workflows.md) before acting.

## Tool Surface

- Records:
  - `get_records`
  - `create_records`
  - `update_records`
  - `delete_records`
- Datasheet reads:
  - `get_fields`
  - `get_views`
  - `upload_attachments`
- Space and nodes:
  - `get_spaces`
  - `get_nodes`
  - `search_nodes`
  - `get_node_details`
  - `create_embedlinks`
  - `get_embedlinks`
- Org:
  - `get_a_member`
  - `update_a_member`
  - `delete_a_member`
  - `list_the_team_members`
  - `list_teams`
  - `create_a_team`
  - `update_a_team`
  - `delete_a_team`
  - `list_units_under_the_role`
  - `list_roles`
  - `create_a_role`
  - `update_a_role`
  - `delete_a_role`
- AI:
  - `create_chat_completions`

## Response Pattern

- Return the concrete IDs you discover, especially `spaceId`, `nodeId`, `datasheetId`, `teamId`, `roleId`, and `memberId`.
- When a tool fails, surface the structured error category and request only the next missing input.
- If a delete operation is requested, restate what will be removed before calling the tool.

## References

- For common task sequences and payload tips, read [references/workflows.md](references/workflows.md).
