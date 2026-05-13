// Minimal Node http static-file server used by capture-reference.mjs and visual.test.mjs.
// Required because Chromium blocks ES-module imports from file:// origins (unique-origin policy),
// so the visual gate must serve the playground over http://localhost.

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.mjs':  'application/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg':  'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
  '.woff':  'font/woff',
  '.woff2': 'font/woff2',
  '.map':   'application/json; charset=utf-8',
};

// Start an HTTP server rooted at `root`. Returns { server, url } where url is
// the base origin like 'http://127.0.0.1:54321'. Call `await server.closePromise()`
// to shut it down cleanly.
export async function startStaticServer(root) {
  const ROOT = path.resolve(root);
  const server = createServer(async (req, res) => {
    try {
      let urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
      if (urlPath.endsWith('/')) urlPath += 'index.html';
      const filePath = path.normalize(path.join(ROOT, urlPath));
      if (!filePath.startsWith(ROOT)) {
        res.statusCode = 403;
        res.end('Forbidden');
        return;
      }
      const st = await stat(filePath);
      if (st.isDirectory()) {
        const idx = path.join(filePath, 'index.html');
        const data = await readFile(idx);
        res.setHeader('Content-Type', mimeTypes['.html']);
        res.end(data);
        return;
      }
      const data = await readFile(filePath);
      const ct = mimeTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
      res.setHeader('Content-Type', ct);
      res.setHeader('Cache-Control', 'no-store');
      res.end(data);
    } catch (e) {
      res.statusCode = 404;
      res.end(`Not found: ${req.url}\n${e && e.message}`);
    }
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  server.closePromise = () => new Promise((resolve) => server.close(() => resolve()));
  return { server, url: `http://127.0.0.1:${port}` };
}
