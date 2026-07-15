# Continuous Homepage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the homepage into one continuous scrollable document — illustration → intro → Bonheur → 3 placeholder projects — with a left-edge dot-nav, per `docs/superpowers/specs/2026-07-16-continuous-homepage-design.md`.

**Architecture:** `data/home_sections.yaml` is the single source of truth for section order. `layouts/index.html` renders the illustration and intro directly (fixed position, not data-driven), then loops the data file to dispatch Bonheur (bespoke, relocated content) and placeholders (generic partial) in order. A dot-nav renders one dot per data entry and an `IntersectionObserver`-based controller (`home-sections.js`) handles scroll-triggered reveals, dot-nav visibility/active-state, and click-to-jump.

**Tech Stack:** Hugo (Go templates), vanilla CSS, vanilla JS (`IntersectionObserver`, no framework/build step — matches the rest of the site).

## Global Constraints

- Scroll direction is never inverted, anywhere. (spec: "Scroll-direction rule")
- WASD/mouse-look remains the only way to move within the illustration; scrolling never moves the girl. (spec: "Scroll-direction rule")
- Bonheur's rendering stays bespoke — no generic "beat engine." Only placeholders get the generic partial. (spec: "Why Bonheur isn't generalized")
- All `relURL`-eligible links must actually use `relURL` (or the explicit anchor-guard pattern below) — this site deploys under the `/Portfolio/` baseURL subpath, and a bug in this exact class was already hit and fixed once on this branch.
- `prefers-reduced-motion` disables all fades/slides/smooth-scrolling introduced by this plan.
- No automated test suite exists in this repo (confirmed: no test runner, no assertions anywhere in `static/` or `layouts/`). Every task's "test" step is a Hugo build + `grep`/`curl` check against the built output, matching the established pattern from `docs/superpowers/plans/2026-07-08-bonheur-story-page.md`. Task 5 is a manual browser spot-check, not automatable.
- Scratch build directory for all tasks: `/tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop/674ae7f7-a941-4a07-a7ee-c9f4945d9bcd/scratchpad/hugo-build`
- Working directory for all commands: `/mnt/c/Users/SirenDesign/Desktop/Portfolio/.worktrees/bonheur-story-page`

---

### Task 1: Relocate Bonheur into a homepage partial; retire `/work/bonheur/` as a redirect stub

**Files:**
- Create (via move): `layouts/partials/home/bonheur-section.html` (moved from `layouts/work/bonheur-story.html`)
- Modify: `layouts/partials/head.html:45-53`
- Modify: `content/work/bonheur.md` (front matter)
- Create: `layouts/work/redirect.html`

**Interfaces:**
- Produces: `layouts/partials/home/bonheur-section.html`, callable as `{{ partial "home/bonheur-section.html" . }}` (needs `.Site.Data.bonheur_story.beats`, same as before). Renders `<section id="bonheur" class="layout-page bs-page">...</section>` followed by `<script src="{{ "js/bonheur-story.js" | relURL }}" defer></script>`. Not yet called from anywhere — Task 2 wires it in.
- Produces: `/work/bonheur/` now serves a redirect stub via `layouts/work/redirect.html`, meta-refreshing and canonical-linking to `{{ "/" | relURL }}#bonheur`.

- [ ] **Step 1: Move the template into a partial and adjust its wrapper**

```bash
mkdir -p layouts/partials/home
git mv layouts/work/bonheur-story.html layouts/partials/home/bonheur-section.html
sed -i '2d' layouts/partials/home/bonheur-section.html
sed -i '$ d' layouts/partials/home/bonheur-section.html
sed -i '1s#.*#{{/* layouts/partials/home/bonheur-section.html */}}#' layouts/partials/home/bonheur-section.html
sed -i 's#<section class="layout-page bs-page">#<section id="bonheur" class="layout-page bs-page">#' layouts/partials/home/bonheur-section.html
```

