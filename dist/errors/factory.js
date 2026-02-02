/** Action string for each error class (PRD). */
const ERROR_CLASS_TO_ACTION = {
    auth: "fix_credentials",
    permission: "check_permissions",
    invalid_args: "fix_arguments",
    not_found: "not_applicable",
    conflict: "not_applicable",
    rate_limit: "wait_and_retry",
    transient: "retry",
    timeout: "not_applicable",
};
/**
 * Builds the canonical error envelope structure.
 */
export function createCanonicalError(errorClass, message, context, options) {
    const action = options?.action ?? ERROR_CLASS_TO_ACTION[errorClass];
    const retryable = options?.retryable ?? (errorClass === "rate_limit" || errorClass === "transient");
    const suggested_backoff_ms = options?.suggested_backoff_ms !== undefined
        ? options.suggested_backoff_ms
        : errorClass === "transient"
            ? 1000
            : null;
    return {
        class: errorClass,
        retryable,
        suggested_backoff_ms,
        message,
        action,
        context,
    };
}
/**
 * Maps HTTP status code to canonical ErrorClass.
 * 401->auth, 403->permission, 404->not_found, 409->conflict,
 * 422/400->invalid_args, 429->rate_limit, 502/503/504->transient.
 */
export function httpStatusToErrorClass(status) {
    switch (status) {
        case 401:
            return "auth";
        case 403:
            return "permission";
        case 404:
            return "not_found";
        case 409:
            return "conflict";
        case 400:
        case 422:
            return "invalid_args";
        case 429:
            return "rate_limit";
        case 502:
        case 503:
        case 504:
            return "transient";
        default:
            return "transient";
    }
}
/**
 * Wraps an HTTP upstream response into a CanonicalError.
 * For rate_limit, extracts Retry-After header for suggested_backoff_ms.
 * For HTML responses, sets message to 'Upstream returned non-JSON response'.
 */
export function wrapUpstreamError(response) {
    const status = response.status;
    const errorClass = httpStatusToErrorClass(status);
    const context = { source: "upstream", upstream_code: status };
    const isHtml = typeof response.body === "string" &&
        (response.body.trimStart().toLowerCase().startsWith("<!") ||
            response.body.includes("</html>"));
    const message = isHtml ? "Upstream returned non-JSON response" : String(response.body ?? "");
    let suggested_backoff_ms = errorClass === "transient" ? 1000 : null;
    if (errorClass === "rate_limit" && response.headers) {
        const retryAfter = response.headers["retry-after"] ?? response.headers["Retry-After"];
        if (retryAfter !== undefined) {
            const val = Array.isArray(retryAfter) ? retryAfter[0] : retryAfter;
            const parsed = parseInt(val, 10);
            if (!Number.isNaN(parsed)) {
                suggested_backoff_ms = parsed * 1000;
            }
        }
    }
    return createCanonicalError(errorClass, message, context, {
        retryable: errorClass === "rate_limit" || errorClass === "transient",
        suggested_backoff_ms,
    });
}
/**
 * Wraps DNS/TLS/connect errors into a CanonicalError with transient class.
 */
export function wrapNetworkError(message, context = { source: "bridge" }) {
    return createCanonicalError("transient", message, context, {
        retryable: true,
        suggested_backoff_ms: 1000,
    });
}
/**
 * Wraps deadline-exceeded / timeout into a CanonicalError with timeout class.
 */
export function wrapTimeoutError(message, context = { source: "bridge" }) {
    return createCanonicalError("timeout", message, context, {
        retryable: false,
        suggested_backoff_ms: null,
    });
}
/**
 * Sets retryable and suggested_backoff_ms on a canonical error:
 * - rate_limit / transient (read-only ops): retryable=true, suggested_backoff_ms set
 * - mutations without idempotency key: retryable=false
 */
export function setRetryable(error, options) {
    const { isReadOnly = false, hasIdempotencyKey = false } = options;
    const isRetryableClass = error.class === "rate_limit" || error.class === "transient";
    if (isRetryableClass && isReadOnly) {
        return {
            ...error,
            retryable: true,
            suggested_backoff_ms: error.suggested_backoff_ms ?? (error.class === "transient" ? 1000 : null),
        };
    }
    if (!isReadOnly && !hasIdempotencyKey) {
        return {
            ...error,
            retryable: false,
            suggested_backoff_ms: null,
        };
    }
    return error;
}
