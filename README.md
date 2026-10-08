# Dev Tutorials — an offline-capable Tutorial PWA

A unified, installable **Progressive Web App** covering five tracks, built from
hand-authored HTML lesson fragments and a tiny zero-dependency static-site
generator that runs under [Bun](https://bun.com).

| Section | Lessons | Covers |
|---------|--------:|--------|
| 🐹 **Golang** | 13 | setup & tooling, modules, types, control flow, structs/interfaces/generics, errors, concurrency, HTTP/APIs, files & JSON, testing, databases, CLI tools, deployment |
| 🥟 **Bun** | 11 | what/why, install, runtime, package manager, TypeScript, APIs (Bun.serve + Hono), file I/O & shell, testing, bundling, databases (sqlite/sql/Drizzle), deployment |
| 🌐 **Web Development** | 16 | HTML, CSS, JS, TypeScript, HTTP & APIs, forms & validation, accessibility, responsive design, browser storage, PWAs, service workers, manifests, HTMX, Datastar, auth, frontend/backend integration |
| 🐧 **Linux** | 13 | shell, filesystem, permissions, users & groups, processes & services, package managers, env vars, networking, SSH, logs, cron & systemd timers, bash scripting, troubleshooting |
| 🔁 **DevOps** | 16 | mindset, Git workflows, CI/CD, GitHub Actions, Docker, Compose, Kubernetes, reverse proxies, TLS & domains, cloud (AWS), IaC (Terraform), monitoring & logging, GitOps, security, deployment strategies, incident response |

Every lesson goes straight into examples, commands, and expected output, with
common-mistake callouts, exercises, a mini-project, and official "Further
reading" links.

## PWA features

- **Installable** on desktop and mobile (valid `manifest.webmanifest`, real PNG + maskable icons, app shortcuts).
- **Offline-capable**: a service worker precaches the app shell and *every* lesson page on first visit; an `offline.html` fallback covers anything not yet cached.
- **Caching strategy**: network-first for page navigations (fresh when online, cached when not), stale-while-revalidate for static assets, with versioned caches cleaned up on activate.
- **Dashboard-first**: the home screen is the tutorial dashboard, not a landing page.
- **Full-text search** across all lessons (from a generated `search-index.json`).
- **Progress tracking, bookmarks, and completion checkboxes** stored in `localStorage` (per device).
- **Dark / light theme** (persisted, applied before paint — no flash).
- **Per-lesson table of contents**, copy-to-clipboard code buttons, and clear previous/next navigation that flows across sections.
- Responsive layout for mobile, tablet, and desktop.

## Architecture

Content is **data-driven**, never hard-coded into one big component:

```
Tutorials/
├── scripts/
│   ├── lessons.js        # THE source of truth: every section + lesson
│   ├── build-site.js     # generator → docs/  (dashboard, pages, SW, manifest, search)
│   ├── gen-icons.js      # writes real PNG icons (no deps) into assets/
│   ├── serve.js          # local preview server (Bun)
│   └── check.js          # post-build sanity checks (CI-gateable)
├── content/<section>/<slug>.html   # hand-authored lesson fragments (edit here)
├── assets/
│   ├── app.css           # shared theme + layout
│   ├── app.js            # theme, search, progress, SW registration, install prompt
│   └── icon-*.png        # generated icons
└── docs/                 # ← BUILD OUTPUT (GitHub Pages source; committed)
```

To add or edit a lesson: change `scripts/lessons.js` (slug, title, blurb,
further-reading links) and write/edit `content/<section>/<slug>.html` as a clean
HTML fragment (`<h2>`/`<h3>`, `<pre><code>`, `<table>`, `<blockquote class="tip|warn">`,
`<p class="lead">`, `<span class="level beginner|intermediate|advanced">`). The
generator assigns heading ids, builds the TOC, adds copy buttons, wires prev/next,
and appends the Further-reading block automatically.

## Develop

Requires [Bun](https://bun.com) ≥ 1.0.

```bash
bun run build      # generate docs/
bun run serve      # preview docs/ at http://127.0.0.1:8792
bun run dev        # build + serve
bun run check      # verify pages, manifest, search index, SW, broken TOC anchors
bun run scripts/gen-icons.js   # (re)generate PNG icons — only if you change the icon
```

### Verifying offline behavior locally

1. `bun run dev` and open `http://127.0.0.1:8792`.
2. Load the dashboard and a few lessons (populates the cache).
3. DevTools → **Application → Service Workers** → tick **Offline** (or stop the server).
4. Reload and navigate — cached pages load; uncached ones show `offline.html`.

> A full Lighthouse PWA audit needs a browser: DevTools → Lighthouse →
> *Progressive Web App*, or `npx lighthouse http://127.0.0.1:8792 --only-categories=pwa`.

## Continuous integration

`.github/workflows/ci.yml` runs on every push to `main` and every pull request:
it installs Bun, runs `bun run build`, runs `bun run check.js` (all pages present,
valid manifest, full search-index coverage, no broken TOC anchors, SW offline
wiring), and finally verifies the committed `docs/` matches a fresh build.

That last check works because the build is **deterministic** — the service
worker's cache version is a SHA-256 content hash of the precached output, not a
timestamp, so an unchanged site produces a byte-identical `docs/`. After editing
content, always run `bun run build` and commit the regenerated `docs/`, or CI
will fail with "docs/ is out of date".

## Deploy to GitHub Pages

The build output in `docs/` (including `.nojekyll`) is the Pages source.

1. Push `main`.
2. GitHub → **Settings → Pages → Build and deployment**
   - **Source:** *Deploy from a branch*
   - **Branch:** `main` · **Folder:** `/docs`
3. Open the published URL. The app installs and works offline from the first visit.

Any static host works too (Netlify, Cloudflare Pages, S3+CloudFront, nginx) —
serve the `docs/` folder as the web root. Serve `*.webmanifest` as
`application/manifest+json`, give hashed assets long cache lifetimes, and keep
`sw.js` / HTML on `no-cache` so updates are picked up.

## Content sources

The lessons were extracted, reorganized, and expanded from three existing
tutorial sites, unified here into five coherent tracks:

- Go — <https://danegigi.github.io/go-tut/>
- Bun — <https://danegigi.github.io/bun-tut/>
- DevOps — <https://danegigi.github.io/DevOps/>
