# AGENTS.md

Guidance for AI coding agents working in this repository. Humans should start
with `README.md`; this file covers the rules and traps that matter when changing
the code or content.

## What this project is

A static, offline-capable tutorial PWA (Golang, Bun, Web Development, Linux,
DevOps) published at <https://danegigi.github.io/Tutorials/>. A small
zero-dependency generator, run under Bun, turns hand-authored HTML lesson
fragments into the site in `docs/`, which GitHub Pages serves.

- Runtime: **Bun** only. There are no npm dependencies, so don't add any without
  explicit approval.
- No framework, no bundler, no TypeScript build step. Plain ES modules.

## Layout

```
scripts/lessons.js       # single source of truth: sections + lessons (order = reading order)
scripts/build-site.js    # generator -> docs/ (pages, nav, SEO, sitemap, SW, manifest, search index)
scripts/check.js         # post-build checks (run in CI)
scripts/serve.js         # local preview server, http://127.0.0.1:8792
scripts/gen-icons.js     # regenerates PNG icons (only when the icon changes)
content/<section>/<slug>.html   # lesson bodies (HTML fragments)
assets/app.css, app.js   # shared theme/layout + client behavior (theme, search, progress, SW)
docs/                    # BUILD OUTPUT. Committed. Never hand-edit.
.github/workflows/ci.yml # build + check + "docs/ in sync" gate
```

Section ids: `golang`, `bun`, `web`, `linux`, `devops`.

## Commands

```bash
bun run build    # generate docs/
bun run check    # run all post-build checks (must print "All checks passed.")
bun run dev      # build + serve on :8792
bun run serve    # serve existing docs/
```

## Adding or editing a lesson

1. **Register it** in `scripts/lessons.js` inside the right section's `lessons`
   array: `{ slug, title, blurb, further: [ref(label, url), ...] }`.
   - **Insert it next to its related lessons, not at the end of the array.** The
     array order is the reading order and drives the section index, search
     corpus, and the prev/next pager, which flows across sections. Keep each
     topic's basic -> advanced lessons adjacent (e.g. all React lessons, then the
     TanStack trio; Kubernetes basics -> deep dive -> advanced).
   - Slugs must be unique within a section. The same slug can appear in two
     sections (for example `testing` and `networking-deep-dive`), because pages
     are keyed by `section/slug`.
   - `further` links should point to official upstream docs for the topic.
2. **Write the fragment** at `content/<section>/<slug>.html`.
3. `bun run build && bun run check`, then commit the sources **and** the
   regenerated `docs/` together.

### Fragment conventions (the house style)

- It's a fragment. No `<html>`, `<head>`, `<body>`, or `<h1>` (the generator
  adds the page shell and title).
- Exactly one `<p class="lead">` intro at the top.
- Structure with `<h2>`/`<h3>`. The generator assigns ids and builds the TOC,
  so don't add ids or a manual TOC.
- Difficulty markers: `<span class="level beginner|intermediate|advanced">`.
  Comprehensive lessons go basic -> advanced and use all three.
- Code goes in `<pre><code>`. **Escape `<`, `>`, `&`** inside code (JSX, Vue
  templates, HTML, generics, shell redirects). The generator adds copy buttons.
- Callouts: `<blockquote class="tip">` and `<blockquote class="warn">`.
- Tables via plain `<table>`.
- Every lesson ends with `<h2>Common mistakes</h2>`, `<h2>Exercises</h2>`, and a
  `<h2>Mini-project: ...</h2>` section. Don't add a "Further reading" section
  yourself. It's generated from `further`.
- Prefer real, runnable examples with expected output over toy snippets, and
  target current versions of the tools you write about (verify fast-moving APIs
  like TanStack, Tailwind 4, daisyUI 5, React 19 before writing).
- Don't add audience callouts ("Aimed at junior developers..."). State the
  material directly.

Quick self-gate for a new fragment:

```bash
f=content/web/example.html
grep -c 'class="lead"' "$f"                      # expect 1
grep -cE '<(html|body|h1)[ >]' "$f"              # expect 0
grep -oE 'level (beginner|intermediate|advanced)' "$f" | sort -u
grep -E '<h2>(Common mistakes|Exercises|Mini-project)' "$f"
```

## Determinism and CI (important)

CI (`.github/workflows/ci.yml`) builds, runs `check.js`, then **fails if the
committed `docs/` differs from a fresh build**. So:

- Always rebuild and commit `docs/` alongside any change to `scripts/`,
  `content/`, or `assets/`.
- Keep the build **deterministic**. Don't put timestamps, `Date.now()`, random
  values, or the current date into any output. The service-worker cache version
  is `SW_VERSION` + a SHA-256 hash of the precached output, and `sitemap.xml`
  deliberately has no `<lastmod>`.
- Verify determinism after generator changes: build twice and confirm
  `git status --porcelain docs/` is unchanged between runs (or diff
  `docs/sw.js`).
- `sw.js` changing in a commit that changes content is expected and correct.

## SEO and generated files

`build-site.js` emits per-page title, meta description, canonical URL
(`SITE_URL`), Open Graph/Twitter tags, and JSON-LD (`WebSite`, `CollectionPage`,
`LearningResource` + `BreadcrumbList`), plus `sitemap.xml` and `robots.txt`.
New lessons inherit all of this automatically. `check.js` (check 7) verifies
sitemap coverage and per-lesson canonical/description/JSON-LD. If you change
`SITE_URL`, the canonical, sitemap, and robots output all change with it.

When adding a new generated top-level file, update `check.js` (top-level file
list) and decide deliberately whether it belongs in the SW precache. Sitemap and
robots are intentionally *not* precached.

## Verifying changes

- `bun run check` must pass with zero failures.
- For UI/asset changes, `bun run dev` and spot-check a lesson, search, theme
  toggle, and offline mode (DevTools -> Application -> Service Workers ->
  Offline).
- For smoke tests against the local server, prefer a `bun -e` script using
  `fetch()`.
- Lighthouse needs Node >= 22/23. Under older Node the `canonical` audit crashes
  (`URL.parse is not a function`) and nulls the SEO score, which is a tooling
  artifact and not a site regression. Use `nvm use 23` before `npx lighthouse`.

## Git

- Work on `main` (the Pages source is `main` + `/docs`).
- Stage explicit paths (`scripts/ content/ assets/ docs/ README.md ...`) rather
  than `git add -A`.
- Don't push. Commit locally and let the maintainer push. Pushing triggers CI
  and the Pages deploy.
- Keep `README.md` section counts and topic lists in sync when lessons are added.

## Don't

- Hand-edit anything in `docs/`.
- Append new lessons to the end of a section without considering flow.
- Introduce dependencies, a framework, or a bundler.
- Add nondeterministic output to the build.
- Delete content fragments or reorder by moving files. Order lives only in
  `lessons.js`.
