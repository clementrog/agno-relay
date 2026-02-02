import { AsyncLocalStorage } from 'async_hooks';
import express from 'express';
import { McpBridge } from './mcp/index.js';
import { loadAuthConfig, extractPassthroughAuth } from './auth/index.js';
import { handleChatCompletion } from './handlers/index.js';
import { createCanonicalError } from './errors/factory.js';
import { Logger } from './logging/index.js';
import { formatTrace } from './trace/format.js';
import { printStartupBanner, printSnippets } from './output/index.js';
const logger = new Logger();
const requestAuthStorage = new AsyncLocalStorage();
/**
 * Creates the Express app with MCP bridge. When options.bridge is provided, uses it without connecting (for tests).
 */
export async function createApp(options) {
    const authConfig = loadAuthConfig(options.allowAuthPassthrough);
    let bridge;
    if (options.bridge) {
        bridge = options.bridge;
    }
    else {
        bridge = new McpBridge(options.url, {
            defaultAuthToken: authConfig.bridgeToken,
            getRequestAuth: () => requestAuthStorage.getStore()?.auth ?? null,
        });
        await bridge.connect();
    }
    const app = express();
    app.set('mcpBridge', bridge);
    app.use(express.json());
    app.use((req, res, next) => {
        const start = Date.now();
        res.on('finish', () => {
            const durationMs = Date.now() - start;
            logger.log('info', 'request', {
                method: req.method,
                path: req.path,
                statusCode: res.statusCode,
                durationMs,
            });
        });
        next();
    });
    app.get('/healthz', (_req, res) => {
        res.status(200).json({ status: 'ok' });
    });
    app.get('/capabilities', (_req, res) => {
        res.json({
            streaming: false,
            pagination: 'cursor',
            errors: 'canonical',
            auth: 'bridge-level',
        });
    });
    let firstRequestDone = false;
    const INSIGHT_TEASE = 'Run agno report for conformance + README badge';
    app.post('/v1/chat/completions', async (req, res) => {
        const body = req.body;
        if (body?.stream === true) {
            const err = createCanonicalError('invalid_args', 'Streaming is not supported', { source: 'bridge' }, { retryable: false });
            res.status(422).json(err);
            return;
        }
        const effectiveAuth = extractPassthroughAuth(req.headers, authConfig.allowPassthrough) ?? authConfig.bridgeToken;
        const appBridge = app.get('mcpBridge');
        try {
            const response = await requestAuthStorage.run({ auth: effectiveAuth }, async () => await handleChatCompletion(body, appBridge, {
                headers: req.headers,
                trace: options.trace,
                onTrace: options.trace
                    ? (entry) => {
                        console.log(formatTrace(entry));
                    }
                    : undefined,
            }));
            res.json(response);
            if (!firstRequestDone) {
                firstRequestDone = true;
                console.log(INSIGHT_TEASE);
            }
        }
        catch (err) {
            const canonical = err;
            if (canonical?.class && canonical?.message !== undefined) {
                const status = canonical.class === 'invalid_args' ? 422 : canonical.class === 'auth' ? 401 : canonical.class === 'permission' ? 403 : canonical.class === 'not_found' ? 404 : canonical.class === 'conflict' ? 409 : canonical.class === 'rate_limit' ? 429 : canonical.class === 'timeout' ? 504 : 503;
                res.status(status).json(canonical);
            }
            else {
                res.status(503).json(createCanonicalError('transient', err instanceof Error ? err.message : String(err), { source: 'bridge' }, { retryable: true }));
            }
        }
    });
    return app;
}
export async function startServer(port, options) {
    const app = await createApp(options);
    const maxAttempts = 11; // port, port+1, ... port+10
    let attempt = 0;
    function tryListen(currentPort) {
        const server = app.listen(currentPort, () => {
            printStartupBanner({
                port: currentPort,
                url: options.url,
                allowAuthPassthrough: options.allowAuthPassthrough,
            });
            printSnippets({ baseUrl: `http://localhost:${currentPort}` });
        });
        server.on('error', (err) => {
            if (err.code === 'EADDRINUSE' && attempt < maxAttempts - 1) {
                server.close();
                attempt++;
                tryListen(currentPort + 1);
            }
            else {
                throw err;
            }
        });
    }
    tryListen(port);
}
