# Vika MCP Workflows

## Resolve a datasheet from names

Use this sequence when the user gives names instead of IDs:

1. Call `vika_spaces_list` if `space_id` is unknown.
2. Call `vika_resolve_datasheet` with `space_id` and `node_name`.
3. Reuse the returned `datasheet_id` and `node_id` for later calls.

## Inspect schema before record writes

Use this sequence before `vika_records_create` or `vika_records_update`:

1. Call `vika_fields_list`.
2. Record the field IDs, names, and types you actually need.
3. Build write payloads with `fieldKey: "id"` when possible.

## Read records safely

Pick the narrowest read tool that fits:

- Use `vika_record_get` when the user already knows the record ID.
- Use `vika_records_list` when the user needs filtering, sorting, pagination, or view-based reads.
- If the user refers to fields by name, read the field list first so you can map names to IDs.

## Update records safely

Use this sequence for updates:

1. Call `vika_fields_list`.
2. Build the payload with explicit field IDs.
3. Call `vika_records_update`.
4. Echo back the record IDs and the fields you changed.

## Attachment flow

Use this sequence for file attachments:

1. Call `vika_attachment_upload` with the local file path.
2. Take the returned attachment object or list item exactly as returned.
3. Call `vika_records_update` and assign that attachment payload to the attachment field.

## Destructive tools

These tools require `confirm_destructive: true`:

- `vika_records_delete`
- `vika_datasheets_create`
- `vika_fields_create`
- `vika_fields_update`
- `vika_fields_delete`
- `vika_views_create`
- `vika_views_update`
- `vika_views_delete`
- `vika_teams_create`
- `vika_teams_update`
- `vika_teams_delete`
- `vika_roles_create`
- `vika_roles_update`
- `vika_roles_delete`
- `vika_embedlinks_delete`

Before calling one of them:

1. Confirm the target object and scope.
2. Restate what will change.
3. Only then send `confirm_destructive: true`.

## Deployment-sensitive endpoints

Treat these as optional by deployment:

- Views
- Teams and roles
- AI endpoints

If one of these returns `feature_unavailable`, explain that the current Vika deployment does not expose that endpoint and continue with a fallback path if one exists.
