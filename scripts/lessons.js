/*
 * lessons.js — the single source of truth for the Tutorials PWA.
 *
 * Every section and every lesson is declared here. The build script, the
 * search index, the service-worker precache manifest, progress tracking,
 * and prev/next navigation are all derived from this one file. Nothing about
 * the site's structure is hard-coded anywhere else.
 *
 * Each lesson's prose lives as a clean HTML fragment in
 *   content/<section>/<slug>.html
 * authored with <h2>/<h3>, <pre><code>, <table>, <blockquote class="tip|warn">,
 * <p class="lead">, and <span class="level beginner|intermediate|advanced">.
 * The generator assigns heading ids, builds a per-lesson table of contents,
 * adds copy buttons to code blocks, and appends a "Further reading" block.
 */

/** @typedef {{label:string,url:string}} Ref */
/** @typedef {{slug:string,title:string,blurb:string,further?:Ref[]}} Lesson */
/** @typedef {{id:string,title:string,icon:string,tagline:string,accent:string,lessons:Lesson[]}} Section */

const ref = (label, url) => ({ label, url });

/** @type {Section[]} */
export const SECTIONS = [
  // ─────────────────────────────────────────────────────────── Golang ──
  {
    id: "golang",
    title: "Golang",
    icon: "🐹",
    tagline: "From setup and syntax to concurrency, HTTP services, testing, and deployment.",
    accent: "#00add8",
    lessons: [
      {
        slug: "setup-and-tooling",
        title: "Go Setup & Tooling",
        blurb: "Install Go, the go command, GOPATH vs modules, formatting, vetting, and the editor toolchain.",
        further: [
          ref("Download & install", "https://go.dev/doc/install"),
          ref("Go command reference", "https://pkg.go.dev/cmd/go"),
          ref("Effective Go", "https://go.dev/doc/effective_go"),
        ],
      },
      {
        slug: "modules-and-packages",
        title: "Modules & Packages",
        blurb: "go.mod, semantic import versioning, adding dependencies, go work multi-module workspaces.",
        further: [
          ref("Managing dependencies", "https://go.dev/doc/modules/managing-dependencies"),
          ref("go.mod reference", "https://go.dev/ref/mod"),
          ref("Workspaces tutorial", "https://go.dev/doc/tutorial/workspaces"),
        ],
      },
      {
        slug: "variables-types-functions",
        title: "Variables, Types & Functions",
        blurb: "Declarations, zero values, basic & composite types, functions, multiple returns, closures.",
        further: [
          ref("Tour of Go: Basics", "https://go.dev/tour/basics/1"),
          ref("Go spec: Types", "https://go.dev/ref/spec#Types"),
        ],
      },
      {
        slug: "control-flow",
        title: "Control Flow",
        blurb: "if/else, the one and only for loop, switch (with no fallthrough), defer, and labelled breaks.",
        further: [
          ref("Tour of Go: Flow control", "https://go.dev/tour/flowcontrol/1"),
          ref("Defer, Panic, Recover", "https://go.dev/blog/defer-panic-and-recover"),
        ],
      },
      {
        slug: "structs-interfaces-methods",
        title: "Structs, Interfaces & Methods",
        blurb: "Struct composition over inheritance, methods & receivers, implicit interfaces, generics.",
        further: [
          ref("Tour of Go: Methods", "https://go.dev/tour/methods/1"),
          ref("Generics tutorial", "https://go.dev/doc/tutorial/generics"),
        ],
      },
      {
        slug: "error-handling",
        title: "Error Handling",
        blurb: "errors as values, wrapping with %w, errors.Is / errors.As, sentinel errors, custom types.",
        further: [
          ref("Error handling in Go", "https://go.dev/blog/error-handling-and-go"),
          ref("Working with errors", "https://go.dev/blog/go1.13-errors"),
        ],
      },
      {
        slug: "concurrency",
        title: "Concurrency: Goroutines & Channels",
        blurb: "goroutines, channels, select, sync primitives, context cancellation, worker pools, race detector.",
        further: [
          ref("Share memory by communicating", "https://go.dev/blog/codelab-share"),
          ref("Go Concurrency Patterns", "https://go.dev/blog/pipelines"),
          ref("context package", "https://pkg.go.dev/context"),
        ],
      },
      {
        slug: "http-servers-and-apis",
        title: "HTTP Servers & APIs",
        blurb: "net/http servers, routing with ServeMux, JSON APIs, middleware, and the Gin framework.",
        further: [
          ref("net/http", "https://pkg.go.dev/net/http"),
          ref("Writing web applications", "https://go.dev/doc/articles/wiki/"),
          ref("Gin web framework", "https://gin-gonic.com/docs/"),
        ],
      },
      {
        slug: "files-and-json",
        title: "Working with Files & JSON",
        blurb: "os & io, reading/writing files, encoding/json marshalling, struct tags, streaming decoders.",
        further: [
          ref("encoding/json", "https://pkg.go.dev/encoding/json"),
          ref("JSON and Go", "https://go.dev/blog/json"),
          ref("os package", "https://pkg.go.dev/os"),
        ],
      },
      {
        slug: "testing",
        title: "Testing & Benchmarks",
        blurb: "the testing package, table-driven tests, subtests, benchmarks, fuzzing, and coverage.",
        further: [
          ref("testing package", "https://pkg.go.dev/testing"),
          ref("Go fuzzing", "https://go.dev/doc/security/fuzz/"),
          ref("Add a test (tutorial)", "https://go.dev/doc/tutorial/add-a-test"),
        ],
      },
      {
        slug: "database-basics",
        title: "Database Basics",
        blurb: "database/sql, connection pools, prepared statements, and the Ent ORM for typed schemas.",
        further: [
          ref("database/sql", "https://pkg.go.dev/database/sql"),
          ref("Accessing a database (tutorial)", "https://go.dev/doc/tutorial/database-access"),
          ref("Ent ORM", "https://entgo.io/docs/getting-started/"),
        ],
      },
      {
        slug: "cli-tools",
        title: "Building CLI Tools",
        blurb: "the flag package, subcommands, exit codes, reading stdin, and shipping a cross-platform binary.",
        further: [
          ref("flag package", "https://pkg.go.dev/flag"),
          ref("Cobra CLI library", "https://github.com/spf13/cobra"),
        ],
      },
      {
        slug: "deployment-basics",
        title: "Deployment Basics",
        blurb: "go build, cross-compilation with GOOS/GOARCH, tiny Docker images, and systemd services.",
        further: [
          ref("go build", "https://pkg.go.dev/cmd/go#hdr-Compile_packages_and_dependencies"),
          ref("Deploying Go (official Docker image)", "https://hub.docker.com/_/golang"),
        ],
      },
      {
        slug: "generics-deep-dive",
        title: "Generics Deep Dive",
        blurb: "Type parameters, constraints & the constraints package, generic data structures, inference, and when NOT to use them.",
        further: [
          ref("Tutorial: Generics", "https://go.dev/doc/tutorial/generics"),
          ref("When To Use Generics", "https://go.dev/blog/when-generics"),
          ref("golang.org/x/exp/constraints", "https://pkg.go.dev/golang.org/x/exp/constraints"),
        ],
      },
      {
        slug: "context-and-cancellation",
        title: "Context & Cancellation",
        blurb: "context.Context in depth: timeouts, deadlines, cancellation propagation, values, and the rules for passing it.",
        further: [
          ref("context package", "https://pkg.go.dev/context"),
          ref("Go Concurrency Patterns: Context", "https://go.dev/blog/context"),
        ],
      },
      {
        slug: "profiling-and-performance",
        title: "Profiling & Performance",
        blurb: "pprof CPU/memory profiles, benchmarks with -benchmem, the execution tracer, escape analysis, and reducing allocations.",
        further: [
          ref("Profiling Go programs", "https://go.dev/blog/pprof"),
          ref("Diagnostics", "https://go.dev/doc/diagnostics"),
          ref("runtime/pprof", "https://pkg.go.dev/runtime/pprof"),
        ],
      },
      {
        slug: "project-layout-and-patterns",
        title: "Project Layout & Patterns",
        blurb: "Package organization, internal/ and cmd/, dependency injection, interfaces at the boundary, and idiomatic structure.",
        further: [
          ref("Organizing a Go module", "https://go.dev/doc/modules/layout"),
          ref("Effective Go", "https://go.dev/doc/effective_go"),
          ref("Standard Go Project Layout (community)", "https://github.com/golang-standards/project-layout"),
        ],
      },
    ],
  },

  // ───────────────────────────────────────────────────────────── Bun ──
  {
    id: "bun",
    title: "Bun",
    icon: "🥟",
    tagline: "The all-in-one JavaScript/TypeScript runtime: install, run, bundle, test, and deploy.",
    accent: "#fbf0df",
    lessons: [
      {
        slug: "what-is-bun",
        title: "What Bun Is & When to Use It",
        blurb: "Runtime + package manager + bundler + test runner in one fast binary, and where it fits.",
        further: [
          ref("Bun docs", "https://bun.com/docs"),
          ref("What is Bun?", "https://bun.com/docs"),
        ],
      },
      {
        slug: "installation",
        title: "Installation & Getting Started",
        blurb: "Install Bun, scaffold a project, run TS/JS natively, bunfig.toml, and env resolution order.",
        further: [
          ref("Installation", "https://bun.com/docs/installation"),
          ref("bunfig.toml", "https://bun.com/docs/runtime/bunfig"),
          ref("Environment variables", "https://bun.com/docs/runtime/env"),
        ],
      },
      {
        slug: "runtime",
        title: "The Bun Runtime",
        blurb: "bun run, --watch / --hot, --print, shebangs, Web APIs, and the Node.js compatibility layer.",
        further: [
          ref("bun run", "https://bun.com/docs/cli/run"),
          ref("Hot reloading", "https://bun.com/docs/runtime/hot"),
          ref("Web APIs in Bun", "https://bun.com/docs/runtime/web-apis"),
        ],
      },
      {
        slug: "package-management",
        title: "Package Management",
        blurb: "install/add/remove, the binary lockfile, bun outdated, workspaces, overrides, and bunx.",
        further: [
          ref("bun install", "https://bun.com/docs/cli/install"),
          ref("Lockfile", "https://bun.com/docs/install/lockfile"),
          ref("Workspaces", "https://bun.com/docs/install/workspaces"),
        ],
      },
      {
        slug: "typescript",
        title: "TypeScript with Bun",
        blurb: "Zero-config TS execution, path mapping, tsconfig, type-checking with tsc --noEmit.",
        further: [
          ref("TypeScript support", "https://bun.com/docs/runtime/typescript"),
          ref("tsconfig paths", "https://bun.com/docs/runtime/typescript#path-mapping"),
        ],
      },
      {
        slug: "building-apis",
        title: "Building APIs with Bun.serve",
        blurb: "Bun.serve routing, WebSockets + pub/sub, raw TCP/UDP, and building a Hono app with JWT auth.",
        further: [
          ref("HTTP server", "https://bun.com/docs/api/http"),
          ref("WebSockets", "https://bun.com/docs/api/websockets"),
          ref("Hono docs", "https://hono.dev/docs/"),
        ],
      },
      {
        slug: "file-io",
        title: "File I/O & Shell",
        blurb: "Bun.file, Bun.write, streaming, the s3:// protocol, Bun.$ shell scripting, and Bun.spawn.",
        further: [
          ref("File I/O", "https://bun.com/docs/api/file-io"),
          ref("Bun Shell ($)", "https://bun.com/docs/runtime/shell"),
          ref("Spawn", "https://bun.com/docs/api/spawn"),
        ],
      },
      {
        slug: "testing",
        title: "Testing with bun test",
        blurb: "bun test, matchers, mocks/spies, snapshots, lifecycle hooks, coverage, and DOM testing.",
        further: [
          ref("bun test", "https://bun.com/docs/cli/test"),
          ref("Writing tests", "https://bun.com/docs/test/writing"),
          ref("Coverage", "https://bun.com/docs/test/coverage"),
        ],
      },
      {
        slug: "bundling",
        title: "Bundling & Executables",
        blurb: "bun build for the browser & server, tree-shaking, and --compile standalone binaries.",
        further: [
          ref("Bundler", "https://bun.com/docs/bundler"),
          ref("Standalone executables", "https://bun.com/docs/bundler/executables"),
        ],
      },
      {
        slug: "databases",
        title: "Database Usage",
        blurb: "bun:sqlite, the unified Bun.sql client (Postgres/MySQL/SQLite), and Drizzle ORM with Bun.",
        further: [
          ref("bun:sqlite", "https://bun.com/docs/api/sqlite"),
          ref("Bun.sql", "https://bun.com/docs/api/sql"),
          ref("Drizzle + Bun SQLite", "https://orm.drizzle.team/docs/get-started/bun-sqlite-new"),
        ],
      },
      {
        slug: "deployment",
        title: "Deployment Workflows",
        blurb: "Environment config, Playwright E2E under Bun, the official Docker image, and production hardening.",
        further: [
          ref("Bun Docker image", "https://hub.docker.com/r/oven/bun"),
          ref("Playwright", "https://playwright.dev/docs/intro"),
        ],
      },
      {
        slug: "monorepos-and-workspaces",
        title: "Monorepos & Workspaces",
        blurb: "Bun workspaces, shared packages, filtered scripts (--filter), catalog versions, and a monorepo CI setup.",
        further: [
          ref("Workspaces", "https://bun.com/docs/install/workspaces"),
          ref("Filter (--filter)", "https://bun.com/docs/cli/filter"),
          ref("Catalogs", "https://bun.com/docs/install/catalogs"),
        ],
      },
      {
        slug: "env-and-config",
        title: "Environment & Configuration",
        blurb: ".env resolution order, Bun.env vs process.env, typed config, secrets with Bun.secrets, and per-environment config.",
        further: [
          ref("Environment variables", "https://bun.com/docs/runtime/env"),
          ref("bunfig.toml", "https://bun.com/docs/runtime/bunfig"),
          ref("Bun.secrets", "https://bun.com/reference/bun/secrets"),
        ],
      },
      {
        slug: "web-frameworks",
        title: "Web Frameworks: Hono & Elysia",
        blurb: "Beyond Bun.serve: routing, middleware, validation, and typed end-to-end APIs with Hono and Elysia.",
        further: [
          ref("Hono docs", "https://hono.dev/docs/"),
          ref("Hono validation (zod)", "https://hono.dev/docs/guides/validation"),
          ref("Elysia docs", "https://elysiajs.com/"),
        ],
      },
      {
        slug: "performance-and-optimization",
        title: "Performance & Optimization",
        blurb: "Benchmarking with bun test, where Bun is fast, hot paths, startup time, and production profiling.",
        further: [
          ref("bench (bun test --bench style)", "https://bun.com/docs/cli/test"),
          ref("Bun performance", "https://bun.com/docs"),
          ref("Node profiling (applies to Bun)", "https://nodejs.org/en/learn/getting-started/profiling"),
        ],
      },
    ],
  },

  // ──────────────────────────────────────────────── Web Development ──
  {
    id: "web",
    title: "Web Development",
    icon: "🌐",
    tagline: "HTML, CSS, JavaScript, TypeScript, APIs, accessibility, and modern PWAs end to end.",
    accent: "#f472b6",
    lessons: [
      {
        slug: "html-fundamentals",
        title: "HTML Fundamentals",
        blurb: "Document structure, semantic elements, forms, links, media, and metadata that matters.",
        further: [
          ref("HTML elements reference (MDN)", "https://developer.mozilla.org/en-US/docs/Web/HTML/Element"),
          ref("Structuring content (MDN)", "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content"),
        ],
      },
      {
        slug: "css-fundamentals",
        title: "CSS Fundamentals",
        blurb: "The box model, selectors & specificity, Flexbox, Grid, custom properties, and modern layout.",
        further: [
          ref("CSS reference (MDN)", "https://developer.mozilla.org/en-US/docs/Web/CSS/Reference"),
          ref("A Complete Guide to Flexbox", "https://css-tricks.com/snippets/css/a-guide-to-flexbox/"),
          ref("A Complete Guide to Grid", "https://css-tricks.com/snippets/css/complete-guide-grid/"),
        ],
      },
      {
        slug: "javascript-fundamentals",
        title: "JavaScript Fundamentals",
        blurb: "Values & types, functions & closures, the event loop, promises/async-await, modules, the DOM.",
        further: [
          ref("JavaScript guide (MDN)", "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide"),
          ref("The event loop", "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Event_loop"),
        ],
      },
      {
        slug: "typescript-basics",
        title: "TypeScript Basics",
        blurb: "Types, interfaces, unions & narrowing, generics, and configuring the compiler for the web.",
        further: [
          ref("TypeScript handbook", "https://www.typescriptlang.org/docs/handbook/intro.html"),
          ref("TS for JS programmers", "https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes.html"),
        ],
      },
      {
        slug: "http-and-apis",
        title: "HTTP & APIs",
        blurb: "The request/response model, methods, status codes, headers, REST, fetch, CORS, and JSON.",
        further: [
          ref("HTTP overview (MDN)", "https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview"),
          ref("Using Fetch (MDN)", "https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch"),
          ref("CORS (MDN)", "https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS"),
        ],
      },
      {
        slug: "forms-and-validation",
        title: "Forms & Validation",
        blurb: "Form controls, native constraint validation, the Constraint Validation API, and server checks.",
        further: [
          ref("Client-side form validation (MDN)", "https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Forms/Form_validation"),
          ref("Constraint Validation API", "https://developer.mozilla.org/en-US/docs/Web/API/Constraint_validation"),
        ],
      },
      {
        slug: "accessibility",
        title: "Accessibility",
        blurb: "Semantic HTML, ARIA, keyboard navigation, focus management, contrast, and screen readers.",
        further: [
          ref("Accessibility (MDN)", "https://developer.mozilla.org/en-US/docs/Web/Accessibility"),
          ref("WCAG 2.2 quick reference", "https://www.w3.org/WAI/WCAG22/quickref/"),
          ref("ARIA Authoring Practices", "https://www.w3.org/WAI/ARIA/apg/"),
        ],
      },
      {
        slug: "responsive-design",
        title: "Responsive Design",
        blurb: "The viewport, fluid layouts, media & container queries, responsive images, and mobile-first.",
        further: [
          ref("Responsive design (MDN)", "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout/Responsive_Design"),
          ref("Container queries (MDN)", "https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_queries"),
        ],
      },
      {
        slug: "browser-storage",
        title: "Browser Storage",
        blurb: "localStorage & sessionStorage, cookies, IndexedDB, the Cache API, and when to use each.",
        further: [
          ref("Web Storage API (MDN)", "https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API"),
          ref("IndexedDB (MDN)", "https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API"),
        ],
      },
      {
        slug: "progressive-web-apps",
        title: "Progressive Web Apps",
        blurb: "What makes an app a PWA: installability, the manifest, offline-first, and the install prompt.",
        further: [
          ref("PWA overview (MDN)", "https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps"),
          ref("Learn PWA (web.dev)", "https://web.dev/learn/pwa/"),
          ref("Installation prompt", "https://web.dev/learn/pwa/installation-prompt"),
        ],
      },
      {
        slug: "service-workers-and-offline",
        title: "Service Workers & Offline Caching",
        blurb: "The service-worker lifecycle, caching strategies, offline fallback, and background sync.",
        further: [
          ref("Service Worker API (MDN)", "https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API"),
          ref("Caching strategies (Workbox)", "https://developer.chrome.com/docs/workbox/modules/workbox-strategies"),
          ref("Background Sync", "https://developer.mozilla.org/en-US/docs/Web/API/Background_Synchronization_API"),
        ],
      },
      {
        slug: "web-app-manifests",
        title: "Web App Manifests",
        blurb: "The manifest.webmanifest fields, icons & maskable icons, display modes, and shortcuts.",
        further: [
          ref("Web app manifest (MDN)", "https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest"),
          ref("Maskable icons", "https://web.dev/articles/maskable-icon"),
        ],
      },
      {
        slug: "htmx",
        title: "HTMX",
        blurb: "Hypermedia-driven apps: hx-get/post, swapping, triggers, and server-rendered partials.",
        further: [
          ref("htmx docs", "https://htmx.org/docs/"),
          ref("Hypermedia Systems (book)", "https://hypermedia.systems/"),
        ],
      },
      {
        slug: "datastar",
        title: "Datastar",
        blurb: "Reactive signals + server-sent events: data-* attributes, SSE fragment merging, and gotchas.",
        further: [
          ref("Datastar docs", "https://data-star.dev/"),
          ref("Server-Sent Events (MDN)", "https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events"),
        ],
      },
      {
        slug: "authentication-concepts",
        title: "Authentication Concepts",
        blurb: "Sessions vs tokens, JWT access + refresh rotation, HttpOnly cookies, OAuth2/OIDC, and CSRF.",
        further: [
          ref("OAuth 2.0 (RFC 6749)", "https://datatracker.ietf.org/doc/html/rfc6749"),
          ref("OpenID Connect", "https://openid.net/developers/how-connect-works/"),
          ref("JWT introduction", "https://jwt.io/introduction"),
        ],
      },
      {
        slug: "frontend-backend-integration",
        title: "Frontend / Backend Integration & Deployment",
        blurb: "Wiring a frontend to an API, environment config, build output, and static deployment.",
        further: [
          ref("Deploy static sites (MDN)", "https://developer.mozilla.org/en-US/docs/Learn_web_development/Howto/Tools_and_setup/Deployment"),
          ref("GitHub Pages", "https://docs.github.com/en/pages"),
        ],
      },
      {
        slug: "web-performance",
        title: "Web Performance & Core Web Vitals",
        blurb: "LCP, CLS, INP — what they measure, how to diagnose them, and the fixes: images, fonts, JS, layout stability.",
        further: [
          ref("Core Web Vitals (web.dev)", "https://web.dev/articles/vitals"),
          ref("Optimize LCP", "https://web.dev/articles/optimize-lcp"),
          ref("Optimize CLS", "https://web.dev/articles/optimize-cls"),
          ref("Optimize INP", "https://web.dev/articles/optimize-inp"),
        ],
      },
      {
        slug: "state-management",
        title: "Client-Side State Management",
        blurb: "Local vs shared vs server vs URL state, the observable store pattern, and avoiding over-engineering.",
        further: [
          ref("Thinking in React (state)", "https://react.dev/learn/thinking-in-react"),
          ref("URLSearchParams (MDN)", "https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams"),
        ],
      },
      {
        slug: "testing-web-apps",
        title: "Testing Web Apps",
        blurb: "The testing pyramid for the frontend: unit, component, and end-to-end tests with Playwright.",
        further: [
          ref("Testing Library principles", "https://testing-library.com/docs/guiding-principles/"),
          ref("Playwright", "https://playwright.dev/docs/intro"),
          ref("Vitest", "https://vitest.dev/"),
        ],
      },
      {
        slug: "web-security",
        title: "Web Security",
        blurb: "XSS, CSRF, Content-Security-Policy, security headers, HTTPS/HSTS, and the OWASP Top Ten for the browser.",
        further: [
          ref("OWASP Top Ten", "https://owasp.org/www-project-top-ten/"),
          ref("Content Security Policy (MDN)", "https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP"),
          ref("Web security (MDN)", "https://developer.mozilla.org/en-US/docs/Web/Security"),
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────── Linux ──
  {
    id: "linux",
    title: "Linux",
    icon: "🐧",
    tagline: "The command line that runs every server: shell, permissions, processes, networking, scripting.",
    accent: "#f0b429",
    lessons: [
      {
        slug: "shell-basics",
        title: "Shell Basics",
        blurb: "Navigating the filesystem, creating & moving files, viewing content, wildcards, and redirection.",
        further: [
          ref("The Linux command line (book)", "https://linuxcommand.org/tlcl.php"),
          ref("Bash manual", "https://www.gnu.org/software/bash/manual/bash.html"),
        ],
      },
      {
        slug: "filesystem-layout",
        title: "Filesystem Layout",
        blurb: "The FHS: / , /etc, /var, /usr, /home, /tmp, /proc — where things live and why.",
        further: [
          ref("Filesystem Hierarchy Standard", "https://refspecs.linuxfoundation.org/FHS_3.0/fhs/index.html"),
        ],
      },
      {
        slug: "permissions",
        title: "Permissions",
        blurb: "rwx bits, octal notation, chmod/chown, umask, setuid/setgid, and the sticky bit.",
        further: [
          ref("chmod (man)", "https://man7.org/linux/man-pages/man1/chmod.1.html"),
          ref("Permissions explained", "https://wiki.archlinux.org/title/File_permissions_and_attributes"),
        ],
      },
      {
        slug: "users-and-groups",
        title: "Users & Groups",
        blurb: "/etc/passwd & /etc/group, useradd/usermod, sudo, and the principle of least privilege.",
        further: [
          ref("Users and groups (Arch wiki)", "https://wiki.archlinux.org/title/users_and_groups"),
          ref("sudoers (man)", "https://man7.org/linux/man-pages/man5/sudoers.5.html"),
        ],
      },
      {
        slug: "processes-and-services",
        title: "Processes & Services",
        blurb: "ps, top/htop, signals & kill, jobs & background, and managing services with systemctl.",
        further: [
          ref("systemctl (man)", "https://man7.org/linux/man-pages/man1/systemctl.1.html"),
          ref("Signals (man)", "https://man7.org/linux/man-pages/man7/signal.7.html"),
        ],
      },
      {
        slug: "package-managers",
        title: "Package Managers",
        blurb: "apt, dnf/yum, and pacman: install, update, search, remove, and repositories.",
        further: [
          ref("apt (man)", "https://man7.org/linux/man-pages/man8/apt.8.html"),
          ref("dnf docs", "https://dnf.readthedocs.io/en/latest/"),
        ],
      },
      {
        slug: "environment-variables",
        title: "Environment Variables",
        blurb: "export, PATH, shell startup files, per-process env, and persisting configuration.",
        further: [
          ref("Environment variables (Arch wiki)", "https://wiki.archlinux.org/title/Environment_variables"),
        ],
      },
      {
        slug: "networking-commands",
        title: "Networking Commands",
        blurb: "ip/ifconfig, ping, curl & wget, ss/netstat, dig/nslookup, and reading /etc/hosts.",
        further: [
          ref("ip (man)", "https://man7.org/linux/man-pages/man8/ip.8.html"),
          ref("curl docs", "https://curl.se/docs/"),
        ],
      },
      {
        slug: "ssh",
        title: "SSH",
        blurb: "Key pairs, ssh-keygen, authorized_keys, config, agent forwarding, tunnels, and scp/rsync.",
        further: [
          ref("OpenSSH manual", "https://www.openssh.com/manual.html"),
          ref("ssh_config (man)", "https://man7.org/linux/man-pages/man5/ssh_config.5.html"),
        ],
      },
      {
        slug: "logs",
        title: "Logs",
        blurb: "journalctl, /var/log, tail -f, grep patterns, and log rotation with logrotate.",
        further: [
          ref("journalctl (man)", "https://man7.org/linux/man-pages/man1/journalctl.1.html"),
          ref("logrotate (man)", "https://man7.org/linux/man-pages/man8/logrotate.8.html"),
        ],
      },
      {
        slug: "cron-and-systemd-timers",
        title: "Cron & systemd Timers",
        blurb: "crontab syntax, @reboot, and the modern alternative: systemd service + timer units.",
        further: [
          ref("crontab (man)", "https://man7.org/linux/man-pages/man5/crontab.5.html"),
          ref("systemd.timer (man)", "https://man7.org/linux/man-pages/man5/systemd.timer.5.html"),
        ],
      },
      {
        slug: "bash-scripting",
        title: "Bash Scripting Basics",
        blurb: "Shebangs, variables & quoting, conditionals, loops, functions, arguments, and set -euo pipefail.",
        further: [
          ref("Bash manual", "https://www.gnu.org/software/bash/manual/bash.html"),
          ref("ShellCheck", "https://www.shellcheck.net/"),
        ],
      },
      {
        slug: "troubleshooting",
        title: "Troubleshooting Workflow",
        blurb: "A systematic method: is it up? reachable? resourced? logged? — plus the tools to answer each.",
        further: [
          ref("USE Method (Brendan Gregg)", "https://www.brendangregg.com/usemethod.html"),
        ],
      },
    ],
  },

  // ────────────────────────────────────────────────────────── DevOps ──
  {
    id: "devops",
    title: "DevOps",
    icon: "🔁",
    tagline: "Ship software reliably: Git, CI/CD, containers, Kubernetes, IaC, cloud, and observability.",
    accent: "#38bdf8",
    lessons: [
      {
        slug: "devops-mindset",
        title: "The DevOps Mindset",
        blurb: "Culture over tools: feedback loops, shared ownership, automation, and the CALMS/DORA lenses.",
        further: [
          ref("DORA / State of DevOps", "https://dora.dev/"),
          ref("The DevOps Handbook", "https://itrevolution.com/product/the-devops-handbook/"),
        ],
      },
      {
        slug: "git-workflows",
        title: "Git Workflows",
        blurb: "Branches, commits & PRs, trunk-based vs GitFlow, rebasing, and safe rollbacks.",
        further: [
          ref("Pro Git (book)", "https://git-scm.com/book/en/v2"),
          ref("Trunk-based development", "https://trunkbaseddevelopment.com/"),
        ],
      },
      {
        slug: "cicd-concepts",
        title: "CI/CD Concepts",
        blurb: "Continuous integration vs delivery vs deployment, pipelines, artifacts, and environments.",
        further: [
          ref("Continuous delivery (Fowler)", "https://martinfowler.com/bliki/ContinuousDelivery.html"),
        ],
      },
      {
        slug: "github-actions",
        title: "GitHub Actions",
        blurb: "Workflows, jobs & steps, triggers, matrix builds, secrets, caching, and reusable actions.",
        further: [
          ref("GitHub Actions docs", "https://docs.github.com/en/actions"),
          ref("Workflow syntax", "https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions"),
        ],
      },
      {
        slug: "docker",
        title: "Docker",
        blurb: "Images vs containers, Dockerfiles, multi-stage builds & BuildKit, volumes, networks, registries.",
        further: [
          ref("Docker docs", "https://docs.docker.com/"),
          ref("Dockerfile reference", "https://docs.docker.com/reference/dockerfile/"),
          ref("Build best practices", "https://docs.docker.com/build/building/best-practices/"),
        ],
      },
      {
        slug: "docker-compose",
        title: "Docker Compose",
        blurb: "The compose file, services, networks & volumes, env & profiles, and Compose v2 commands.",
        further: [
          ref("Compose docs", "https://docs.docker.com/compose/"),
          ref("Compose file reference", "https://docs.docker.com/reference/compose-file/"),
        ],
      },
      {
        slug: "kubernetes-basics",
        title: "Kubernetes Basics",
        blurb: "Cluster anatomy, Pods, Deployments, Services, Ingress, ConfigMaps/Secrets, Helm, autoscaling.",
        further: [
          ref("Kubernetes docs", "https://kubernetes.io/docs/home/"),
          ref("Kubernetes basics tutorial", "https://kubernetes.io/docs/tutorials/kubernetes-basics/"),
          ref("Helm docs", "https://helm.sh/docs/"),
        ],
      },
      {
        slug: "reverse-proxies",
        title: "Reverse Proxies",
        blurb: "Why a reverse proxy, Nginx & HAProxy & Traefik, load balancing, and L4 vs L7.",
        further: [
          ref("Traefik docs", "https://doc.traefik.io/traefik/"),
          ref("Nginx reverse proxy", "https://docs.nginx.com/nginx/admin-guide/web-server/reverse-proxy/"),
        ],
      },
      {
        slug: "tls-and-domains",
        title: "TLS & Domains",
        blurb: "DNS records, how TLS works, Let's Encrypt & ACME, certificates, and wiring a domain to a server.",
        further: [
          ref("Let's Encrypt how it works", "https://letsencrypt.org/how-it-works/"),
          ref("How HTTPS works (MDN TLS)", "https://developer.mozilla.org/en-US/docs/Web/Security/Transport_Layer_Security"),
        ],
      },
      {
        slug: "cloud-basics",
        title: "Cloud Basics (AWS)",
        blurb: "Regions & AZs, VPC networking, load balancers (ALB/NLB), DNS, and core managed services.",
        further: [
          ref("AWS documentation", "https://docs.aws.amazon.com/"),
          ref("Elastic Load Balancing", "https://docs.aws.amazon.com/elasticloadbalancing/"),
        ],
      },
      {
        slug: "infrastructure-as-code",
        title: "Infrastructure as Code",
        blurb: "Terraform providers, the init/plan/apply loop, state & locking, modules, and workspaces.",
        further: [
          ref("Terraform docs", "https://developer.hashicorp.com/terraform/docs"),
          ref("Terraform tutorials", "https://developer.hashicorp.com/terraform/tutorials"),
        ],
      },
      {
        slug: "monitoring-and-logging",
        title: "Monitoring & Logging",
        blurb: "The three pillars — metrics, logs, traces — with Prometheus, Grafana, Loki, and OpenTelemetry.",
        further: [
          ref("Prometheus docs", "https://prometheus.io/docs/introduction/overview/"),
          ref("Grafana docs", "https://grafana.com/docs/grafana/latest/"),
          ref("OpenTelemetry docs", "https://opentelemetry.io/docs/"),
        ],
      },
      {
        slug: "gitops",
        title: "GitOps",
        blurb: "Git as the source of truth, pull-based delivery with Flux, and reconciliation loops.",
        further: [
          ref("GitOps principles (OpenGitOps)", "https://opengitops.dev/"),
          ref("Flux docs", "https://fluxcd.io/flux/"),
        ],
      },
      {
        slug: "security-basics",
        title: "Security Basics",
        blurb: "Least privilege, secrets management, image scanning, supply-chain, and hardening checklists.",
        further: [
          ref("OWASP Top Ten", "https://owasp.org/www-project-top-ten/"),
          ref("CIS Benchmarks", "https://www.cisecurity.org/cis-benchmarks"),
        ],
      },
      {
        slug: "deployment-strategies",
        title: "Deployment Strategies",
        blurb: "Rolling, blue/green, canary, and feature flags — plus how to roll back safely.",
        further: [
          ref("Deployment strategies (Kubernetes)", "https://kubernetes.io/docs/concepts/workloads/controllers/deployment/#deployment-strategy"),
        ],
      },
      {
        slug: "incident-response",
        title: "Incident Response",
        blurb: "On-call, severity levels, runbooks, blameless postmortems, and SLOs/error budgets.",
        further: [
          ref("Google SRE: Managing incidents", "https://sre.google/sre-book/managing-incidents/"),
          ref("Postmortem culture", "https://sre.google/sre-book/postmortem-culture/"),
        ],
      },
      {
        slug: "advanced-kubernetes",
        title: "Advanced Kubernetes",
        blurb: "Probes, resource requests/limits, HPA autoscaling, affinity & taints, PodDisruptionBudgets, and operators.",
        further: [
          ref("Configure liveness/readiness probes", "https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/"),
          ref("Horizontal Pod Autoscaler", "https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/"),
          ref("Resource management", "https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/"),
          ref("Operator pattern", "https://kubernetes.io/docs/concepts/extend-kubernetes/operator/"),
        ],
      },
      {
        slug: "secrets-management",
        title: "Secrets Management",
        blurb: "Why env/Git are not enough: Vault, External Secrets, Sealed Secrets, OIDC federation, and rotation.",
        further: [
          ref("HashiCorp Vault docs", "https://developer.hashicorp.com/vault/docs"),
          ref("External Secrets Operator", "https://external-secrets.io/latest/"),
          ref("Sealed Secrets", "https://github.com/bitnami-labs/sealed-secrets"),
          ref("GitHub OIDC in Actions", "https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect"),
        ],
      },
      {
        slug: "observability-deep-dive",
        title: "Observability Deep Dive",
        blurb: "Structured logging, PromQL, RED/USE methods, OpenTelemetry instrumentation, SLO-based alerting, and dashboards.",
        further: [
          ref("PromQL basics", "https://prometheus.io/docs/prometheus/latest/querying/basics/"),
          ref("OpenTelemetry instrumentation", "https://opentelemetry.io/docs/concepts/instrumentation/"),
          ref("RED method", "https://grafana.com/blog/2018/08/02/the-red-method-how-to-instrument-your-services/"),
          ref("Alerting on SLOs (Google SRE)", "https://sre.google/workbook/alerting-on-slos/"),
        ],
      },
      {
        slug: "chaos-engineering",
        title: "Chaos Engineering & Resilience",
        blurb: "Deliberately injecting failure to build confidence: hypotheses, blast radius, game days, and resilience patterns.",
        further: [
          ref("Principles of Chaos Engineering", "https://principlesofchaos.org/"),
          ref("Chaos Mesh", "https://chaos-mesh.org/docs/"),
          ref("Resilience patterns (circuit breaker)", "https://martinfowler.com/bliki/CircuitBreaker.html"),
        ],
      },
    ],
  },
];

// ── Derived helpers (used by the generator, search, and service worker) ──

/** Flat, ordered list of every lesson with its section attached. */
export function allLessons() {
  const out = [];
  for (const section of SECTIONS) {
    section.lessons.forEach((lesson, i) => {
      out.push({ ...lesson, section, index: i });
    });
  }
  return out;
}

/** The output path (relative to docs/) for a lesson page. */
export function lessonPath(sectionId, slug) {
  return `${sectionId}/${slug}.html`;
}

/** The content fragment path (relative to project root) for a lesson. */
export function contentPath(sectionId, slug) {
  return `content/${sectionId}/${slug}.html`;
}

/** Total lesson count across all sections. */
export function lessonCount() {
  return SECTIONS.reduce((n, s) => n + s.lessons.length, 0);
}
