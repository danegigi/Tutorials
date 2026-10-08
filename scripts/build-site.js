#!/usr/bin/env bun
/*
 * build-site.js — Tutorials PWA static site generator
 *
 * Reads the lesson registry (scripts/lessons.js) and the hand-authored HTML
 * fragments in content/<section>/<slug>.html, and emits a complete static,
 * installable, offline-capable PWA into docs/:
 *
 *   docs/
 *     index.html                 ← dashboard (first screen)
 *     search.html                ← full-text lesson search
 *     offline.html               ← offline fallback
 *     manifest.webmanifest
 *     sw.js                      ← service worker (precache from registry)
 *     search-index.json          ← search corpus
 *     app.css, app.js, icons…    ← copied assets
 *     <section>/index.html       ← section lesson index
 *     <section>/<slug>.html      ← lesson pages (TOC, copy, prev/next, tools)
 *
 * Runs under Bun (`bun run scripts/build-site.js`) or Node — zero deps.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SECTIONS, allLessons, lessonPath, contentPath, lessonCount } from "./lessons.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const CONTENT = path.join(ROOT, "content");
const ASSETS = path.join(ROOT, "assets");
const OUT = path.join(ROOT, "docs");

const SITE_NAME = "Dev Tutorials";
const SW_VERSION = "v1"; // bump to invalidate caches

// ── small helpers ──────────────────────────────────────────────────────────
const esc = (s) =>
  String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

function slugifyHeading(text) {
  return text.toLowerCase().replace(/<[^>]+>/g, "").replace(/&[a-z]+;/g, "")
    .replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-");
}

// Add id="" to every <h2>/<h3> that lacks one; collect TOC entries.
function injectAnchorsAndToc(html) {
  const toc = [];
  const used = new Set();
  const out = html.replace(/<(h2|h3)([^>]*)>([\s\S]*?)<\/\1>/g, (m, tag, attrs, inner) => {
    let id = (attrs.match(/id=["']([^"']+)["']/) || [])[1];
    if (!id) {
      id = slugifyHeading(inner) || "section";
      let base = id, n = 2;
      while (used.has(id)) id = `${base}-${n++}`;
      attrs += ` id="${id}"`;
    }
    used.add(id);
    toc.push({ level: tag === "h2" ? 2 : 3, id, text: inner.replace(/<[^>]+>/g, "").trim() });
    return `<${tag}${attrs}>${inner}</${tag}>`;
  });
  return { html: out, toc };
}

function tocHtml(toc) {
  if (toc.length < 2) return "";
  const items = toc.map((t) => `<li class="lvl${t.level}"><a href="#${t.id}">${esc(t.text)}</a></li>`).join("\n");
  return `<nav class="toc" aria-label="On this page"><strong>On this page</strong><ul>\n${items}\n</ul></nav>`;
}

function furtherHtml(further) {
  if (!further || !further.length) return "";
  const items = further
    .map((r) => `<li><a href="${esc(r.url)}" target="_blank" rel="noopener">${esc(r.label)} ↗</a></li>`)
    .join("\n");
  return `<section class="further"><h2 id="further-reading">Further reading</h2>
<p>Official documentation for the tools and APIs covered on this page:</p>
<ul class="further-list">${items}</ul></section>`;
}

// The <head> shared by every page. `base` is "" (root) or "../" (section depth).
function head(title, base, extraCss) {
  return `<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#0d1117">
<meta name="description" content="${esc(SITE_NAME)} — Golang, Bun, Web Development, Linux and DevOps, offline-ready.">
<title>${esc(title)}</title>
<link rel="manifest" href="${base}manifest.webmanifest">
<link rel="icon" href="${base}icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="${base}icon-192.png">
<link rel="stylesheet" href="${base}app.css">
<script>/* set theme before paint to avoid flash */(function(){try{var t=localStorage.getItem('tut.theme');document.documentElement.setAttribute('data-theme',t||'dark');}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();</script>
${extraCss || ""}`;
}

function navBar(base, crumb) {
  return `<header class="nav">
  <a class="brand" href="${base}index.html">📚 ${esc(SITE_NAME)}</a>
  ${crumb ? `<span class="crumb">${esc(crumb)}</span>` : ""}
  <span class="spacer"></span>
  <a class="navbtn" href="${base}search.html">🔎 Search</a>
  <button class="navbtn" id="install-btn" type="button">⬇️ Install</button>
  <button class="navbtn" id="theme-btn" type="button" aria-label="Toggle theme">🌙 Dark</button>
</header>`;
}

function banners() {
  return `<div class="banner" id="update-banner" role="status">A new version is available.<button type="button">Reload</button></div>
<div class="banner" id="offline-banner" role="status">You're offline — showing cached lessons.</div>`;
}

function footScripts(base) {
  return `<button type="button" class="fab top" id="fab-top" aria-label="Back to top">↑ Top</button>
${banners()}
<script src="${base}app.js" defer></script>`;
}

// ── page templates ───────────────────────────────────────────────────────────
function pageDocument({ title, base, bodyClass, body, extraCss }) {
  return `<!DOCTYPE html>
<html lang="en" data-base="${base}">
<head>
${head(title, base, extraCss)}
</head>
<body${bodyClass ? ` class="${bodyClass}"` : ""}>
${navBar(base, title === SITE_NAME ? "" : title)}
${body}
${footScripts(base)}
</body>
</html>`;
}

function dashboard() {
  const allIds = allLessons().map((l) => `${l.section.id}/${l.slug}`).join(",");
  const cards = SECTIONS.map((s) => {
    const ids = s.lessons.map((l) => `${s.id}/${l.slug}`).join(",");
    return `  <a class="section-card" href="${s.id}/index.html" style="--card-accent:${s.accent}">
    <div class="ic">${s.icon}</div>
    <h2>${esc(s.title)}</h2>
    <p>${esc(s.tagline)}</p>
    <div class="meta" data-progress-ids="${ids}">
      <div class="bar"><span></span></div>
      <span class="count">${s.lessons.length} lessons</span>
    </div>
  </a>`;
  }).join("\n");

  const body = `<main class="wrap wrap-wide">
  <div class="hero">
    <div class="logo">📚</div>
    <h1>${esc(SITE_NAME)}</h1>
    <p>A hands-on, offline-ready path through <strong>Golang</strong>, <strong>Bun</strong>, <strong>Web Development</strong>, <strong>Linux</strong>, and <strong>DevOps</strong> — ${lessonCount()} lessons with runnable examples, commands, expected output, common mistakes, exercises, and mini-projects.</p>
    <div class="progress-overall" data-progress-ids="${allIds}">
      <div class="bar"><span></span></div>
      <div class="label">0 / ${lessonCount()} done</div>
    </div>
  </div>
  <div class="section-grid">
${cards}
  </div>
  <p style="color:var(--muted);font-size:13px;text-align:center">Installable &middot; works offline after first visit &middot; your progress and bookmarks stay on this device.</p>
</main>`;
  return pageDocument({ title: SITE_NAME, base: "", bodyClass: "home", body });
}

function sectionPage(section) {
  const base = "../";
  const ids = section.lessons.map((l) => `${section.id}/${l.slug}`).join(",");
  const items = section.lessons.map((l, i) => {
    const id = `${section.id}/${l.slug}`;
    return `    <li><a href="${l.slug}.html" data-id="${id}">
      <span class="num">${String(i + 1).padStart(2, "0")}</span>
      <span class="body"><span class="ttl">${esc(l.title)}</span><br><span class="desc">${esc(l.blurb)}</span></span>
      <span class="state"></span>
    </a></li>`;
  }).join("\n");

  const body = `<main class="wrap">
  <h1 class="page-title">${section.icon} ${esc(section.title)}</h1>
  <p class="section-tagline">${esc(section.tagline)}</p>
  <div class="progress-overall" data-progress-ids="${ids}" style="margin:0 0 10px">
    <div class="bar"><span></span></div>
    <div class="label">0 / ${section.lessons.length} done</div>
  </div>
  <ul class="lesson-list">
${items}
  </ul>
</main>`;
  return pageDocument({ title: section.title, base, body });
}

function lessonPage(section, lesson, prev, next, bodyHtml, toc) {
  const base = "../";
  const id = `${section.id}/${lesson.slug}`;
  const prevLink = prev
    ? `<a class="prev" href="${prev.sameSection ? "" : "../" + prev.section.id + "/"}${prev.slug}.html"><small>Previous</small>${prev.section.icon} ${esc(prev.title)}</a>`
    : `<a class="prev" href="index.html"><small>Section</small>${section.icon} ${esc(section.title)}</a>`;
  const nextLink = next
    ? `<a class="next" href="${next.sameSection ? "" : "../" + next.section.id + "/"}${next.slug}.html"><small>Next</small>${next.section.icon} ${esc(next.title)}</a>`
    : `<a class="next" href="../index.html"><small>Done</small>📚 Dashboard</a>`;

  const body = `<main class="wrap lesson-body">
  <h1 class="page-title">${esc(lesson.title)}</h1>
  <div class="lesson-tools" data-lesson-id="${id}">
    <button id="done-btn" type="button" aria-pressed="false">○ Mark complete</button>
    <button id="mark-btn" type="button" aria-pressed="false">☆ Bookmark</button>
    <a class="navbtn" href="index.html" style="margin-left:auto">All ${esc(section.title)} lessons →</a>
  </div>
${tocHtml(toc)}
${bodyHtml}
${furtherHtml(lesson.further)}
  <nav class="pager">
${prevLink}
${nextLink}
  </nav>
</main>`;
  return pageDocument({ title: `${lesson.title} — ${section.title}`, base, bodyClass: "lesson", body });
}

function searchPage() {
  const body = `<main class="wrap">
  <h1 class="page-title">🔎 Search lessons</h1>
  <p class="section-tagline">Search across all ${lessonCount()} lessons in every section.</p>
  <div class="search-wrap">
    <input id="search-input" type="search" placeholder="Try: goroutines, service worker, chmod, docker compose…" autocomplete="off" aria-label="Search lessons">
    <ul id="search-results"></ul>
  </div>
</main>`;
  return pageDocument({ title: "Search", base: "", body });
}

function offlinePage() {
  const links = SECTIONS.map((s) => `<a class="navbtn" href="${s.id}/index.html">${s.icon} ${esc(s.title)}</a>`).join(" ");
  const body = `<main class="wrap" style="text-align:center">
  <div class="hero">
    <div class="logo">📡</div>
    <h1>You're offline</h1>
    <p>This page isn't in the cache yet. Any lesson you've already opened is available offline — try one of the sections below, or reconnect to load new material.</p>
  </div>
  <div style="display:flex;flex-wrap:wrap;gap:10px;justify-content:center;margin-top:20px">${links}</div>
</main>`;
  return pageDocument({ title: "Offline", base: "", body });
}

// ── search index ─────────────────────────────────────────────────────────────
function buildSearchIndex() {
  return allLessons().map((l) => ({
    title: l.title,
    section: l.section.title,
    sectionIcon: l.section.icon,
    blurb: l.blurb,
    url: lessonPath(l.section.id, l.slug),
    keywords: (l.further || []).map((r) => r.label).join(" "),
  }));
}

// ── manifest ───────────────────────────────────────────────────────────────
function manifest() {
  return JSON.stringify({
    name: SITE_NAME,
    short_name: "Tutorials",
    description: "Offline-ready tutorials for Golang, Bun, Web Development, Linux, and DevOps.",
    start_url: "./index.html",
    scope: "./",
    display: "standalone",
    orientation: "any",
    background_color: "#0d1117",
    theme_color: "#0d1117",
    categories: ["education", "developer", "books"],
    icons: [
      { src: "icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: SECTIONS.map((s) => ({
      name: s.title,
      url: `./${s.id}/index.html`,
    })),
  }, null, 2);
}

