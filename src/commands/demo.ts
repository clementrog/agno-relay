import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import { startServer } from '../server.js';

export async function runDemo(): Promise<void> {
  // Spawn the mock MCP server
  const mockServerPath = path.join(process.cwd(), 'examples', 'mock-mcp', 'server.js');
  const childProcess: ChildProcess = spawn('node', [mockServerPath], {
    env: { ...process.env, PORT: '3000' },
    stdio: 'inherit',
  });

  // Wait 1 second for server to start
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Start the bridge server
  await startServer(3847, {
    url: 'http://localhost:3000/mcp',
    allowAuthPassthrough: false,
    trace: false,
  });

  // Log startup message
  console.log('\n=== Demo Started ===');
  console.log('Mock MCP server: http://localhost:3000');
  console.log('Bridge endpoint: http://localhost:3847/v1/chat/completions');
  console.log('Available tools: list_repos, create_issue');
  console.log('\nExample curl command:');
  console.log('curl http://localhost:3847/v1/chat/completions \\');
  console.log('  -H "Content-Type: application/json" \\');
  console.log('  -d \'{"model":"gpt-4","messages":[{"role":"user","content":"List repos"}],"tools":[{"type":"function","function":{"name":"list_repos"}}]}\'');
  console.log('\nPress Ctrl+C to stop\n');

  // Set up SIGINT handler to kill child process and exit cleanly
  process.on('SIGINT', () => {
    console.log('\nShutting down...');
    childProcess.kill();
    process.exit(0);
  });
}
