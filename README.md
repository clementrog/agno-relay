> **Note**: This project is unrelated to [agno-agi/agno](https://github.com/agno-agi/agno) (Python agent framework).

# agno-relay

[![Conformance](https://img.shields.io/badge/conformance-100%25-brightgreen)](https://github.com/agno/agno)

A reliability bridge that translates MCP tool servers into an OpenAI-compatible tools interface with deterministic behavior under failures.

Point agno at any MCP server and immediately call it via an OpenAI-style `POST /v1/chat/completions` flow, with a canonical error contract that agents can reliably interpret.

## Features

- **OpenAI-Compatible API** — Drop-in replacement for tool calling workflows
- **Canonical Error Contract** — 8 deterministic error classes with retry guidance
- **Pagination Normalization** — Opaque cursor-based pagination for all list operations
- **Idempotency Support** — Safe retries for mutations with `X-Idempotency-Key`
- **Auth Handling** — Bridge-level credentials or per-request passthrough
- **Trace Mode** — Side-by-side request/response debugging
- **Conformance Reports** — README-ready markdown + CI-friendly JSON

## Quick Start

```bash
# Install dependencies
npm install

# Build
npm run build

# Start the bridge
node dist/cli.js bridge --url http://localhost:3000

# Or with npx (when published)
npx agno-relay bridge --url http://localhost:3000
```

Output:
```
🚀 Bridge ready

Endpoint: http://localhost:3847/v1/chat/completions
Upstream: http://localhost:3000

Capabilities:
  • Streaming: unsupported
  • Pagination: cursor-based
  • Errors: canonical
  • Auth: bridge-level
```

## Try it in 60 Seconds

Run the built-in demo with a mock MCP server:

```bash
npx agno-relay demo
```

This starts a mock MCP server and bridge. Try these commands in another terminal:

```bash
# List repos
curl -s http://localhost:3847/v1/chat/completions \
  -H 'Content-Type: application/json' \
  -d '{"model":"gpt-4","messages":[{"role":"assistant","content":null,"tool_calls":[{"id":"1","type":"function","function":{"name":"list_repos","arguments":"{}"}}]}]}' | jq '.'

# See pagination in action
./examples/curl/02-pagination.sh

# Test idempotency
./examples/curl/05-idempotency.sh
```

Press Ctrl+C to stop the demo.

## Why This Exists

### The Problem

MCP servers expose powerful tools, but calling them directly from agents is risky:

**Inconsistent Errors** → **Canonical Error Classes**

- **Problem**: Every MCP server returns errors differently. GitHub returns `{"message": "...", "status": 403}`. Slack returns `{"error": "...", "ok": false}`. Your agent needs custom handling for each.
- **Solution**: agno-relay wraps all errors in 8 deterministic classes (auth, permission, rate_limit, etc.) with explicit retry guidance.

**Varying Pagination** → **Normalized Cursors**

- **Problem**: GitHub uses `page`/`per_page`. Slack uses `cursor`. Notion uses `start_cursor`. Your agent needs to know each API's quirks.
- **Solution**: agno-relay normalizes all pagination to `{has_more, cursor}`. Pass the cursor back to continue. Done.

**Dangerous Retries** → **Safe Idempotency**

- **Problem**: Retrying a failed `create_issue` might create duplicates. Retrying a failed `transfer_funds` could move money twice. Without idempotency, agents can't safely retry mutations.
- **Solution**: Pass `X-Idempotency-Key` and agno-relay ensures the operation runs exactly once, even if you retry 10 times.

agno-relay turns chaotic MCP calls into deterministic, retryable operations.

## Usage

### Bridge Command

```bash
agno-relay bridge --url <mcp_server_url> [options]
```

| Option | Description | Default |
|--------|-------------|---------|
| `--url <url>` | MCP server URL (required) | — |
| `--port <number>` | Local port | `3847` |
| `--allow-auth-passthrough` | Forward Authorization header | `false` |
| `--trace` | Enable debug output | `false` |

### Report Command

```bash
agno-relay report [options]
```

| Option | Description | Default |
|--------|-------------|---------|
| `--format <format>` | Output format (`markdown` or `json`) | `markdown` |

## API Reference

### POST /v1/chat/completions

OpenAI-compatible chat completions endpoint with tool calling support.

**Request:**
```json
{
  "model": "gpt-4",
  "messages": [
    {
      "role": "assistant",
      "content": null,
      "tool_calls": [
        {
          "id": "call_1",
          "type": "function",
          "function": {
            "name": "list_repos",
            "arguments": "{\"org\": \"acme\"}"
          }
        }
      ]
    }
  ]
}
```

**Response:**
```json
{
  "choices": [
    {
      "message": {
        "role": "assistant",
        "tool_calls": [
          {
            "id": "call_1",
            "type": "function",
            "function": {
              "name": "list_repos",
              "arguments": "{\"result\": ...}"
            }
          }
        ]
      }
    }
  ]
}
```

### GET /healthz

Health check endpoint.

```json
{"status": "ok"}
```

### GET /capabilities

Bridge capabilities.

```json
{
  "streaming": false,
  "pagination": "cursor",
  "errors": "canonical",
  "auth": "bridge-level"
}
```

## Canonical Error Contract

Every failure returns a structured error envelope:

```json
{
  "error": {
    "class": "rate_limit",
    "retryable": true,
    "suggested_backoff_ms": 2500,
    "message": "GitHub API rate limit exceeded.",
    "action": "wait_and_retry",
    "context": {
      "source": "upstream",
      "upstream_code": 429,
      "reset_at": 1738491000
    }
  }
}
```

### Error Classes

| Class | HTTP Status | Retryable | Action |
|-------|-------------|-----------|--------|
| `auth` | 401 | No | `fix_credentials` |
| `permission` | 403 | No | `check_permissions` |
| `invalid_args` | 400, 422 | No | `fix_arguments` |
| `not_found` | 404 | No | `not_applicable` |
| `conflict` | 409 | No | `not_applicable` |
| `rate_limit` | 429 | Yes | `wait_and_retry` |
| `transient` | 502, 503, 504 | Yes | `retry` |
| `timeout` | — | Depends | `not_applicable` |

### Retry Rules

- **Read-only operations**: Always retryable for `rate_limit` and `transient`
- **Mutations without `X-Idempotency-Key`**: Not retryable
- **Mutations with `X-Idempotency-Key`**: Retryable for `rate_limit` and `transient`

## Pagination

List operations return a normalized pagination format:

```json
{
  "data": [
    {"id": 1, "name": "repo-a"},
    {"id": 2, "name": "repo-b"}
  ],
  "pagination": {
    "has_more": true,
    "cursor": "eyJwYWdlIjoyfQ=="
  }
}
```

The cursor is opaque — pass it back to continue iteration until `has_more` is `false`.

## Authentication

### Bridge-Level (Default)

Set credentials via environment variables:

```bash
export GITHUB_TOKEN=ghp_xxxx
# or
export MCP_AUTH_TOKEN=your-token

agno-relay bridge --url http://localhost:3000
```

### Per-Request Passthrough

Enable forwarding of `Authorization` header from incoming requests:

```bash
agno-relay bridge --url http://localhost:3000 --allow-auth-passthrough
```

Then include the header in your requests:
```bash
curl -H "Authorization: Bearer ghp_xxxx" \
  http://localhost:3847/v1/chat/completions
```

## Mutation Warnings

Mutation tools (create, update, delete, etc.) include a warning in their description:

> ⚠️ Not idempotent: do not retry without verifying state. Provide X-Idempotency-Key to enable safe retries.

## Trace Mode

Enable detailed request/response logging:

```bash
agno-relay bridge --url http://localhost:3000 --trace
```

Output shows side-by-side comparison:
```
═══ TRACE ═══
OpenAI Request:
  {"model":"gpt-4","messages":[...]}

MCP Request(s):
  list_repos({"org":"acme"})

MCP Response(s):
  {"items":[...],"nextPageToken":"..."}

OpenAI Response:
  {"choices":[...]}
═════════════
```

All sensitive values are automatically redacted.

## Conformance Report

Generate a conformance report for your README:

```bash
agno-relay report
```

Output:
```markdown
## Conformance Report

[![Conformance](https://img.shields.io/badge/conformance-100%25-brightgreen)](https://github.com/agno/report)

**Score:** 100/100
**Adapter:** agno-relay
**Last verified:** 2024-01-15T10:30:00.000Z

### Capability matrix

| Check | Status |
|-------|--------|
| schema_validity | ✅ pass |
| canonical_error_wrapping | ✅ pass |
| pagination_normalization | ✅ pass |
| auth_behavior | ✅ pass |
| determinism | ✅ pass |
```

For CI pipelines:
```bash
agno-relay report --format json
```

## Code Examples

### JavaScript

```javascript
const response = await fetch('http://localhost:3847/v1/chat/completions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'gpt-4',
    messages: [{
      role: 'assistant',
      content: null,
      tool_calls: [{
        id: 'call_1',
        type: 'function',
        function: { name: 'list_repos', arguments: '{"org":"acme"}' }
      }]
    }]
  })
});

const data = await response.json();
console.log(data.choices[0].message.tool_calls);
```

### Python

```python
import requests

response = requests.post(
    'http://localhost:3847/v1/chat/completions',
    json={
        'model': 'gpt-4',
        'messages': [{
            'role': 'assistant',
            'content': None,
            'tool_calls': [{
                'id': 'call_1',
                'type': 'function',
                'function': {'name': 'list_repos', 'arguments': '{"org":"acme"}'}
            }]
        }]
    }
)

data = response.json()
print(data['choices'][0]['message']['tool_calls'])
```

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Development mode
npm run dev
```

## Project Structure

```
src/
├── cli.ts              # CLI entry point
├── server.ts           # Express server
├── commands/           # CLI commands
├── mcp/                # MCP client wrapper
├── handlers/           # Request handlers
├── errors/             # Canonical error contract
├── translation/        # MCP → OpenAI translation
├── pagination/         # Cursor normalization
├── idempotency/        # Idempotency handling
├── auth/               # Authentication
├── logging/            # Redacted logging
├── trace/              # Trace mode
├── output/             # CLI output formatting
└── report/             # Conformance reports
```

## License

ISC
