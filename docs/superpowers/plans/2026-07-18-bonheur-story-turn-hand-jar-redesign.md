# Bonheur Story Turn Beat Hand+Jar Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace beat 3's ("The Turn") polaroid/cut-line/sticker-peel sequence with a new one: a mason jar sits dim at the bottom of the screen, a spark ignites center-screen out of Ache's darkness, a sketchy pencil-linework hand rises up and catches it, lowers back down, and drops it into the jar, which lights up gold — then the caption fades in.

**Architecture:** A fourth independent instance of the same `--bs-*-progress` scroll+rAF pattern this file already uses three times (`--bs-intro-progress`, `--bs-ache-progress`, the existing `--bs-turn-progress` handler) — no new JS is needed, since `bonheur-story.js` already computes `--bs-turn-progress` from `#bs-turn`'s scroll position and this redesign only changes what CSS/HTML does with that value. All new visual elements are static markup (no JS-generated DOM), matching this beat's existing convention, with every animation expressed as CSS `calc()`/`clamp()` phase windows reading `--bs-turn-progress`.

**Tech Stack:** Hugo v0.163.3 (extended), static site, no JS framework — verified via `./bin/hugo --minify` builds + `grep` assertions, plus a manual browser scroll-through at `http://localhost:1313/Portfolio/` (or via Playwright if available).

## Global Constraints

- Scope is beat 3 ("Turn") only — beats 1, 2, 4-6 are untouched.
- No JS changes required or permitted — the existing `--bs-turn-progress` handler in `static/js/bonheur-story.js` (lines 380-411) is reused completely unmodified.
- No new dependency — plain CSS/SVG, matching the rest of this page.
- Every old class (`.bs-turn-photo`, `.bs-turn-photo-image`, `.bs-turn-photo-image::before`, `.bs-turn-photo-spark`, `.bs-turn-cutline`, `.bs-turn-cutline circle`, `.bs-turn-sticker`, `.bs-turn-sticker-spark`) must be fully deleted from both HTML and CSS — none left dead.
- `.bs-turn-caption` is kept (same class name, new copy) — do not rename it.
- `prefers-reduced-motion: reduce` must show a static end-state (jar lit, caption visible, spark and hand both hidden) rather than attempting the animation without motion.
- This repo's Hugo dev server file-watcher is unreliable on this `/mnt/c/...` WSL mount — always fully stop and restart `./bin/hugo server` after edits.
- Reference spec: `docs/superpowers/specs/2026-07-18-bonheur-story-turn-hand-jar-redesign-design.md`.

---

### Task 1: HTML — replace the Turn beat markup

**Files:**
- Modify: `layouts/partials/home/bonheur-section.html:40-56`

**Interfaces:**
- Produces: `#bs-turn` (unchanged id/data attributes), `.bs-turn-stage` (unchanged), `.bs-turn-jar` (new — the jar wrapper div, contains `.bs-turn-jar-glass` SVG + `.bs-turn-jar-glow` div + `.bs-turn-jar-spark` div), `.bs-turn-spark` (new — the free-floating catchable spark), `.bs-turn-hand` (new — the hand wrapper div, contains `.bs-turn-hand-svg` with two `.bs-turn-hand-pose` groups), `.bs-turn-caption` (same class, new copy) — all consumed by Task 2's CSS.
- Consumes: nothing from other tasks.

- [ ] **Step 1: Replace the turn beat block**

In `layouts/partials/home/bonheur-section.html`, find (lines 40-56):

```html
    {{ else if eq .id "turn" }}
    <section class="bs-beat bs-turn" data-beat-id="{{ .id }}" data-motif="{{ .motif }}" id="bs-turn">
      <div class="bs-turn-stage">
        <div class="bs-turn-photo">
          <div class="bs-turn-photo-image">
            <div class="bs-turn-photo-spark"></div>
          </div>
        </div>
        <svg class="bs-turn-cutline" viewBox="0 0 120 120" aria-hidden="true">
          <circle cx="60" cy="60" r="54"></circle>
        </svg>
        <div class="bs-turn-sticker">
          <div class="bs-turn-sticker-spark"></div>
        </div>
        <p class="bs-turn-caption">So: catch it before it fades. A photo, a word for what it was — a breeze, a small win, someone's laugh. Bonheur cuts the moment out of its own photo and keeps it as a spark — a little sticker of the thing itself.</p>
      </div>
    </section>
```

