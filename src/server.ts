import express, { Request, Response } from 'express';
import { McpBridge } from './mcp';

export interface ServerOptions {
  url: string;
  allowAuthPassthrough: boolean;
  trace: boolean;
}

export async function startServer(port: number, options: ServerOptions): Promise<void> {
  const bridge = new McpBridge(options.url);
  await bridge.connect();

  const app = express();
  app.set('mcpBridge', bridge);
  app.use(express.json());

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

  app.post('/v1/chat/completions', (_req: Request, res: Response) => {
    res.status(501).json({ message: 'Not implemented yet' });
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
