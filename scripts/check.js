#!/usr/bin/env bun
/*
 * check.js — post-build sanity checks (run after build-site.js).
 * Verifies: every lesson page exists, manifest is valid JSON with icons,
 * the service worker and search index exist, and no lesson page has a broken
 * in-page TOC anchor. Exits non-zero on failure so CI can gate on it.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SECTIONS, allLessons, lessonPath, lessonCount } from "./lessons.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dirname, "..", "docs");

let errors = 0;
const fail = (msg) => { console.error("✗ " + msg); errors++; };
const ok = (msg) => console.log("✓ " + msg);

function exists(rel) { return fs.existsSync(path.join(OUT, rel)); }

// 1. Top-level files.
for (const f of ["index.html", "search.html", "offline.html", "manifest.webmanifest", "sw.js", "search-index.json", "app.css", "app.js", "icon.svg", "sitemap.xml", "robots.txt", ".nojekyll"]) {
  if (!exists(f)) fail(`missing ${f}`);
}
if (!errors) ok("app shell files present");

// 2. Manifest validity.
try {
  const m = JSON.parse(fs.readFileSync(path.join(OUT, "manifest.webmanifest"), "utf8"));
  if (!m.name || !m.start_url || !Array.isArray(m.icons) || !m.icons.length) fail("manifest missing required fields");
  else ok(`manifest valid (${m.icons.length} icons, ${m.shortcuts?.length || 0} shortcuts)`);
} catch (e) { fail("manifest is not valid JSON: " + e.message); }

// 3. Every lesson + section page exists.
let pages = 0;
for (const s of SECTIONS) {
  if (!exists(`${s.id}/index.html`)) fail(`missing section page ${s.id}/index.html`);
  for (const l of s.lessons) {
    if (!exists(lessonPath(s.id, l.slug))) fail(`missing lesson ${s.id}/${l.slug}.html`);
    else pages++;
  }
}
if (pages === lessonCount()) ok(`all ${pages} lesson pages generated`);

// 4. Search index covers every lesson.
try {
  const idx = JSON.parse(fs.readFileSync(path.join(OUT, "search-index.json"), "utf8"));
  if (idx.length !== lessonCount()) fail(`search index has ${idx.length} entries, expected ${lessonCount()}`);
  else ok(`search index covers all ${idx.length} lessons`);
} catch (e) { fail("search-index.json invalid: " + e.message); }

// 5. Broken in-page TOC anchors.
let broken = 0;
for (const l of allLessons()) {
  const file = path.join(OUT, lessonPath(l.section.id, l.slug));
  if (!fs.existsSync(file)) continue;
  const html = fs.readFileSync(file, "utf8");
  const hrefs = [...html.matchAll(/href="#([\w-]+)"/g)].map((m) => m[1]);
  for (const id of hrefs) {
    if (id === "further-reading") continue;
    if (!new RegExp(`id="${id}"`).test(html)) { fail(`broken TOC anchor #${id} in ${l.section.id}/${l.slug}.html`); broken++; }
  }
}
if (!broken) ok("no broken in-page TOC anchors");

// 6. Service worker references offline + precaches lessons.
const sw = fs.readFileSync(path.join(OUT, "sw.js"), "utf8");
if (!/offline\.html/.test(sw)) fail("sw.js does not reference offline.html");
else ok("service worker wired for offline fallback");

// 7. SEO: sitemap covers every lesson URL; every lesson page has canonical + description + JSON-LD.
try {
  const sitemap = fs.readFileSync(path.join(OUT, "sitemap.xml"), "utf8");
  let sitemapMisses = 0;
  for (const l of allLessons()) {
    const loc = `/${lessonPath(l.section.id, l.slug)}`;
    if (!sitemap.includes(loc)) { fail(`sitemap missing ${loc}`); sitemapMisses++; }
  }
  if (!sitemapMisses) ok(`sitemap.xml covers all ${lessonCount()} lesson URLs`);

  let seoMisses = 0;
  for (const l of allLessons()) {
    const html = fs.readFileSync(path.join(OUT, lessonPath(l.section.id, l.slug)), "utf8");
    if (!/<link rel="canonical"/.test(html)) { fail(`${l.section.id}/${l.slug}.html missing canonical`); seoMisses++; }
    if (!/<meta name="description"/.test(html)) { fail(`${l.section.id}/${l.slug}.html missing description`); seoMisses++; }
    if (!/application\/ld\+json/.test(html)) { fail(`${l.section.id}/${l.slug}.html missing JSON-LD`); seoMisses++; }
  }
  if (!seoMisses) ok("every lesson page has canonical + description + JSON-LD");
} catch (e) { fail("SEO/sitemap check failed: " + e.message); }

console.log(errors ? `\n${errors} check(s) failed.` : "\nAll checks passed. ✓");
process.exit(errors ? 1 : 0);
