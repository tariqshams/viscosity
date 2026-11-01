// A tiny static server for dist/ (used by the smoke test and screenshots).
// The book is served under its base path, as in production
// (https://viscosity.dev/book/): /book/x is dist/x, / redirects to /book/,
// and anything else outside /book/ is a 404.
import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json', '.woff2': 'font/woff2',
  '.wasm': 'application/wasm', '.pdf': 'application/pdf', '.epub': 'application/epub+zip',
  '.pf_meta': 'application/octet-stream', '.pf_index': 'application/octet-stream', '.pf_fragment': 'application/octet-stream',
};

/** The book's base path (astro.config.mjs `base`), with a trailing slash. */
export const BASE = '/book/';

export function serve(root, port = 0, base = BASE) {
  const server = createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (p === '/' || p === base.slice(0, -1)) { res.writeHead(302, { location: base }); return res.end(); }
    const notFound = () => {
      res.writeHead(404, { 'content-type': 'text/html; charset=utf-8' });
      return createReadStream(join(root, '404.html')).pipe(res);
    };
    if (!p.startsWith(base)) return notFound();
    let file = normalize(join(root, p.slice(base.length - 1)));
    if (!file.startsWith(root)) { res.writeHead(403); return res.end(); }
    if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
    if (!existsSync(file) && existsSync(file + '.html')) file += '.html';
    if (!existsSync(file)) return notFound();
    res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
    createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => server.listen(port, '127.0.0.1', () => resolve({ server, url: `http://127.0.0.1:${server.address().port}`, base })));
}
