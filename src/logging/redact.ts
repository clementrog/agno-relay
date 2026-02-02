const REDACTED = '[REDACTED]';

/** Patterns that match sensitive values; each is [keyOrLabel, valueRegex?]. Value is redacted. */
const SECRET_PATTERNS: Array<{ key?: RegExp; value?: RegExp; replaceInString?: RegExp }> = [
  // Authorization header (Bearer token, Basic auth, etc.)
  { replaceInString: /authorization\s*:\s*[^\s,}\]"']+/gi },
  { replaceInString: /Bearer\s+[A-Za-z0-9\-_.~+/]+=*/gi },
  { replaceInString: /Basic\s+[A-Za-z0-9+/=]+/gi },
  // API keys and tokens in common shapes
  { replaceInString: /api[_-]?key\s*[:=]\s*["']?[A-Za-z0-9\-_.~+/=]{8,}["']?/gi },
  { replaceInString: /apikey\s*[:=]\s*["']?[A-Za-z0-9\-_.~+/=]{8,}["']?/gi },
  { replaceInString: /token\s*[:=]\s*["']?[A-Za-z0-9\-_.~+/=]{8,}["']?/gi },
  { replaceInString: /access[_-]?token\s*[:=]\s*["']?[A-Za-z0-9\-_.~+/=]{8,}["']?/gi },
  { replaceInString: /secret\s*[:=]\s*["']?[A-Za-z0-9\-_.~+/=]{8,}["']?/gi },
  // Tokens in URLs (e.g. ?token=..., &api_key=...)
  { replaceInString: /[?&](?:token|api_key|apikey|access_token|auth)=[A-Za-z0-9\-_.~+/%=]+/gi },
  // Cookie header
  { replaceInString: /cookie\s*:\s*[^\s,}\]"']+/gi },
  { replaceInString: /set-cookie\s*:\s*[^\s,}\]"']+/gi },
  // X-Auth, X-API-Key style headers
  { replaceInString: /x-[a-z-]*(?:auth|api-key|token|secret)[a-z-]*\s*:\s*[^\s,}\]"']+/gi },
  // Generic long base64-like or hex strings that might be secrets (err on side of redacting)
  { replaceInString: /(?:password|passwd|pwd)\s*[:=]\s*["']?[^\s"']+["']?/gi },
];

function redactString(s: string): string {
  let out = s;
  for (const p of SECRET_PATTERNS) {
    if (p.replaceInString) {
      out = out.replace(p.replaceInString, REDACTED);
    }
  }
  return out;
}

function redactValue(value: unknown): unknown {
  if (value === null || value === undefined) {
    return value;
  }
  if (typeof value === 'string') {
    return redactString(value);
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(redactValue);
  }
  if (typeof value === 'object') {
    const obj: Record<string, unknown> = {};
    const sensitiveKeys = /^(authorization|cookie|set-cookie|x-api-key|x-auth-token|api[_-]?key|token|access[_-]?token|secret|password|passwd|pwd)$/i;
    for (const [k, v] of Object.entries(value)) {
      const key = k.toLowerCase();
      obj[k] = sensitiveKeys.test(key) ? REDACTED : redactValue(v);
    }
    return obj;
  }
  return value;
}

/**
 * Replaces sensitive values (tokens, cookies, authorization headers, api keys, etc.)
 * with '[REDACTED]' in strings and in object values. Safe to use on message and context
 * before writing logs.
 */
export function redactSecrets(input: string | Record<string, unknown>): string | Record<string, unknown> {
  if (typeof input === 'string') {
    return redactString(input);
  }
  if (input !== null && typeof input === 'object' && !Array.isArray(input)) {
    return redactValue(input) as Record<string, unknown>;
  }
  return input;
}
