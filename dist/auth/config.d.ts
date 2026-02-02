import type { AuthConfig } from './types.js';
/**
 * Loads auth config from environment: bridge token from GITHUB_TOKEN or MCP_AUTH_TOKEN,
 * allowPassthrough must be set by the caller (e.g. from --allow-auth-passthrough flag).
 */
export declare function loadAuthConfig(allowPassthrough: boolean): AuthConfig;
