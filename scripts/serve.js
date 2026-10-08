#!/usr/bin/env bun
/*
 * serve.js — tiny static server for previewing the built site under Bun.
 *   bun run scripts/serve.js   → http://127.0.0.1:8792
 * Serves docs/ with sensible MIME types; falls back to offline.html on 404
 * navigations so you can test the offline experience locally.
 */
import { file } from "bun";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DOCS = path.resolve(__dirname, "..", "docs");
const PORT = Number(Bun.env.PORT || 8792);

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
};

function resolvePath(urlPath) {
  let p = decodeURIComponent(urlPath.split("?")[0]);
  if (p.endsWith("/")) p += "index.html";
  if (p === "") p = "/index.html";
  const abs = path.join(DOCS, p);
  if (!abs.startsWith(DOCS)) return null; // path traversal guard
  return abs;
}

Bun.serve({
  port: PORT,
  hostname: "127.0.0.1",
  async fetch(req) {
    const url = new URL(req.url);
    let abs = resolvePath(url.pathname);
    if (abs && fs.existsSync(abs) && fs.statSync(abs).isDirectory()) abs = path.join(abs, "index.html");
    if (abs && fs.existsSync(abs)) {
      const ext = path.extname(abs);
      return new Response(file(abs), { headers: { "content-type": TYPES[ext] || "application/octet-stream" } });
    }
    // SPA-ish offline fallback for navigations.
    const offline = path.join(DOCS, "offline.html");
    if (fs.existsSync(offline)) {
      return new Response(file(offline), { status: 404, headers: { "content-type": TYPES[".html"] } });
    }
    return new Response("Not found", { status: 404 });
  },
});

console.log(`Serving ${path.relative(path.resolve(__dirname, ".."), DOCS)}/ at http://127.0.0.1:${PORT}`);
