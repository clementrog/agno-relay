import type { ChatCompletionRequest, ChatCompletionResponse } from "../handlers/types.js";
/**
 * One MCP call (name + arguments) as sent to the MCP server.
 */
export interface McpCallRecord {
    name: string;
    arguments: Record<string, unknown>;
}
/**
 * Trace entry capturing request/response pairs for a single chat completion:
 * incoming OpenAI request, translated MCP call(s), MCP response(s), translated OpenAI response.
 */
export interface TraceEntry {
    /** Incoming OpenAI chat completion request. */
    openaiRequest: ChatCompletionRequest;
    /** Translated MCP calls (one per tool call). */
    mcpCalls: McpCallRecord[];
    /** Raw MCP responses in order (one per tool call). */
    mcpResponses: unknown[];
    /** Translated OpenAI chat completion response. */
    openaiResponse: ChatCompletionResponse;
}
