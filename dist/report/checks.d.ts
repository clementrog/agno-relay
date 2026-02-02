import type { ConformanceCheck } from "./types.js";
/**
 * Runs all conformance checks: schema validity, canonical error wrapping,
 * pagination normalization, auth behavior, determinism.
 */
export declare function runConformanceChecks(): ConformanceCheck[];
