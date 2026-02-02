/**
 * OpenAI chat message (role + optional content and/or tool_calls).
 */
export interface ChatMessage {
    role: "user" | "assistant" | "system";
    content?: string | null;
    tool_calls?: OpenAIToolCall[];
}
/**
 * OpenAI tool call item (id, type, function name + arguments).
 */
export interface OpenAIToolCall {
    id: string;
    type: "function";
    function: {
        name: string;
        arguments: string;
    };
}
/**
 * OpenAI Chat Completion request: model, messages, optional tools, tool_choice, stream.
 */
export interface ChatCompletionRequest {
    model: string;
    messages: ChatMessage[];
    tools?: unknown[];
    tool_choice?: unknown;
    stream?: boolean;
}
/**
 * OpenAI Chat Completion response: choices with message containing optional tool_calls.
 */
export interface ChatCompletionResponse {
    id?: string;
    object?: string;
    choices: Array<{
        index: number;
        message: {
            role: "assistant";
            content: string | null;
            tool_calls?: Array<{
                id: string;
                type: "function";
                function: {
                    name: string;
                    arguments: string;
                };
            }>;
        };
        finish_reason: string;
    }>;
    usage?: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}
