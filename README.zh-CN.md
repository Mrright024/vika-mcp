# vika-mcp

通过 `stdio` 访问 Vika 数据表的 TypeScript MCP 服务。

英文说明见 [README.md](./README.md)。

## 环境变量

- `VIKA_HOST`: 必填，例如 `https://vika.cn`
- `VIKA_TOKEN`: 必填，Vika API Token
- `VIKA_TIMEOUT_MS`: 可选，默认 `15000`
- `VIKA_ALLOW_INSECURE_TLS`: 可选，默认 `false`
- `VIKA_LOG_LEVEL`: 可选，可选值为 `debug`、`info`、`warn`、`error`
- `VIKA_TEST_SPACE_ID`: smoke test 必填
- `VIKA_TEST_NODE_ID`: smoke test 必填
- `VIKA_TEST_DATASHEET_ID`: smoke test 必填

## 脚本

- `npm run build`
- `npm run check`
- `npm test`
- `npm run smoke`

## 用法

先从 npm 安装：

```bash
npm install -g vika-mcp
```

然后让你的 MCP 客户端指向 `vika-mcp` 可执行文件。

如果你不想全局安装，也可以直接运行：

```bash
npx -y vika-mcp
```

服务端只调用 `/fusion/v1` 和 `/fusion/v2` 下的公开 REST 接口，不会探测站点根路径，从而避免部分部署场景下的 SafeLine 根路径拦截问题。

### MCPorter 配置示例

MCPorter 支持读取项目级配置 `config/mcporter.json`，也支持读取用户级配置 `~/.mcporter/mcporter.json`。

如果你希望 MCPorter 直接启动已发布的 npm 包，可以使用下面的配置：

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

说明：

- `https://vika.cn` 是公开云版本的官方示例地址。本文中的 token 和路径仍为公开文档使用的占位值，不包含任何真实环境信息。
- `${VIKA_TOKEN}` 表示由 MCPorter 从当前 shell 环境读取 token。也可以直接写死，但环境变量更安全。
- 如果你的私有部署使用自签名证书，可以在 `env` 中加入 `"VIKA_ALLOW_INSECURE_TLS": "true"`。

如果你更希望直接使用本仓库源码而不是已发布 npm 包，请先构建，再让 MCPorter 指向编译产物：

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

使用 MCPorter 的快速验证命令：

```bash
npx mcporter list vika --schema
npx mcporter call vika.vika_spaces_list
```

### 开发模式

如果你是直接在这个仓库里开发，可以这样启动：

```bash
npm install
npm run build
node dist/index.js
```

### Agent Skill

这个仓库还附带了一份skill，位于 `skills/vika-mcp/`。

当你希望 agent 按推荐的 `vika-mcp` 使用方式工作，而不是自己猜 HTTP 调用或工具顺序时，就应该配合这个 skill 使用。它主要帮助 agent：

- 先从名称解析 space、node 和 datasheet
- 在写记录前先读取字段信息
- 优先使用 `fieldKey: "id"`
- 更稳妥地处理 destructive 工具和部署敏感接口

可以把这个 skill 复制或软链接到本地 Codex skills 目录：

```bash
mkdir -p ~/.codex/skills
cp -R skills/vika-mcp ~/.codex/skills/vika-mcp
```

之后可以在提示词里显式触发，例如：

```text
Use $vika-mcp to inspect the datasheet named "Leads" and list its fields.
Use $vika-mcp to update record rec123 in datasheet dst456.
```

这个 skill 只是对 MCP 的补充，不会替代 MCP 配置本身。agent 仍然需要先能访问 `vika-mcp` 服务器。

## 工具列表

- 发现类：`vika_spaces_list`、`vika_nodes_list`、`vika_nodes_children_list`、`vika_nodes_search`、`vika_resolve_node`、`vika_resolve_datasheet`
- 记录类：`vika_records_list`、`vika_record_get`、`vika_records_create`、`vika_records_update`、`vika_records_delete`
- 数据表与附件：`vika_datasheets_create`、`vika_attachment_upload`、`vika_embedlinks_list`、`vika_embedlinks_create`、`vika_embedlinks_delete`
- 字段类：`vika_fields_list`、`vika_fields_create`、`vika_fields_update`、`vika_fields_delete`
- 视图类：`vika_views_list`、`vika_views_create`、`vika_views_update`、`vika_views_delete`
- 组织类：`vika_members_list`、`vika_teams_list`、`vika_teams_create`、`vika_teams_update`、`vika_teams_delete`、`vika_roles_list`、`vika_roles_create`、`vika_roles_update`、`vika_roles_delete`
- AI 类：`vika_ai_request`

## 说明

- 删除操作和变更 schema 的操作都要求显式传入 `confirm_destructive: true`。
- 查询参数序列化遵循官方 Vika JS SDK 的 bracket 风格，例如 `recordIds[]`。
- 视图变更、组织接口和 AI 接口是否可用取决于具体部署。如果部署未开放这些接口，服务会返回 `feature_unavailable`。

## Smoke Test 覆盖项

smoke 脚本要求提供 `VIKA_TEST_SPACE_ID`、`VIKA_TEST_NODE_ID` 和 `VIKA_TEST_DATASHEET_ID`。

可选覆盖项：

- `VIKA_SMOKE_TEXT_FIELD_JSON`
- `VIKA_SMOKE_ATTACHMENT_FIELD_JSON`
- `VIKA_SMOKE_VIEW_JSON`

如果未提供这些值，smoke 脚本会根据公开 API 的字段类型和视图类型名称使用默认 payload。

## 许可证

本项目采用 `GPL-3.0-only` 许可证。详见 [LICENSE](./LICENSE)。
