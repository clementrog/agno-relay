import { Client } from '@modelcontextprotocol/sdk/client';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp';

export interface McpBridgeOptions {
  /** Default auth token sent as Authorization header on MCP requests. */
  defaultAuthToken?: string | null;
  /** Optional per-request auth (e.g. passthrough); when set, overrides defaultAuthToken for that request. */
  getRequestAuth?: () => string | null;
}

/**
 * Wraps MCP client connection. Connects to MCP servers via URL (Streamable HTTP).
 * Accepts optional auth token(s); per-request auth overrides default when getRequestAuth returns a value.
 */
export class McpBridge {
  private readonly url: string;
  private readonly defaultAuthToken: string | null;
  private readonly getRequestAuth: (() => string | null) | undefined;
  private client: Client | null = null;
  private transport: StreamableHTTPClientTransport | null = null;

  constructor(url: string, options?: McpBridgeOptions) {
    this.url = url;
    this.defaultAuthToken = options?.defaultAuthToken ?? null;
    this.getRequestAuth = options?.getRequestAuth;
  }

  /**
   * Establishes connection to the MCP server.
   * @throws Error with url attempted if server is unreachable
   */
  async connect(): Promise<void> {
    let urlObj: URL;
    try {
      urlObj = new URL(this.url);
    } catch (parseErr) {
      const message = parseErr instanceof Error ? parseErr.message : String(parseErr);
      throw new Error(`MCP server URL invalid: ${this.url}. ${message}`);
    }

    const defaultToken = this.defaultAuthToken ?? '';
    const createAuthFetch = (): (input: URL | RequestInfo, init?: RequestInit) => Promise<Response> => {
      return (input: URL | RequestInfo, init?: RequestInit) => {
        const override = this.getRequestAuth?.() ?? null;
        const headers = new Headers(init?.headers);
        if (override !== null && override !== '') {
          headers.set('Authorization', override);
        } else if (defaultToken !== '') {
          headers.set('Authorization', defaultToken);
        }
        return fetch(input, { ...init, headers });
      };
    };

    try {
      this.transport = new StreamableHTTPClientTransport(urlObj, {
        requestInit: defaultToken ? { headers: { Authorization: defaultToken } } : undefined,
        fetch: createAuthFetch(),
      });
      this.client = new Client(
        { name: 'agno-bridge', version: '1.0.0' },
        { capabilities: {} },
      );
      await this.client.connect(this.transport);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`MCP server unreachable at ${this.url}. ${message}`);
    }
  }

  /**
   * Calls MCP tools/list and returns the raw tool definitions.
   */
  async getTools(): Promise<{ tools: unknown[] }> {
    this.ensureConnected();
    const result = await this.client!.listTools();
    return { tools: result.tools };
  }

  /**
   * Invokes a tool by name with the given arguments and returns the result.
   */
  async callTool(name: string, args: object): Promise<unknown> {
    this.ensureConnected();
    const result = await this.client!.callTool({
      name,
      arguments: args as Record<string, unknown>,
    });
    return result;
  }

  /**
   * Cleanly closes the MCP connection.
   */
  async disconnect(): Promise<void> {
    if (this.transport) {
      await this.transport.close();
      this.transport = null;
      this.client = null;
    }
  }

  private ensureConnected(): void {
    if (!this.client || !this.transport) {
      throw new Error('MCP bridge is not connected');
    }
  }
}
