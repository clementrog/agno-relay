/**
 * Returns the Authorization header value from the request when allowPassthrough is true.
 * Whitelist only Authorization header for passthrough. Returns null if passthrough disabled or header absent.
 */
export function extractPassthroughAuth(headers, allowPassthrough) {
    if (!allowPassthrough)
        return null;
    const raw = headers['authorization'] ?? headers['Authorization'];
    if (raw == null)
        return null;
    const value = Array.isArray(raw) ? raw[0] : raw;
    return typeof value === 'string' && value.trim() !== '' ? value.trim() : null;
}
