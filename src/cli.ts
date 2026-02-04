#!/usr/bin/env node

import { Command } from 'commander';
import { runBridge } from './commands/bridge.js';
import { runReport } from './commands/report.js';
import { runDemo } from './commands/demo.js';

const program = new Command();

program
  .name('agno-relay')
  .description('agno-relay — MCP to OpenAI reliability bridge')
  .version('1.0.0');

program
  .command('bridge')
  .description('Start the MCP-to-OpenAI bridge server')
  .requiredOption('--url <url>', 'Bridge URL')
  .option('--port <number>', 'Port', '3847')
  .option('--allow-auth-passthrough', 'Allow auth passthrough')
  .option('--trace', 'Enable trace')
  .action(async (options) => {
    const port = parseInt(options.port, 10);
    await runBridge({
      url: options.url,
      port,
      allowAuthPassthrough: !!options.allowAuthPassthrough,
      trace: !!options.trace,
    });
  });

program
  .command('report')
  .description('Generate conformance report')
  .option('--format <format>', 'Report format', 'markdown')
  .action((options) => {
    runReport({
      format: options.format ?? 'markdown',
    });
  });

program
  .command('demo')
  .description('Start demo with mock MCP server')
  .action(async () => {
    await runDemo();
  });

program.parse();
