import type { McpBridge } from "../mcp/client.js";
import { setRetryable, wrapNetworkError, wrapTimeoutError } from "../errors/factory.js";
import { extractIdempotencyKey } from "../idempotency/extract.js";
import { isListTool, normalizeListResponse } from "../pagination/normalize.js";
import { isMutationTool } from "../translation/tools.js";
import type {
  ChatCompletionRequest,
  ChatCompletionResponse,
  ChatMessage,
  OpenAIToolCall,
} from "./types.js";

const IDEMPOTENCY_KEY_REQUIRED_MESSAGE =
  "Mutation failed. Provide X-Idempotency-Key header to enable safe retries.";

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

export interface ChatCompletionOptions {
  headers?: Record<string, string | string[] | undefined>;
}

/**
 * handleChatCompletion: extracts tool_calls from last assistant message,
 * calls McpBridge.callTool for each, builds OpenAI-format response.
 * Wraps MCP tool call errors and applies setRetryable based on idempotency key and mutation.
 */
export async function handleChatCompletion(
  request: ChatCompletionRequest,
  bridge: McpBridge,
  options?: ChatCompletionOptions
): Promise<ChatCompletionResponse> {
  const headers = options?.headers ?? {};
  const idempotencyKey = extractIdempotencyKey(headers);
  const hasIdempotencyKey = idempotencyKey !== null;

  const toolCalls = getToolCallsFromLastMessage(request.messages);
  const results: Array<{ id: string; type: "function"; function: { name: string; arguments: string } }> = [];

  for (const tc of toolCalls) {
    const name = tc.function?.name ?? "";
    const argsJson = typeof tc.function?.arguments === "string" ? tc.function.arguments : "{}";
    const args = parseToolArguments(argsJson);
    const isReadOnly = !isMutationTool(name);
    try {
      const raw = await bridge.callTool(name, args);
      const toSerialize = isListTool(name) ? normalizeListResponse(raw) : raw;
      const serialized = serializeToolResult(toSerialize);
      results.push({
        id: tc.id ?? "",
        type: "function",
        function: { name, arguments: serialized },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const isTimeout =
        /timeout|deadline/i.test(message);
      const canonical = isTimeout
        ? wrapTimeoutError(message, { source: "bridge" })
        : wrapNetworkError(message, { source: "bridge" });
      const withRetry = setRetryable(canonical, {
        isReadOnly,
        hasIdempotencyKey,
      });
      if (
        !isReadOnly &&
        !hasIdempotencyKey &&
        (withRetry.class === "timeout" || withRetry.class === "transient")
      ) {
        throw { ...withRetry, message: IDEMPOTENCY_KEY_REQUIRED_MESSAGE };
      }
      throw withRetry;
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
