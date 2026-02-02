/**
 * Encodes page token or page number into an opaque base64 cursor string.
 */
export function encodeCursor(value) {
    const payload = JSON.stringify(value);
    return Buffer.from(payload, "utf-8").toString("base64");
}
/**
 * Decodes an opaque cursor back to page token or number.
 * Returns null for invalid or malformed cursors.
 */
export function decodeCursor(cursor) {
    if (typeof cursor !== "string" || cursor.trim() === "")
        return null;
    try {
        const decoded = Buffer.from(cursor, "base64").toString("utf-8");
        const parsed = JSON.parse(decoded);
        if (typeof parsed === "string" || typeof parsed === "number")
            return parsed;
        return null;
    }
    catch {
        return null;
    }
}
