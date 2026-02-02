import type { Application } from 'express';
import { McpBridge } from './mcp/index.js';
export interface ServerOptions {
    url: string;
    allowAuthPassthrough: boolean;
    trace: boolean;
}
export interface CreateAppOptions extends ServerOptions {
    /** When provided, use this bridge and skip connecting (for tests). */
    bridge?: McpBridge;
}
/**
 * Creates the Express app with MCP bridge. When options.bridge is provided, uses it without connecting (for tests).
 */
export declare function createApp(options: CreateAppOptions): Promise<Application>;
export declare function startServer(port: number, options: ServerOptions): Promise<void>;
