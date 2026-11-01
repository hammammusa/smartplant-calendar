// Minimal static server that mimics GitHub Pages for local checks and e2e tests:
//   - serves ./out under BASE_PATH (default: the domain root, like smartplantcalendar.github.io),
//   - "/dir" redirects to "/dir/" and "/dir/" serves "/dir/index.html",
//   - unknown paths return out/404.html with status 404.
// Usage: node scripts/serve-static.mjs [port]
import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, resolve } from "node:path";

const port = Number(process.argv[2] ?? process.env.PORT ?? 3200);
const basePath = (process.env.BASE_PATH ?? process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "");
const root = resolve(process.cwd(), "out");

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".webmanifest": "application/manifest+json",
};

function send(res, status, file) {
  res.writeHead(status, { "Content-Type": TYPES[extname(file)] ?? "application/octet-stream" });
  createReadStream(file).pipe(res);
}

createServer((req, res) => {
  const url = new URL(req.url ?? "/", "http://localhost");
  let path = decodeURIComponent(url.pathname);
  if (basePath) {
    if (path === basePath) {
      res.writeHead(301, { Location: `${basePath}/${url.search}` });
      return res.end();
    }
    if (!path.startsWith(`${basePath}/`)) return send(res, 404, join(root, "404.html"));
    path = path.slice(basePath.length);
  }
  const file = normalize(join(root, path));
  if (!file.startsWith(root)) return send(res, 404, join(root, "404.html"));
  if (existsSync(file) && statSync(file).isDirectory()) {
    if (!path.endsWith("/")) {
      res.writeHead(301, { Location: `${basePath}${path}/${url.search}` });
      return res.end();
    }
    const index = join(file, "index.html");
    return existsSync(index) ? send(res, 200, index) : send(res, 404, join(root, "404.html"));
  }
  if (existsSync(file)) return send(res, 200, file);
  if (existsSync(`${file}.html`)) return send(res, 200, `${file}.html`);
  return send(res, 404, join(root, "404.html"));
}).listen(port, () => console.log(`Serving ${root} at http://localhost:${port}${basePath}/`));
