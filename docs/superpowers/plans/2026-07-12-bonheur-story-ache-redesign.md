# Bonheur Story Ache Beat Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace beat 2's ("The Ache") standard card with a scroll-scrubbed sequence: ~13 stars scatter into view, drift and twinkle, then fade out one by one while dark ink blobs grow and merge to cover the screen, at which point new negativity-bias text appears.

**Architecture:** A second, independent instance of the same `--bs-intro-progress` pattern already shipped for beat 1 — a new `--bs-ache-progress` custom property computed by its own scroll+rAF handler, driving JS-generated star/ink-blob elements via CSS `calc()`/`clamp()`. The existing per-beat `IntersectionObserver` (which syncs the persistent `#bs-motif` spark's `data-motif`) is untouched — the new block keeps the `.bs-beat`/`data-beat-id`/`data-motif` attributes it already relies on.

**Tech Stack:** Hugo v0.163.3 (extended), static site, no JS framework — verified via `./bin/hugo --minify` builds + `grep` assertions, plus a Playwright browser check (same locally-extracted-Chromium-libs approach used earlier this session).

## Global Constraints

- Scope is beat 2 only — beat 1's intro and beats 3-6 are untouched.
- No new dependency — plain CSS/JS, matching the rest of this page.
- This file's established convention is one fully self-contained IIFE per concern — the new star/ink code gets its own duplicated `simplex2` port, not a shared refactor of the existing mist-drift IIFE.
- `prefers-reduced-motion: reduce` must show a static end-state (dark background, text visible, no stars/ink rendered at all) rather than attempting the animation without motion.
- This repo's Hugo dev server file-watcher is unreliable on this `/mnt/c/...` WSL mount — always fully stop and restart `./bin/hugo server` after edits.
- Reference spec: `docs/superpowers/specs/2026-07-12-bonheur-story-ache-redesign-design.md`.

---

### Task 1: Data + HTML — the "ache" branch and text

**Files:**
- Modify: `data/bonheur_story.yaml`
- Modify: `layouts/work/bonheur-story.html`

**Interfaces:**
- Produces: `#bs-ache` (the new tall beat section), `.bs-ache-stage` (its sticky inner stage, the container Task 3's JS appends stars/ink into), `.bs-ache-text` (the hardcoded new copy) — consumed by Task 2 (CSS) and Task 3 (JS, which only needs `.bs-ache-stage` and `#bs-ache`).
- Consumes: nothing new from other tasks.

- [ ] **Step 1: Drop the now-unused fields from the "ache" YAML entry**

In `data/bonheur_story.yaml`, find:

```yaml
  - id: ache
    number: 2
    title: "The Ache"
    body: "We remember the bad hour instantly and let the good one slip by unclaimed — negativity bias, not a flaw of memory but a habit of attention. Most of what actually moved you today is already gone by tonight."
    motif: fading
    media: null
```

Replace with:

```yaml
  - id: ache
    number: 2
    motif: fading
```

- [ ] **Step 2: Branch the beats loop so "ache" renders the new block**

In `layouts/work/bonheur-story.html`, find:

```html
    {{ range .Site.Data.bonheur_story.beats }}
    <section class="bs-beat" data-beat-id="{{ .id }}" data-motif="{{ .motif }}">
      <div class="bs-beat-inner">
        <p class="bs-beat-number">{{ printf "%02d" .number }}</p>
        <h2 class="heading-section">{{ .title }}</h2>
        <p>{{ .body }}</p>

        <div class="bs-beat-media">
          {{ if .media }}
            <img src="{{ .media | relURL }}" alt="{{ .title }}">
          {{ else }}
            <div class="bs-media-placeholder">Artwork pending — {{ .title }}</div>
          {{ end }}

          {{ if isset . "video" }}
            {{ if .video }}
              <video src="{{ .video | relURL }}" controls muted loop></video>
            {{ else }}
              <div class="bs-media-placeholder">Walkthrough video pending — {{ .title }}</div>
            {{ end }}
          {{ end }}
        </div>
      </div>
    </section>
    {{ end }}
```

Replace with:

```html
    {{ range .Site.Data.bonheur_story.beats }}
    {{ if eq .id "ache" }}
    <section class="bs-beat bs-ache" data-beat-id="{{ .id }}" data-motif="{{ .motif }}" id="bs-ache">
      <div class="bs-ache-stage">
        <p class="bs-ache-text">We often let the good moments slip away unnoticed. Our minds are wired with a negativity bias, so what captures our attention isn't always what truly mattered. What moved us most is often forgotten first.</p>
      </div>
    </section>
    {{ else }}
    <section class="bs-beat" data-beat-id="{{ .id }}" data-motif="{{ .motif }}">
      <div class="bs-beat-inner">
        <p class="bs-beat-number">{{ printf "%02d" .number }}</p>
        <h2 class="heading-section">{{ .title }}</h2>
        <p>{{ .body }}</p>

        <div class="bs-beat-media">
          {{ if .media }}
            <img src="{{ .media | relURL }}" alt="{{ .title }}">
          {{ else }}
            <div class="bs-media-placeholder">Artwork pending — {{ .title }}</div>
          {{ end }}

          {{ if isset . "video" }}
            {{ if .video }}
              <video src="{{ .video | relURL }}" controls muted loop></video>
            {{ else }}
              <div class="bs-media-placeholder">Walkthrough video pending — {{ .title }}</div>
            {{ end }}
          {{ end }}
        </div>
      </div>
    </section>
    {{ end }}
    {{ end }}
```

(Stars and ink blobs are not in this markup — Task 3's JS appends them into `.bs-ache-stage` at runtime, since their positions must be genuinely random, not hand-authored content.)

- [ ] **Step 3: Build and verify**

```bash
cd "/mnt/c/Users/SirenDesign/Desktop/Portfolio/.worktrees/bonheur-story-page"
rm -rf /tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop/8f425d52-0d28-46cd-a43c-126b89fabac5/scratchpad/hugo-build
./bin/hugo --minify -d /tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop/8f425d52-0d28-46cd-a43c-126b89fabac5/scratchpad/hugo-build 2>&1 | tail -20
BUILD=/tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop/8f425d52-0d28-46cd-a43c-126b89fabac5/scratchpad/hugo-build
echo "bs-ache section: $(grep -oc 'id=bs-ache' "$BUILD/work/bonheur/index.html")"
echo "ache-stage: $(grep -oc 'bs-ache-stage' "$BUILD/work/bonheur/index.html")"
echo "ache-text: $(grep -oc 'bs-ache-text' "$BUILD/work/bonheur/index.html")"
echo "old ache title gone: $(grep -oc 'The Ache' "$BUILD/work/bonheur/index.html")"
echo "other beats intact: $(grep -oc 'bs-beat-number' "$BUILD/work/bonheur/index.html")"
```

Expected: build succeeds with zero `ERROR` lines; `bs-ache section`, `ache-stage`, `ache-text` each print `1` or more; `old ache title gone` prints `0` (the literal string "The Ache" no longer appears anywhere — the heading was dropped along with the rest of the old card); `other beats intact` prints `5` (spark, turn, jar, star-cloud, keeping still render their standard `.bs-beat-number` card).

- [ ] **Step 4: Commit**

```bash
git add data/bonheur_story.yaml layouts/work/bonheur-story.html
git commit -m "Branch the Ache beat into a dedicated block, drop its old card copy"
```

---

### Task 2: CSS — stars, ink blobs, text, reduced motion

**Files:**
- Modify: `static/css/bonheur-story.css`

**Interfaces:**
- Consumes: `.bs-ache`, `.bs-ache-stage`, `.bs-ache-text` (from Task 1); `--bs-ache-progress` (from Task 3, read via `var(..., 0)` fallback so this task's CSS is valid before Task 3 exists); per-star/per-blob custom properties written by Task 3's JS (`--bs-star-x`/`-y`/`-in`/`-out`/`-delay`/`-wobble-x`/`-wobble-y` on each `.bs-ache-star`; `--bs-ink-x`/`-y`/`-size`/`-wobble-x`/`-wobble-y` on each `.bs-ache-ink`), each read with sensible fallbacks.
- Produces: all visual behavior of the sequence — no other task depends on this task's internals beyond the class/property names above.

- [ ] **Step 1: Add the beat container override**

At the end of `static/css/bonheur-story.css`, append:

```css

/* ACHE BEAT — scattering stars fading into spreading darkness.
   Driven by --bs-ache-progress (0-1), written by the scroll/rAF handler in
   bonheur-story.js -- a second, independent instance of the same pattern
   --bs-intro-progress already uses for beat 1. */

.bs-ache {
  position: relative;
  height: 280vh;
  display: block;
  padding: 0;
}

.bs-ache-stage {
  position: sticky;
  top: 0;
  height: 100vh;
  overflow: hidden;
}
```

- [ ] **Step 2: Add the star styling**

Append:

```css

.bs-ache-star {
  position: fixed;
  top: var(--bs-star-y, 50%);
  left: var(--bs-star-x, 50%);
  z-index: 1;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: radial-gradient(circle, #fff8e7 0%, #f4c869 45%, transparent 75%);
  box-shadow: 0 0 14px 5px rgba(244, 200, 105, 0.5);
  pointer-events: none;
  animation: bs-flicker 2.4s ease-in-out infinite;
  animation-delay: var(--bs-star-delay, 0s);
  transform: translate(
    calc(-50% + var(--bs-star-wobble-x, 0px)),
    calc(-50% + var(--bs-star-wobble-y, 0px))
  );
  /* 0 -> 1 over a 0.08-wide ramp starting at this star's own random
     threshold -- staggers each star's fade-in/out independently. */
  --bs-star-fade-in: clamp(0, calc((var(--bs-ache-progress, 0) - var(--bs-star-in, 0)) / 0.08), 1);
  --bs-star-fade-out: clamp(0, calc((var(--bs-ache-progress, 0) - var(--bs-star-out, 1)) / 0.08), 1);
  opacity: calc(var(--bs-star-fade-in) * (1 - var(--bs-star-fade-out)));
}
```

- [ ] **Step 3: Add the ink-blob styling**

Append:

```css

.bs-ache-ink {
  position: fixed;
  top: var(--bs-ink-y, 50%);
  left: var(--bs-ink-x, 50%);
  z-index: 2;
  width: var(--bs-ink-size, 60vw);
  height: var(--bs-ink-size, 60vw);
  border-radius: 50%;
  background: #0a0816;
  filter: blur(70px);
  pointer-events: none;
  /* 0 -> 1 across the last 35% of scroll -- grows from nothing to full
     size, merging with the other blobs to cover the screen. */
  --bs-ink-grow: clamp(0, calc((var(--bs-ache-progress, 0) - 0.55) / 0.35), 1);
  transform: translate(
    calc(-50% + var(--bs-ink-wobble-x, 0px)),
    calc(-50% + var(--bs-ink-wobble-y, 0px))
  ) scale(var(--bs-ink-grow));
}
```

- [ ] **Step 4: Add the text styling**

Append:

```css

.bs-ache-text {
  position: fixed;
  top: 50%;
  left: 50%;
  z-index: 3;
  transform: translate(-50%, -50%);
  max-width: 34rem;
  padding: 0 1.5rem;
  margin: 0;
  text-align: center;
  font-size: 1.1rem;
  line-height: 1.7;
  color: #f4f0ff;
  pointer-events: none;
  /* 0 -> 1 across progress 0.75-0.90, holding through 1.0 -- appears once
     the screen is substantially dark. */
  opacity: clamp(0, calc((var(--bs-ache-progress, 0) - 0.75) / 0.15), 1);
}
```

- [ ] **Step 5: Extend the reduced-motion block**

Find:

```css
  .bs-scroll-cue,
  .bs-intro-sky,
  .bs-intro-sunshine,
  .bs-intro-mist {
    display: none !important;
  }

  .bs-intro-tagline {
    opacity: 1 !important;
    animation: none !important;
  }
}
```

Replace with:

```css
  .bs-scroll-cue,
  .bs-intro-sky,
  .bs-intro-sunshine,
  .bs-intro-mist {
    display: none !important;
  }

  .bs-intro-tagline {
    opacity: 1 !important;
    animation: none !important;
  }

  .bs-ache-star,
  .bs-ache-ink {
    display: none !important;
  }

  .bs-ache-stage {
    background: #0a0816;
  }

  .bs-ache-text {
    opacity: 1 !important;
  }
}
```

- [ ] **Step 6: Build and verify**

```bash
cd "/mnt/c/Users/SirenDesign/Desktop/Portfolio/.worktrees/bonheur-story-page"
rm -rf /tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop/8f425d52-0d28-46cd-a43c-126b89fabac5/scratchpad/hugo-build
./bin/hugo --minify -d /tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop/8f425d52-0d28-46cd-a43c-126b89fabac5/scratchpad/hugo-build 2>&1 | tail -20
BUILD=/tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop/8f425d52-0d28-46cd-a43c-126b89fabac5/scratchpad/hugo-build
grep -c 'bs-ache-progress' "$BUILD/css/bonheur-story.css"
grep -c 'bs-star-fade-in' "$BUILD/css/bonheur-story.css"
grep -c 'bs-ink-grow' "$BUILD/css/bonheur-story.css"
```

Expected: build succeeds with zero `ERROR` lines; all three greps print `1` or more.

- [ ] **Step 7: Commit**

```bash
git add static/css/bonheur-story.css
git commit -m "Add Ache beat CSS: scattering stars, growing ink blobs, dark text reveal"
```

---

### Task 3: JS — ache progress engine, star/ink generation, drift

**Files:**
- Modify: `static/js/bonheur-story.js`

**Interfaces:**
- Consumes: `#bs-ache`, `.bs-ache-stage` (from Task 1).
- Produces: `--bs-ache-progress` on `document.documentElement`; `.bs-ache-star`/`.bs-ache-ink` elements appended into `.bs-ache-stage` with the custom properties Task 2's CSS reads.

- [ ] **Step 1: Add the ache progress engine**

At the end of `static/js/bonheur-story.js`, append:

```js

// Drives --bs-ache-progress (0-1) from how far the user has scrolled
// through #bs-ache -- a second, independent instance of the same pattern
// --bs-intro-progress already uses. All visual behavior lives in
// bonheur-story.css as calc()/clamp() expressions reading this property.
(function () {
  "use strict";

  var ache = document.getElementById("bs-ache");
  if (!ache) return;

  var ticking = false;

  function updateAcheProgress() {
    ticking = false;
    var rect = ache.getBoundingClientRect();
    var scrollableDistance = rect.height - window.innerHeight;
    var progress = scrollableDistance > 0 ? (0 - rect.top) / scrollableDistance : 1;
    progress = Math.min(1, Math.max(0, progress));
    document.documentElement.style.setProperty("--bs-ache-progress", progress.toFixed(4));
  }

  function onScrollOrResize() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(updateAcheProgress);
  }

  window.addEventListener("scroll", onScrollOrResize, { passive: true });
  window.addEventListener("resize", onScrollOrResize);
  updateAcheProgress();
})();
```

- [ ] **Step 2: Build and verify the syntax still checks out**

```bash
cd "/mnt/c/Users/SirenDesign/Desktop/Portfolio/.worktrees/bonheur-story-page"
rm -rf /tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop/8f425d52-0d28-46cd-a43c-126b89fabac5/scratchpad/hugo-build
./bin/hugo --minify -d /tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop/8f425d52-0d28-46cd-a43c-126b89fabac5/scratchpad/hugo-build 2>&1 | tail -20
BUILD=/tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop/8f425d52-0d28-46cd-a43c-126b89fabac5/scratchpad/hugo-build
node --check "$BUILD/js/bonheur-story.js" && echo "syntax ok"
```

Expected: build succeeds with zero `ERROR` lines; `node --check` prints nothing followed by `syntax ok`.

- [ ] **Step 3: Commit**

```bash
git add static/js/bonheur-story.js
git commit -m "Add the Ache beat's own scroll-scrubbed progress engine"
```

- [ ] **Step 4: Generate the stars and ink blobs, and drive their drift**

At the end of `static/js/bonheur-story.js`, append:

```js

// Generates the ~13 scattering stars and 3-4 growing ink blobs for the
// Ache beat, and drives their per-frame noise-driven drift. Skipped
// entirely under prefers-reduced-motion (the elements are display:none
// anyway per the CSS, so this just avoids wasted per-frame work and
// avoids ever creating them in the first place).
(function () {
  "use strict";

  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  var stage = document.querySelector(".bs-ache-stage");
  if (!stage) return;

  var GRAD2 = [
    [1, 1], [-1, 1], [1, -1], [-1, -1],
    [1, 0], [-1, 0], [1, 0], [-1, 0],
    [0, 1], [0, -1], [0, 1], [0, -1],
  ];

  var PERM_BASE = [
    151, 160, 137, 91, 90, 15, 131, 13, 201, 95, 96, 53, 194, 233, 7, 225,
    140, 36, 103, 30, 69, 142, 8, 99, 37, 240, 21, 10, 23, 190, 6, 148,
    247, 120, 234, 75, 0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32,
    57, 177, 33, 88, 237, 149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175,
    74, 165, 71, 134, 139, 48, 27, 166, 77, 146, 158, 231, 83, 111, 229, 122,
    60, 211, 133, 230, 220, 105, 92, 41, 55, 46, 245, 40, 244, 102, 143, 54,
    65, 25, 63, 161, 1, 216, 80, 73, 209, 76, 132, 187, 208, 89, 18, 169,
    200, 196, 135, 130, 116, 188, 159, 86, 164, 100, 109, 198, 173, 186, 3, 64,
    52, 217, 226, 250, 124, 123, 5, 202, 38, 147, 118, 126, 255, 82, 85, 212,
    207, 206, 59, 227, 47, 16, 58, 17, 182, 189, 28, 42, 223, 183, 170, 213,
    119, 248, 152, 2, 44, 154, 163, 70, 221, 153, 101, 155, 167, 43, 172, 9,
    129, 22, 39, 253, 19, 98, 108, 110, 79, 113, 224, 232, 178, 185, 112, 104,
    218, 246, 97, 228, 251, 34, 242, 193, 238, 210, 144, 12, 191, 179, 162, 241,
    81, 51, 145, 235, 249, 14, 239, 107, 49, 192, 214, 31, 181, 199, 106, 157,
    184, 84, 204, 176, 115, 121, 50, 45, 127, 4, 150, 254, 138, 236, 205, 93,
    222, 114, 67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215, 61, 156, 180,
  ];

  var PERM = new Uint8Array(512);
  var PERM_MOD12 = new Uint8Array(512);
  for (var pi = 0; pi < 512; pi += 1) {
    PERM[pi] = PERM_BASE[pi & 255];
    PERM_MOD12[pi] = PERM[pi] % 12;
  }

  var F2 = 0.5 * (Math.sqrt(3) - 1);
  var G2 = (3 - Math.sqrt(3)) / 6;

  function dot2(g, x, y) { return g[0] * x + g[1] * y; }

  function simplex2(xin, yin) {
    var s = (xin + yin) * F2;
    var i = Math.floor(xin + s);
    var j = Math.floor(yin + s);
    var t = (i + j) * G2;
    var x0 = xin - (i - t);
    var y0 = yin - (j - t);

    var i1, j1;
    if (x0 > y0) { i1 = 1; j1 = 0; } else { i1 = 0; j1 = 1; }

    var x1 = x0 - i1 + G2;
    var y1 = y0 - j1 + G2;
    var x2 = x0 - 1 + 2 * G2;
    var y2 = y0 - 1 + 2 * G2;

    var ii = i & 255;
    var jj = j & 255;
    var gi0 = PERM_MOD12[ii + PERM[jj]];
    var gi1 = PERM_MOD12[ii + i1 + PERM[jj + j1]];
    var gi2 = PERM_MOD12[ii + 1 + PERM[jj + 1]];

    var n0 = 0, n1 = 0, n2 = 0;
    var t0 = 0.5 - x0 * x0 - y0 * y0;
    if (t0 >= 0) { t0 *= t0; n0 = t0 * t0 * dot2(GRAD2[gi0], x0, y0); }
    var t1 = 0.5 - x1 * x1 - y1 * y1;
    if (t1 >= 0) { t1 *= t1; n1 = t1 * t1 * dot2(GRAD2[gi1], x1, y1); }
    var t2 = 0.5 - x2 * x2 - y2 * y2;
    if (t2 >= 0) { t2 *= t2; n2 = t2 * t2 * dot2(GRAD2[gi2], x2, y2); }

    return 70 * (n0 + n1 + n2);
  }

  var STAR_COUNT = 13;
  var stars = [];
  for (var i = 0; i < STAR_COUNT; i += 1) {
    var star = document.createElement("div");
    star.className = "bs-ache-star";
    var x = Math.random() * 90 + 5;
    var y = Math.random() * 80 + 10;
    var inThreshold = Math.random() * 0.20;
    var outThreshold = 0.55 + Math.random() * 0.35;
    star.style.setProperty("--bs-star-x", x.toFixed(2) + "%");
    star.style.setProperty("--bs-star-y", y.toFixed(2) + "%");
    star.style.setProperty("--bs-star-in", inThreshold.toFixed(3));
    star.style.setProperty("--bs-star-out", outThreshold.toFixed(3));
    star.style.setProperty("--bs-star-delay", (-Math.random() * 2.4).toFixed(2) + "s");
    stage.appendChild(star);
    stars.push({ el: star, x: x, y: y, seed: 100 + i * 37.7 });
  }

  var INK_COUNT = 4;
  var inks = [];
  for (var j = 0; j < INK_COUNT; j += 1) {
    var ink = document.createElement("div");
    ink.className = "bs-ache-ink";
    var starRef = stars[Math.floor(Math.random() * stars.length)];
    ink.style.setProperty("--bs-ink-x", starRef.x.toFixed(2) + "%");
    ink.style.setProperty("--bs-ink-y", starRef.y.toFixed(2) + "%");
    var size = 55 + Math.random() * 20;
    ink.style.setProperty("--bs-ink-size", size.toFixed(1) + "vw");
    stage.appendChild(ink);
    inks.push({ el: ink, seed: 500 + j * 61.3 });
  }

  var ache = document.getElementById("bs-ache");
  var t = 0;

  function frame() {
    var rect = ache.getBoundingClientRect();
    var inView = rect.bottom > 0 && rect.top < window.innerHeight;
    if (inView) {
      t += 0.006;
      stars.forEach(function (s) {
        var nx = simplex2(t, s.seed);
        var ny = simplex2(t + 100, s.seed);
        s.el.style.setProperty("--bs-star-wobble-x", (nx * 10).toFixed(2) + "px");
        s.el.style.setProperty("--bs-star-wobble-y", (ny * 10).toFixed(2) + "px");
      });
      inks.forEach(function (b) {
        var nx = simplex2(t, b.seed);
        var ny = simplex2(t + 100, b.seed);
        b.el.style.setProperty("--bs-ink-wobble-x", (nx * 16).toFixed(2) + "px");
        b.el.style.setProperty("--bs-ink-wobble-y", (ny * 16).toFixed(2) + "px");
      });
    }
    window.requestAnimationFrame(frame);
  }

  window.requestAnimationFrame(frame);
})();
```

- [ ] **Step 5: Build and verify**

```bash
cd "/mnt/c/Users/SirenDesign/Desktop/Portfolio/.worktrees/bonheur-story-page"
rm -rf /tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop/8f425d52-0d28-46cd-a43c-126b89fabac5/scratchpad/hugo-build
./bin/hugo --minify -d /tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop/8f425d52-0d28-46cd-a43c-126b89fabac5/scratchpad/hugo-build 2>&1 | tail -20
BUILD=/tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop/8f425d52-0d28-46cd-a43c-126b89fabac5/scratchpad/hugo-build
node --check "$BUILD/js/bonheur-story.js" && echo "syntax ok"
```

Expected: build succeeds with zero `ERROR` lines; `node --check` prints nothing followed by `syntax ok`.

- [ ] **Step 6: Commit**

```bash
git add static/js/bonheur-story.js
git commit -m "Generate the Ache beat's scattering stars and growing ink blobs"
```

---

### Task 4: Browser verification

**Files:** none (verification only)

- [ ] **Step 1: Start a clean Hugo dev server**

```bash
pkill -f "bin/hugo server" 2>/dev/null
cd "/mnt/c/Users/SirenDesign/Desktop/Portfolio/.worktrees/bonheur-story-page"
./bin/hugo server -D --port 1313 > /tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop/8f425d52-0d28-46cd-a43c-126b89fabac5/scratchpad/hugo-server.log 2>&1 &
for i in $(seq 1 20); do
  code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:1313/Portfolio/work/bonheur/)
  if [ "$code" = "200" ]; then echo "up after $i tries"; break; fi
  sleep 1
done
curl -s http://localhost:1313/Portfolio/css/bonheur-story.css | grep -c 'bs-ache-progress'
curl -s http://localhost:1313/Portfolio/js/bonheur-story.js | grep -c 'bs-ache-progress'
```

Expected: prints `up after N tries`; both grep counts are non-zero (confirms fresh files are served).

- [ ] **Step 2: Write and run the check script**

Create `/tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop/8f425d52-0d28-46cd-a43c-126b89fabac5/scratchpad/check-ache.js`:

```js
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('pageerror', (err) => errors.push(String(err)));

  await page.goto('http://localhost:1313/Portfolio/work/bonheur/', { waitUntil: 'load' });
  await page.waitForTimeout(300);

  const starCount = await page.evaluate(() => document.querySelectorAll('.bs-ache-star').length);
  const inkCount = await page.evaluate(() => document.querySelectorAll('.bs-ache-ink').length);
  console.log('star count:', starCount, 'ink count:', inkCount);

  // Find #bs-ache's document offset so we can compute real scroll targets,
  // same 48px-top-padding lesson learned from the intro's own verification.
  const acheGeom = await page.evaluate(() => {
    const el = document.getElementById('bs-ache');
    const rect = el.getBoundingClientRect();
    return { top: rect.top + window.scrollY, height: rect.height };
  });
  console.log('ache geometry:', JSON.stringify(acheGeom));

  const scrollable = acheGeom.height - 900;

  async function readAt(progressFraction) {
    const y = acheGeom.top + scrollable * progressFraction;
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await page.waitForTimeout(200);
    return page.evaluate(() => {
      const stars = Array.from(document.querySelectorAll('.bs-ache-star'));
      const inks = Array.from(document.querySelectorAll('.bs-ache-ink'));
      return {
        introProgress: getComputedStyle(document.documentElement).getPropertyValue('--bs-ache-progress').trim(),
        starOpacities: stars.map((s) => getComputedStyle(s).opacity),
        inkScales: inks.map((b) => getComputedStyle(b).transform),
        textOpacity: getComputedStyle(document.querySelector('.bs-ache-text')).opacity,
      };
    });
  }

  const at10 = await readAt(0.10);
  console.log('AT ~0.10 (stars materializing):', JSON.stringify(at10));

  const at40 = await readAt(0.40);
  console.log('AT ~0.40 (hold):', JSON.stringify(at40));

  const at70 = await readAt(0.70);
  console.log('AT ~0.70 (fading + ink growing):', JSON.stringify(at70));

  const at95 = await readAt(0.95);
  console.log('AT ~0.95 (dark + text):', JSON.stringify(at95));

  // Regression guard: beat 1 intro and a later beat unaffected.
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
  const introStillWorks = await page.evaluate(() => ({
    bonOpacity: getComputedStyle(document.querySelector('.bs-intro-word--bon')).opacity,
    cueOpacity: getComputedStyle(document.querySelector('.bs-scroll-cue')).opacity,
  }));
  console.log('INTRO REGRESSION GUARD:', JSON.stringify(introStillWorks));

  await page.evaluate(() => {
    document.querySelector('[data-beat-id="turn"]').scrollIntoView();
  });
  await page.waitForTimeout(800);
  const turnBeat = await page.evaluate(() => {
    const beat = document.querySelector('[data-beat-id="turn"]');
    return {
      isVisible: beat.classList.contains('is-visible'),
      motif: document.getElementById('bs-motif').getAttribute('data-motif'),
    };
  });
  console.log('BEAT "turn" REGRESSION GUARD:', JSON.stringify(turnBeat));

  console.log('console/page errors:', JSON.stringify(errors));
  await browser.close();

  const browser2 = await chromium.launch();
  const page2 = await browser2.newContext({ reducedMotion: 'reduce' }).then((c) => c.newPage());
  await page2.goto('http://localhost:1313/Portfolio/work/bonheur/', { waitUntil: 'load' });
  await page2.waitForTimeout(300);
  const reduced = await page2.evaluate(() => ({
    starCount: document.querySelectorAll('.bs-ache-star').length,
    inkCount: document.querySelectorAll('.bs-ache-ink').length,
    stageBackground: getComputedStyle(document.querySelector('.bs-ache-stage')).backgroundColor,
    textOpacity: getComputedStyle(document.querySelector('.bs-ache-text')).opacity,
  }));
  console.log('REDUCED MOTION:', JSON.stringify(reduced));
  await browser2.close();
})();
```

Run it:

```bash
export LD_LIBRARY_PATH="/tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop/8f425d52-0d28-46cd-a43c-126b89fabac5/scratchpad/debs/extracted/usr/lib/x86_64-linux-gnu:$LD_LIBRARY_PATH"
NODE_PATH="/home/sirendesign/.npm/_npx/705bc6b22212b352/node_modules" node /tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop/8f425d52-0d28-46cd-a43c-126b89fabac5/scratchpad/check-ache.js
```

Expected, checking the printed JSON by hand:
- `star count: 13 ink count: 4`.
- `AT ~0.10`: `starOpacities` is a mix of values, not all identical (some stars have already crossed their random `--bs-star-in` threshold and are fading in, others haven't yet) — confirms staggering, not a synchronized pop-in.
- `AT ~0.40`: most/all `starOpacities` close to `"1"` (the hold phase); `inkScales` all show `scale(0)` or very close (ink growth doesn't start until 0.55); `textOpacity` `"0"`.
- `AT ~0.70`: `starOpacities` is again a mixed set of values between 0 and 1 (staggered fade-out, not synchronized); `inkScales` show non-zero, non-identical scale values (blobs growing at slightly different rates); `textOpacity` still low/`"0"` (text doesn't start until 0.75).
- `AT ~0.95`: `starOpacities` all `"0"` or very close (fully faded); `inkScales` all near `scale(1)`; `textOpacity` `"1"`.
- `INTRO REGRESSION GUARD`: `bonOpacity` `"1"`, `cueOpacity` `"1"` — beat 1's intro still works exactly as before.
- `BEAT "turn" REGRESSION GUARD`: `isVisible` `true`, `motif` `"caught"` — beat 3 and the persistent spark's motif-sync still work exactly as before.
- `console/page errors: []`.
- `REDUCED MOTION`: `starCount` `0`, `inkCount` `0` (never created), `stageBackground` is the dark color (rendered as `rgb(10, 8, 22)`), `textOpacity` `"1"`.

If any value doesn't match, stop and fix the CSS/JS before continuing.

- [ ] **Step 3: Screenshot pass**

```bash
cd /tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop/8f425d52-0d28-46cd-a43c-126b89fabac5/scratchpad
mkdir -p shots-ache
cat > shot-ache.js <<'EOF'
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto('http://localhost:1313/Portfolio/work/bonheur/', { waitUntil: 'load' });
  await page.waitForTimeout(300);
  const acheGeom = await page.evaluate(() => {
    const el = document.getElementById('bs-ache');
    const rect = el.getBoundingClientRect();
    return { top: rect.top + window.scrollY, height: rect.height };
  });
  const scrollable = acheGeom.height - 900;
  const targets = [
    ['00-stars-in', 0.12],
    ['01-hold', 0.40],
    ['02-fading-darkening', 0.72],
    ['03-dark-text', 0.95],
  ];
  for (const [name, frac] of targets) {
    await page.evaluate((yy) => window.scrollTo(0, yy), acheGeom.top + scrollable * frac);
    await page.waitForTimeout(250);
    await page.screenshot({ path: `/tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop/8f425d52-0d28-46cd-a43c-126b89fabac5/scratchpad/shots-ache/${name}.png` });
  }
  await browser.close();
})();
EOF
export LD_LIBRARY_PATH="/tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop/8f425d52-0d28-46cd-a43c-126b89fabac5/scratchpad/debs/extracted/usr/lib/x86_64-linux-gnu:$LD_LIBRARY_PATH"
NODE_PATH="/home/sirendesign/.npm/_npx/705bc6b22212b352/node_modules" node shot-ache.js
ls shots-ache/
```

Expected: 4 screenshots generated. Review each (via the Read tool on the PNG paths) to confirm: `00-stars-in` shows several small gold stars scattered at different visibility levels (some barely visible, some bright); `01-hold` shows most/all stars bright and no darkness yet; `02-fading-darkening` shows some stars gone, some still visible, with dark blob(s) visibly encroaching from a few points; `03-dark-text` shows the screen fully dark with the new text legible in light lavender-white.

- [ ] **Step 4: Stop the dev server**

```bash
pkill -f "bin/hugo server" 2>/dev/null; echo done
```

- [ ] **Step 5: No commit for this task** (verification only).
