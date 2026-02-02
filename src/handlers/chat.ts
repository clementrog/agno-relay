import type { McpBridge } from "../mcp/client.js";
import { wrapNetworkError } from "../errors/factory.js";
import type {
  ChatCompletionRequest,
  ChatCompletionResponse,
  ChatMessage,
  OpenAIToolCall,
} from "./types.js";

/**
 * Extracts tool_calls from the last assistant message.
 * Returns empty array if last message is not assistant or has no tool_calls.
 */
function getToolCallsFromLastMessage(messages: ChatMessage[]): OpenAIToolCall[] {
  if (messages.length === 0) return [];
  const last = messages[messages.length - 1];
  if (last?.role !== "assistant" || !Array.isArray(last.tool_calls)) return [];
  return last.tool_calls;
}

/**
 * Parses JSON arguments, returns empty object if invalid.
 */
function parseToolArguments(argsJson: string): Record<string, unknown> {
  if (typeof argsJson !== "string" || argsJson.trim() === "") return {};
  try {
    const parsed = JSON.parse(argsJson);
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

/**
 * Serializes MCP call result for OpenAI response (function.arguments string).
 * MCP returns { content?: Array<{ type, text }> } or arbitrary shape; we JSON.stringify.
 */
function serializeToolResult(result: unknown): string {
  if (result === undefined || result === null) return "null";
  if (typeof result === "object" && result !== null && "content" in result) {
    const content = (result as { content?: unknown[] }).content;
    if (Array.isArray(content)) {
      const texts = content
        .filter((c): c is { type: string; text?: string } => c != null && typeof c === "object" && "text" in c)
        .map((c) => (typeof c.text === "string" ? c.text : ""));
      if (texts.length > 0) return JSON.stringify({ result: texts.join("\n") });
    }
  }
  return JSON.stringify(result);
}

/**
 * handleChatCompletion: extracts tool_calls from last assistant message,
 * calls McpBridge.callTool for each, builds OpenAI-format response.
 * Wraps MCP tool call errors with wrapNetworkError (transient).
 */
export async function handleChatCompletion(
  request: ChatCompletionRequest,
  bridge: McpBridge
): Promise<ChatCompletionResponse> {
  const toolCalls = getToolCallsFromLastMessage(request.messages);
  const results: Array<{ id: string; type: "function"; function: { name: string; arguments: string } }> = [];

  for (const tc of toolCalls) {
    const name = tc.function?.name ?? "";
    const argsJson = typeof tc.function?.arguments === "string" ? tc.function.arguments : "{}";
    const args = parseToolArguments(argsJson);
    try {
      const raw = await bridge.callTool(name, args);
      const serialized = serializeToolResult(raw);
      results.push({
        id: tc.id ?? "",
        type: "function",
        function: { name, arguments: serialized },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw wrapNetworkError(message, { source: "bridge" });
    }
  }

  const response: ChatCompletionResponse = {
    id: "chatcmpl-bridge",
    object: "chat.completion",
    choices: [
      {
        index: 0,
        message: {
          role: "assistant",
          content: null,
          tool_calls: results,
        },
        finish_reason: "tool_calls",
      },
    ],
    usage: {
      prompt_tokens: 0,
      completion_tokens: 0,
      total_tokens: 0,
    },
  };
  return response;
}
