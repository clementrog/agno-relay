/**
 * Integration tests for GitHub adapter flow.
 * Mocks GitHub MCP server responses to validate: list repos pagination,
 * create/update issue mutations, canonical errors (401, 429, 5xx), streaming rejection.
 */

import { jest, describe, it, expect } from '@jest/globals';
import request from 'supertest';
import { wrapUpstreamError, type UpstreamResponse } from '../../src/errors/factory';
import { normalizeListResponse } from '../../src/pagination/normalize';
import {
  translateMcpToolsToOpenAI,
  isMutationTool,
  type McpTool,
} from '../../src/translation/tools';
import { handleChatCompletion } from '../../src/handlers/chat';
import { createApp } from '../../src/server';
import type { McpBridge } from '../../src/mcp/client';
import type { ChatCompletionRequest } from '../../src/handlers/types';

// --- Mock MCP server response shapes (GitHub-like) ---

function mockMcpResultContent(json: unknown): { content: Array<{ type: string; text: string }> } {
  return {
    content: [{ type: 'text', text: JSON.stringify(json) }],
  };
}

describe('GitHub adapter integration', () => {
  describe('test setup with mocked MCP server responses', () => {
    it('uses MCP-shaped content for list and mutation responses', () => {
      const listPayload = { items: [{ id: 1, name: 'repo-a' }], nextPageToken: 'page2' };
      const result = mockMcpResultContent(listPayload);
      expect(result.content).toHaveLength(1);
      expect(JSON.parse(result.content[0].text)).toEqual(listPayload);
    });
  });

  describe('list repos (pagination)', () => {
    it('verifies data and pagination shape with has_more and cursor', () => {
      const mcpResult = mockMcpResultContent({
        items: [
          { id: 1, full_name: 'org/repo-a' },
          { id: 2, full_name: 'org/repo-b' },
        ],
        nextPageToken: 'token_abc',
      });
      const normalized = normalizeListResponse(mcpResult);
      expect(normalized.data).toHaveLength(2);
      expect((normalized.data[0] as { full_name: string }).full_name).toBe('org/repo-a');
      expect(normalized.pagination).toEqual({
        has_more: true,
        cursor: expect.any(String),
      });
      expect(normalized.pagination.cursor).not.toBeNull();
    });

    it('has_more false when no next token', () => {
      const mcpResult = mockMcpResultContent({
        items: [{ id: 1, name: 'repo-a' }],
      });
      const normalized = normalizeListResponse(mcpResult);
      expect(normalized.pagination.has_more).toBe(false);
      expect(normalized.pagination.cursor).toBeNull();
    });
  });

  describe('create issue (mutation)', () => {
    it('verifies mutation warning in tool description', () => {
      const tools: McpTool[] = [
        {
          name: 'create_issue',
          description: 'Create a new issue',
          inputSchema: { type: 'object', properties: { title: { type: 'string' } } },
        },
      ];
      const openai = translateMcpToolsToOpenAI(tools);
      expect(openai).toHaveLength(1);
      expect(openai[0].function.description).toContain('Not idempotent');
      expect(openai[0].function.description).toContain('X-Idempotency-Key');
    });

    it('verifies response format from create issue call', async () => {
      const mockBridge = {
        connect: jest.fn().mockResolvedValue(undefined),
        disconnect: jest.fn().mockResolvedValue(undefined),
        getTools: jest.fn(),
        callTool: jest.fn().mockResolvedValue(
          mockMcpResultContent({ id: 42, title: 'New issue', state: 'open' })
        ),
      } as unknown as McpBridge;

      const req: ChatCompletionRequest = {
        model: 'gpt-4',
        messages: [
          {
            role: 'assistant',
            content: null,
            tool_calls: [
              {
                id: 'call_1',
                type: 'function',
                function: { name: 'create_issue', arguments: '{"title":"Bug"}' },
              },
            ],
          },
        ],
      };
      const response = await handleChatCompletion(req, mockBridge);
      expect(response.choices[0].message.tool_calls).toHaveLength(1);
      const args = response.choices[0].message.tool_calls![0].function.arguments;
      const parsed = JSON.parse(args);
      expect(parsed.result).toBeDefined();
      expect(JSON.parse(parsed.result).id).toBe(42);
    });
  });

  describe('update issue (mutation)', () => {
    it('verifies mutation handling: update_issue is mutation and gets warning', () => {
      expect(isMutationTool('update_issue')).toBe(true);
      const tools: McpTool[] = [
        {
          name: 'update_issue',
          description: 'Update an issue',
          inputSchema: {},
        },
      ];
      const openai = translateMcpToolsToOpenAI(tools);
      expect(openai[0].function.description).toContain('Not idempotent');
    });
  });

  describe('canonical error on 401', () => {
    it('verifies auth error class and retryable false', () => {
      const response: UpstreamResponse = { status: 401, body: 'Unauthorized' };
      const err = wrapUpstreamError(response);
      expect(err.class).toBe('auth');
      expect(err.retryable).toBe(false);
      expect(err.context.source).toBe('upstream');
      expect(err.context.upstream_code).toBe(401);
    });
  });

  describe('canonical error on 429', () => {
    it('verifies rate_limit class and suggested_backoff_ms present', () => {
      const response: UpstreamResponse = {
        status: 429,
        body: 'Rate limit exceeded',
        headers: { 'Retry-After': '5' },
      };
      const err = wrapUpstreamError(response);
      expect(err.class).toBe('rate_limit');
      expect(err.suggested_backoff_ms).toBe(5000);
      expect(err.retryable).toBe(true);
    });
  });

  describe('canonical error on 5xx', () => {
    it('verifies transient class', () => {
      const response: UpstreamResponse = { status: 503, body: 'Service Unavailable' };
      const err = wrapUpstreamError(response);
      expect(err.class).toBe('transient');
      expect(err.retryable).toBe(true);
      expect(err.context.upstream_code).toBe(503);
    });
  });

  describe('streaming rejection', () => {
    it('verifies stream:true returns invalid_args error', async () => {
      const mockBridge = {
        connect: jest.fn().mockResolvedValue(undefined),
        getTools: jest.fn(),
        callTool: jest.fn(),
        disconnect: jest.fn().mockResolvedValue(undefined),
      } as unknown as McpBridge;

      const app = await createApp({
        url: 'http://localhost:9999',
        allowAuthPassthrough: false,
        trace: false,
        bridge: mockBridge,
      });

      const res = await request(app)
        .post('/v1/chat/completions')
        .send({
          model: 'gpt-4',
          messages: [],
          stream: true,
        });

      expect(res.status).toBe(422);
      expect(res.body.class).toBe('invalid_args');
      expect(res.body.message).toContain('Streaming');
      expect(res.body.retryable).toBe(false);
    });
  });
});
