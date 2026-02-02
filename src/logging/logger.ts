import { redactSecrets } from './redact.js';
import type { LogLevel, LogEntry } from './types.js';

export class Logger {
  log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
    const timestamp = new Date().toISOString();
    const safeMessage =
      typeof message === 'string' ? (redactSecrets(message) as string) : String(message);
    const safeContext =
      context !== undefined
        ? (redactSecrets(context) as Record<string, unknown>)
        : undefined;
    const entry: LogEntry = {
      level,
      message: safeMessage,
      timestamp,
      ...(safeContext !== undefined && Object.keys(safeContext).length > 0
        ? { context: safeContext }
        : {}),
    };
    const line = JSON.stringify(entry);
    process.stdout.write(line + '\n');
  }
}
