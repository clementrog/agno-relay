import { runConformanceChecks } from "../report/checks.js";
import { calculateScore } from "../report/score.js";
import { formatMarkdown, formatJson } from "../report/format.js";
const ADAPTER_NAME = "agno";
function buildReport() {
    const checks = runConformanceChecks();
    const score = calculateScore(checks);
    const capabilities = checks.map((c) => c.name);
    return {
        score,
        checks,
        capabilities,
        adapter: ADAPTER_NAME,
        lastVerified: new Date().toISOString(),
    };
}
export function runReport(options) {
    const report = buildReport();
    const format = (options.format ?? "markdown").toLowerCase();
    if (format === "json") {
        console.log(formatJson(report));
    }
    else {
        console.log(formatMarkdown(report));
    }
}
