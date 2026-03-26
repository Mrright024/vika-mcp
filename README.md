# vika-mcp

TypeScript MCP server for Vika datasheets over `stdio`.

通过 `stdio` 访问 Vika 数据表的 TypeScript MCP 服务。参见 [README.zh-CN.md](./README.zh-CN.md)。

## Environment

- `VIKA_HOST`: required, example `https://vika.cn`
- `VIKA_TOKEN`: required, API token
- `VIKA_TIMEOUT_MS`: optional, defaults to `15000`
- `VIKA_ALLOW_INSECURE_TLS`: optional, defaults to `false`
- `VIKA_PROXY_URL`: optional, use a single proxy for all Vika traffic, example `http://127.0.0.1:7890`
- `VIKA_LOG_LEVEL`: optional, one of `debug`, `info`, `warn`, `error`

## Scripts

- `npm run build`
- `npm run check`
- `npm test`

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

The server only talks to documented REST endpoints under `/fusion/v1`, `/fusion/v2`, and `/fusion/ai`. It does not probe the site root, which avoids SafeLine root-page blocking.

### MCPorter Example

MCPorter reads project-local config from `config/mcporter.json` or a user-level config from `~/.mcporter/mcporter.json`.

If you want MCPorter to start the published npm package directly, add an entry like this:

```json
{
  "mcpServers": {
    "vika-mcp": {
      "command": "npx",
      "args": [
        "-y",
        "vika-mcp"
      ],
      "env": {
        "VIKA_HOST": "https://vika.cn",
        "VIKA_TOKEN": "${VIKA_TOKEN}",
        "VIKA_PROXY_URL": "http://127.0.0.1:7890",
        "VIKA_TIMEOUT_MS": "15000",
        "VIKA_LOG_LEVEL": "info"
      }
    }
  }
}
```

Notes:

- `https://vika.cn` is the official public-cloud host example.
- `${VIKA_TOKEN}` assumes MCPorter will read the token from your shell environment. You can also inline the token directly, but an environment variable is safer.
- `VIKA_PROXY_URL` is the simplest way to force all Vika traffic through a single proxy.
- If your private deployment uses a self-signed certificate, add `"VIKA_ALLOW_INSECURE_TLS": "true"` under `env`.

If you prefer using the cloned source tree instead of the published package, build first and point MCPorter to the compiled entry file:

```json
{
  "mcpServers": {
    "vika-mcp": {
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
npx mcporter call vika.get_spaces
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

Use it when you want an agent to follow the recommended `vika-mcp` workflow instead of guessing raw API calls or tool order. The skill is aligned with the MCP package tool surface and helps with:

- finding spaces and nodes through the official search and detail endpoints
- inspecting fields before record writes
- using `get_records` with `recordIds` for narrow reads
- handling delete operations and org changes safely

Then invoke it explicitly in prompts such as:

```text
Use $vika-mcp to inspect the datasheet named "Leads" and list its fields.
Use $vika-mcp to search a datasheet node named "Leads" and then update its records.
```

The skill complements the MCP server. It does not replace MCP configuration; the `vika-mcp` server still needs to be available to the agent.

## Tool Surface

- Records: `get_records`, `create_records`, `update_records`, `delete_records`
- Datasheet reads: `get_fields`, `get_views`, `upload_attachments`
- Space and nodes: `get_spaces`, `get_nodes`, `search_nodes`, `get_node_details`, `create_embedlinks`, `get_embedlinks`
- Org: `get_a_member`, `update_a_member`, `delete_a_member`, `list_the_team_members`, `list_teams`, `create_a_team`, `update_a_team`, `delete_a_team`, `list_units_under_the_role`, `list_roles`, `create_a_role`, `update_a_role`, `delete_a_role`
- AI: `create_chat_completions`

## Notes

- MCP tool names follow the official API reference page slugs, converted to snake_case.
- Delete operations require `confirm_destructive: true`.
- Search and delete queries follow the public reference examples, such as `permissions=0,1` and `recordIds=recA,recB`.
- A `403` from a folder or member endpoint is treated as an authorization error for that resource, not as a global capability shutdown.

## License

This project is licensed under `GPL-3.0-only`. See [LICENSE](./LICENSE).

Developed with *Codex*