Replace with:

```html
    {{ else if eq .id "turn" }}
    <section class="bs-beat bs-turn" data-beat-id="{{ .id }}" data-motif="{{ .motif }}" id="bs-turn">
      <div class="bs-turn-stage">
        <div class="bs-turn-jar" aria-hidden="true">
          <svg class="bs-turn-jar-glass" viewBox="0 0 110 170" preserveAspectRatio="xMidYMax meet">
            <defs>
              <linearGradient id="bsTurnJarGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stop-color="#ffffff" stop-opacity="0.35"/>
                <stop offset="0.25" stop-color="#F4C869" stop-opacity="0.12"/>
                <stop offset="0.6" stop-color="#F4C869" stop-opacity="0.08"/>
                <stop offset="1" stop-color="#ffffff" stop-opacity="0.25"/>
              </linearGradient>
            </defs>
            <rect x="30" y="8" width="50" height="16" rx="3" fill="#8a8f9a" stroke="#c8cdd6" stroke-width="1.5"></rect>
            <rect x="34" y="22" width="42" height="8" rx="2" fill="#6f7480"></rect>
            <path d="M32,30 L32,140 Q32,158 55,158 Q78,158 78,140 L78,30 Z" fill="url(#bsTurnJarGrad)" stroke="rgba(244,200,105,0.7)" stroke-width="2"></path>
            <line x1="32" y1="36" x2="78" y2="36" stroke="rgba(244,200,105,0.4)" stroke-width="1"></line>
            <line x1="32" y1="42" x2="78" y2="42" stroke="rgba(244,200,105,0.4)" stroke-width="1"></line>
          </svg>
          <div class="bs-turn-jar-glow" aria-hidden="true"></div>
          <div class="bs-turn-jar-spark" aria-hidden="true"></div>
        </div>
        <div class="bs-turn-spark" aria-hidden="true"></div>
        <div class="bs-turn-hand" aria-hidden="true">
          <svg class="bs-turn-hand-svg" viewBox="0 0 120 170">
            <g class="bs-turn-hand-pose bs-turn-hand-pose--open">
              <path class="bs-turn-hand-line-a" d="M34,170 L34,120 C34,108 30,100 26,88 C22,76 24,64 32,58 C38,54 46,56 48,64 L50,92 L54,60 C55,50 63,48 68,56 L70,92 L74,58 C76,48 84,48 86,58 L86,94 L90,66 C93,58 100,60 100,70 L98,108 C97,122 92,132 84,138 L84,170 Z"></path>
              <path class="bs-turn-hand-line-b" d="M34,170 L34,120 C34,108 30,100 26,88 C22,76 24,64 32,58 C38,54 46,56 48,64 L50,92 L54,60 C55,50 63,48 68,56 L70,92 L74,58 C76,48 84,48 86,58 L86,94 L90,66 C93,58 100,60 100,70 L98,108 C97,122 92,132 84,138 L84,170 Z" transform="translate(1.5,1)"></path>
            </g>
            <g class="bs-turn-hand-pose bs-turn-hand-pose--closed">
              <path class="bs-turn-hand-line-a" d="M34,170 L34,118 C34,96 48,82 65,80 C84,78 102,90 100,108 C100,124 90,136 78,140 L84,170 Z"></path>
              <path class="bs-turn-hand-line-b" d="M34,170 L34,118 C34,96 48,82 65,80 C84,78 102,90 100,108 C100,124 90,136 78,140 L84,170 Z" transform="translate(-1.2,1.3)"></path>
            </g>
          </svg>
        </div>
        <p class="bs-turn-caption">So: catch it before it fades. A photo, a word for what it was — a breeze, a small win, someone's laugh. Bonheur stores the moments.</p>
      </div>
    </section>
```

- [ ] **Step 2: Build and confirm the template compiles**

