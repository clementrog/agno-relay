import { AsyncLocalStorage } from 'async_hooks';
import express, { Request, Response, NextFunction } from 'express';
import { McpBridge } from './mcp';
import { loadAuthConfig, extractPassthroughAuth } from './auth/index.js';
import { handleChatCompletion } from './handlers/index.js';
import { createCanonicalError } from './errors/factory.js';
import { Logger } from './logging/index.js';
import { formatTrace } from './trace/format.js';
import type { ChatCompletionRequest } from './handlers/types.js';

const logger = new Logger();

export interface ServerOptions {
  url: string;
  allowAuthPassthrough: boolean;
  trace: boolean;
}

const requestAuthStorage = new AsyncLocalStorage<{ auth: string | null }>();

export async function startServer(port: number, options: ServerOptions): Promise<void> {
  const authConfig = loadAuthConfig(options.allowAuthPassthrough);
  const bridge = new McpBridge(options.url, {
    defaultAuthToken: authConfig.bridgeToken,
    getRequestAuth: () => requestAuthStorage.getStore()?.auth ?? null,
  });
  await bridge.connect();

  const app = express();
  app.set('mcpBridge', bridge);
  app.use(express.json());

  app.use((req: Request, res: Response, next: NextFunction) => {
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

  app.get('/healthz', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'ok' });
  });

  app.get('/capabilities', (_req: Request, res: Response) => {
    res.json({
      streaming: false,
      pagination: 'cursor',
      errors: 'canonical',
      auth: 'bridge-level',
    });
  });

  app.post('/v1/chat/completions', async (req: Request, res: Response) => {
    const body = req.body as ChatCompletionRequest;
    if (body?.stream === true) {
      const err = createCanonicalError(
        'invalid_args',
        'Streaming is not supported',
        { source: 'bridge' },
        { retryable: false }
      );
      res.status(422).json(err);
      return;
    }
    const effectiveAuth =
      extractPassthroughAuth(req.headers, authConfig.allowPassthrough) ?? authConfig.bridgeToken;
    const bridge = app.get('mcpBridge') as McpBridge;
    try {
      const response = await requestAuthStorage.run(
        { auth: effectiveAuth },
        async () =>
          await handleChatCompletion(body, bridge, {
            headers: req.headers,
            trace: options.trace,
            onTrace: options.trace
              ? (entry) => {
                  console.log(formatTrace(entry));
                }
              : undefined,
          })
      );
      res.json(response);
    } catch (err: unknown) {
      const canonical = err as { class?: string; retryable?: boolean; message?: string; action?: string; context?: unknown; suggested_backoff_ms?: number | null };
      if (canonical?.class && canonical?.message !== undefined) {
        const status = canonical.class === 'invalid_args' ? 422 : canonical.class === 'auth' ? 401 : canonical.class === 'permission' ? 403 : canonical.class === 'not_found' ? 404 : canonical.class === 'conflict' ? 409 : canonical.class === 'rate_limit' ? 429 : canonical.class === 'timeout' ? 504 : 503;
        res.status(status).json(canonical);
      } else {
        res.status(503).json(
          createCanonicalError('transient', err instanceof Error ? err.message : String(err), { source: 'bridge' }, { retryable: true })
        );
      }
    }
  });

  const maxAttempts = 11; // port, port+1, ... port+10
  let attempt = 0;

  function tryListen(currentPort: number): void {
    const server = app.listen(currentPort, () => {
      console.log('Bridge ready');
      console.log(`Endpoint: http://localhost:${currentPort}/v1/chat/completions`);
      console.log(`Upstream: ${options.url}`);
    });

    server.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE' && attempt < maxAttempts - 1) {
        server.close();
        attempt++;
        tryListen(currentPort + 1);
      } else {
        throw err;
      }
    });
  }

  tryListen(port);
}