This removes the `{{ define "main" }}` line (was line 2) and the trailing `{{ end }}` that closed it (Go templates only need `define`/`end` when populating a named block in `baseof.html` — a plain partial doesn't use one), renames the file-path comment, and tags the outer section with `id="bonheur"` so it's a valid same-page anchor target.

- [ ] **Step 2: Verify the transform**

```bash
head -3 layouts/partials/home/bonheur-section.html
tail -3 layouts/partials/home/bonheur-section.html
grep -c 'define "main"' layouts/partials/home/bonheur-section.html
grep -c 'id="bonheur"' layouts/partials/home/bonheur-section.html
```

Expected: first line is the new comment, third line is `<section id="bonheur" class="layout-page bs-page">`; last three lines end with `<script src="{{ "js/bonheur-story.js" | relURL }}" defer></script>` and no trailing `{{ end }}`; `define "main"` count is `0`; `id="bonheur"` count is `1`.

- [ ] **Step 3: Update `layouts/partials/head.html`** — change the `bonheur-story` layout gate to fire on `.IsHome` instead (Bonheur's fonts/CSS now load with the homepage, not a standalone page), and add a new gate for the redirect stub's meta-refresh + canonical link.

Old (`layouts/partials/head.html:45-53`):
```go-html-template
{{ if .IsHome }}
<link rel="stylesheet" href="{{ "css/explorers-path.css" | relURL }}">
{{ end }}
{{ if eq .Layout "bonheur-story" }}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&family=Literata:ital,wght@0,400;0,500;1,400&family=Space+Mono:wght@400;700&display=swap">
<link rel="stylesheet" href="{{ "css/bonheur-story.css" | relURL }}">
{{ end }}
```

New:
```go-html-template
{{ if .IsHome }}
<link rel="stylesheet" href="{{ "css/explorers-path.css" | relURL }}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&family=Literata:ital,wght@0,400;0,500;1,400&family=Space+Mono:wght@400;700&display=swap">
<link rel="stylesheet" href="{{ "css/bonheur-story.css" | relURL }}">
{{ end }}
{{ if eq .Layout "redirect" }}
<meta http-equiv="refresh" content="0; url={{ "/" | relURL }}#{{ .Params.redirectAnchor }}">
<link rel="canonical" href="{{ "/" | relURL }}">
{{ end }}
```

- [ ] **Step 4: Rewrite `content/work/bonheur.md` as a redirect stub**

Replace the entire file with:
```markdown
+++
title = "Bonheur"
layout = "redirect"
redirectAnchor = "bonheur"

[_build]
  list = false
+++

<!-- This page is a redirect stub. Bonheur's real content now lives inline
     on the homepage (layouts/partials/home/bonheur-section.html), driven
     by data/bonheur_story.yaml. This URL redirects to /#bonheur via
     layouts/work/redirect.html, kept alive for old links/bookmarks. -->
```

- [ ] **Step 5: Create `layouts/work/redirect.html`**

```go-html-template
{{/* layouts/work/redirect.html */}}
{{ define "main" }}
<section class="layout-page">
  <p>
    <a href="{{ "/" | relURL }}#{{ .Params.redirectAnchor }}">Continue to {{ .Title }} →</a>
  </p>
</section>
{{ end }}
```

- [ ] **Step 6: Build and verify**

```bash
cd /mnt/c/Users/SirenDesign/Desktop/Portfolio/.worktrees/bonheur-story-page
rm -rf /tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop/674ae7f7-a941-4a07-a7ee-c9f4945d9bcd/scratchpad/hugo-build
./bin/hugo --minify -d /tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop/674ae7f7-a941-4a07-a7ee-c9f4945d9bcd/scratchpad/hugo-build 2>&1 | tail -20
BUILD=/tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop/674ae7f7-a941-4a07-a7ee-c9f4945d9bcd/scratchpad/hugo-build
grep -o 'http-equiv="refresh" content="0; url=[^"]*"' "$BUILD/work/bonheur/index.html"
grep -c 'rel="canonical" href="/Portfolio/"' "$BUILD/work/bonheur/index.html"
grep -c "Bonheur" "$BUILD/work/index.html"
```

Expected: build succeeds with zero `ERROR` lines. First grep prints `http-equiv="refresh" content="0; url=/Portfolio/#bonheur"` (confirms the baseURL subpath resolved correctly — this is the exact bug class already fixed once on this branch, so it must show `/Portfolio/#bonheur`, not `/#bonheur`). Second grep prints `1`. Third grep prints `0` (the stub no longer appears in the work list, since `_build.list = false`).

- [ ] **Step 7: Commit**

```bash
git add layouts/partials/home/bonheur-section.html layouts/work/redirect.html layouts/partials/head.html content/work/bonheur.md
git commit -m "Relocate Bonheur into a homepage partial; retire /work/bonheur/ as a redirect stub"
```

---

### Task 2: Section-order data file, intro + placeholder partials, homepage assembly

**Files:**
- Create: `data/home_sections.yaml`
- Create: `layouts/partials/home/intro.html`
- Create: `layouts/partials/home/project-placeholder.html`
- Create: `static/css/home-sections.css`
- Modify: `layouts/index.html`
- Modify: `layouts/partials/head.html:45-53` (from Task 1's state)

**Interfaces:**
- Consumes: `layouts/partials/home/bonheur-section.html` from Task 1 (called with no props, needs top-level context `.Site`).
- Produces: `.Site.Data.home_sections` — an ordered list of `{id, kind, label}`, `kind` ∈ `illustration | bonheur | placeholder`. Task 3's dot-nav ranges over this same list.
- Produces: `#intro` section id (Task 3's controller targets it directly). `.reveal-group` / `.reveal-item` / `.reveal-item--1/2/3` CSS class contract (Task 3's JS toggles `.is-visible` on `.reveal-group` elements).

- [ ] **Step 1: Create `data/home_sections.yaml`**

```yaml
- id: ep-viewport
  kind: illustration
  label: "Explorer's Path"
- id: bonheur
  kind: bonheur
  label: "Bonheur"
- id: project-2
  kind: placeholder
  label: "Project 2"
- id: project-3
  kind: placeholder
  label: "Project 3"
- id: project-4
  kind: placeholder
  label: "Project 4"
```

The illustration's `id` is `ep-viewport`, not a fresh name — it must match the real DOM id already set on `.ep-viewport` in `layouts/partials/explorers-path/scene.html` (`id="ep-viewport"`), since that element is what the dot-nav's "back to illustration" dot and the scrollspy observer (Task 3) actually target. Introducing a new id here would point at nothing.

- [ ] **Step 2: Create `layouts/partials/home/intro.html`**

```go-html-template
{{- $hero := .Site.Params.hero -}}
<section id="intro" class="home-section home-intro reveal-group">
  <div class="home-intro__inner">
    <h1 class="home-intro__name reveal-item reveal-item--1">{{ default "Amber Li" $hero.title }}</h1>
    {{ with $hero.badge }}
    <p class="home-intro__badge reveal-item reveal-item--2">{{ . }}</p>
    {{ end }}
    {{ with $hero.summary }}
    <p class="home-intro__summary reveal-item reveal-item--3">{{ . }}</p>
    {{ end }}
  </div>
</section>
```

- [ ] **Step 3: Create `layouts/partials/home/project-placeholder.html`**

Called from within a `range` over `home_sections.yaml`, so `.` is the current entry (`{id, kind, label}`) directly.

```go-html-template
<section id="{{ .id }}" class="home-section home-placeholder reveal-group">
  <div class="home-placeholder__inner">
    <h2 class="home-placeholder__title reveal-item reveal-item--1">{{ .label }}</h2>
    <p class="home-placeholder__status reveal-item reveal-item--2">Content coming soon.</p>
  </div>
</section>
```

- [ ] **Step 4: Create `static/css/home-sections.css`**

```css
/* static/css/home-sections.css */

html {
  scroll-behavior: smooth;
}

.home-section {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4rem 1.5rem;
}

.home-intro,
.home-placeholder {
  min-height: 100vh;
}

.home-intro__inner,
.home-placeholder__inner {
  max-width: 42rem;
  text-align: center;
}

.home-intro__name {
  font-family: var(--font-serif);
  font-size: clamp(2.5rem, 6vw, 4rem);
  color: var(--color-text);
  margin: 0 0 0.75rem;
}

.home-intro__badge {
  font-family: var(--font-mono);
  font-size: 0.85rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-accent);
  margin: 0 0 1.25rem;
}

.home-intro__summary {
  font-family: var(--font-sans);
  font-size: 1.05rem;
  line-height: 1.6;
  color: var(--color-text-muted);
  margin: 0;
}

.home-placeholder__title {
  font-family: var(--font-serif);
  font-size: clamp(1.75rem, 4vw, 2.5rem);
  color: var(--color-text);
  margin: 0 0 0.5rem;
}

.home-placeholder__status {
  font-family: var(--font-sans);
  color: var(--color-text-muted);
  margin: 0;
}

.reveal-item {
  opacity: 0;
  transform: translateY(12px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}

.reveal-item--1 { transition-delay: 0ms; }
.reveal-item--2 { transition-delay: 120ms; }
.reveal-item--3 { transition-delay: 240ms; }

.reveal-group.is-visible .reveal-item {
  opacity: 1;
  transform: translateY(0);
}

@media (prefers-reduced-motion: reduce) {
  html {
    scroll-behavior: auto;
  }

  .reveal-item {
    transition: none;
    opacity: 1;
    transform: none;
  }
}
```

Note: `.reveal-item` defaults to `opacity: 0` — until Task 3 adds the JS that toggles `.is-visible`, this content is present in the HTML (verifiable via `grep`/`curl`) but visually hidden except under `prefers-reduced-motion: reduce`. That's expected at this point in the plan, not a bug.

- [ ] **Step 5: Update `layouts/partials/head.html`** — add the new stylesheet inside the `.IsHome` block from Task 1.

Old (inside the `.IsHome` block, first line):
```go-html-template
{{ if .IsHome }}
<link rel="stylesheet" href="{{ "css/explorers-path.css" | relURL }}">
```

New:
```go-html-template
{{ if .IsHome }}
<link rel="stylesheet" href="{{ "css/explorers-path.css" | relURL }}">
<link rel="stylesheet" href="{{ "css/home-sections.css" | relURL }}">
```

- [ ] **Step 6: Rewrite `layouts/index.html`**

```go-html-template
{{ define "main" }}
  {{ partial "explorers-path/scene.html" . }}
  <script src="{{ "js/explorers-path.js" | relURL }}" defer></script>

  {{ partial "home/intro.html" . }}

  {{ range .Site.Data.home_sections }}
    {{ if eq .kind "bonheur" }}
      {{ partial "home/bonheur-section.html" $ }}
    {{ else if eq .kind "placeholder" }}
      {{ partial "home/project-placeholder.html" . }}
    {{ end }}
  {{ end }}
{{ end }}
```

The illustration is rendered directly (unchanged from before this plan), not from the data loop — it isn't repeatable content, so it doesn't need to be data-driven. The loop only dispatches the two `kind`s that actually repeat/vary: `bonheur` and `placeholder`. `home/bonheur-section.html` is called with `$` (the top-level context, valid inside `range` in Go templates) because it needs `.Site.Data.bonheur_story.beats`; `home/project-placeholder.html` is called with `.` (the current data entry) because it needs `.id`/`.label` directly.

- [ ] **Step 7: Build and verify**

```bash
cd /mnt/c/Users/SirenDesign/Desktop/Portfolio/.worktrees/bonheur-story-page
rm -rf /tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop/674ae7f7-a941-4a07-a7ee-c9f4945d9bcd/scratchpad/hugo-build
./bin/hugo --minify -d /tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop/674ae7f7-a941-4a07-a7ee-c9f4945d9bcd/scratchpad/hugo-build 2>&1 | tail -20
BUILD=/tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop/674ae7f7-a941-4a07-a7ee-c9f4945d9bcd/scratchpad/hugo-build
grep -c 'id="intro"' "$BUILD/index.html"
grep -c 'id="bonheur"' "$BUILD/index.html"
grep -o '>Project 2<\|>Project 3<\|>Project 4<' "$BUILD/index.html"
grep -c 'Amber Li' "$BUILD/index.html"
grep -c 'ep-viewport' "$BUILD/index.html"
```

Expected: build succeeds with zero `ERROR` lines. First grep prints `1`. Second grep prints `1` (Bonheur is now inline on the homepage). Third grep prints all three placeholder titles, one per line. Fourth grep prints at least `1`. Fifth grep prints at least `1` (illustration still present, unchanged).

- [ ] **Step 8: Commit**

```bash
git add data/home_sections.yaml layouts/partials/home/intro.html layouts/partials/home/project-placeholder.html static/css/home-sections.css layouts/index.html layouts/partials/head.html
git commit -m "Assemble the continuous homepage: intro + Bonheur + placeholder sections"
```

---

### Task 3: Dot-nav and the reveal/scrollspy controller

**Files:**
- Create: `layouts/partials/home/dot-nav.html`
- Create: `static/css/dot-nav.css`
- Create: `static/js/home-sections.js`
- Modify: `layouts/index.html`
- Modify: `layouts/partials/head.html:45-53` (from Task 2's state)

**Interfaces:**
- Consumes: `.Site.Data.home_sections` (Task 2), `.reveal-group`/`.reveal-item` classes and `#intro` (Task 2).
- Produces: `#dot-nav` element with one `.dot-nav__dot` anchor per section, `data-dot-target="{id}"` on each. No other task depends on this one's internals.

- [ ] **Step 1: Create `layouts/partials/home/dot-nav.html`**

```go-html-template
<nav class="dot-nav" id="dot-nav" aria-label="Section navigation">
  {{ range .Site.Data.home_sections }}
  <a href="#{{ .id }}" class="dot-nav__dot" data-dot-target="{{ .id }}" aria-label="{{ .label }}">
    <span class="dot-nav__marker" aria-hidden="true"></span>
  </a>
  {{ end }}
</nav>
```

- [ ] **Step 2: Create `static/css/dot-nav.css`**

```css
/* static/css/dot-nav.css */

.dot-nav {
  position: fixed;
  left: 1.5rem;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  z-index: 20;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.4s ease;
}

.dot-nav.is-visible {
  opacity: 1;
  pointer-events: auto;
}

.dot-nav__dot {
  display: block;
  width: 0.6rem;
  height: 0.6rem;
  border-radius: 50%;
  border: 1px solid var(--color-border);
  background: transparent;
  transition: background 0.3s ease, transform 0.3s ease, border-color 0.3s ease;
}

.dot-nav__dot:hover {
  border-color: var(--color-accent);
}

.dot-nav__dot.is-active {
  background: var(--color-accent);
  border-color: var(--color-accent);
  transform: scale(1.3);
}

.dot-nav__marker {
  display: block;
  width: 100%;
  height: 100%;
}

@media (max-width: 640px) {
  .dot-nav {
    left: 0.75rem;
    gap: 0.6rem;
  }

  .dot-nav__dot {
    width: 0.45rem;
    height: 0.45rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .dot-nav,
  .dot-nav__dot {
    transition: none;
  }
}
```

- [ ] **Step 3: Create `static/js/home-sections.js`**

```js
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var revealGroups = Array.prototype.slice.call(document.querySelectorAll(".reveal-group"));
  var dotNav = document.getElementById("dot-nav");
  var introSection = document.getElementById("intro");
  var dots = dotNav ? Array.prototype.slice.call(dotNav.querySelectorAll(".dot-nav__dot")) : [];

  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealGroups.forEach(function (el) {
      el.classList.add("is-visible");
    });
  } else if (revealGroups.length) {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.3 }
    );
    revealGroups.forEach(function (el) {
      revealObserver.observe(el);
    });
  }

  if (dotNav && introSection && "IntersectionObserver" in window) {
    var navVisibilityObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            dotNav.classList.add("is-visible");
          }
        });
      },
      { threshold: 0.3 }
    );
    navVisibilityObserver.observe(introSection);
  }

  if (dots.length) {
    var sectionEls = dots
      .map(function (dot) {
        var id = dot.getAttribute("data-dot-target");
        return { dot: dot, el: document.getElementById(id) };
      })
      .filter(function (pair) {
        return pair.el;
      });

    function setActiveDot(id) {
      dots.forEach(function (dot) {
        dot.classList.toggle("is-active", dot.getAttribute("data-dot-target") === id);
      });
    }

    if ("IntersectionObserver" in window && sectionEls.length) {
      var activeObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              setActiveDot(entry.target.id);
            }
          });
        },
        { threshold: 0.5 }
      );
      sectionEls.forEach(function (pair) {
        activeObserver.observe(pair.el);
      });
    }

    dots.forEach(function (dot) {
      dot.addEventListener("click", function (event) {
        var id = dot.getAttribute("data-dot-target");
        var target = document.getElementById(id);
        if (!target) {
          return;
        }
        event.preventDefault();
        target.scrollIntoView({
          behavior: reduceMotion ? "auto" : "smooth",
          block: "start",
        });
      });
    });
  }
})();
```

- [ ] **Step 4: Update `layouts/partials/head.html`** — add `dot-nav.css` inside the `.IsHome` block, after `home-sections.css`.

Old:
```go-html-template
<link rel="stylesheet" href="{{ "css/explorers-path.css" | relURL }}">
<link rel="stylesheet" href="{{ "css/home-sections.css" | relURL }}">
```

New:
```go-html-template
<link rel="stylesheet" href="{{ "css/explorers-path.css" | relURL }}">
<link rel="stylesheet" href="{{ "css/home-sections.css" | relURL }}">
<link rel="stylesheet" href="{{ "css/dot-nav.css" | relURL }}">
```

- [ ] **Step 5: Update `layouts/index.html`** — add the dot-nav partial and its script, at the end of `main`.

Old (end of file):
```go-html-template
  {{ range .Site.Data.home_sections }}
    {{ if eq .kind "bonheur" }}
      {{ partial "home/bonheur-section.html" $ }}
    {{ else if eq .kind "placeholder" }}
      {{ partial "home/project-placeholder.html" . }}
    {{ end }}
  {{ end }}
{{ end }}
```

New:
```go-html-template
  {{ range .Site.Data.home_sections }}
    {{ if eq .kind "bonheur" }}
      {{ partial "home/bonheur-section.html" $ }}
    {{ else if eq .kind "placeholder" }}
      {{ partial "home/project-placeholder.html" . }}
    {{ end }}
  {{ end }}

  {{ partial "home/dot-nav.html" . }}
  <script src="{{ "js/home-sections.js" | relURL }}" defer></script>
{{ end }}
```

- [ ] **Step 6: Build and verify**

```bash
cd /mnt/c/Users/SirenDesign/Desktop/Portfolio/.worktrees/bonheur-story-page
rm -rf /tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop/674ae7f7-a941-4a07-a7ee-c9f4945d9bcd/scratchpad/hugo-build
./bin/hugo --minify -d /tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop/674ae7f7-a941-4a07-a7ee-c9f4945d9bcd/scratchpad/hugo-build 2>&1 | tail -20
BUILD=/tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop/674ae7f7-a941-4a07-a7ee-c9f4945d9bcd/scratchpad/hugo-build
grep -c 'id="dot-nav"' "$BUILD/index.html"
grep -c 'data-dot-target=' "$BUILD/index.html"
grep -c 'js/home-sections.js' "$BUILD/index.html"
```

Expected: build succeeds with zero `ERROR` lines. First grep prints `1`. Second grep prints `5` (one dot per `home_sections.yaml` entry). Third grep prints `1`.

- [ ] **Step 7: Commit**

```bash
git add layouts/partials/home/dot-nav.html static/css/dot-nav.css static/js/home-sections.js layouts/index.html layouts/partials/head.html
git commit -m "Add the left-edge dot-nav and the reveal/scrollspy controller"
```

---

### Task 4: Bonheur hotspot → same-page anchor

**Files:**
- Modify: `data/explorers_path.yaml`
- Modify: `layouts/partials/explorers-path/scene.html:39,61`
- Modify: `static/js/explorers-path.js`

**Interfaces:**
- Consumes: `#bonheur` (Task 1/2 — the relocated section's id).
- Produces: nothing new consumed by later tasks.

- [ ] **Step 1: Update `data/explorers_path.yaml`** — change the `now-case-study-1` hotspot's `workRef`.

Old:
```yaml
    workRef: "work/bonheur/"
```

New:
```yaml
    workRef: "#bonheur"
```

- [ ] **Step 2: Update `layouts/partials/explorers-path/scene.html`** — both `workRef` link call sites (lines 39 and 61) skip `relURL` for anchor values, and get a shared class so the panel can be closed on click.

Old (line 39):
```go-html-template
        <a href="{{ .workRef | relURL }}" class="btn-primary btn-primary-sm">View the case study →</a>
```

New (line 39):
```go-html-template
        <a href="{{ if hasPrefix .workRef "#" }}{{ .workRef }}{{ else }}{{ .workRef | relURL }}{{ end }}" class="ep-panel-case-study-link btn-primary btn-primary-sm">View the case study →</a>
```

Old (line 61):
```go-html-template
        <a href="{{ .workRef | relURL }}">View the case study →</a>
```

New (line 61):
```go-html-template
        <a href="{{ if hasPrefix .workRef "#" }}{{ .workRef }}{{ else }}{{ .workRef | relURL }}{{ end }}" class="ep-panel-case-study-link">View the case study →</a>
```

`relURL` is meant for site-relative paths; its behavior on a bare `#fragment` isn't something to rely on unverified, so both sites explicitly skip it for anchor values while still using it for any future non-anchor `workRef`.

- [ ] **Step 3: Update `static/js/explorers-path.js`** — close the hotspot panel when a same-page case-study link is clicked, so the panel doesn't stay open over the page as it scrolls to `#bonheur`.

Find this existing block (around line 341, where the panel's own close button is wired):
```js
    panelClose.addEventListener("click", closePanel);
```

Add immediately after it:
```js
    Array.prototype.slice.call(document.querySelectorAll(".ep-panel-case-study-link")).forEach(function (link) {
      link.addEventListener("click", function () {
        if (link.getAttribute("href").charAt(0) === "#") {
          closePanel();
        }
      });
    });
```

This reuses the existing `closePanel` function already defined in the same closure. It only fires for same-page anchor links (guarded by the `#` check), so it has no effect if a future hotspot ever uses a real cross-page `workRef`.

- [ ] **Step 4: Build and verify**

```bash
cd /mnt/c/Users/SirenDesign/Desktop/Portfolio/.worktrees/bonheur-story-page
rm -rf /tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop/674ae7f7-a941-4a07-a7ee-c9f4945d9bcd/scratchpad/hugo-build
./bin/hugo --minify -d /tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop/674ae7f7-a941-4a07-a7ee-c9f4945d9bcd/scratchpad/hugo-build 2>&1 | tail -20
BUILD=/tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop/674ae7f7-a941-4a07-a7ee-c9f4945d9bcd/scratchpad/hugo-build
grep -o 'href="#bonheur"[^>]*ep-panel-case-study-link\|ep-panel-case-study-link[^>]*href="#bonheur"' "$BUILD/index.html"
grep -c "ep-panel-case-study-link" static/js/explorers-path.js
```

Expected: build succeeds with zero `ERROR` lines. First grep prints at least one match (the hotspot link now points to `#bonheur`, not a `relURL`-expanded path). Second grep prints `1`.

- [ ] **Step 5: Commit**

```bash
git add data/explorers_path.yaml layouts/partials/explorers-path/scene.html static/js/explorers-path.js
git commit -m "Point the Bonheur hotspot at the same-page anchor instead of a page navigation"
```

---

### Task 5: Full integrated verification

**Files:** none (verification only).

- [ ] **Step 1: Clean build**

```bash
cd /mnt/c/Users/SirenDesign/Desktop/Portfolio/.worktrees/bonheur-story-page
rm -rf /tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop/674ae7f7-a941-4a07-a7ee-c9f4945d9bcd/scratchpad/hugo-build
./bin/hugo --minify -d /tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop/674ae7f7-a941-4a07-a7ee-c9f4945d9bcd/scratchpad/hugo-build 2>&1 | tail -30
```

Expected: zero `ERROR` lines.

- [ ] **Step 2: Restart the local dev server against this worktree and confirm it serves the new homepage**

```bash
pkill -f "bin/hugo server" || true
cd /mnt/c/Users/SirenDesign/Desktop/Portfolio/.worktrees/bonheur-story-page
nohup ./bin/hugo server -D --port 1313 > /tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop/674ae7f7-a941-4a07-a7ee-c9f4945d9bcd/scratchpad/hugo-dev.log 2>&1 &
sleep 3
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:1313/Portfolio/
curl -s http://localhost:1313/Portfolio/ | grep -c 'id="dot-nav"'
```

Expected: `200`, then `1`.

- [ ] **Step 3: Manual browser spot-check** (not automatable — use Playwright or a real browser against `http://localhost:1313/Portfolio/`)

Walk through every item from the spec's Testing section:

1. WASD/mouse-look still moves the girl within the illustration; scrolling (wheel or trackpad, either direction) while the illustration is in view does not move her, and simply scrolls the page toward the intro section.
2. Dot-nav is invisible while the illustration is in view, fades in at the intro section, stays fixed afterward.
3. Dot-nav correctly highlights the active section while scrolling through intro → Bonheur → placeholders.
4. Clicking each of the 5 dots jumps to the right section, tested from multiple starting scroll positions (not just top-to-bottom).
5. Bonheur's beats still render and scroll-trigger correctly now that they're embedded rather than on their own page (spark scatter, ache darkness, motif sync).
6. The illustration's Bonheur hotspot smooth-scrolls to `#bonheur` with no full page navigation/reload, and the hotspot panel closes when clicked.
7. Visiting `/work/bonheur/` directly redirects to `/#bonheur`.
8. `/work/` renders with zero listed projects, no error.
9. Mobile-width spot-check of the shrunk dot-nav (resize viewport to ~375px wide).
10. Intro and each placeholder section fade/rise in with the staggered name → badge → summary (or title → "coming soon") timing, once ~30% visible — not before, not abruptly.
11. Bonheur's own intro reveal is unaffected by relocation.
12. With `prefers-reduced-motion` enabled (OS setting or browser emulation), all fades/slides resolve instantly — no motion plays.

- [ ] **Step 4: Fix anything that fails, then re-run Steps 1–3 until everything passes.**

- [ ] **Step 5: No commit for this task** (verification only — any fixes from Step 4 are committed as part of whichever task's files they touched).