Run: `./bin/hugo --minify`
Expected: build succeeds with zero errors, no "unclosed action" or template-parsing warnings.

- [ ] **Step 3: Confirm old classes are gone from the HTML**

Run: `grep -n "bs-turn-photo\|bs-turn-cutline\|bs-turn-sticker" layouts/partials/home/bonheur-section.html`
Expected: no output (no matches).

- [ ] **Step 4: Commit**

```bash
git add layouts/partials/home/bonheur-section.html
git commit -m "Replace Turn beat's cut-line/sticker markup with jar/spark/hand"
```

---

### Task 2: CSS — visibility gating, reduced motion, and the full animation

**Files:**
- Modify: `static/css/bonheur-story.css:32-35` (default-hidden class list)
- Modify: `static/css/bonheur-story.css:60-63` (active-visible class list)
- Modify: `static/css/bonheur-story.css:295-312` (reduced-motion block)
- Modify: `static/css/bonheur-story.css:824-971` (the full TURN BEAT rule block)

**Interfaces:**
- Consumes: `.bs-turn-jar`, `.bs-turn-jar-glass`, `.bs-turn-jar-glow`, `.bs-turn-jar-spark`, `.bs-turn-spark`, `.bs-turn-hand`, `.bs-turn-hand-svg`, `.bs-turn-hand-pose--open`, `.bs-turn-hand-pose--closed`, `.bs-turn-hand-line-a`, `.bs-turn-hand-line-b`, `.bs-turn-caption` — all produced by Task 1's HTML.
- Produces: the fully animated beat, consumed only by the browser (no later task reads these CSS classes).

- [ ] **Step 1: Update the default-hidden class list**

Find (lines 29-37):

```css
.bs-ache-void,
.bs-ache-ink,
.bs-ache-text,
.bs-turn-photo,
.bs-turn-cutline,
.bs-turn-sticker,
.bs-turn-caption {
  visibility: hidden;
}
```

Replace with:

```css
.bs-ache-void,
.bs-ache-ink,
.bs-ache-text,
.bs-turn-jar,
.bs-turn-spark,
.bs-turn-hand,
.bs-turn-caption {
  visibility: hidden;
}
```

- [ ] **Step 2: Update the active-visible class list**

Find (lines 57-65):

```css
#bs-ache.bs-ache--active .bs-ache-void,
#bs-ache.bs-ache--active .bs-ache-ink,
#bs-ache.bs-ache--active .bs-ache-text,
#bs-turn.bs-turn--active .bs-turn-photo,
#bs-turn.bs-turn--active .bs-turn-cutline,
#bs-turn.bs-turn--active .bs-turn-sticker,
#bs-turn.bs-turn--active .bs-turn-caption {
  visibility: visible;
}
```

Replace with:

```css
#bs-ache.bs-ache--active .bs-ache-void,
#bs-ache.bs-ache--active .bs-ache-ink,
#bs-ache.bs-ache--active .bs-ache-text,
#bs-turn.bs-turn--active .bs-turn-jar,
#bs-turn.bs-turn--active .bs-turn-spark,
#bs-turn.bs-turn--active .bs-turn-hand,
#bs-turn.bs-turn--active .bs-turn-caption {
  visibility: visible;
}
```

- [ ] **Step 3: Update the reduced-motion block**

Find (lines 295-312):

```css
  .bs-turn-photo,
  .bs-turn-cutline {
    display: none !important;
  }

  .bs-turn-sticker {
    opacity: 1 !important;
    transform:
      translate(-50%, calc(-50% - 18px))
      translate(40px, -40px)
      rotate(8deg)
      scale(1.1) !important;
    filter: drop-shadow(0 16px 24px rgba(0, 0, 0, 0.5)) !important;
  }

  .bs-turn-caption {
    opacity: 1 !important;
  }
```

Replace with:

```css
  .bs-turn-spark,
  .bs-turn-hand {
    display: none !important;
  }

  .bs-turn-jar {
    opacity: 1 !important;
  }

  .bs-turn-jar-glow,
  .bs-turn-jar-spark {
    opacity: 1 !important;
  }

  .bs-turn-caption {
    opacity: 1 !important;
  }
```

