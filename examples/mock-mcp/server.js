const express = require('express');
const { randomUUID } = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Idempotency store: X-Idempotency-Key -> response body (for create_issue)
const idempotencyMap = new Map();

// Error responses by code
const ERROR_RESPONSES = {
  401: { status: 401, body: { error: 'Unauthorized' } },
  403: { status: 403, body: { error: 'Forbidden' } },
  429: { status: 429, headers: { 'Retry-After': '3' }, body: { error: 'Rate limited' } },
  502: { status: 502, body: { error: 'Bad Gateway' } },
  503: { status: 503, body: { error: 'Service Unavailable' } },
  504: { status: 504, body: { error: 'Gateway Timeout' } },
};

// Mock repos: 5 total, first page 3, second page 2
const ALL_REPOS = [
  { id: '1', name: 'repo-a' },
  { id: '2', name: 'repo-b' },
  { id: '3', name: 'repo-c' },
  { id: '4', name: 'repo-d' },
  { id: '5', name: 'repo-e' },
];
const PAGE_SIZE = 3;

function listRepos(cursor) {
  if (!cursor) {
    const page = ALL_REPOS.slice(0, PAGE_SIZE);
    return {
      items: page,
      has_more: ALL_REPOS.length > PAGE_SIZE,
      cursor: 'page2',
    };
  }
  const page = ALL_REPOS.slice(PAGE_SIZE);
  return { items: page, has_more: false };
}

function createIssue(idempotencyKey) {
  if (idempotencyKey && idempotencyMap.has(idempotencyKey)) {
    return idempotencyMap.get(idempotencyKey);
  }
  const result = { id: randomUUID() };
  if (idempotencyKey) idempotencyMap.set(idempotencyKey, result);
  return result;
}

// Middleware: check ?error=CODE and respond early
function errorSimulation(req, res, next) {
  const code = req.query.error;
  if (!code) return next();
  const err = ERROR_RESPONSES[code];
  if (!err) return next();
  if (err.headers) Object.entries(err.headers).forEach(([k, v]) => res.setHeader(k, v));
  res.status(err.status).json(err.body);
}

// Health check for verify
app.get('/healthz', (req, res) => {
  console.log(`${new Date().toISOString()} GET /healthz`);
  res.send('OK');
});

// MCP JSON-RPC endpoint
app.post('/mcp', errorSimulation, (req, res) => {
  console.log(`${new Date().toISOString()} POST /mcp`, JSON.stringify(req.body));
  const body = req.body;
  if (!body || typeof body.jsonrpc !== 'string' || body.jsonrpc !== '2.0') {
    return res.status(400).json({ jsonrpc: '2.0', error: { code: -32600, message: 'Invalid Request' }, id: body?.id ?? null });
  }
  const id = body.id;
  const method = body.method;
  const params = body.params || {};

  if (method === 'tools/list') {
    return res.json({
      jsonrpc: '2.0',
      id,
      result: {
        tools: [
          { name: 'list_repos', description: 'List repos with pagination', inputSchema: { type: 'object', properties: { cursor: { type: 'string' } } } },
          { name: 'create_issue', description: 'Create an issue', inputSchema: { type: 'object' } },
        ],
      },
    });
  }

  if (method === 'tools/call') {
    const name = params.name;
    const args = params.arguments || {};
    if (name === 'list_repos') {
      const out = listRepos(args.cursor);
      return res.json({ jsonrpc: '2.0', id, result: { content: [{ type: 'text', text: JSON.stringify(out) }] } });
    }
    if (name === 'create_issue') {
      const key = req.headers['x-idempotency-key'];
      const out = createIssue(key);
      return res.json({ jsonrpc: '2.0', id, result: { content: [{ type: 'text', text: JSON.stringify(out) }] } });
    }
    return res.json({ jsonrpc: '2.0', id, error: { code: -32601, message: 'Method not found' } });
  }

  res.json({ jsonrpc: '2.0', id, error: { code: -32601, message: 'Method not found' } });
});

app.listen(PORT, () => {
  console.log(`Mock MCP server listening on port ${PORT}`);
});
