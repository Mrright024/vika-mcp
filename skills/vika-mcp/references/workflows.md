# Vika MCP Workflows

## Resolve a datasheet from names

Use this sequence when the user gives names instead of IDs:

1. Call `get_spaces` if `spaceId` is unknown.
2. Call `search_nodes` with `spaceId`, `type: "Datasheet"`, and the target name in `query`.
3. If the user gave a folder first, call `get_node_details` on that folder and match the child node there.
4. Reuse the returned `nodeId` as the `datasheetId` for record, field, and view reads.

## Inspect schema before record writes

Use this sequence before `create_records` or `update_records`:

1. Call `get_fields`.
2. Record the field names and types you actually need.
3. Build write payloads that match the current datasheet schema.

## Read records safely

Pick the narrowest read shape that fits:

- Use `get_records` with `recordIds` when the user already knows the target record IDs.
- Use `get_records` with `viewId`, `filterByFormula`, `maxRecords`, or `sort` when the user needs filtered or paginated reads.
- If the user refers to fields by name, call `get_fields` first.

## Update records safely

Use this sequence for updates:

1. Call `get_fields`.
2. Build the update payload with the current field names and values.
3. Call `update_records`.
4. Echo back the record IDs and the fields you changed.

## Attachment flow

Use this sequence for file attachments:

1. Call `upload_attachments` with the local file path.
2. Take the returned attachment object or list item exactly as returned.
3. Call `update_records` and assign that attachment payload to the attachment field.

## Delete operations

These tools require `confirm_destructive: true`:

- `delete_records`
- `delete_a_member`
- `delete_a_team`
- `delete_a_role`

Before calling one of them:

1. Confirm the target object and scope.
2. Restate what will be removed.
3. Only then send `confirm_destructive: true`.

## Organization flows

- Use `list_teams` with `teamId: "0"` for top-level teams.
- Use `list_the_team_members` when the user asks for the members of a known team.
- Use `list_roles` to discover role IDs before `list_units_under_the_role`, `update_a_role`, or `delete_a_role`.
- Use `get_a_member` before `update_a_member` when the user only gives a member identifier and wants to inspect the current state first.

## AI endpoint

- `create_chat_completions` maps to the public `/fusion/ai/{assistantId}/chat/completions` endpoint.
- Only call it when the user has provided or can infer a valid `assistantId`.
