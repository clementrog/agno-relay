import { startServer } from '../server';

export interface BridgeOptions {
  url: string;
  port: number;
  allowAuthPassthrough: boolean;
  trace: boolean;
}

export function runBridge(options: BridgeOptions): void {
  startServer(options.port, {
    url: options.url,
    allowAuthPassthrough: options.allowAuthPassthrough,
    trace: options.trace,
  });
}
