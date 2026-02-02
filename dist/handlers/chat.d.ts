import type { McpBridge } from "../mcp/client.js";
import type { TraceEntry } from "../trace/types.js";
import type { ChatCompletionRequest, ChatCompletionResponse } from "./types.js";
export interface ChatCompletionOptions {
    headers?: Record<string, string | string[] | undefined>;
    /** When true, capture trace data; if onTrace is provided, it will be called with the entry. */
    trace?: boolean;
    onTrace?: (entry: TraceEntry) => void;
}
/**
 * handleChatCompletion: extracts tool_calls from last assistant message,
 * calls McpBridge.callTool for each, builds OpenAI-format response.
 * Wraps MCP tool call errors and applies setRetryable based on idempotency key and mutation.
 */
export declare function handleChatCompletion(request: ChatCompletionRequest, bridge: McpBridge, options?: ChatCompletionOptions): Promise<ChatCompletionResponse>;
