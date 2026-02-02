import type { LogLevel } from './types.js';
export declare class Logger {
    log(level: LogLevel, message: string, context?: Record<string, unknown>): void;
}
