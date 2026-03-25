# vika-mcp

TypeScript MCP server for Vika datasheets over `stdio`.

通过 `stdio` 访问 Vika 数据表的 TypeScript MCP 服务。参见 [README.zh-CN.md](./README.zh-CN.md)。

## Environment

- `VIKA_HOST`: required, example `https://vika.cn`
- `VIKA_TOKEN`: required, API token
- `VIKA_TIMEOUT_MS`: optional, defaults to `15000`
- `VIKA_ALLOW_INSECURE_TLS`: optional, defaults to `false`
- `VIKA_LOG_LEVEL`: optional, one of `debug`, `info`, `warn`, `error`
- `VIKA_TEST_SPACE_ID`: required for smoke tests
- `VIKA_TEST_NODE_ID`: required for smoke tests
- `VIKA_TEST_DATASHEET_ID`: required for smoke tests

## Scripts

- `npm run build`
- `npm run check`
- `npm test`
- `npm run smoke`

## Usage

Install from npm:

```bash
npm install -g vika-mcp
```

Then point your MCP client to the `vika-mcp` binary.

You can also run it without a global install:

```bash
npx -y vika-mcp
```

The server only talks to documented REST endpoints under `/fusion/v1` and `/fusion/v2`. It does not probe the site root, which avoids SafeLine root-page blocking.

### MCPorter Example

MCPorter reads project-local config from `config/mcporter.json` or a user-level config from `~/.mcporter/mcporter.json`.

If you want MCPorter to start the published npm package directly, add an entry like this:

```json
{
  "mcpServers": {
    "vika": {
      "command": "npx",
      "args": [
        "-y",
        "vika-mcp"
      ],
      "env": {
        "VIKA_HOST": "https://vika.cn",
        "VIKA_TOKEN": "${VIKA_TOKEN}",
        "VIKA_TIMEOUT_MS": "15000",
        "VIKA_LOG_LEVEL": "info"
      }
    }
  }
}
```

Notes:

- `https://vika.cn` is the official public-cloud host example. The token and file paths in this README are placeholders intended for public documentation.
- `${VIKA_TOKEN}` assumes MCPorter will read the token from your shell environment. You can also inline the token directly, but an environment variable is safer.
- If your private deployment uses a self-signed certificate, add `"VIKA_ALLOW_INSECURE_TLS": "true"` under `env`.

If you prefer using the cloned source tree instead of the published package, build first and point MCPorter to the compiled entry file:

```json
{
  "mcpServers": {
    "vika": {
      "command": "node",
      "args": [
        "C:/path/to/vika-mcp/dist/index.js"
      ],
      "env": {
        "VIKA_HOST": "https://vika.cn",
        "VIKA_TOKEN": "${VIKA_TOKEN}"
      }
    }
  }
}
```

Quick verification with MCPorter:

```bash
npx mcporter list vika --schema
npx mcporter call vika.vika_spaces_list
```

### Development

If you are working from this repository directly:

```bash
npm install
npm run build
node dist/index.js
```

### Agent Skill

This repository also includes a skill at `skills/vika-mcp/`.

Use it when you want an agent to follow the recommended `vika-mcp` workflow instead of guessing raw API calls or tool order. The skill helps with:

- resolving spaces, nodes, and datasheets from names
- inspecting fields before record writes
- using `fieldKey: "id"` when possible
- handling destructive tools and deployment-sensitive endpoints safely

Install the skill by copying or symlinking the folder into your Codex skills directory:

```bash
mkdir -p ~/.codex/skills
cp -R skills/vika-mcp ~/.codex/skills/vika-mcp
```

Then invoke it explicitly in prompts such as:

```text
Use $vika-mcp to inspect the datasheet named "Leads" and list its fields.
Use $vika-mcp to update record rec123 in datasheet dst456.
```

The skill complements the MCP server. It does not replace MCP configuration; the `vika-mcp` server still needs to be available to the agent.

## Tool Surface

- Discovery: `vika_spaces_list`, `vika_nodes_list`, `vika_nodes_children_list`, `vika_nodes_search`, `vika_resolve_node`, `vika_resolve_datasheet`
- Records: `vika_records_list`, `vika_record_get`, `vika_records_create`, `vika_records_update`, `vika_records_delete`
- Datasheets and attachments: `vika_datasheets_create`, `vika_attachment_upload`, `vika_embedlinks_list`, `vika_embedlinks_create`, `vika_embedlinks_delete`
- Fields: `vika_fields_list`, `vika_fields_create`, `vika_fields_update`, `vika_fields_delete`
- Views: `vika_views_list`, `vika_views_create`, `vika_views_update`, `vika_views_delete`
- Org: `vika_members_list`, `vika_teams_list`, `vika_teams_create`, `vika_teams_update`, `vika_teams_delete`, `vika_roles_list`, `vika_roles_create`, `vika_roles_update`, `vika_roles_delete`
- AI: `vika_ai_request`

## Notes

- Delete operations and schema-changing operations require `confirm_destructive: true`.
- Query serialization follows the official Vika JS SDK bracket style, such as `recordIds[]`.
- View mutations, org APIs, and AI endpoints are deployment-sensitive. If your private deployment does not expose them, the server returns `feature_unavailable`.

## Smoke Test Overrides

The smoke script requires `VIKA_TEST_SPACE_ID`, `VIKA_TEST_NODE_ID`, and `VIKA_TEST_DATASHEET_ID`.

Optional overrides:

- `VIKA_SMOKE_TEXT_FIELD_JSON`
- `VIKA_SMOKE_ATTACHMENT_FIELD_JSON`
- `VIKA_SMOKE_VIEW_JSON`

If these are not provided, the smoke script uses default payloads based on the public API field and view type names.

## License

This project is licensed under `GPL-3.0-only`. See [LICENSE](./LICENSE).

Developed with *Codex*
