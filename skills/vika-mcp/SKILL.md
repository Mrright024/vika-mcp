---
name: vika-mcp
description: Use when an agent needs to work with Vika datasheets through the configured vika-mcp MCP server or the published npm package. Covers discovery, datasheet resolution, field inspection, record CRUD, attachments, views, teams, roles, and deployment-sensitive endpoints. Prefer this skill over direct HTTP when the vika-mcp tools are available.
---

# Vika MCP

Use this skill to operate Vika through `vika-mcp` tools instead of composing raw HTTP requests.

## Hard Rules

- Prefer `vika-mcp` tools over direct API calls whenever the MCP server is available.
- Resolve IDs from names before mutating data if the user gives datasheet or node names instead of explicit IDs.
- List fields before creating or updating records unless the user already supplied verified field IDs.
- Prefer `fieldKey: "id"` for record writes to avoid breakage from field renames.
- Treat `feature_unavailable` on views, org APIs, and AI endpoints as a deployment capability signal, not a transient error.
- Require clear user intent before using any tool that needs `confirm_destructive: true`.

## Default Workflow

1. Confirm the `vika-mcp` server is configured and reachable.
2. If IDs are unknown, call `vika_spaces_list`, then resolve the target with `vika_resolve_datasheet` or `vika_resolve_node`.
3. Before record mutations, call `vika_fields_list` to learn field IDs and field types.
4. For reads, use `vika_records_list` or `vika_record_get`.
5. For writes, use `vika_records_create` or `vika_records_update`.
6. For attachments, upload first, then patch the record with the returned attachment payload.
7. For schema, view, or org changes, read [references/workflows.md](references/workflows.md) before acting.

## Tool Selection

- Discovery:
  - `vika_spaces_list`
  - `vika_nodes_list`
  - `vika_nodes_children_list`
  - `vika_nodes_search`
  - `vika_resolve_node`
  - `vika_resolve_datasheet`
- Records:
  - `vika_records_list`
  - `vika_record_get`
  - `vika_records_create`
  - `vika_records_update`
  - `vika_records_delete`
- Schema and attachments:
  - `vika_fields_list`
  - `vika_fields_create`
  - `vika_fields_update`
  - `vika_fields_delete`
  - `vika_datasheets_create`
  - `vika_attachment_upload`
- Views and org:
  - `vika_views_list`
  - `vika_views_create`
  - `vika_views_update`
  - `vika_views_delete`
  - `vika_members_list`
  - `vika_teams_list`
  - `vika_teams_create`
  - `vika_teams_update`
  - `vika_teams_delete`
  - `vika_roles_list`
  - `vika_roles_create`
  - `vika_roles_update`
  - `vika_roles_delete`
- Misc:
  - `vika_embedlinks_list`
  - `vika_embedlinks_create`
  - `vika_embedlinks_delete`
  - `vika_ai_request`

## Response Pattern

- Return concrete IDs when you discover them.
- When a tool fails, surface the structured error category and request the next missing input only if needed.
- If a destructive operation is requested, restate what will be changed before calling the tool.

## References

- For common task sequences and payload tips, read [references/workflows.md](references/workflows.md).
