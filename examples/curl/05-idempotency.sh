#!/bin/bash
# This script demonstrates idempotency:
# - Makes create_issue call with X-Idempotency-Key header
# - Makes same call again with same key
# - Shows both return same ID (idempotent)

IDEMPOTENCY_KEY="test-key-$(date +%s)"

echo "=== First call with idempotency key: $IDEMPOTENCY_KEY ==="
RESPONSE1=$(curl -s -X POST http://localhost:3847/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "X-Idempotency-Key: $IDEMPOTENCY_KEY" \
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
              "name": "create_issue",
              "arguments": "{}"
            }
          }
        ]
      }
    ]
  }')

echo "$RESPONSE1" | jq '.'
ID1=$(echo "$RESPONSE1" | jq -r '.choices[0].message.tool_calls[0].function.arguments | fromjson | .result.id // empty')

echo ""
echo "=== Second call with same idempotency key: $IDEMPOTENCY_KEY ==="
RESPONSE2=$(curl -s -X POST http://localhost:3847/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "X-Idempotency-Key: $IDEMPOTENCY_KEY" \
  -d '{
    "model": "gpt-4",
    "messages": [
      {
        "role": "assistant",
        "content": null,
        "tool_calls": [
          {
            "id": "call_2",
            "type": "function",
            "function": {
              "name": "create_issue",
              "arguments": "{}"
            }
          }
        ]
      }
    ]
  }')

echo "$RESPONSE2" | jq '.'
ID2=$(echo "$RESPONSE2" | jq -r '.choices[0].message.tool_calls[0].function.arguments | fromjson | .result.id // empty')

echo ""
if [ "$ID1" = "$ID2" ] && [ -n "$ID1" ]; then
  echo "✅ Idempotency verified: Both calls returned same ID: $ID1"
else
  echo "❌ Idempotency failed: IDs differ (ID1: $ID1, ID2: $ID2)"
fi
