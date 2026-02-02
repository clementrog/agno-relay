import { startServer } from '../server.js';
export async function runBridge(options) {
    await startServer(options.port, {
        url: options.url,
        allowAuthPassthrough: options.allowAuthPassthrough,
        trace: options.trace,
    });
}
