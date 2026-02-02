/**
 * Extracts X-Idempotency-Key header from request headers.
 * Returns the first value if header is present, null otherwise.
 */
export function extractIdempotencyKey(
  headers: Record<string, string | string[] | undefined>
): string | null {
  const raw = headers["x-idempotency-key"] ?? headers["X-Idempotency-Key"];
  if (raw === undefined) return null;
  const value = Array.isArray(raw) ? raw[0] : raw;
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}