// ── service worker ───────────────────────────────────────────────────────────
function serviceWorker(precache) {
  const list = JSON.stringify(precache, null, 2);
  return `/* Tutorials PWA service worker — generated by build-site.js */
const VERSION = "${SW_VERSION}-${Date.now()}";
const CACHE = "tutorials-" + VERSION;
const OFFLINE_URL = "offline.html";

// App shell + every lesson page, precached on install so the whole site
// is available offline after the first visit.
const PRECACHE = ${list};

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      // Add individually so one 404 can't abort the whole precache.
      Promise.all(PRECACHE.map((url) => cache.add(url).catch(() => null)))
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // let cross-origin (docs links) pass through

  // Navigations: network-first, falling back to cache, then the offline page.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
        return res;
      }).catch(() =>
        caches.match(req).then((hit) => hit || caches.match(OFFLINE_URL))
      )
    );
    return;
  }

  // Static assets: stale-while-revalidate.
  event.respondWith(
    caches.match(req).then((hit) => {
      const network = fetch(req).then((res) => {
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      }).catch(() => hit);
      return hit || network;
    })
  );
});
`;
}

// ── minimal icons (SVG source + tiny PNG placeholders) ───────────────────────
function iconSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="#0d1117"/>
  <text x="50%" y="54%" font-size="300" text-anchor="middle" dominant-baseline="central">📚</text>
