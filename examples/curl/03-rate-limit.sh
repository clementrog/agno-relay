#!/bin/bash
# This script demonstrates rate limit handling:
# - Hits the mock server with ?error=429 to trigger rate limit
# - Shows the 429 response and Retry-After header
# - Comment explaining how bridge handles this

# The bridge translates upstream 429 errors into canonical rate_limit errors
# with retryable=true and suggested_backoff_ms from Retry-After header.
# Clients should respect the suggested_backoff_ms and retry after the delay.

echo "=== Triggering rate limit (429) ==="
curl -v -X POST http://localhost:3847/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
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
              "arguments": "{\"cursor\": \"?error=429\"}"
            }
          }
        ]
      }
    ]
  }' 2>&1 | grep -A 20 "< HTTP"

echo ""
echo "=== Response body ==="
curl -s -X POST http://localhost:3847/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
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
              "arguments": "{\"cursor\": \"?error=429\"}"
            }
          }
        ]
      }
    ]
  }' | jq '.'
