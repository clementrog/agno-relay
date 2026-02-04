🧵 Building agents that call MCP servers? Here's the problem:

Every server returns errors differently. GitHub: `{"message": "...", "status": 403}`. Slack: `{"error": "...", "ok": false}`. Your agent needs custom handling for each.

This chaos makes retries dangerous and error handling brittle.

1/10

Introducing agno-relay 🚀

A reliability bridge that translates ANY MCP server into an OpenAI-compatible tools API with deterministic behavior.

Point it at any MCP server → get a clean `/v1/chat/completions` endpoint with canonical errors your agent can actually reason about.

2/10

Try it in 60 seconds:

```bash
npx agno-relay demo
```

This starts a mock MCP server + bridge. Then call it like any OpenAI tool:

```bash
curl http://localhost:3847/v1/chat/completions \
  -d '{"model":"gpt-4","messages":[...]}'
```

[Demo GIF placeholder]

3/10

Canonical errors: 8 deterministic classes.

Every failure maps to one of:
- auth (401)
- permission (403)
- invalid_args (400/422)
- not_found (404)
- conflict (409)
- rate_limit (429)
- transient (502/503/504)
- timeout

Each includes retry guidance. Your agent knows exactly what to do.

4/10

Pagination normalization.

GitHub uses `page`/`per_page`. Slack uses `cursor`. Notion uses `start_cursor`.

agno-relay normalizes ALL to `{has_more, cursor}`. Pass the cursor back to continue. Done.

No more API-specific pagination logic in your agent.

5/10

Idempotency for safe retries.

Retrying a failed `create_issue` might create duplicates. Retrying `transfer_funds` could move money twice.

Pass `X-Idempotency-Key` and agno-relay ensures the operation runs exactly once, even if you retry 10 times.

6/10

See it in action:

```bash
# List repos with pagination
./examples/curl/02-pagination.sh

# Test idempotency
./examples/curl/05-idempotency.sh
```

All examples work with any MCP server. The bridge handles the translation.

7/10

It's open source.

MIT licensed. Built for the agent community.

GitHub: github.com/agno/agno

We're solving the reliability gap between MCP servers and agent frameworks. Every tool call should be deterministic and retryable.

8/10

Call to action:

👉 Try it: `npx agno-relay demo`
👉 Star it: github.com/agno/agno
👉 Build with it: Point it at your MCP server and start calling tools reliably

If you're building agents that call MCP servers, this removes a whole class of bugs.

9/10

Thread ender:

agno-relay: Reliability bridge from MCP to OpenAI tools API

🔗 github.com/agno/agno
📦 npm: npx agno-relay
🎯 Canonical errors, normalized pagination, safe idempotency

Turn chaotic MCP calls into deterministic operations.

10/10
