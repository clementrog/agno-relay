#!/bin/bash
# This script demonstrates pagination:
# - Makes first call to list_repos (gets 3 repos + cursor)
# - Extracts cursor from response
# - Makes second call with cursor to get remaining repos
# - Shows both responses

echo "=== First call (no cursor) ==="
RESPONSE1=$(curl -s -X POST http://localhost:3847/v1/chat/completions \
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
              "arguments": "{}"
            }
          }
        ]
      }
    ]
  }')

echo "$RESPONSE1" | jq '.'

# Extract cursor from the response
CURSOR=$(echo "$RESPONSE1" | jq -r '.choices[0].message.tool_calls[0].function.arguments | fromjson | .pagination.cursor // empty')

if [ -z "$CURSOR" ] || [ "$CURSOR" = "null" ]; then
  echo "No cursor found, pagination complete"
  exit 0
fi

echo ""
echo "=== Second call (with cursor: $CURSOR) ==="
curl -s -X POST http://localhost:3847/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d "{
    \"model\": \"gpt-4\",
    \"messages\": [
      {
        \"role\": \"assistant\",
        \"content\": null,
        \"tool_calls\": [
          {
            \"id\": \"call_2\",
            \"type\": \"function\",
            \"function\": {
              \"name\": \"list_repos\",
              \"arguments\": \"{\\\"cursor\\\": \\\"$CURSOR\\\"}\"
            }
          }
        ]
      }
    ]
  }" | jq '.'
