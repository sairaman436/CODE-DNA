const express = require('express');
const http = require('http');
const path = require('path');

const backendRoot = path.resolve(__dirname, '..');

function resolveBackend(relativePath) {
  return path.join(backendRoot, relativePath);
}

function clearModule(relativePath) {
  const resolved = require.resolve(resolveBackend(relativePath));
  delete require.cache[resolved];
}

function mockModule(relativePath, exportsValue) {
  const resolved = require.resolve(resolveBackend(relativePath));
  require.cache[resolved] = {
    id: resolved,
    filename: resolved,
    loaded: true,
    exports: exportsValue,
  };
}

function loadRouteWithMocks(routePath, mocks = {}) {
  clearModule(routePath);
  for (const [mockPath, mockValue] of Object.entries(mocks)) {
    mockModule(mockPath, mockValue);
  }
  return require(resolveBackend(routePath));
}

function createJsonApp(routePath, mountPath, mocks = {}) {
  const app = express();
  app.use(express.json());
  app.use(mountPath, loadRouteWithMocks(routePath, mocks));
  app.use((err, req, res, next) => {
    res.status(500).json({ error: err.message });
  });
  return app;
}

async function request(app, method, pathname, { body, headers } = {}) {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();

  try {
    const payload = body ? JSON.stringify(body) : undefined;
    const response = await new Promise((resolve, reject) => {
      const req = http.request({
        hostname: '127.0.0.1',
        port,
        path: pathname,
        method,
        headers: {
          ...(payload ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } : {}),
          ...headers,
        },
      }, (res) => {
        let raw = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          raw += chunk;
        });
        res.on('end', () => {
          resolve({
            status: res.statusCode,
            data: raw ? JSON.parse(raw) : null,
          });
        });
      });
      req.on('error', reject);
      if (payload) req.write(payload);
      req.end();
    });
    return response;
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

module.exports = {
  createJsonApp,
  loadRouteWithMocks,
  request,
};
