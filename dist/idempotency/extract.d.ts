/**
 * Extracts X-Idempotency-Key header from request headers.
 * Returns the first value if header is present, null otherwise.
 */
export declare function extractIdempotencyKey(headers: Record<string, string | string[] | undefined>): string | null;
