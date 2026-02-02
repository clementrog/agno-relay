import { redactSecrets } from "../logging/redact.js";
const MAX_VALUE_LENGTH = 1000;
const TRUNCATE_SUFFIX = "...[truncated]";
/**
 * Truncates strings longer than 1000 characters with '...[truncated]' suffix.
 * Non-strings are returned unchanged.
 */
export function truncateValue(value) {
    if (typeof value !== "string")
        return value;
    if (value.length <= MAX_VALUE_LENGTH)
        return value;
    return value.slice(0, MAX_VALUE_LENGTH - TRUNCATE_SUFFIX.length) + TRUNCATE_SUFFIX;
}
/** Recursively truncate string values in a redacted value. */
function truncateStrings(value) {
    if (value === null || value === undefined)
        return value;
    if (typeof value === "string")
        return truncateValue(value);
    if (typeof value === "number" || typeof value === "boolean")
        return value;
    if (Array.isArray(value))
        return value.map(truncateStrings);
    if (typeof value === "object") {
        const out = {};
        for (const [k, v] of Object.entries(value))
            out[k] = truncateStrings(v);
        return out;
    }
    return value;
}
/** Applies redactSecrets to all values, then truncates long strings. */
function redactAndTruncate(value) {
    if (typeof value === "string") {
        return truncateValue(redactSecrets(value));
    }
    if (Array.isArray(value)) {
        return value.map(redactAndTruncate);
    }
    if (value !== null && typeof value === "object") {
        const redacted = redactSecrets(value);
        return truncateStrings(redacted);
    }
    return value;
}
function formatBlock(label, value) {
    const safe = redactAndTruncate(value);
    const str = typeof safe === "string" ? safe : JSON.stringify(safe, null, 2);
    return `${label}:\n${str}`;
}
/**
 * Creates a side-by-side human-readable trace: OpenAI request vs translated MCP request(s),
 * OpenAI response vs MCP response(s). All values are redacted and truncated before output.
 */
export function formatTrace(entry) {
    const sections = [];
    sections.push("=== OpenAI Request ===");
    sections.push(formatBlock("OpenAI request", entry.openaiRequest));
    sections.push("\n=== MCP Request(s) ===");
    if (entry.mcpCalls.length === 0) {
        sections.push("(none)");
    }
    else {
        entry.mcpCalls.forEach((call, i) => {
            sections.push(formatBlock(`MCP call ${i + 1}`, call));
        });
    }
    sections.push("\n=== MCP Response(s) ===");
    if (entry.mcpResponses.length === 0) {
        sections.push("(none)");
    }
    else {
        entry.mcpResponses.forEach((res, i) => {
            sections.push(formatBlock(`MCP response ${i + 1}`, res));
        });
    }
    sections.push("\n=== OpenAI Response ===");
    sections.push(formatBlock("OpenAI response", entry.openaiResponse));
    return sections.join("\n");
}
