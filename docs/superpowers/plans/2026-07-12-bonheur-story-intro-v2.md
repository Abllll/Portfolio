# Bonheur Story Intro v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the already-shipped Bon/heur intro sequence with a one-letter corner reveal, a pulsing scroll-down cue, a tagline phase between merge and ignition, and a living-light noise backdrop ported from the real Bonheur app.

**Architecture:** All new visual state is driven by the same `--bs-intro-progress` CSS custom property the existing sequence already uses (re-timed to new phase boundaries for a 320vh intro), plus one new time-based `requestAnimationFrame` loop (independent of the scroll-progress loop) driving three noise-driven backdrop blobs via a verbatim port of the real app's `simplex2` function. A one-time JS class-latch (matching the existing `.is-visible` pattern) triggers the tagline's single flicker.

**Tech Stack:** Hugo v0.163.3 (extended), static site, no JS framework — verified via `./bin/hugo --minify` builds + `grep` assertions, plus the same Playwright + locally-extracted-Chromium-libs browser check used for the v1 intro plan.

## Global Constraints

- Builds on the already-shipped intro (commits `ea68cfe`..`8d580c7`, plan `docs/superpowers/plans/2026-07-12-bonheur-story-intro-motion-redesign.md`) — do not redo or re-verify that work, only add the four v2 pieces.
- Beats 2-6 stay untouched (copy, motifs, reveal mechanism).
- No new dependency — plain CSS/JS, same as the rest of this page.
- `prefers-reduced-motion: reduce` must still work: the scroll cue and backdrop (purely decorative motion) are hidden entirely; the tagline (real content — a product description) shows immediately at full opacity instead of being hidden, so its text isn't lost to reduced-motion users. This is a deliberate correction to the spec's original "skipped entirely" wording for the tagline specifically — hiding real copy via reduced motion would be an accessibility regression, matching how `.bs-spark` is already forced visible rather than hidden under reduced motion.
- Reference spec: `docs/superpowers/specs/2026-07-12-bonheur-story-intro-v2-design.md`.
- This repo's Hugo dev server file-watcher is unreliable on this `/mnt/c/...` WSL mount — always fully stop and restart `./bin/hugo server` after edits, don't rely on live-reload.

---

### Task 1: HTML — scroll cue, tagline, and backdrop markup

**Files:**
- Modify: `layouts/work/bonheur-story.html`

**Interfaces:**
- Produces: `.bs-scroll-cue` / `.bs-scroll-cue-icon`, `.bs-intro-tagline`, `.bs-intro-sky`, `.bs-intro-sunshine`, `.bs-intro-mist--pink`/`--purple`/`--teal` — consumed by Task 2 (CSS) and Task 3 (JS, which queries `.bs-intro-tagline` and `.bs-intro-mist`).
- Consumes: nothing new from other tasks.

- [ ] **Step 1: Add the new elements inside `.bs-intro-stage`**

In `layouts/work/bonheur-story.html`, find:

```html
    <section class="bs-intro" id="bs-intro">
      <div class="bs-intro-stage">
        <span class="bs-intro-word bs-intro-word--bon" aria-hidden="true">Bon</span>
        <span class="bs-intro-word bs-intro-word--heur" aria-hidden="true">heur</span>
      </div>
    </section>
```

Replace with:

```html
    <section class="bs-intro" id="bs-intro">
      <div class="bs-intro-stage">
        <div class="bs-intro-sky" aria-hidden="true"></div>
        <div class="bs-intro-sunshine" aria-hidden="true"></div>
        <div class="bs-intro-mist bs-intro-mist--pink" aria-hidden="true"></div>
        <div class="bs-intro-mist bs-intro-mist--purple" aria-hidden="true"></div>
        <div class="bs-intro-mist bs-intro-mist--teal" aria-hidden="true"></div>
        <div class="bs-scroll-cue" aria-hidden="true">
          <span class="bs-scroll-cue-icon"></span>
        </div>
        <span class="bs-intro-word bs-intro-word--bon" aria-hidden="true">Bon</span>
        <span class="bs-intro-word bs-intro-word--heur" aria-hidden="true">heur</span>
        <p class="bs-intro-tagline">A personal memory companion that helps people cultivate happiness by collecting meaningful everyday moments.</p>
      </div>
    </section>
```

