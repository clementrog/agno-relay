import { encodeCursor } from "./cursor.js";
/** Common keys that hold the list array in upstream responses */
const DATA_KEYS = ["items", "data", "results", "resources"];
/** Common pagination field names in upstream responses */
const PAGINATION_KEYS = ["nextPageToken", "next_page", "page", "offset", "cursor"];
/**
 * Extracts a JSON payload from MCP result. If result has content[].text, parses first text as JSON.
 */
function getPayload(result) {
    if (result === undefined || result === null)
        return result;
    if (typeof result === "object" && result !== null && "content" in result) {
        const content = result.content;
        if (Array.isArray(content) && content.length > 0) {
            const first = content[0];
            if (first != null &&
                typeof first === "object" &&
                "text" in first &&
                typeof first.text === "string") {
                const text = first.text;
                try {
                    return JSON.parse(text);
                }
                catch {
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
function extractData(payload) {
    if (Array.isArray(payload))
        return payload;
    if (payload === null || typeof payload !== "object")
        return [];
    const obj = payload;
    for (const key of DATA_KEYS) {
        const val = obj[key];
        if (Array.isArray(val))
            return val;
    }
    return [];
}
/**
 * Extracts pagination state from payload: next token/page/cursor and has_more.
 */
function extractPagination(payload) {
    if (payload === null || typeof payload !== "object")
        return { has_more: false, cursor: null };
    const obj = payload;
    let nextValue;
    for (const key of PAGINATION_KEYS) {
        const val = obj[key];
        if (val !== undefined && val !== null && val !== "") {
            nextValue = typeof val === "string" || typeof val === "number" ? val : String(val);
            break;
        }
    }
    if (nextValue === undefined || nextValue === null)
        return { has_more: false, cursor: null };
    return {
        has_more: true,
        cursor: encodeCursor(nextValue),
    };
}
/**
 * Detects pagination in MCP response and converts it to standard PaginatedResponse format.
 */
export function normalizeListResponse(result) {
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
export function isListTool(toolName) {
    if (typeof toolName !== "string" || toolName.trim() === "")
        return false;
    return LIST_NAME_PATTERNS.some((re) => re.test(toolName.trim()));
}
