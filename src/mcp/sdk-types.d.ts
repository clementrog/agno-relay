declare module '@modelcontextprotocol/sdk/client' {
  export class Client {
    constructor(
      clientInfo: { name: string; version: string },
      options?: { capabilities?: Record<string, unknown> },
    );
    connect(transport: unknown, options?: unknown): Promise<void>;
    listTools(params?: unknown): Promise<{ tools: unknown[] }>;
    callTool(params: { name: string; arguments?: Record<string, unknown> }): Promise<unknown>;
  }
}

declare module '@modelcontextprotocol/sdk/client/streamableHttp' {
  export class StreamableHTTPClientTransport {
    constructor(url: URL, opts?: unknown);
    close(): Promise<void>;
  }
}
