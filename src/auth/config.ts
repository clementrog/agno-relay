import type { AuthConfig } from './types.js';

/**
 * Loads auth config from environment: bridge token from GITHUB_TOKEN or MCP_AUTH_TOKEN,
 * allowPassthrough must be set by the caller (e.g. from --allow-auth-passthrough flag).
 */
export function loadAuthConfig(allowPassthrough: boolean): AuthConfig {
  const bridgeToken =
    (typeof process.env.MCP_AUTH_TOKEN === 'string' && process.env.MCP_AUTH_TOKEN.trim() !== ''
      ? process.env.MCP_AUTH_TOKEN.trim()
      : null) ??
    (typeof process.env.GITHUB_TOKEN === 'string' && process.env.GITHUB_TOKEN.trim() !== ''
      ? process.env.GITHUB_TOKEN.trim()
      : null);
  return { bridgeToken, allowPassthrough };
}
