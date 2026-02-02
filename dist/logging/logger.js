import { redactSecrets } from './redact.js';
export class Logger {
    log(level, message, context) {
        const timestamp = new Date().toISOString();
        const safeMessage = typeof message === 'string' ? redactSecrets(message) : String(message);
        const safeContext = context !== undefined
            ? redactSecrets(context)
            : undefined;
        const entry = {
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
