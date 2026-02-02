import type { PaginatedResponse } from "./types.js";
import { encodeCursor } from "./cursor.js";

/** Common keys that hold the list array in upstream responses */
const DATA_KEYS = ["items", "data", "results", "resources"] as const;

/** Common pagination field names in upstream responses */
const PAGINATION_KEYS = ["nextPageToken", "next_page", "page", "offset", "cursor"] as const;

/**
 * Extracts a JSON payload from MCP result. If result has content[].text, parses first text as JSON.
 */
function getPayload(result: unknown): unknown {
  if (result === undefined || result === null) return result;
  if (typeof result === "object" && result !== null && "content" in result) {
    const content = (result as { content?: unknown[] }).content;
    if (Array.isArray(content) && content.length > 0) {
      const first = content[0];
      if (
        first != null &&
        typeof first === "object" &&
        "text" in first &&
        typeof (first as { text: unknown }).text === "string"
      ) {
        const text = (first as { text: string }).text;
        try {
          return JSON.parse(text) as unknown;
        } catch {
          return result;
        }
      }
    }
  }
  return result;
}

/**
 * Extracts the data array from a payload (object or array).
 */
function extractData(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (payload === null || typeof payload !== "object") return [];
  const obj = payload as Record<string, unknown>;
  for (const key of DATA_KEYS) {
    const val = obj[key];
    if (Array.isArray(val)) return val;
  }
  return [];
}

/**
 * Extracts pagination state from payload: next token/page/cursor and has_more.
 */
function extractPagination(payload: unknown): { has_more: boolean; cursor: string | null } {
  if (payload === null || typeof payload !== "object") return { has_more: false, cursor: null };
  const obj = payload as Record<string, unknown>;
  let nextValue: string | number | null | undefined;
  for (const key of PAGINATION_KEYS) {
    const val = obj[key];
    if (val !== undefined && val !== null && val !== "") {
      nextValue = typeof val === "string" || typeof val === "number" ? val : String(val);
      break;
    }
  }
  if (nextValue === undefined || nextValue === null) return { has_more: false, cursor: null };
  return {
    has_more: true,
    cursor: encodeCursor(nextValue),
  };
}

/**
 * Detects pagination in MCP response and converts it to standard PaginatedResponse format.
 */
export function normalizeListResponse(result: unknown): PaginatedResponse {
  const payload = getPayload(result);
  const data = extractData(payload);
  const pagination = extractPagination(payload);
  return { data, pagination };
}

const LIST_NAME_PATTERNS = [
  /^list/i,
  /^get.*s$/i,
  /^search/i,
  /^find/i,
  /^query/i,
];

/**
 * Detects list-like tools by name patterns: list*, get*s, search*, find*, query* (case insensitive).
 */
export function isListTool(toolName: string): boolean {
  if (typeof toolName !== "string" || toolName.trim() === "") return false;
  return LIST_NAME_PATTERNS.some((re) => re.test(toolName.trim()));
}
