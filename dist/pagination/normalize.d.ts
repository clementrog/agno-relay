import type { PaginatedResponse } from "./types.js";
/**
 * Detects pagination in MCP response and converts it to standard PaginatedResponse format.
 */
export declare function normalizeListResponse(result: unknown): PaginatedResponse;
/**
 * Detects list-like tools by name patterns: list*, get*s, search*, find*, query* (case insensitive).
 */
export declare function isListTool(toolName: string): boolean;
