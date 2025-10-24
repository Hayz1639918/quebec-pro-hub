// Minimal HTTP backend for development without external deps
// Endpoints:
//  GET /health         -> { status: 'ok' }
//  GET /api/v1/ping    -> { pong: true, time }
//  POST /api/v1/echo   -> echoes JSON body

const http = require('http');
const { URL } = require('url');

const PORT = process.env.API_PORT ? Number(process.env.API_PORT) : 5174;
const HOST = process.env.API_HOST || '0.0.0.0';

function send(res, status, data, headers = {}) {
  const body = typeof data === 'string' ? data : JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    ...headers,
  });
  res.end(body);
}

function parseBody(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (chunk) => (data += chunk));
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        resolve({});
      }
    });
  });
}

const server = http.createServer(async (req, res) => {
  if (!req.url || !req.method) return send(res, 400, { error: 'Bad request' });

  // Handle CORS preflight
  if (req.method === 'OPTIONS') return send(res, 204, '');

  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;

  if (req.method === 'GET' && path === '/health') {
    return send(res, 200, { status: 'ok' });
  }

  if (req.method === 'GET' && path === '/api/v1/ping') {
    return send(res, 200, { pong: true, time: new Date().toISOString() });
  }

  // Get client IP (for audit metadata)
  if (req.method === 'GET' && path === '/api/v1/client-ip') {
    const xf = req.headers['x-forwarded-for'];
    const forwarded = Array.isArray(xf) ? xf[0] : (xf || '');
    const ip = (forwarded.split(',')[0] || req.socket.remoteAddress || 'unknown').trim();
    return send(res, 200, { ip });
  }

  if (req.method === 'POST' && path === '/api/v1/echo') {
    const body = await parseBody(req);
    return send(res, 200, { echo: body });
  }

  return send(res, 404, { error: 'Not found', path });
});

server.listen(PORT, HOST, () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on http://${HOST}:${PORT}`);
});
