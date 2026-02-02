import type { ConformanceReport } from "./types.js";
/**
 * Shields.io style badge URL for conformance score.
 */
export declare function badgeSnippet(score: number): string;
/**
 * Generates README-ready markdown block with capability matrix, score, last verified timestamp, and badge.
 */
export declare function formatMarkdown(report: ConformanceReport): string;
/**
 * Returns full ConformanceReport as JSON string for --format json output.
 */
export declare function formatJson(report: ConformanceReport): string;
