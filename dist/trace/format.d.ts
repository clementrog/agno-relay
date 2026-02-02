import type { TraceEntry } from "./types.js";
/**
 * Truncates strings longer than 1000 characters with '...[truncated]' suffix.
 * Non-strings are returned unchanged.
 */
export declare function truncateValue(value: unknown): unknown;
/**
 * Creates a side-by-side human-readable trace: OpenAI request vs translated MCP request(s),
 * OpenAI response vs MCP response(s). All values are redacted and truncated before output.
 */
export declare function formatTrace(entry: TraceEntry): string;
