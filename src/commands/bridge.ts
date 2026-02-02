import { startServer } from '../server.js';

export interface BridgeOptions {
  url: string;
  port: number;
  allowAuthPassthrough: boolean;
  trace: boolean;
}

export async function runBridge(options: BridgeOptions): Promise<void> {
  await startServer(options.port, {
    url: options.url,
    allowAuthPassthrough: options.allowAuthPassthrough,
    trace: options.trace,
  });
}