</svg>`;
}
// A 1x1 transparent PNG is a poor icon; we emit a simple solid-color PNG via a
// data decode so installability has real raster icons without a build dep.
// (See generateIcons: we write a small valid PNG for 192/512 + maskable.)

function build() {
  if (!fs.existsSync(CONTENT)) fs.mkdirSync(CONTENT, { recursive: true });
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, ".nojekyll"), "");

  // Copy shared assets.
  for (const f of ["app.css", "app.js"]) {
    fs.copyFileSync(path.join(ASSETS, f), path.join(OUT, f));
  }
  // Icons: SVG (always) + PNGs if present in assets/ (generated separately).
  fs.writeFileSync(path.join(OUT, "icon.svg"), iconSvg());
  for (const png of ["icon-192.png", "icon-512.png", "icon-maskable-512.png"]) {
    const src = path.join(ASSETS, png);
    if (fs.existsSync(src)) fs.copyFileSync(src, path.join(OUT, png));
  }

  // Flat ordered list for prev/next that flows ACROSS sections.
  const flat = allLessons();
  const precache = ["./", "index.html", "search.html", "offline.html", "app.css", "app.js",
    "manifest.webmanifest", "icon.svg", "search-index.json"];

  let built = 0;
  const missing = [];

  for (let i = 0; i < flat.length; i++) {
    const l = flat[i];
    const section = l.section;
    const src = path.join(ROOT, contentPath(section.id, l.slug));
    const outDir = path.join(OUT, section.id);
    fs.mkdirSync(outDir, { recursive: true });

    let raw;
    if (fs.existsSync(src)) {
      raw = fs.readFileSync(src, "utf8");
    } else {
      missing.push(`${section.id}/${l.slug}`);
      raw = `<p class="lead">${esc(l.blurb)}</p><blockquote class="warn">This lesson's content fragment is not authored yet (<code>${esc(contentPath(section.id, l.slug))}</code>).</blockquote>`;
    }
    const { html, toc } = injectAnchorsAndToc(raw);

    // prev/next across the whole flat sequence, tagged with sameSection.
    const prevRaw = flat[i - 1];
    const nextRaw = flat[i + 1];
    const prev = prevRaw ? { ...prevRaw, sameSection: prevRaw.section.id === section.id } : null;
    const next = nextRaw ? { ...nextRaw, sameSection: nextRaw.section.id === section.id } : null;

    fs.writeFileSync(path.join(outDir, `${l.slug}.html`), lessonPage(section, l, prev, next, html, toc));
    precache.push(lessonPath(section.id, l.slug));
    built++;
  }

  // Section index pages.
  for (const s of SECTIONS) {
    fs.writeFileSync(path.join(OUT, s.id, "index.html"), sectionPage(s));
    precache.push(`${s.id}/index.html`);
  }

  // Top-level pages.
  fs.writeFileSync(path.join(OUT, "index.html"), dashboard());
  fs.writeFileSync(path.join(OUT, "search.html"), searchPage());
  fs.writeFileSync(path.join(OUT, "offline.html"), offlinePage());
  fs.writeFileSync(path.join(OUT, "manifest.webmanifest"), manifest());
  fs.writeFileSync(path.join(OUT, "search-index.json"), JSON.stringify(buildSearchIndex()));
  fs.writeFileSync(path.join(OUT, "sw.js"), serviceWorker(precache));

  console.log(`Built ${built}/${lessonCount()} lesson pages + ${SECTIONS.length} section pages → ${path.relative(ROOT, OUT)}/`);
  if (missing.length) {
    console.log(`\n${missing.length} lesson(s) still need a content fragment:`);
    missing.forEach((m) => console.log(`  content/${m}.html`));
  } else {
    console.log("All lessons have authored content. ✓");
  }
}

build();