- [ ] **Step 4: Replace the entire TURN BEAT rule block**

Find (lines 824-971 — from the `/* TURN BEAT` comment through the closing brace of `.bs-turn-caption`):

```css
/* TURN BEAT — a polaroid fades in from Ache's black, a cut-line traces
   itself around the spark, the spark peels free as a sticker, then the
   caption appears. Driven entirely by --bs-turn-progress (0-1), written by
   the scroll/rAF handler in bonheur-story.js -- a third, independent
   instance of the same pattern --bs-intro-progress and --bs-ache-progress
   already use. Unlike Ache, nothing here is JS-generated: every element is
   static markup, and all motion is CSS calc()/clamp() reading the single
   progress value. */

.bs-turn {
  position: relative;
  height: 220vh;
  display: block;
  padding: 0;
}

.bs-turn-stage {
  position: sticky;
  top: 0;
  height: 100vh;
  overflow: hidden;
  background: #0a0816;
}

.bs-turn-photo {
  --bs-turn-enter: clamp(0, calc(var(--bs-turn-progress, 0) / 0.15), 1);
  --bs-turn-peel: clamp(0, calc((var(--bs-turn-progress, 0) - 0.45) / 0.2), 1);
  --bs-turn-exit: clamp(0, calc((var(--bs-turn-progress, 0) - 0.9) / 0.1), 1);
  position: fixed;
  top: 50%;
  left: 50%;
  z-index: 1;
  width: 260px;
  padding: 14px 14px 50px;
  background: #faf6ef;
  border-radius: 2px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.4);
  opacity: calc(var(--bs-turn-enter) * (1 - 0.45 * var(--bs-turn-peel)) * (1 - var(--bs-turn-exit)));
  transform: translate(-50%, -50%) scale(calc(0.9 + 0.1 * var(--bs-turn-enter)));
  pointer-events: none;
}

.bs-turn-photo-image {
  position: relative;
  width: 232px;
  height: 232px;
  overflow: hidden;
  border-radius: 1px;
}

.bs-turn-photo-image::before {
  content: "";
  position: absolute;
  inset: -20px;
  background: radial-gradient(circle at 40% 35%, #fff3d6 0%, #f4c869 45%, #f2a879 75%, #f4c869 100%);
  filter: blur(10px);
}

.bs-turn-photo-spark {
  position: absolute;
  top: 50%;
  left: 50%;
  z-index: 1;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  background: #F4C869;
  box-shadow: 0 0 8px 5px rgba(244, 200, 105, 0.22);
}

.bs-turn-cutline {
  --bs-turn-draw: clamp(0, calc((var(--bs-turn-progress, 0) - 0.15) / 0.3), 1);
  --bs-turn-peel: clamp(0, calc((var(--bs-turn-progress, 0) - 0.45) / 0.2), 1);
  position: fixed;
  top: 50%;
  left: 50%;
  z-index: 2;
  width: 120px;
  height: 120px;
  transform: translate(-50%, calc(-50% - 18px));
  opacity: calc(1 - var(--bs-turn-peel));
  pointer-events: none;
}

.bs-turn-cutline circle {
  fill: none;
  stroke: rgba(244, 200, 105, 0.8);
  stroke-width: 2;
  /* Circumference of r=54: 2 * PI * 54 ≈ 339.29 */
  stroke-dasharray: 339.29px;
  stroke-dashoffset: calc(339.29px * (1 - var(--bs-turn-draw)));
}

.bs-turn-sticker {
  --bs-turn-fade: clamp(0, calc((var(--bs-turn-progress, 0) - 0.35) / 0.1), 1);
  --bs-turn-peel: clamp(0, calc((var(--bs-turn-progress, 0) - 0.45) / 0.2), 1);
  --bs-turn-exit: clamp(0, calc((var(--bs-turn-progress, 0) - 0.9) / 0.1), 1);
  position: fixed;
  top: 50%;
  left: 50%;
  z-index: 3;
  width: 108px;
  height: 108px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid #faf6ef;
  opacity: calc(var(--bs-turn-fade) * (1 - var(--bs-turn-exit)));
  transform:
    translate(-50%, calc(-50% - 18px))
    translate(calc(var(--bs-turn-peel) * 40px), calc(var(--bs-turn-peel) * -40px))
    rotate(calc(var(--bs-turn-peel) * 8deg))
    scale(calc(1 + var(--bs-turn-peel) * 0.1));
  filter: drop-shadow(0 calc(var(--bs-turn-peel) * 16px) calc(var(--bs-turn-peel) * 24px) rgba(0, 0, 0, 0.5));
  background: radial-gradient(circle at 40% 35%, #fff3d6 0%, #f4c869 50%, #f2a879 100%);
  pointer-events: none;
}

.bs-turn-sticker-spark {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  background: #F4C869;
  box-shadow: 0 0 8px 5px rgba(244, 200, 105, 0.22);
}

.bs-turn-caption {
  --bs-turn-caption-in: clamp(0, calc((var(--bs-turn-progress, 0) - 0.65) / 0.1), 1);
  --bs-turn-exit: clamp(0, calc((var(--bs-turn-progress, 0) - 0.9) / 0.1), 1);
  position: fixed;
  top: calc(50% + 130px);
  left: 50%;
  z-index: 3;
  transform: translate(-50%, 0);
  max-width: 30rem;
  padding: 0 1.5rem;
  margin: 0;
  text-align: center;
  font-size: 1.05rem;
  line-height: 1.7;
  color: #f4f0ff;
  pointer-events: none;
  opacity: calc(var(--bs-turn-caption-in) * (1 - var(--bs-turn-exit)));
}
```

