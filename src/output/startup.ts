/**
 * Startup banner and capabilities block for the bridge server.
 */

const BOLD = '\u001b[1m';
const DIM = '\u001b[2m';
const RESET = '\u001b[0m';

export interface StartupBannerOptions {
  port: number;
  url: string;
  allowAuthPassthrough: boolean;
}

/**
 * Prints the "Bridge ready" message with styling and a capabilities block.
 * Capabilities: streaming (unsupported), pagination (cursor-based), errors (canonical), auth mode (bridge-level or passthrough).
 */
export function printStartupBanner(options: StartupBannerOptions): void {
  const { port, url, allowAuthPassthrough } = options;
  const endpoint = `http://localhost:${port}/v1/chat/completions`;
  const authMode = allowAuthPassthrough ? 'bridge-level or passthrough' : 'bridge-level';

  console.log('');
  console.log(`${BOLD}Bridge ready${RESET}`);
  console.log(`Endpoint: ${endpoint}`);
  console.log(`Upstream: ${url}`);
  console.log('');
  console.log(`${DIM}Capabilities:${RESET}`);
  console.log(`  streaming:   unsupported`);
  console.log(`  pagination:  cursor-based`);
  console.log(`  errors:      canonical`);
  console.log(`  auth mode:   ${authMode}`);
  console.log('');
}
