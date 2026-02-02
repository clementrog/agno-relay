/**
 * Returns the Authorization header value from the request when allowPassthrough is true.
 * Whitelist only Authorization header for passthrough. Returns null if passthrough disabled or header absent.
 */
export declare function extractPassthroughAuth(headers: Record<string, string | string[] | undefined>, allowPassthrough: boolean): string | null;