(The tagline is intentionally *not* `aria-hidden` — unlike the decorative word letters and backdrop, it's real product copy a screen reader should announce.)

- [ ] **Step 2: Build and verify the markup**

```bash
cd "/mnt/c/Users/SirenDesign/Desktop/Portfolio/.worktrees/bonheur-story-page"
rm -rf /tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop/8f425d52-0d28-46cd-a43c-126b89fabac5/scratchpad/hugo-build
./bin/hugo --minify -d /tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop/8f425d52-0d28-46cd-a43c-126b89fabac5/scratchpad/hugo-build 2>&1 | tail -20
BUILD=/tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop/8f425d52-0d28-46cd-a43c-126b89fabac5/scratchpad/hugo-build
echo "scroll-cue: $(grep -oc 'bs-scroll-cue' "$BUILD/work/bonheur/index.html")"
echo "tagline: $(grep -oc 'bs-intro-tagline' "$BUILD/work/bonheur/index.html")"
echo "sky: $(grep -oc 'bs-intro-sky' "$BUILD/work/bonheur/index.html")"
echo "mist: $(grep -oc 'bs-intro-mist' "$BUILD/work/bonheur/index.html")"
```

Expected: build succeeds with zero `ERROR` lines; `scroll-cue` prints `2` (wrapper + icon class both contain the substring), `tagline` prints `1`, `sky` prints `1`, `mist` prints `4` (base class + 3 modifier classes each also contain "bs-intro-mist").

- [ ] **Step 3: Commit**

```bash
git add layouts/work/bonheur-story.html
git commit -m "Add scroll cue, tagline, and backdrop markup to the Bonheur intro"
```

---

### Task 2: CSS — re-time phases, tighten reveal, style new elements

**Files:**
- Modify: `static/css/bonheur-story.css`

**Interfaces:**
- Consumes: `.bs-scroll-cue`/`.bs-scroll-cue-icon`, `.bs-intro-tagline`, `.bs-intro-sky`/`.bs-intro-sunshine`/`.bs-intro-mist` (from Task 1); `--bs-intro-progress` (from the existing JS engine, unchanged); a new `--bs-mist-x`/`--bs-mist-y`/`--bs-mist-breathe` set per mist blob (from Task 3, read via `var(..., <fallback>)` so this task's CSS is valid before Task 3 exists).
- Produces: `.bs-intro-tagline--flicker` class hook (consumed by Task 3, which adds it) and all visual behavior for the new elements.

- [ ] **Step 1: Grow the intro and re-time the existing phase variables**

Find:

```css
.bs-intro {
  position: relative;
  height: 220vh;
}
```

Replace with:

```css
.bs-intro {
  position: relative;
  height: 320vh;
}
```

Find:

```css
.bs-spark {
  position: relative;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: radial-gradient(circle, #fff8e7 0%, #f4c869 45%, transparent 75%);
  box-shadow: 0 0 24px 8px rgba(244, 200, 105, 0.55);
  opacity: clamp(0, calc((var(--bs-intro-progress, 0) - 0.45) / 0.1), 1);
  transition: transform 0.6s ease, box-shadow 0.6s ease;
}
```

Replace with (ignition moves from 0.45-0.55 to 0.65-0.75 to make room for the tagline phase):

```css
.bs-spark {
  position: relative;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: radial-gradient(circle, #fff8e7 0%, #f4c869 45%, transparent 75%);
  box-shadow: 0 0 24px 8px rgba(244, 200, 105, 0.55);
  opacity: clamp(0, calc((var(--bs-intro-progress, 0) - 0.65) / 0.1), 1);
  transition: transform 0.6s ease, box-shadow 0.6s ease;
}
```

Find:

```css
.bs-intro-word {
  position: absolute;
  top: 50%;
  left: 50%;
  font-size: clamp(3rem, 11vw, 8rem);
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1;
  white-space: nowrap;
  pointer-events: none;
  /* 0 -> 1 across the first 45% of scroll (the approach) */
  --bs-enter: clamp(0, calc(var(--bs-intro-progress, 0) / 0.45), 1);
  /* 0 -> 1 across the last 30% of scroll (the recede) */
  --bs-exit: clamp(0, calc((var(--bs-intro-progress, 0) - 0.55) / 0.3), 1);
  opacity: calc(1 - var(--bs-exit));
  color: color-mix(in srgb, var(--color-text), #f4c869 calc(var(--bs-enter) * 100%));
}

.bs-intro-word--bon {
  transform: translate(
    calc(-100% + (1 - var(--bs-enter)) * -38vw + var(--bs-exit) * -50vw),
    calc(-50% + (1 - var(--bs-enter)) * 42vh)
  );
}

.bs-intro-word--heur {
  transform: translate(
    calc((1 - var(--bs-enter)) * 38vw + var(--bs-exit) * 50vw),
    calc(-50% + (1 - var(--bs-enter)) * 42vh)
  );
}
```

Replace with (corner offset widens from `38vw` to `50vw` so only one full letter is visible at rest — start here and tune further in Task 4's browser check if the clip boundary doesn't land cleanly on the glyph edge; `--bs-enter`/`--bs-exit` are removed from here because Step 2 below hoists them onto the shared `.bs-intro-stage` parent instead, re-timed to the new phase table, so the backdrop layers added in Step 2 can read them too):

```css
.bs-intro-word {
  position: absolute;
  top: 50%;
  left: 50%;
  z-index: 1;
  font-size: clamp(3rem, 11vw, 8rem);
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1;
  white-space: nowrap;
  pointer-events: none;
  opacity: calc(1 - var(--bs-exit));
  color: color-mix(in srgb, var(--color-text), #f4c869 calc(var(--bs-enter) * 100%));
}

.bs-intro-word--bon {
  transform: translate(
    calc(-100% + (1 - var(--bs-enter)) * -50vw + var(--bs-exit) * -50vw),
    calc(-50% + (1 - var(--bs-enter)) * 42vh)
  );
}

.bs-intro-word--heur {
  transform: translate(
    calc((1 - var(--bs-enter)) * 50vw + var(--bs-exit) * 50vw),
    calc(-50% + (1 - var(--bs-enter)) * 42vh)
  );
}
```

- [ ] **Step 2: Hoist `--bs-enter`/`--bs-exit` onto `.bs-intro-stage`, re-timed for the tagline phase**

`.bs-intro-word`'s `opacity`/`color` above still reference `--bs-enter`/`--bs-exit`, and Step 3 below needs the backdrop layers to read the same two variables — but those live on a `.bs-intro-word`-only rule today, and CSS custom properties only inherit to descendants, not siblings. Moving them onto the shared `.bs-intro-stage` parent (which both the words and the backdrop layers are children of) fixes that.

Find:

```css
.bs-intro-stage {
  position: sticky;
  top: 0;
  height: 100vh;
  overflow: hidden;
}
```

Replace with (enter now completes at 0.30 instead of 0.45, giving 0.30-0.65 room for the merged tagline+ignition dwell; recede moves from 0.55-0.85 to 0.75-0.95):

```css
.bs-intro-stage {
  position: sticky;
  top: 0;
  height: 100vh;
  overflow: hidden;
  /* 0 -> 1 across the first 30% of scroll (the approach) */
  --bs-enter: clamp(0, calc(var(--bs-intro-progress, 0) / 0.30), 1);
  /* 0 -> 1 across the last 20% of scroll (the recede) -- shared by the
     words (Step 1 above) and the backdrop layers (Step 3 below). */
  --bs-exit: clamp(0, calc((var(--bs-intro-progress, 0) - 0.75) / 0.2), 1);
}
```

- [ ] **Step 3: Add the scroll-down cue, tagline, and backdrop styles**

At the end of `static/css/bonheur-story.css`, append:

```css

/* SCROLL-DOWN CUE
   Visible only before scrolling starts -- fades out within the first 3% of
   --bs-intro-progress. The icon's own pulse reuses the existing bs-flicker
   keyframe (already defined above for beat 2's spark) for visual consistency. */

.bs-scroll-cue {
  position: absolute;
  top: 50%;
  left: 50%;
  z-index: 1;
  transform: translate(-50%, -50%);
  opacity: clamp(0, calc(1 - var(--bs-intro-progress, 0) / 0.03), 1);
  pointer-events: none;
}

.bs-scroll-cue-icon {
  display: block;
  width: 22px;
  height: 22px;
  border-right: 2px solid #ffffff;
  border-bottom: 2px solid #ffffff;
  transform: rotate(45deg);
  animation: bs-flicker 2.2s ease-in-out infinite;
}

/* TAGLINE
   Fades in once the words merge (0.30-0.40), holds, flickers once (see
   bs-intro-tagline--flicker, added by JS at progress 0.40), then fades out
   before ignition (0.55-0.65). */

.bs-intro-tagline {
  position: absolute;
  top: 62%;
  left: 50%;
  z-index: 1;
  transform: translate(-50%, -50%);
  max-width: 32rem;
  padding: 0 1.5rem;
  margin: 0;
  text-align: center;
  font-size: 1.05rem;
  line-height: 1.6;
  color: var(--color-text);
  pointer-events: none;
  --bs-tagline-in: clamp(0, calc((var(--bs-intro-progress, 0) - 0.30) / 0.10), 1);
  --bs-tagline-out: clamp(0, calc((var(--bs-intro-progress, 0) - 0.55) / 0.10), 1);
  opacity: calc(var(--bs-tagline-in) * (1 - var(--bs-tagline-out)));
}

.bs-intro-tagline--flicker {
  animation: bs-tagline-flicker 1s ease-in-out;
}

@keyframes bs-tagline-flicker {
  0%, 100% { opacity: 1; }
  15% { opacity: 0.3; }
  30% { opacity: 1; }
  45% { opacity: 0.4; }
  60% { opacity: 1; }
}

/* LIVING-LIGHT BACKDROP
   Palette ported from the real Bonheur app's Universe.js (mood="day" render)
   -- its actual persistent ambient background, not the data-driven jar glow.
   The sky/sunshine layers are static; the three mist blobs drift and breathe
   via simplex noise (ported from the app's JarBackdrop.js/simplexNoise.js),
   driven by bonheur-story.js writing --bs-mist-x/--bs-mist-y/--bs-mist-breathe
   per blob every frame. Intro-only -- fades out over the same recede range
   the words use (--bs-exit, 0.75-0.95). */

.bs-intro-sky {
  position: absolute;
  inset: 0;
  z-index: 0;
  background: radial-gradient(circle at 50% 20%, #F8EFFB 0%, #EFE7FA 55%, #F6E2EE 100%);
  opacity: calc(1 - var(--bs-exit, 0));
}

.bs-intro-sunshine {
  position: absolute;
  inset: 0;
  z-index: 0;
  background: linear-gradient(225deg, rgba(255, 226, 160, 0.85) 0%, rgba(255, 217, 160, 0.5) 22%, rgba(255, 243, 214, 0.1) 50%, transparent 100%);
  opacity: calc(1 - var(--bs-exit, 0));
}

.bs-intro-mist {
  position: absolute;
  z-index: 0;
  width: 46vw;
  height: 46vw;
  max-width: 480px;
  max-height: 480px;
  border-radius: 50%;
  filter: blur(60px);
  opacity: calc(var(--bs-mist-breathe, 0.3) * (1 - var(--bs-exit, 0)));
  transform: translate(var(--bs-mist-x, 0px), var(--bs-mist-y, 0px));
}

.bs-intro-mist--pink { top: 18%; left: 12%; background: #F0BEDE; }
.bs-intro-mist--purple { top: 34%; left: 62%; background: #C3A6EE; }
.bs-intro-mist--teal { top: 68%; left: 30%; background: #C2E0E8; }
```

Note: `.bs-intro-sky`/`.bs-intro-sunshine`/`.bs-intro-mist` read `var(--bs-exit, 0)` with a `0` fallback purely as defensive CSS (valid even if `--bs-exit` were ever unset) — in practice it's always set, since Step 2 above put it on `.bs-intro-stage`, the shared ancestor of the words and these backdrop layers alike.

- [ ] **Step 4: Extend the reduced-motion block**

Find:

```css
  .bs-intro-word {
    display: none !important;
  }

  .bs-spark {
    opacity: 1 !important;
  }
}
```

Replace with:

```css
  .bs-intro-word {
    display: none !important;
  }

  .bs-spark {
    opacity: 1 !important;
  }

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

(The tagline is shown immediately rather than hidden — see the Global Constraints note on why.)

- [ ] **Step 5: Build and verify**

```bash
cd "/mnt/c/Users/SirenDesign/Desktop/Portfolio/.worktrees/bonheur-story-page"
rm -rf /tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop/8f425d52-0d28-46cd-a43c-126b89fabac5/scratchpad/hugo-build
./bin/hugo --minify -d /tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop/8f425d52-0d28-46cd-a43c-126b89fabac5/scratchpad/hugo-build 2>&1 | tail -20
BUILD=/tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop/8f425d52-0d28-46cd-a43c-126b89fabac5/scratchpad/hugo-build
grep -c '320vh' "$BUILD/css/bonheur-story.css"
grep -c 'bs-tagline-flicker' "$BUILD/css/bonheur-story.css"
grep -c 'bs-mist-x' "$BUILD/css/bonheur-story.css"
```

Expected: build succeeds with zero `ERROR` lines; all three greps print `1` or more.

- [ ] **Step 6: Commit**

```bash
git add static/css/bonheur-story.css
git commit -m "Re-time intro phases for a tagline beat, tighten one-letter reveal, add backdrop/cue/tagline styles"
```

---

### Task 3: JS — tagline flicker latch, simplex2 port, mist-drift loop

**Files:**
- Modify: `static/js/bonheur-story.js`

**Interfaces:**
- Consumes: `.bs-intro-tagline`, `.bs-intro-mist` (from Task 1); `--bs-intro-progress` computation (already exists, extended in place).
- Produces: `.bs-intro-tagline--flicker` class (added once, consumed by Task 2's CSS); `--bs-mist-x`/`--bs-mist-y`/`--bs-mist-breathe` custom properties per `.bs-intro-mist` element (consumed by Task 2's CSS).

- [ ] **Step 1: Add the tagline flicker latch to the existing progress engine**

Find:

```js
  var intro = document.getElementById("bs-intro");
  if (!intro) return;

  var ticking = false;

  function updateProgress() {
    ticking = false;
    var rect = intro.getBoundingClientRect();
    var scrollableDistance = rect.height - window.innerHeight;
    var progress = scrollableDistance > 0 ? (0 - rect.top) / scrollableDistance : 1;
    progress = Math.min(1, Math.max(0, progress));
    document.documentElement.style.setProperty("--bs-intro-progress", progress.toFixed(4));
  }
```

Replace with:

```js
  var intro = document.getElementById("bs-intro");
  if (!intro) return;

  var tagline = document.querySelector(".bs-intro-tagline");
  var taglineFlickered = false;

  var ticking = false;

  function updateProgress() {
    ticking = false;
    var rect = intro.getBoundingClientRect();
    var scrollableDistance = rect.height - window.innerHeight;
    var progress = scrollableDistance > 0 ? (0 - rect.top) / scrollableDistance : 1;
    progress = Math.min(1, Math.max(0, progress));
    document.documentElement.style.setProperty("--bs-intro-progress", progress.toFixed(4));

    if (!taglineFlickered && tagline && progress >= 0.4) {
      taglineFlickered = true;
      tagline.classList.add("bs-intro-tagline--flicker");
    }
  }
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
git commit -m "Add the tagline's one-time flicker latch to the intro progress engine"
```

- [ ] **Step 4: Port simplex2 and add the mist-drift loop**

At the end of `static/js/bonheur-story.js`, append:

```js

// Deterministic 2D simplex noise (public-domain Gustavson algorithm), ported
// verbatim from the real Bonheur app's src/simplexNoise.js -- drives the
// living-light backdrop's mist-blob drift below. Skipped entirely under
// prefers-reduced-motion (the blobs are display:none anyway per the CSS, so
// this just avoids wasted per-frame work).
(function () {
  "use strict";

  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  var intro = document.getElementById("bs-intro");
  var blobs = document.querySelectorAll(".bs-intro-mist");
  if (!intro || !blobs.length) return;

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

  var seeds = [11.3, 47.9, 83.1];
  var t = 0;

  function frame() {
    var rect = intro.getBoundingClientRect();
    var inView = rect.bottom > 0 && rect.top < window.innerHeight;
    if (inView) {
      t += 0.006;
      for (var i = 0; i < blobs.length; i += 1) {
        var seed = seeds[i % seeds.length];
        var nx = simplex2(t, seed);
        var ny = simplex2(t + 100, seed);
        var breathe = 0.3 + simplex2(t, seed + 5.7) * 0.05;
        blobs[i].style.setProperty("--bs-mist-x", (nx * 24).toFixed(2) + "px");
        blobs[i].style.setProperty("--bs-mist-y", (ny * 24).toFixed(2) + "px");
        blobs[i].style.setProperty("--bs-mist-breathe", Math.max(0.06, breathe).toFixed(3));
      }
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
git commit -m "Port simplex2 and add the noise-driven mist-blob drift loop"
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
curl -s http://localhost:1313/Portfolio/css/bonheur-story.css | grep -c '320vh'
curl -s http://localhost:1313/Portfolio/js/bonheur-story.js | grep -c 'bs-mist-x'
```

Expected: prints `up after N tries`; both grep counts are non-zero (confirms fresh files are served, not a stale cache).

- [ ] **Step 2: Write and run the v2 check script**

Create `/tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop/8f425d52-0d28-46cd-a43c-126b89fabac5/scratchpad/check-intro-v2.js`:

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

  async function readState() {
    return page.evaluate(() => {
      const bon = document.querySelector('.bs-intro-word--bon');
      const heur = document.querySelector('.bs-intro-word--heur');
      const spark = document.querySelector('.bs-spark');
      const cue = document.querySelector('.bs-scroll-cue');
      const tagline = document.querySelector('.bs-intro-tagline');
      const mist = document.querySelector('.bs-intro-mist--pink');
      return {
        introProgress: getComputedStyle(document.documentElement).getPropertyValue('--bs-intro-progress').trim(),
        bonRect: bon.getBoundingClientRect(),
        heurRect: heur.getBoundingClientRect(),
        sparkOpacity: getComputedStyle(spark).opacity,
        cueOpacity: getComputedStyle(cue).opacity,
        taglineOpacity: getComputedStyle(tagline).opacity,
        taglineHasFlickerClass: tagline.classList.contains('bs-intro-tagline--flicker'),
        mistOpacity: getComputedStyle(mist).opacity,
      };
    });
  }

  // Total scrollable range is 320vh - 100vh = 220vh = 1980px at 900px viewport.
  const atStart = await readState();
  console.log('AT START (progress 0):', JSON.stringify(atStart));

  await page.evaluate(() => window.scrollTo(0, 1980 * 0.20)); // ~0.20
  await page.waitForTimeout(150);
  const cueCheck = await readState();
  console.log('AFTER TINY SCROLL (~0.20):', JSON.stringify(cueCheck));

  await page.evaluate(() => window.scrollTo(0, 1980 * 0.45)); // ~0.45, mid-tagline
  await page.waitForTimeout(800); // let the 1s flicker animation play out
  const taglinePeak = await readState();
  console.log('MID TAGLINE (~0.45):', JSON.stringify(taglinePeak));

  await page.evaluate(() => window.scrollTo(0, 1980 * 0.70)); // ~0.70, ignition ramping
  await page.waitForTimeout(200);
  const ignition = await readState();
  console.log('IGNITION (~0.70):', JSON.stringify(ignition));

  await page.evaluate(() => window.scrollTo(0, 1980 * 1.0)); // fully past
  await page.waitForTimeout(300);
  const pastIntro = await readState();
  console.log('PAST INTRO (~1.0):', JSON.stringify(pastIntro));

  const mistDrift1 = await page.evaluate(() => getComputedStyle(document.querySelector('.bs-intro-mist--pink')).transform);
  await page.waitForTimeout(600);
  const mistDrift2 = await page.evaluate(() => getComputedStyle(document.querySelector('.bs-intro-mist--pink')).transform);
  console.log('MIST DRIFT (should differ):', JSON.stringify({ mistDrift1, mistDrift2 }));

  await page.evaluate(() => {
    document.querySelector('[data-beat-id="ache"]').scrollIntoView();
  });
  await page.waitForTimeout(800);
  const beat2 = await page.evaluate(() => ({
    motif: document.getElementById('bs-motif').getAttribute('data-motif'),
    sparkOpacity: getComputedStyle(document.querySelector('.bs-spark')).opacity,
  }));
  console.log('BEAT 2 (ache, regression guard):', JSON.stringify(beat2));

  console.log('console/page errors:', JSON.stringify(errors));
  await browser.close();

  const browser2 = await chromium.launch();
  const page2 = await browser2.newContext({ reducedMotion: 'reduce' }).then((c) => c.newPage());
  await page2.goto('http://localhost:1313/Portfolio/work/bonheur/', { waitUntil: 'load' });
  await page2.waitForTimeout(300);
  const reduced = await page2.evaluate(() => ({
    cueDisplay: getComputedStyle(document.querySelector('.bs-scroll-cue')).display,
    skyDisplay: getComputedStyle(document.querySelector('.bs-intro-sky')).display,
    mistDisplay: getComputedStyle(document.querySelector('.bs-intro-mist--pink')).display,
    taglineOpacity: getComputedStyle(document.querySelector('.bs-intro-tagline')).opacity,
    taglineDisplay: getComputedStyle(document.querySelector('.bs-intro-tagline')).display,
    sparkOpacity: getComputedStyle(document.querySelector('.bs-spark')).opacity,
  }));
  console.log('REDUCED MOTION:', JSON.stringify(reduced));
  await browser2.close();
})();
```

Run it:

```bash
export LD_LIBRARY_PATH="/tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop/8f425d52-0d28-46cd-a43c-126b89fabac5/scratchpad/debs/extracted/usr/lib/x86_64-linux-gnu:$LD_LIBRARY_PATH"
NODE_PATH="/home/sirendesign/.npm/_npx/705bc6b22212b352/node_modules" node /tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop/8f425d52-0d28-46cd-a43c-126b89fabac5/scratchpad/check-intro-v2.js
```

Expected, checking the printed JSON by hand:
- `AT START`: `introProgress` `"0.0000"`; `bonRect`/`heurRect` show only roughly one letter's width on-screen at each bottom corner (compare against a screenshot in Step 3 -- exact pixel math is approximate, eyeball it); `sparkOpacity` `"0"`; `cueOpacity` `"1"`; `taglineOpacity` `"0"`.
- `AFTER TINY SCROLL (~0.20)`: `cueOpacity` `"0"` (gone well before 0.20, since it fully fades by 0.03).
- `MID TAGLINE (~0.45)`: `taglineOpacity` `"1"`; `taglineHasFlickerClass` `true` (latched once progress crossed 0.40).
- `IGNITION (~0.70)`: `sparkOpacity` greater than `"0"` and less than or equal to `"1"`; `taglineOpacity` `"0"` (already faded out by 0.65).
- `PAST INTRO (~1.0)`: `sparkOpacity` `"1"`; `mistOpacity` `"0"` (backdrop faded out with the recede).
- `MIST DRIFT`: `mistDrift1` and `mistDrift2` are different strings -- confirms the blob is actually moving frame-to-frame, not frozen.
- `BEAT 2 (ache, regression guard)`: `motif` `"fading"`; `sparkOpacity` in the `0.15`-`0.5` range (the existing flicker animation's own range) -- confirms beats 2-6 still work exactly as before.
- `console/page errors: []`.
- `REDUCED MOTION`: `cueDisplay`/`skyDisplay`/`mistDisplay` all `"none"`; `taglineOpacity` `"1"`; `taglineDisplay` NOT `"none"` (still rendered, just no animation); `sparkOpacity` `"1"`.

If any value doesn't match, stop and fix the CSS/JS before continuing.

- [ ] **Step 3: Screenshot pass for the one-letter reveal and overall look**

```bash
cd /tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop/8f425d52-0d28-46cd-a43c-126b89fabac5/scratchpad
mkdir -p shots-v2
cat > shot-intro-v2.js <<'EOF'
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto('http://localhost:1313/Portfolio/work/bonheur/', { waitUntil: 'load' });
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'shots-v2/00-start-oneletter-cue.png' });
  const targets = [
    ['01-approach', 1980 * 0.15],
    ['02-merge-tagline-in', 1980 * 0.35],
    ['03-tagline-flicker', 1980 * 0.45],
    ['04-tagline-out', 1980 * 0.60],
    ['05-ignition', 1980 * 0.70],
    ['06-recede', 1980 * 0.85],
    ['07-settled-beat1', 1980 * 1.15],
  ];
  for (const [name, y] of targets) {
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await page.waitForTimeout(300);
    await page.screenshot({ path: `shots-v2/${name}.png` });
  }
  await browser.close();
})();
EOF
export LD_LIBRARY_PATH="/tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop/8f425d52-0d28-46cd-a43c-126b89fabac5/scratchpad/debs/extracted/usr/lib/x86_64-linux-gnu:$LD_LIBRARY_PATH"
NODE_PATH="/home/sirendesign/.npm/_npx/705bc6b22212b352/node_modules" node shot-intro-v2.js
ls shots-v2/
```

Expected: all 8 screenshots generated. Review each (via the Read tool on the PNG paths): `00-start` shows the pulsing white chevron centered, and only "n"/"h" peeking at the bottom corners (not more); `02`-`04` show "Bonheur" merged with the tagline fading in, visible, then fading out, against the purple-sky/gold-sunshine/mist backdrop; `05`-`06` show the spark igniting and the words/backdrop receding; `07` shows the normal settled state with beat-1's card, matching the already-shipped look.

- [ ] **Step 4: Tune the one-letter reveal offset if needed**

If `00-start-oneletter-cue.png` shows more or less than one full letter per word, adjust the `50vw` constant in both `.bs-intro-word--bon`/`--heur` (introduced in Task 2 Step 1) up or down, rebuild, restart the server, and re-run Step 3's screenshot script until `00-start` shows exactly one full glyph per side. Commit any adjustment:

```bash
git add static/css/bonheur-story.css
git commit -m "Tune one-letter corner-reveal offset after visual check"
```

(Only commit if a change was actually needed — skip this step's commit if `50vw` already looked right.)

- [ ] **Step 5: Stop the dev server**

```bash
pkill -f "bin/hugo server" 2>/dev/null; echo done
```

- [ ] **Step 6: No further commit for this task** (verification only, beyond the conditional tuning commit in Step 4).
