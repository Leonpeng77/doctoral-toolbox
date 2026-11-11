#!/usr/bin/env node
/*
 * Zero-dependency local counterpart of the Azure Functions app.
 * Same handler, same HTTP contract, no Azure account required.
 *   node azure/local-server.js
 *   curl http://127.0.0.1:7071/api/health
 */
'use strict';

const http = require('node:http');
const { handleHealth, handleParse, VERSION } = require('./function-app/shared/handler');

const PORT = Number(process.env.PORT || 7071);
const MAX_BODY = 200000;

function send(res, status, obj) {
  const payload = JSON.stringify(obj);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(payload),
    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
  });
  res.end(payload);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');

  if (req.method === 'OPTIONS') {
    send(res, 204, {});
    return;
  }

  if (url.pathname === '/api/health' && req.method === 'GET') {
    send(res, 200, { ...handleHealth(), mode: 'local' });
    return;
  }

  if (url.pathname === '/' && req.method === 'GET') {
    send(res, 200, {
      service: 'doctoral-toolbox-api',
      version: VERSION,
      mode: 'local',
      endpoints: {
        'GET /api/health': 'service status',
        'POST /api/parse': '{ "text": "one reference per line" }'
      }
    });
    return;
  }

  if (url.pathname === '/api/parse' && req.method === 'POST') {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > MAX_BODY) {
        send(res, 413, { error: 'Payload too large' });
        req.destroy();
      }
    });
    req.on('end', () => {
      let body = {};
      try {
        body = raw ? JSON.parse(raw) : {};
      } catch (err) {
        send(res, 400, { error: 'Invalid JSON body', details: [String(err.message || err)] });
        return;
      }
      const result = handleParse(body);
      send(res, result.statusCode, result.body);
    });
    return;
  }

  send(res, 404, { error: 'Not found', path: url.pathname });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log('doctoral-toolbox-api (local) v' + VERSION);
  console.log('  GET  http://127.0.0.1:' + PORT + '/api/health');
  console.log('  POST http://127.0.0.1:' + PORT + '/api/parse');
});
