/**
 * Startup banner and capabilities block for the bridge server.
 */
export interface StartupBannerOptions {
    port: number;
    url: string;
    allowAuthPassthrough: boolean;
}
/**
 * Prints the "Bridge ready" message with styling and a capabilities block.
 * Capabilities: streaming (unsupported), pagination (cursor-based), errors (canonical), auth mode (bridge-level or passthrough).
 */
export declare function printStartupBanner(options: StartupBannerOptions): void;
