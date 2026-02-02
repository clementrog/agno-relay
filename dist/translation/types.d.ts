/**
 * JSON Schema shape for OpenAI function parameters (open-ended per JSON Schema spec).
 */
export type JSONSchema = Record<string, unknown>;
/**
 * OpenAI function descriptor (name, description, parameters).
 */
export interface OpenAIFunction {
    name: string;
    description: string;
    parameters: JSONSchema;
}
/**
 * OpenAI tool with type 'function' and nested function descriptor.
 */
export interface OpenAITool {
    type: "function";
    function: OpenAIFunction;
}
