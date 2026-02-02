export interface BridgeOptions {
  url: string;
  port: number;
  allowAuthPassthrough: boolean;
  trace: boolean;
}

export function runBridge(options: BridgeOptions): void {
  console.log('Bridge starting...');
  console.log('Options:', options);
}
