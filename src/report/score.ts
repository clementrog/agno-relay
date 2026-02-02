import type { ConformanceCheck, CheckStatus } from "./types.js";

const POINTS: Record<CheckStatus, number> = {
  pass: 10,
  warn: 5,
  fail: 0,
};

/**
 * Calculates conformance score from checks: pass=10, warn=5, fail=0, normalized to 0-100.
 */
export function calculateScore(checks: ConformanceCheck[]): number {
  if (checks.length === 0) return 0;
  const raw = checks.reduce((sum, c) => sum + POINTS[c.status], 0);
  const maxRaw = checks.length * 10;
  return Math.round((raw / maxRaw) * 100);
}
