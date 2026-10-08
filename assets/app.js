/* ──────────────────────────────────────────────────────────────────────────
   Tutorials PWA — shared client script (loaded on every page)
   No framework, no dependencies. All state is in localStorage so the whole
   site works offline after the service worker has cached it.
   ────────────────────────────────────────────────────────────────────────── */
(function () {
  "use strict";

  // Resolve the site base ("" at root, "../" one level deep) from a data attr
  // set on <html>, so links work both at the dashboard and inside a section.
  var BASE = document.documentElement.getAttribute("data-base") || "";

  // ── Storage keys ──
  var K = {
    theme: "tut.theme",
    done: "tut.completed",     // { "section/slug": true }
    marks: "tut.bookmarks",    // { "section/slug": true }
  };

  function load(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) || fallback; }
    catch (e) { return fallback; }
  }
  function save(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
  }

  // ── Theme ──────────────────────────────────────────────────────────────
  function applyTheme(t) {
    document.documentElement.setAttribute("data-theme", t);
    try { localStorage.setItem(K.theme, t); } catch (e) {}
    var btn = document.getElementById("theme-btn");
    if (btn) {
      btn.textContent = t === "dark" ? "☀️ Light" : "🌙 Dark";
      btn.setAttribute("aria-label", "Switch to " + (t === "dark" ? "light" : "dark") + " theme");
    }
  }
  function initTheme() {
    var saved;
    try { saved = localStorage.getItem(K.theme); } catch (e) {}
    applyTheme(saved || "dark");
    var btn = document.getElementById("theme-btn");
    if (btn) btn.addEventListener("click", function () {
      var cur = document.documentElement.getAttribute("data-theme");
      applyTheme(cur === "dark" ? "light" : "dark");
    });
  }

  // ── Copy buttons on code blocks ─────────────────────────────────────────
  function initCopyButtons() {
    document.querySelectorAll("pre").forEach(function (pre) {
      if (pre.querySelector(".copy")) return;
      var b = document.createElement("button");
      b.className = "copy"; b.type = "button"; b.textContent = "Copy";
      b.setAttribute("aria-label", "Copy code to clipboard");
      b.addEventListener("click", function () {
        var codeEl = pre.querySelector("code");
        var text = (codeEl ? codeEl.innerText : pre.innerText).replace(/\n?Copy$/, "");
        var done = function () { b.textContent = "Copied!"; setTimeout(function () { b.textContent = "Copy"; }, 1500); };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(done, fallback);
        } else { fallback(); }
        function fallback() {
          try {
            var ta = document.createElement("textarea");
            ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
            document.body.appendChild(ta); ta.select(); document.execCommand("copy");
            document.body.removeChild(ta); done();
          } catch (e) {}
        }
      });
      pre.appendChild(b);
    });
  }

  // ── Progress API (completion + bookmarks) ───────────────────────────────
  var Progress = {
    completed: function () { return load(K.done, {}); },
    bookmarks: function () { return load(K.marks, {}); },
    isDone: function (id) { return !!this.completed()[id]; },
    isMarked: function (id) { return !!this.bookmarks()[id]; },
    toggleDone: function (id) {
      var m = this.completed();
      if (m[id]) delete m[id]; else m[id] = true;
      save(K.done, m); return !!m[id];
    },
    toggleMark: function (id) {
      var m = this.bookmarks();
      if (m[id]) delete m[id]; else m[id] = true;
      save(K.marks, m); return !!m[id];
    },
    countDoneIn: function (ids) {
      var done = this.completed(), n = 0;
      ids.forEach(function (id) { if (done[id]) n++; });
      return n;
    },
  };
  window.TutProgress = Progress;

  // ── Lesson toolbar wiring (present only on lesson pages) ────────────────
  function initLessonTools() {
    var tools = document.querySelector("[data-lesson-id]");
    if (!tools) return;
    var id = tools.getAttribute("data-lesson-id");
    var doneBtn = document.getElementById("done-btn");
    var markBtn = document.getElementById("mark-btn");

    function paintDone() {
      var on = Progress.isDone(id);
      doneBtn.setAttribute("aria-pressed", on ? "true" : "false");
      doneBtn.textContent = on ? "✓ Completed" : "○ Mark complete";
    }
    function paintMark() {
      var on = Progress.isMarked(id);
      markBtn.setAttribute("aria-pressed", on ? "true" : "false");
      markBtn.textContent = on ? "★ Bookmarked" : "☆ Bookmark";
    }
    if (doneBtn) { paintDone(); doneBtn.addEventListener("click", function () { Progress.toggleDone(id); paintDone(); }); }
    if (markBtn) { paintMark(); markBtn.addEventListener("click", function () { Progress.toggleMark(id); paintMark(); }); }
  }

  // ── Dashboard / section progress bars ───────────────────────────────────
  function initProgressBars() {
    document.querySelectorAll("[data-progress-ids]").forEach(function (el) {
      var ids = (el.getAttribute("data-progress-ids") || "").split(",").filter(Boolean);
      if (!ids.length) return;
      var done = Progress.countDoneIn(ids);
      var pct = Math.round((done / ids.length) * 100);
      var fill = el.querySelector(".bar > span");
      var count = el.querySelector(".count, .label");
      if (fill) fill.style.width = pct + "%";
      if (count) count.textContent = done + " / " + ids.length + " done";
    });
  }

  // ── Section-page lesson state icons ─────────────────────────────────────
  function initLessonStates() {
    document.querySelectorAll(".lesson-list [data-id]").forEach(function (a) {
      var id = a.getAttribute("data-id");
      var state = a.querySelector(".state");
      if (!state) return;
      if (Progress.isDone(id)) { state.textContent = "✓"; state.title = "Completed"; state.style.color = "var(--ok)"; }
      else if (Progress.isMarked(id)) { state.textContent = "★"; state.title = "Bookmarked"; state.style.color = "var(--warn)"; }
      else { state.textContent = ""; }
    });
  }

  // ── Search (over a precached search-index.json) ─────────────────────────
  function initSearch() {
    var input = document.getElementById("search-input");
    var results = document.getElementById("search-results");
    if (!input || !results) return;

    var INDEX = [];
    fetch(BASE + "search-index.json").then(function (r) { return r.json(); })
      .then(function (data) { INDEX = data; runQuery(input.value); })
      .catch(function () { results.innerHTML = '<li class="search-empty">Search index unavailable offline until first visit.</li>'; });

    function esc(s) { return s.replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
    function highlight(text, q) {
      if (!q) return esc(text);
      var i = text.toLowerCase().indexOf(q.toLowerCase());
      if (i < 0) return esc(text);
      return esc(text.slice(0, i)) + "<mark>" + esc(text.slice(i, i + q.length)) + "</mark>" + esc(text.slice(i + q.length));
    }

    function runQuery(q) {
      q = (q || "").trim();
      if (!q) { results.innerHTML = ""; return; }
      var terms = q.toLowerCase().split(/\s+/);
      var hits = INDEX.map(function (item) {
        var hay = (item.title + " " + item.section + " " + item.blurb + " " + (item.keywords || "")).toLowerCase();
        var score = 0;
        terms.forEach(function (t) {
          if (item.title.toLowerCase().indexOf(t) >= 0) score += 5;
          if (item.section.toLowerCase().indexOf(t) >= 0) score += 2;
          if (hay.indexOf(t) >= 0) score += 1;
        });
        return { item: item, score: score };
      }).filter(function (h) { return h.score > 0; })
        .sort(function (a, b) { return b.score - a.score; })
        .slice(0, 30);

      if (!hits.length) { results.innerHTML = '<li class="search-empty">No lessons match “' + esc(q) + '”.</li>'; return; }
      results.innerHTML = hits.map(function (h) {
        var it = h.item;
        return '<li><a href="' + BASE + it.url + '"><span class="sec">' + esc(it.sectionIcon + " " + it.section) + '</span><br><strong>' +
          highlight(it.title, q) + '</strong><br><span class="desc" style="color:var(--muted);font-size:.9rem">' + esc(it.blurb) + "</span></a></li>";
      }).join("");
    }

    var t;
    input.addEventListener("input", function () { clearTimeout(t); t = setTimeout(function () { runQuery(input.value); }, 120); });
    input.focus();
  }

  // ── "↑ Top" FAB ─────────────────────────────────────────────────────────
  function initTopFab() {
    var fab = document.getElementById("fab-top");
    if (!fab) return;
    fab.addEventListener("click", function () {
      var el = document.scrollingElement || document.documentElement || document.body;
      try { window.scrollTo({ top: 0, left: 0, behavior: "smooth" }); } catch (e) { window.scrollTo(0, 0); }
      if (el.scrollTop > 0) el.scrollTop = 0;
    });
  }

  // ── Service worker + install prompt + update/offline banners ────────────
  function initPWA() {
    // Offline banner reflecting connectivity.
    var offline = document.getElementById("offline-banner");
    function paintOnline() { if (offline) offline.classList.toggle("show", !navigator.onLine); }
    window.addEventListener("online", paintOnline);
    window.addEventListener("offline", paintOnline);
    paintOnline();

    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register(BASE + "sw.js").then(function (reg) {
      // Detect an updated SW waiting to activate.
      function watch(worker) {
        if (!worker) return;
        worker.addEventListener("statechange", function () {
          if (worker.state === "installed" && navigator.serviceWorker.controller) {
            showUpdate(reg);
          }
        });
      }
      watch(reg.waiting);
      reg.addEventListener("updatefound", function () { watch(reg.installing); });
    }).catch(function () {});

    var refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", function () {
      if (refreshing) return; refreshing = true; window.location.reload();
    });

    function showUpdate(reg) {
      var banner = document.getElementById("update-banner");
      if (!banner) return;
      banner.classList.add("show");
      var btn = banner.querySelector("button");
      if (btn) btn.addEventListener("click", function () {
        if (reg.waiting) reg.waiting.postMessage({ type: "SKIP_WAITING" });
      });
    }

    // Install prompt.
    var deferred = null;
    var installBtn = document.getElementById("install-btn");
    window.addEventListener("beforeinstallprompt", function (e) {
      e.preventDefault(); deferred = e;
      if (installBtn) installBtn.style.display = "inline-flex";
    });
    if (installBtn) installBtn.addEventListener("click", function () {
      if (!deferred) return;
      deferred.prompt();
      deferred.userChoice.finally(function () { deferred = null; installBtn.style.display = "none"; });
    });
    window.addEventListener("appinstalled", function () { if (installBtn) installBtn.style.display = "none"; });
  }

  // ── Boot ─────────────────────────────────────────────────────────────────
  function boot() {
    initTheme();
    initCopyButtons();
    initLessonTools();
    initProgressBars();
    initLessonStates();
    initSearch();
    initTopFab();
    initPWA();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
