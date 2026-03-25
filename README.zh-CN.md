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

先执行构建，然后让你的 MCP 客户端指向 `vika-mcp` 二进制，或直接指向 `node dist/index.js`。

服务端只调用 `/fusion/v1` 和 `/fusion/v2` 下的公开 REST 接口，不会探测站点根路径，从而避免部分部署场景下的 SafeLine 根路径拦截问题。

### MCPorter 配置示例

MCPorter 支持读取项目级配置 `config/mcporter.json`，也支持读取用户级配置 `~/.mcporter/mcporter.json`。

执行 `npm run build` 后，可以加入类似下面的配置：

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
        "VIKA_TOKEN": "${VIKA_TOKEN}",
        "VIKA_TIMEOUT_MS": "15000",
        "VIKA_LOG_LEVEL": "info"
      }
    }
  }
}
```

说明：

- 将 `C:/path/to/vika-mcp/dist/index.js` 替换为当前仓库编译产物的绝对路径。
- `https://vika.cn` 是公开云版本的官方示例地址。本文中的 token 和路径仍为公开文档使用的占位值，不包含任何真实环境信息。
- `${VIKA_TOKEN}` 表示由 MCPorter 从当前 shell 环境读取 token。也可以直接写死，但环境变量更安全。
- 如果你的私有部署使用自签名证书，可以在 `env` 中加入 `"VIKA_ALLOW_INSECURE_TLS": "true"`。

使用 MCPorter 的快速验证命令：

```bash
npx mcporter list vika --schema
npx mcporter call vika.vika_spaces_list
```

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
