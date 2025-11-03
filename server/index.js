// Minimal HTTP backend for development without external deps
// Endpoints:
//  GET /health         -> { status: 'ok' }
//  GET /api/v1/ping    -> { pong: true, time }
//  POST /api/v1/echo   -> echoes JSON body
//
// Security:
//  - CORS restricted to allowed origins
//  - Security headers (X-Content-Type-Options, X-Frame-Options, etc.)
//  - X-Powered-By header removed

const http = require('http');
const { URL } = require('url');

const PORT = process.env.API_PORT ? Number(process.env.API_PORT) : 5174;
const HOST = process.env.API_HOST || '0.0.0.0';

// CORS Configuration (OWASP ASVS V13.2.2)
// Only allow requests from trusted origins
const ALLOWED_ORIGINS = [
  'https://batirnet.ca',
  'https://www.batirnet.ca',
  // Development origins (only if NODE_ENV=development)
  ...(process.env.NODE_ENV === 'development' ? [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:8080',
    'http://127.0.0.1:5173',
    process.env.VITE_DEV_ORIGIN
  ] : [])
].filter(Boolean);

/**
 * Get CORS headers based on request origin
 * Returns CORS headers only if origin is whitelisted
 * @param {http.IncomingMessage} req
 * @returns {Object} CORS headers or empty object
 */
function getCorsHeaders(req) {
  const origin = req.headers.origin;

  if (!origin) {
    return {}; // No origin header = same-origin request or direct access
  }

  if (ALLOWED_ORIGINS.includes(origin)) {
    return {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400', // 24 hours
    };
  }

  // Origin not allowed - don't send CORS headers
  return {};
}

/**
 * Get security headers (OWASP ASVS V14.4.x)
 * @returns {Object} Security headers
 */
function getSecurityHeaders() {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
    // Note: CSP should be added via a reverse proxy or frontend framework
  };
}

function send(res, status, data, req, headers = {}) {
  const body = typeof data === 'string' ? data : JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    ...getCorsHeaders(req),
    ...getSecurityHeaders(),
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
  // Remove X-Powered-By header (OWASP ASVS V14.5.2)
  res.removeHeader('X-Powered-By');

  if (!req.url || !req.method) return send(res, 400, { error: 'Bad request' }, req);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') return send(res, 204, '', req);

  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;

  if (req.method === 'GET' && path === '/health') {
    return send(res, 200, { status: 'ok' }, req);
  }

  if (req.method === 'GET' && path === '/api/v1/ping') {
    return send(res, 200, { pong: true, time: new Date().toISOString() }, req);
  }

  // Get client IP (for audit metadata)
  if (req.method === 'GET' && path === '/api/v1/client-ip') {
    const xf = req.headers['x-forwarded-for'];
    const forwarded = Array.isArray(xf) ? xf[0] : (xf || '');
    const ip = (forwarded.split(',')[0] || req.socket.remoteAddress || 'unknown').trim();
    return send(res, 200, { ip }, req);
  }

  if (req.method === 'POST' && path === '/api/v1/echo') {
    const body = await parseBody(req);
    return send(res, 200, { echo: body }, req);
  }

  return send(res, 404, { error: 'Not found', path }, req);
});

server.listen(PORT, HOST, () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on http://${HOST}:${PORT}`);
});
