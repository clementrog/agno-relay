#!/bin/bash
# This script demonstrates transient error handling:
# - Hits mock server with ?error=502 to trigger transient error
# - Comment explaining bridge auto-retries transient errors

# The bridge translates upstream 5xx errors (502, 503, 504) into canonical
# transient errors with retryable=true. For read-only operations like list_repos,
# the bridge marks these as retryable. Clients should implement exponential
# backoff when retrying transient errors.

echo "=== Triggering transient error (502) ==="
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
              "arguments": "{\"cursor\": \"?error=502\"}"
            }
          }
        ]
      }
    ]
  }' | jq '.'
