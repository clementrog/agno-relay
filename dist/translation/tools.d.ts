import type { OpenAITool } from "./types.js";
/** MCP tool shape (name, optional description, optional inputSchema). */
export interface McpTool {
    name?: string;
    description?: string;
    inputSchema?: Record<string, unknown>;
}
/**
 * Detects mutation operations by name patterns: create*, update*, delete*, remove*,
 * add*, set*, patch*, put*, post* (case insensitive).
 */
export declare function isMutationTool(name: string): boolean;
/**
 * Validates that a tool can be safely represented as an OpenAI tool.
 * Throws invalid_args canonical error if e.g. name is missing.
 */
export declare function validateToolTranslation(tool: McpTool): void;
/**
 * Converts an array of MCP tools to OpenAI tools array.
 * Fails closed: validates each tool first; invalid tools cause invalid_args throw.
 * Same MCP input always produces same OpenAI output (deterministic).
 */
export declare function translateMcpToolsToOpenAI(mcpTools: McpTool[]): OpenAITool[];
