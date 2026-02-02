import { Client } from '@modelcontextprotocol/sdk/client';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp';

/**
 * Wraps MCP client connection. Connects to MCP servers via URL (Streamable HTTP).
 */
export class McpBridge {
  private readonly url: string;
  private client: Client | null = null;
  private transport: StreamableHTTPClientTransport | null = null;

  constructor(url: string) {
    this.url = url;
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

    try {
      this.transport = new StreamableHTTPClientTransport(urlObj);
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
