#!/bin/bash
# This script lists repos using the bridge.
# Assumes bridge is running on localhost:3847.
# Makes POST to /v1/chat/completions with tool_choice for list_repos.
# Pipes through jq for formatting.

curl -X POST http://localhost:3847/v1/chat/completions \
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
  }' | jq '.'
