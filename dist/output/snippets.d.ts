/**
 * Copy/paste code snippets for JS and Python calling /v1/chat/completions with tool call.
 */
export interface SnippetsOptions {
    baseUrl: string;
}
/**
 * Returns copy/paste code examples for JS (fetch) and Python (requests) to call
 * /v1/chat/completions with a tool call.
 */
export declare function generateSnippets(options: SnippetsOptions): {
    js: string;
    python: string;
};
/**
 * Prints the snippets to console (e.g. after startup).
 */
export declare function printSnippets(options: SnippetsOptions): void;
