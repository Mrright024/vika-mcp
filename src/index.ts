import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { CapabilityRegistry } from './capabilities.js';
import { loadConfig } from './config.js';
import { VikaClient } from './http/client.js';
import { Logger } from './logger.js';
import { ResolverService } from './resolvers.js';
import { registerAllTools } from './tools/index.js';

async function main(): Promise<void> {
  const config = loadConfig();
  const logger = new Logger(config.logLevel);
  const capabilities = new CapabilityRegistry();
  const client = new VikaClient(config, logger.child({ component: 'client' }), capabilities);
  const resolvers = new ResolverService(client);

  const server = new McpServer(
    {
      name: 'vika-mcp',
      version: '0.1.1',
    },
    {
      capabilities: {
        logging: {},
      },
    },
  );

  registerAllTools(server, {
    client,
    logger: logger.child({ component: 'tool' }),
    resolvers,
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info('vika_mcp_ready', {
    host: config.host,
  });
}

main().catch((error) => {
  const logger = new Logger('error');
  logger.error('vika_mcp_fatal', { error });
  process.exitCode = 1;
});
