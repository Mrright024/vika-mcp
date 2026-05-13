# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

vika-mcp is a TypeScript MCP (Model Context Protocol) server that exposes Vika datasheet APIs as tools over `stdio`. It translates Vika REST endpoints under `/fusion/v1`, `/fusion/v2`, and `/fusion/ai` into MCP tool calls. Published on npm as `vika-mcp`.

## Commands

- `npm run build` — compile TypeScript (uses `tsconfig.build.json`, outputs to `dist/`)
- `npm run check` — type-check without emitting (`tsc --noEmit` against `tsconfig.json`)
- `npm test` — run tests with vitest
- `npm run test:watch` — run tests in watch mode

To run locally after a build: `node dist/index.js`

## Architecture

```
src/
  index.ts          — Entry point: wires up McpServer + StdioServerTransport
  config.ts         — Loads and validates env vars (VIKA_HOST, VIKA_TOKEN, etc.)
  capabilities.ts   — CapabilityRegistry: caches feature availability per 501 responses
  logger.ts         — Structured JSON logger to stderr with log-level filtering
  types.ts          — Shared types: ToolEnvelope, ApiVersion, NodeSummary, etc.
  resolvers.ts      — ResolverService: resolves node by ID or by name/space/parent
  http/
    client.ts       — VikaClient: HTTP client with retry, proxy, TLS, and capability gating
    errors.ts       — VikaToolError hierarchy and HTTP status → category mapping
  schemas/
    common.ts       — Reusable Zod schemas (IDs, pagination, destructive flag, jsonValue)
  tools/
    index.ts        — registerAllTools: assembles all tool modules
    common.ts       — ToolDefinition interface, ok/fail helpers, registerTool wrapper
    spaces.ts       — get_spaces
    nodes.ts        — get_nodes, search_nodes, get_node_details
    datasheets.ts   — upload_attachments, get_embedlinks, create_embedlinks, delete_embedlinks, create_datasheets
    records.ts      — get_records, create_records, update_records, delete_records
    fields.ts       — get_fields, create_fields, delete_fields
    views.ts        — get_views
    org.ts          — member/team/role CRUD tools
    ai.ts           — create_chat_completions
```

Key data flow: `McpServer` → `registerTool` wrapper → tool `execute` function → `VikaClient.request` → Vika REST API. All tool results are wrapped in `ToolEnvelope` (`{ ok, data, meta }` or `{ ok, error }`).

## Key Design Patterns

- **Tool registration**: Each tool module exports a `register*Tools(server, deps)` function. Tools are defined as `ToolDefinition` objects with `name`, `description`, `inputSchema` (Zod), `readOnly` flag, and `execute` handler.
- **Capability gating**: `CapabilityRegistry` tracks whether features are available. A 501 response permanently marks a feature as unavailable, short-circuiting future calls.
- **Destructive guard**: Delete tools require `confirm_destructive: true` in input, enforced by `requireDestructiveConfirmation()`.
- **Error mapping**: HTTP statuses are mapped to `ToolErrorCategory` values (authentication, authorization, not_found, rate_limit, etc.) in `http/errors.ts`. A 403 on a specific resource does not globally disable that endpoint.
- **Retry**: GET requests retry up to 3 times on 429/502/503/504 with linear backoff. Non-GET requests do not retry.

## Tests

Tests live in `tests/contract/` and use vitest with mocked `fetch`. They cover config parsing, client request behavior (auth headers, retries, error mapping, capability caching), and the destructive guard.

## Conventions

- MCP tool names follow Vika API reference page slugs converted to `snake_case`.
- Uses `zod/v4` (not `zod` default export) for schemas.
- ESM module (`"type": "module"` in package.json), uses `NodeNext` module resolution with `.js` extensions in imports.
- Query parameters use `qs.stringify` with `arrayFormat: 'brackets'`.
- Logger sanitizes token/authorization fields and truncates large content.
