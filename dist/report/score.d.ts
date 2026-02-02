import type { ConformanceCheck } from "./types.js";
/**
 * Calculates conformance score from checks: pass=10, warn=5, fail=0, normalized to 0-100.
 */
export declare function calculateScore(checks: ConformanceCheck[]): number;
