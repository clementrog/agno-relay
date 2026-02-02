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
export declare class McpBridge {
    private readonly url;
    private readonly defaultAuthToken;
    private readonly getRequestAuth;
    private client;
    private transport;
    constructor(url: string, options?: McpBridgeOptions);
    /**
     * Establishes connection to the MCP server.
     * @throws Error with url attempted if server is unreachable
     */
    connect(): Promise<void>;
    /**
     * Calls MCP tools/list and returns the raw tool definitions.
     */
    getTools(): Promise<{
        tools: unknown[];
    }>;
    /**
     * Invokes a tool by name with the given arguments and returns the result.
     */
    callTool(name: string, args: object): Promise<unknown>;
    /**
     * Cleanly closes the MCP connection.
     */
    disconnect(): Promise<void>;
    private ensureConnected;
}
