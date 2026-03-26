# vika-mcp

通过 `stdio` 访问 Vika 数据表的 TypeScript MCP 服务。
英文说明见 [README.md](./README.md)。

## 环境变量

- `VIKA_HOST`: 必填，例如 `https://vika.cn`
- `VIKA_TOKEN`: 必填，Vika API Token
- `VIKA_TIMEOUT_MS`: 可选，默认 `15000`
- `VIKA_ALLOW_INSECURE_TLS`: 可选，默认 `false`
- `VIKA_PROXY_URL`: 可选，为所有 Vika 请求指定统一代理，例如 `http://127.0.0.1:7890`
- `VIKA_LOG_LEVEL`: 可选，可选值为 `debug`、`info`、`warn`、`error`

## 脚本

- `npm run build`
- `npm run check`
- `npm test`

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

服务端只调用 `/fusion/v1`、`/fusion/v2` 和 `/fusion/ai` 下的公开 REST 接口，不会探测站点根路径，从而避免部分部署场景下的 SafeLine 根路径拦截问题。

### MCPorter 配置示例

MCPorter 支持读取项目级配置 `config/mcporter.json`，也支持读取用户级配置 `~/.mcporter/mcporter.json`。

如果你希望 MCPorter 直接启动已发布的 npm 包，可以使用下面的配置：

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

说明：

- `https://vika.cn` 是公开云版本的官方示例地址。
- `${VIKA_TOKEN}` 表示由 MCPorter 从当前 shell 环境读取 token。也可以直接写死，但环境变量更安全。
- `VIKA_PROXY_URL` 是最简单的代理方式，会让全部 Vika 请求走同一个代理。
- 如果你的私有部署使用自签名证书，可以在 `env` 中加入 `"VIKA_ALLOW_INSECURE_TLS": "true"`。

如果你更希望直接使用本仓库源码而不是已发布 npm 包，请先构建，再让 MCPorter 指向编译产物：

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

使用 MCPorter 的快速验证命令：

```bash
npx mcporter list vika --schema
npx mcporter call vika.get_spaces
```

### 开发模式

如果你是直接在这个仓库里开发，可以这样启动：

```bash
npm install
npm run build
node dist/index.js
```

### Agent Skill

这个仓库还附带了一份 skill，位于 `skills/vika-mcp/`。

当你希望 agent 按推荐的 `vika-mcp` 使用方式工作，而不是自己猜 HTTP 调用或工具顺序时，就应该配合这个 skill 使用。它和 MCP 包暴露的工具面保持一致，主要帮助 agent：

- 通过官方搜索和详情接口定位空间站与节点
- 在写记录前先读取字段信息
- 用 `get_records + recordIds` 做更窄的读取
- 更稳妥地处理删除操作和组织管理接口

之后可以在提示词里显式触发，例如：

```text
Use $vika-mcp to inspect the datasheet named "Leads" and list its fields.
Use $vika-mcp to search a datasheet node named "Leads" and then update its records.
```

这个 skill 只是对 MCP 的补充，不会替代 MCP 配置本身。agent 仍然需要先能访问 `vika-mcp` 服务器。

## 工具列表

- 记录类：`get_records`、`create_records`、`update_records`、`delete_records`
- 数据表读取：`get_fields`、`get_views`、`upload_attachments`
- 空间站与节点：`get_spaces`、`get_nodes`、`search_nodes`、`get_node_details`、`create_embedlinks`、`get_embedlinks`
- 组织类：`get_a_member`、`update_a_member`、`delete_a_member`、`list_the_team_members`、`list_teams`、`create_a_team`、`update_a_team`、`delete_a_team`、`list_units_under_the_role`、`list_roles`、`create_a_role`、`update_a_role`、`delete_a_role`
- AI 类：`create_chat_completions`

## 说明

- MCP 工具名严格跟随官方 API reference 子页面 slug，并转换为 snake_case。
- 删除操作要求显式传入 `confirm_destructive: true`。
- 搜索和删除的查询参数遵循公开文档示例，例如 `permissions=0,1` 和 `recordIds=recA,recB`。
- 文件夹或成员接口返回 `403` 时，会按该资源无权限处理，不会把整个接口能力全局熔断。

## 许可证

本项目采用 `GPL-3.0-only` 许可证。详见 [LICENSE](./LICENSE)。
