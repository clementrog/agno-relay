/**
 * Shields.io style badge URL for conformance score.
 */
export function badgeSnippet(score) {
    const color = score >= 80 ? "green" : score >= 50 ? "yellow" : "red";
    return `[![Conformance](https://img.shields.io/badge/conformance-${score}%25-${color})](https://github.com/agno/report)`;
}
/**
 * Generates README-ready markdown block with capability matrix, score, last verified timestamp, and badge.
 */
export function formatMarkdown(report) {
    const lines = [];
    lines.push("## Conformance Report");
    lines.push("");
    lines.push(badgeSnippet(report.score));
    lines.push("");
    lines.push(`**Score:** ${report.score}/100`);
    lines.push(`**Adapter:** ${report.adapter}`);
    lines.push(`**Last verified:** ${report.lastVerified}`);
    lines.push("");
    lines.push("### Capability matrix");
    lines.push("");
    lines.push("| Check | Status |");
    lines.push("|-------|--------|");
    for (const c of report.checks) {
        const statusEmoji = c.status === "pass" ? "✅" : c.status === "warn" ? "⚠️" : "❌";
        lines.push(`| ${c.name} | ${statusEmoji} ${c.status} |`);
    }
    lines.push("");
    lines.push("### Capabilities");
    lines.push("");
    for (const cap of report.capabilities) {
        lines.push(`- ${cap}`);
    }
    lines.push("");
    return lines.join("\n");
}
/**
 * Returns full ConformanceReport as JSON string for --format json output.
 */
export function formatJson(report) {
    return JSON.stringify(report, null, 2);
}
