import { createCanonicalError } from "../errors/factory.js";
import type { JSONSchema, OpenAITool } from "./types.js";

/** MCP tool shape (name, optional description, optional inputSchema). */
export interface McpTool {
  name?: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
}

const MUTATION_PREFIXES = [
  "create",
  "update",
  "delete",
  "remove",
  "add",
  "set",
  "patch",
  "put",
  "post",
];

const MUTATION_WARNING =
  " ⚠️ Not idempotent: do not retry without verifying state. Provide X-Idempotency-Key to enable safe retries.";

/**
 * Detects mutation operations by name patterns: create*, update*, delete*, remove*,
 * add*, set*, patch*, put*, post* (case insensitive).
 */
export function isMutationTool(name: string): boolean {
  const lower = name.trim().toLowerCase();
  return MUTATION_PREFIXES.some((prefix) => lower.startsWith(prefix));
}

/**
 * Validates that a tool can be safely represented as an OpenAI tool.
 * Throws invalid_args canonical error if e.g. name is missing.
 */
export function validateToolTranslation(tool: McpTool): void {
  const name = tool?.name;
  if (name == null || typeof name !== "string" || name.trim() === "") {
    throw createCanonicalError(
      "invalid_args",
      "Tool must have a non-empty name",
      { source: "bridge" }
    );
  }
}

/**
 * Converts one MCP tool to OpenAI tool format. Assumes tool is already validated.
 * MCP name maps directly to function.name; inputSchema maps to function.parameters
 * or empty object if missing. Mutation tools get a warning appended to description.
 */
function translateOne(mcpTool: McpTool): OpenAITool {
  const name = (mcpTool.name ?? "").trim();
  let description = typeof mcpTool.description === "string" ? mcpTool.description : "";
  if (isMutationTool(name)) {
    description = description + MUTATION_WARNING;
  }
  const parameters: JSONSchema =
    mcpTool.inputSchema && typeof mcpTool.inputSchema === "object"
      ? (mcpTool.inputSchema as JSONSchema)
      : {};

  return {
    type: "function",
    function: {
      name,
      description,
      parameters,
    },
  };
}

/**
 * Converts an array of MCP tools to OpenAI tools array.
 * Fails closed: validates each tool first; invalid tools cause invalid_args throw.
 * Same MCP input always produces same OpenAI output (deterministic).
 */
export function translateMcpToolsToOpenAI(mcpTools: McpTool[]): OpenAITool[] {
  const result: OpenAITool[] = [];
  for (let i = 0; i < mcpTools.length; i++) {
    const tool = mcpTools[i];
    validateToolTranslation(tool);
    result.push(translateOne(tool));
  }
  return result;
}
