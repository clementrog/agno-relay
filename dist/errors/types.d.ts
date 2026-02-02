/**
 * Canonical error class union - the 8 fixed classes for the error contract.
 */
export type ErrorClass = "auth" | "permission" | "invalid_args" | "not_found" | "conflict" | "rate_limit" | "transient" | "timeout";
/**
 * Context attached to canonical errors (upstream vs bridge, optional codes).
 */
export interface CanonicalErrorContext {
    source: "upstream" | "bridge";
    upstream_code?: number;
    reset_at?: number;
}
/**
 * Canonical error envelope - every failure must be wrapped into this structure.
 */
export interface CanonicalError {
    class: ErrorClass;
    retryable: boolean;
    suggested_backoff_ms: number | null;
    message: string;
    action: string;
    context: CanonicalErrorContext;
}
