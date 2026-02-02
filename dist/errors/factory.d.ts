import type { CanonicalError, CanonicalErrorContext, ErrorClass } from "./types.js";
/**
 * Builds the canonical error envelope structure.
 */
export declare function createCanonicalError(errorClass: ErrorClass, message: string, context: CanonicalErrorContext, options?: {
    retryable?: boolean;
    suggested_backoff_ms?: number | null;
    action?: string;
}): CanonicalError;
/**
 * Maps HTTP status code to canonical ErrorClass.
 * 401->auth, 403->permission, 404->not_found, 409->conflict,
 * 422/400->invalid_args, 429->rate_limit, 502/503/504->transient.
 */
export declare function httpStatusToErrorClass(status: number): ErrorClass;
/** HTTP response shape for wrapUpstreamError. */
export interface UpstreamResponse {
    status: number;
    body: string | Record<string, unknown>;
    headers?: Record<string, string | string[] | undefined>;
}
/**
 * Wraps an HTTP upstream response into a CanonicalError.
 * For rate_limit, extracts Retry-After header for suggested_backoff_ms.
 * For HTML responses, sets message to 'Upstream returned non-JSON response'.
 */
export declare function wrapUpstreamError(response: UpstreamResponse): CanonicalError;
/**
 * Wraps DNS/TLS/connect errors into a CanonicalError with transient class.
 */
export declare function wrapNetworkError(message: string, context?: CanonicalErrorContext): CanonicalError;
/**
 * Wraps deadline-exceeded / timeout into a CanonicalError with timeout class.
 */
export declare function wrapTimeoutError(message: string, context?: CanonicalErrorContext): CanonicalError;
/**
 * Sets retryable and suggested_backoff_ms on a canonical error:
 * - rate_limit / transient (read-only ops): retryable=true, suggested_backoff_ms set
 * - mutations without idempotency key: retryable=false
 */
export declare function setRetryable(error: CanonicalError, options: {
    isReadOnly?: boolean;
    hasIdempotencyKey?: boolean;
}): CanonicalError;
