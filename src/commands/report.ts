export interface ReportOptions {
  format: string;
}

export function runReport(options: ReportOptions): void {
  console.log('Generating report...');
  console.log('Options:', options);
}
