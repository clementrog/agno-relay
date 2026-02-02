/**
 * Replaces sensitive values (tokens, cookies, authorization headers, api keys, etc.)
 * with '[REDACTED]' in strings and in object values. Safe to use on message and context
 * before writing logs.
 */
export declare function redactSecrets(input: string | Record<string, unknown>): string | Record<string, unknown>;