Replace with:

```css
/* TURN BEAT — a mason jar sits dim at the bottom of Ache's blackness, a
   spark ignites center-screen, a sketchy pencil-linework hand rises up to
   catch it, carries it back down, and drops it into the jar, which lights
   up gold. Driven entirely by --bs-turn-progress (0-1), written by the
   scroll/rAF handler in bonheur-story.js -- a third, independent instance
   of the same pattern --bs-intro-progress and --bs-ache-progress already
   use. Nothing here is JS-generated: every element is static markup, and
   all motion is CSS calc()/clamp() reading the single progress value. */

.bs-turn {
  position: relative;
  height: 220vh;
  display: block;
  padding: 0;
}

.bs-turn-stage {
  position: sticky;
  top: 0;
  height: 100vh;
  overflow: hidden;
  background: #0a0816;
}

/* Shared exit-fade window so fixed elements don't hard-pop the instant
   #bs-turn's outer --active class snaps off at the beat's bottom edge --
   same convention as --bs-ache-progress's own void/ink/text-out windows. */
.bs-turn-jar,
.bs-turn-caption {
  --bs-turn-exit: clamp(0, calc((var(--bs-turn-progress, 0) - 0.9) / 0.1), 1);
}

.bs-turn-jar {
  --bs-turn-jar-in: clamp(0, calc(var(--bs-turn-progress, 0) / 0.12), 1);
  position: fixed;
  bottom: 6vh;
  left: 50%;
  z-index: 1;
  width: 130px;
  height: 190px;
  transform: translateX(-50%);
  opacity: calc(var(--bs-turn-jar-in) * (1 - var(--bs-turn-exit)));
  pointer-events: none;
}

.bs-turn-jar-glass {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

/* Fills the jar's lower two-thirds with a warm gold glow once the spark
   has dropped in -- grown from 0, not just faded in, so the glass visibly
   goes from dim to lit rather than an instant color swap. */
.bs-turn-jar-glow {
  --bs-turn-jar-lit: clamp(0, calc((var(--bs-turn-progress, 0) - 0.75) / 0.1), 1);
  position: absolute;
  left: 8%;
  right: 8%;
  bottom: 8%;
  height: 60%;
  border-radius: 0 0 40px 40px;
  background: radial-gradient(circle at 50% 100%, rgba(244, 200, 105, 0.55), transparent 70%);
  opacity: calc(var(--bs-turn-jar-lit) * (1 - var(--bs-turn-exit)));
  pointer-events: none;
}

.bs-turn-jar-spark {
  --bs-turn-jar-lit: clamp(0, calc((var(--bs-turn-progress, 0) - 0.75) / 0.1), 1);
  position: absolute;
  left: 50%;
  bottom: 22%;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  transform: translateX(-50%);
  background: #F4C869;
  box-shadow: 0 0 8px 5px rgba(244, 200, 105, 0.22);
  opacity: calc(var(--bs-turn-jar-lit) * (1 - var(--bs-turn-exit)));
  pointer-events: none;
}

/* The free-floating spark that ignites center-screen and gets caught --
   stays put at its ignition point the whole time (the hand travels to
   meet it, not the other way around); fades out once the closing fingers
   have fully covered it rather than needing to travel anywhere itself. */
.bs-turn-spark {
  --bs-turn-spark-in: clamp(0, calc((var(--bs-turn-progress, 0) - 0.12) / 0.18), 1);
  --bs-turn-spark-out: clamp(0, calc((var(--bs-turn-progress, 0) - 0.45) / 0.1), 1);
  position: fixed;
  top: 38vh;
  left: 50%;
  z-index: 2;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  background: #F4C869;
  box-shadow: 0 0 8px 5px rgba(244, 200, 105, 0.22);
  opacity: calc(var(--bs-turn-spark-in) * (1 - var(--bs-turn-spark-out)));
  animation: bs-organic-drift 8s ease-in-out infinite;
  pointer-events: none;
}

/* The hand's own vertical position is one running total across three
   non-overlapping progress windows -- rise up to the spark, lower to the
   jar, then exit back off-screen -- added onto a 135vh (guaranteed
   off-screen below any real viewport) base. Same "sum of clamped ramps"
   technique the old .bs-turn-sticker used for its peel transform. */
.bs-turn-hand {
  --bs-turn-hand-rise: clamp(0, calc((var(--bs-turn-progress, 0) - 0.3) / 0.15), 1);
  --bs-turn-hand-lower: clamp(0, calc((var(--bs-turn-progress, 0) - 0.55) / 0.2), 1);
  --bs-turn-hand-exit: clamp(0, calc((var(--bs-turn-progress, 0) - 0.85) / 0.15), 1);
  position: fixed;
  top: calc(135vh - (97vh * var(--bs-turn-hand-rise)) + (40vh * var(--bs-turn-hand-lower)) + (57vh * var(--bs-turn-hand-exit)));
  left: 50%;
  z-index: 3;
  width: 90px;
  height: 128px;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.bs-turn-hand-svg {
  width: 100%;
  height: 100%;
  overflow: visible;
}

.bs-turn-hand-line-a,
.bs-turn-hand-line-b {
  fill: none;
  stroke: #E8E4DA;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.bs-turn-hand-line-a {
  stroke-width: 2.5;
}

.bs-turn-hand-line-b {
  stroke-width: 1.6;
  opacity: 0.5;
}

/* Open/closed pose crossfade -- fingers open while rising to the spark
   (0.30-0.45), curl closed over it (0.45-0.55), stay closed through the
   lower (0.55-0.75), then open again releasing it into the jar
   (0.75-0.85). Two full poses cross-faded rather than a single morphed
   path -- simpler, and avoids interpolating mismatched path point counts. */
.bs-turn-hand-pose--closed {
  --bs-turn-hand-closed-in: clamp(0, calc((var(--bs-turn-progress, 0) - 0.45) / 0.1), 1);
  --bs-turn-hand-closed-out: clamp(0, calc((var(--bs-turn-progress, 0) - 0.75) / 0.1), 1);
  opacity: calc(var(--bs-turn-hand-closed-in) * (1 - var(--bs-turn-hand-closed-out)));
}

.bs-turn-hand-pose--open {
  --bs-turn-hand-closed-in: clamp(0, calc((var(--bs-turn-progress, 0) - 0.45) / 0.1), 1);
  --bs-turn-hand-closed-out: clamp(0, calc((var(--bs-turn-progress, 0) - 0.75) / 0.1), 1);
  opacity: calc(1 - (var(--bs-turn-hand-closed-in) * (1 - var(--bs-turn-hand-closed-out))));
}

.bs-turn-caption {
  --bs-turn-caption-in: clamp(0, calc((var(--bs-turn-progress, 0) - 0.85) / 0.1), 1);
  position: fixed;
  bottom: 24vh;
  left: 50%;
  z-index: 3;
  transform: translateX(-50%);
  max-width: 30rem;
  padding: 0 1.5rem;
  margin: 0;
  text-align: center;
  font-size: 1.05rem;
  line-height: 1.7;
  color: #f4f0ff;
  pointer-events: none;
  opacity: calc(var(--bs-turn-caption-in) * (1 - var(--bs-turn-exit)));
}
```

