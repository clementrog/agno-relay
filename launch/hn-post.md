Show HN: agno-relay – Reliability bridge from MCP to OpenAI tools API

agno-relay translates any MCP (Model Context Protocol) server into an OpenAI-compatible tools API with deterministic error handling.

The Problem:
- Every MCP server returns errors differently (GitHub vs Slack vs Notion)
- Pagination varies across APIs (page/cursor/start_cursor)
- Retrying mutations is dangerous without idempotency

The Solution:
agno-relay wraps any MCP server and exposes a `/v1/chat/completions` endpoint with:
- 8 canonical error classes with retry guidance
- Normalized cursor-based pagination
- Idempotency support via `X-Idempotency-Key`

Quick demo:
```bash
npx agno-relay demo
```

Then call it like any OpenAI tool. Works with any MCP server.

GitHub: https://github.com/agno/agno

Would love feedback from anyone building agents that call MCP servers.
