/**
 * Encodes page token or page number into an opaque base64 cursor string.
 */
export declare function encodeCursor(value: string | number): string;
/**
 * Decodes an opaque cursor back to page token or number.
 * Returns null for invalid or malformed cursors.
 */
export declare function decodeCursor(cursor: string): string | number | null;
