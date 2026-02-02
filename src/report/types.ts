/**
 * Status of a single conformance check.
 */
export type CheckStatus = "pass" | "warn" | "fail";

/**
 * Single conformance check result.
 */
export interface ConformanceCheck {
  name: string;
  status: CheckStatus;
  message: string;
}

/**
 * Conformance report: score, checks, capabilities, adapter, lastVerified.
 * Report must NOT contain any tokens (redaction applies).
 */
export interface ConformanceReport {
  score: number;
  checks: ConformanceCheck[];
  capabilities: string[];
  adapter: string;
  lastVerified: string;
}