- [ ] **Step 5: Build and confirm CSS compiles cleanly**

Run: `./bin/hugo --minify`
Expected: build succeeds with zero errors.

- [ ] **Step 6: Confirm old classes are gone from the CSS**

Run: `grep -n "bs-turn-photo\|bs-turn-cutline\|bs-turn-sticker" static/css/bonheur-story.css`
Expected: no output (no matches).

- [ ] **Step 7: Commit**

```bash
git add static/css/bonheur-story.css
git commit -m "Redesign Turn beat as a spark-catch-and-jar sequence"
```

---

### Task 3: Verification and cleanup

**Files:**
- None modified — this task only verifies Tasks 1-2 and fixes anything the checks below surface.

**Interfaces:**
- Consumes: the finished markup/CSS from Tasks 1-2.
- Produces: nothing further downstream.

- [ ] **Step 1: Confirm no leftover references anywhere in the repo**

Run: `grep -rn "bs-turn-photo\|bs-turn-cutline\|bs-turn-sticker" --include="*.css" --include="*.js" --include="*.html" .`
Expected: no output (no matches anywhere in the codebase).

- [ ] **Step 2: Restart the Hugo dev server**

```bash
pkill -f "bin/hugo server" 2>/dev/null; sleep 1
nohup ./bin/hugo server -D --bind 0.0.0.0 --port 1313 > /tmp/hugo-server.log 2>&1 &
sleep 3
cat /tmp/hugo-server.log
```

