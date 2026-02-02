/**
 * Copy/paste code snippets for JS and Python calling /v1/chat/completions with tool call.
 */
/**
 * Returns copy/paste code examples for JS (fetch) and Python (requests) to call
 * /v1/chat/completions with a tool call.
 */
export function generateSnippets(options) {
    const { baseUrl } = options;
    const endpoint = `${baseUrl}/v1/chat/completions`;
    const js = `// JavaScript (fetch) – minimal call with tool
const res = await fetch('${endpoint}', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'gpt-4o',
    messages: [
      { role: 'user', content: 'List available tools' },
      { role: 'assistant', content: null, tool_calls: [{ id: '1', type: 'function', function: { name: 'list_tools', arguments: '{}' } }] }
    ],
    tools: [{ type: 'function', function: { name: 'list_tools', description: 'List tools' } }]
  })
});
const data = await res.json();
`;
    const python = `# Python (requests) – minimal call with tool
import requests
r = requests.post('${endpoint}', json={
    'model': 'gpt-4o',
    'messages': [
        {'role': 'user', 'content': 'List available tools'},
        {'role': 'assistant', 'content': None, 'tool_calls': [{'id': '1', 'type': 'function', 'function': {'name': 'list_tools', 'arguments': '{}'}}]}
    ],
    'tools': [{'type': 'function', 'function': {'name': 'list_tools', 'description': 'List tools'}}]
})
data = r.json()
`;
    return { js, python };
}
/**
 * Prints the snippets to console (e.g. after startup).
 */
export function printSnippets(options) {
    const { js, python } = generateSnippets(options);
    const DIM = '\u001b[2m';
    const RESET = '\u001b[0m';
    console.log(`${DIM}--- Snippets (copy/paste) ---${RESET}`);
    console.log(js);
    console.log(python);
    console.log(`${DIM}---${RESET}`);
}
