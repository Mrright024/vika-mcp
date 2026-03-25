import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { ToolDependencies } from './common.js';
import { registerAiTools } from './ai.js';
import { registerDatasheetTools } from './datasheets.js';
import { registerFieldTools } from './fields.js';
import { registerNodeTools } from './nodes.js';
import { registerOrgTools } from './org.js';
import { registerRecordTools } from './records.js';
import { registerSpaceTools } from './spaces.js';
import { registerViewTools } from './views.js';

export function registerAllTools(server: McpServer, deps: ToolDependencies): void {
  registerSpaceTools(server, deps);
  registerNodeTools(server, deps);
  registerDatasheetTools(server, deps);
  registerRecordTools(server, deps);
  registerFieldTools(server, deps);
  registerViewTools(server, deps);
  registerOrgTools(server, deps);
  registerAiTools(server, deps);
}