Expected: log shows "Watching for changes..." with no build errors.

- [ ] **Step 3: Manual browser scroll-through**

Open `http://localhost:1313/Portfolio/work/bonheur/` (or scroll to `#bonheur` on the homepage) and scroll through beat 3 ("Turn"), confirming in order:

- Screen stays black entering the beat; the dim, empty jar fades in at bottom-center before anything else appears.
- The spark ignites center-screen and settles into a light idle drift.
- The sketchy hand visibly rises from the bottom; the double-stroke lines read as pencil linework rather than a single clean vector line.
- Fingers visibly curl closed around the spark (spark dims/hides as the hand closes, not an instant cut).
- The hand lowers back toward the jar and opens over its mouth; the spark reappears inside the jar as the hand's copy fades, and the jar's glass visibly transitions from dim to a warm gold glow.
- The hand withdraws out of frame; the caption fades in only after the hand is gone and the jar is lit — not before.
- Beats 1, 2, 4-6 are pixel-for-pixel unaffected; the persistent spark still correctly re-ignites (`motif="jar-fill"`) entering beat 4.
- No new console errors (check browser devtools console).

If any of the above doesn't match — e.g. an animation phase's progress window feels off, or the hand's silhouette or jar shape needs a visual tweak — adjust the relevant `clamp()` window bounds or SVG path coordinates in `static/css/bonheur-story.css` / `layouts/partials/home/bonheur-section.html` directly, save, and re-check (the Hugo dev server rebuilds on save, but per the Global Constraints, restart it if changes don't appear to take effect).

- [ ] **Step 4: Confirm reduced motion**

In browser devtools, enable "emulate prefers-reduced-motion: reduce" (Chrome DevTools → Rendering tab → Emulate CSS media feature prefers-reduced-motion), reload, and scroll to beat 3. Confirm:

- The jar is shown fully lit/glowing immediately, with no spark or hand ever appearing.
- The caption is fully visible.
- No animation plays.

- [ ] **Step 5: Final build check**

Run: `./bin/hugo --minify`
Expected: build succeeds with zero errors, confirming the committed state is production-ready.
