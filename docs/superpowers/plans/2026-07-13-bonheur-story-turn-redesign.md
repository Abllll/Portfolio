# Bonheur Story Turn Beat Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace beat 3's ("The Turn") standard card with a scroll-scrubbed sequence: a polaroid photo fades in from Ache's black ending, a dashed cut-line traces itself around the spark inside it, the spark peels free as a sticker with a growing drop shadow while the photo dims, then the beat's caption fades in beneath the finished sticker.

**Architecture:** A third, independent instance of the same `--bs-intro-progress`/`--bs-ache-progress` pattern — a new `--bs-turn-progress` custom property computed by its own scroll+rAF handler, driving entirely static (no JS-generated elements, unlike Ache's random stars/inks) photo/cutline/sticker/caption markup via CSS `calc()`/`clamp()`. The existing per-beat `IntersectionObserver` (which syncs the persistent `#bs-motif` spark's `data-motif`) is untouched — the new block keeps the `.bs-beat`/`data-beat-id`/`data-motif` attributes it already relies on.

**Tech Stack:** Hugo v0.163.3 (extended), static site, no JS framework — verified via `./bin/hugo --minify` builds + `grep` assertions, plus a Playwright browser check.

## Global Constraints

- Scope is beat 3 only — beats 1, 2, 4-6 are untouched.
- No new dependency — plain CSS/JS, matching the rest of this page.
- All new elements are static markup driven purely by `--bs-turn-progress` via CSS `calc()`/`clamp()` — no JS-side element generation or per-frame drift is needed for this beat (unlike Ache's stars/inks), since nothing in this sequence needs genuine randomness.
- `prefers-reduced-motion: reduce` must show a static end-state (dark background, photo hidden, sticker shown fully peeled at its final position, caption visible, no cut-line) rather than attempting the animation without motion.
- This repo's Hugo dev server file-watcher is unreliable on this `/mnt/c/...` WSL mount — always fully stop and restart `./bin/hugo server` after edits.
- Reference spec: `docs/superpowers/specs/2026-07-13-bonheur-story-turn-redesign-design.md`.

---

### Task 1: Data + HTML — the "turn" branch, photo, cut-line, sticker, caption

**Files:**
- Modify: `data/bonheur_story.yaml`
- Modify: `layouts/work/bonheur-story.html`

**Interfaces:**
- Produces: `#bs-turn` (beat section), `.bs-turn-stage` (sticky inner stage), `.bs-turn-photo` / `.bs-turn-photo-image` / `.bs-turn-photo-spark` (the polaroid), `.bs-turn-cutline` (SVG trace, containing a `circle`), `.bs-turn-sticker` / `.bs-turn-sticker-spark` (the peeled piece), `.bs-turn-caption` (hardcoded copy) — all consumed by Task 2 (CSS). Task 3 (JS) only needs `#bs-turn`.
- Consumes: nothing new from other tasks.

- [ ] **Step 1: Drop the now-unused fields from the "turn" YAML entry**

In `data/bonheur_story.yaml`, find:

```yaml
  - id: turn
    number: 3
    title: "The Turn"
    body: "So: catch it before it fades. A photo, a word for what it was — a breeze, a small win, someone's laugh. Bonheur cuts the moment out of its own photo and keeps it as a spark — a little sticker of the thing itself."
    motif: caught
    media: null
```

Replace with:

```yaml
  - id: turn
    number: 3
    motif: caught
```

- [ ] **Step 2: Branch the beats loop so "turn" renders the new block**

In `layouts/work/bonheur-story.html`, find:

```html
    {{ range .Site.Data.bonheur_story.beats }}
    {{ if eq .id "ache" }}
    <section class="bs-beat bs-ache" data-beat-id="{{ .id }}" data-motif="{{ .motif }}" id="bs-ache">
      <div class="bs-ache-stage">
        <div class="bs-ache-void" aria-hidden="true"></div>
        <p class="bs-ache-text">We often let the good moments slip away unnoticed. Our minds are wired with a negativity bias, so what captures our attention isn't always what truly mattered. What moved us most is often forgotten first.</p>
      </div>
    </section>
    {{ else }}
    <section class="bs-beat" data-beat-id="{{ .id }}" data-motif="{{ .motif }}">
```

Replace with:

```html
    {{ range .Site.Data.bonheur_story.beats }}
    {{ if eq .id "ache" }}
    <section class="bs-beat bs-ache" data-beat-id="{{ .id }}" data-motif="{{ .motif }}" id="bs-ache">
      <div class="bs-ache-stage">
        <div class="bs-ache-void" aria-hidden="true"></div>
        <p class="bs-ache-text">We often let the good moments slip away unnoticed. Our minds are wired with a negativity bias, so what captures our attention isn't always what truly mattered. What moved us most is often forgotten first.</p>
      </div>
    </section>
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
    {{ else }}
    <section class="bs-beat" data-beat-id="{{ .id }}" data-motif="{{ .motif }}">
```

(Everything is hand-authored static markup — unlike Ache's stars/inks, nothing here needs runtime-generated randomness, so it all belongs in the template, not JS.)

- [ ] **Step 3: Build and verify**

```bash
cd "/mnt/c/Users/SirenDesign/Desktop/Portfolio/.worktrees/bonheur-story-page"
SCRATCH=/tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop/43b3ca1f-3b51-40c0-aaac-c587e2f02505/scratchpad
rm -rf "$SCRATCH/hugo-build"
./bin/hugo --minify -d "$SCRATCH/hugo-build" 2>&1 | tail -20
BUILD="$SCRATCH/hugo-build"
echo "bs-turn section: $(grep -oc 'id=bs-turn' "$BUILD/work/bonheur/index.html")"
echo "turn-photo: $(grep -oc 'bs-turn-photo' "$BUILD/work/bonheur/index.html")"
echo "turn-cutline: $(grep -oc 'bs-turn-cutline' "$BUILD/work/bonheur/index.html")"
echo "turn-sticker: $(grep -oc 'bs-turn-sticker' "$BUILD/work/bonheur/index.html")"
echo "turn-caption: $(grep -oc 'bs-turn-caption' "$BUILD/work/bonheur/index.html")"
echo "old turn title gone: $(grep -oc 'The Turn' "$BUILD/work/bonheur/index.html")"
echo "other beats intact: $(grep -oc 'bs-beat-number' "$BUILD/work/bonheur/index.html")"
```

Expected: build succeeds with zero `ERROR` lines; `bs-turn section`, `turn-photo`, `turn-cutline`, `turn-sticker`, `turn-caption` each print `1` or more; `old turn title gone` prints `0` (the literal string "The Turn" no longer appears — it was only in the dropped `title` field); `other beats intact` prints `4` (spark, jar, star-cloud, keeping still render their standard `.bs-beat-number` card — `ache` and `turn` are now both custom).

- [ ] **Step 4: Commit**

```bash
git add data/bonheur_story.yaml layouts/work/bonheur-story.html
git commit -m "Branch the Turn beat into a dedicated block, drop its old card copy"
```

---

### Task 2: CSS — photo, cut-line trace, sticker peel, caption, reduced motion

**Files:**
- Modify: `static/css/bonheur-story.css`

**Interfaces:**
- Consumes: `.bs-turn`, `.bs-turn-stage`, `.bs-turn-photo`, `.bs-turn-photo-image`, `.bs-turn-photo-spark`, `.bs-turn-cutline` (+ its `circle`), `.bs-turn-sticker`, `.bs-turn-sticker-spark`, `.bs-turn-caption` (all from Task 1); `--bs-turn-progress` (from Task 3, read via `var(..., 0)` fallback so this task's CSS is valid before Task 3 exists).
- Produces: all visual behavior of the sequence — no other task depends on this task's internals beyond the class names above.

**Shared geometry note used throughout this task:** the photo card is 260px wide with `14px 14px 50px` padding, making its inner image 232×232px. The image's vertical center sits 130px from the card's top edge, while the card's own vertical center sits 148px from its top edge (`(14 + 232 + 50) / 2`) — an **18px** difference. `.bs-turn-cutline` and `.bs-turn-sticker` are independent fixed-position siblings of `.bs-turn-photo` (not its children — nesting them inside would make the sticker inherit the photo's dimming during peel, which must NOT happen so the lifted sticker reads as brighter/crisper than the fading photo behind it), so each bakes in this same `-18px` vertical correction to land exactly on the spark's screen position.

- [ ] **Step 1: Add the beat container, photo card, and photo contents**

At the end of `static/css/bonheur-story.css`, append:

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
  position: fixed;
  top: 50%;
  left: 50%;
  z-index: 1;
  width: 260px;
  padding: 14px 14px 50px;
  background: #faf6ef;
  border-radius: 2px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.4);
  opacity: calc(var(--bs-turn-enter) * (1 - 0.45 * var(--bs-turn-peel)));
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
  background: radial-gradient(circle, #fff8e7 0%, #f4c869 45%, transparent 75%);
  box-shadow: 0 0 24px 8px rgba(244, 200, 105, 0.55);
}
```

- [ ] **Step 2: Add the cut-line trace**

Append:

```css

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
```

- [ ] **Step 3: Add the peeling sticker**

Append:

```css

.bs-turn-sticker {
  --bs-turn-fade: clamp(0, calc((var(--bs-turn-progress, 0) - 0.35) / 0.1), 1);
  --bs-turn-peel: clamp(0, calc((var(--bs-turn-progress, 0) - 0.45) / 0.2), 1);
  position: fixed;
  top: 50%;
  left: 50%;
  z-index: 3;
  width: 108px;
  height: 108px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid #faf6ef;
  opacity: var(--bs-turn-fade);
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
  background: radial-gradient(circle, #fff8e7 0%, #f4c869 45%, transparent 75%);
  box-shadow: 0 0 24px 8px rgba(244, 200, 105, 0.55);
}
```

- [ ] **Step 4: Add the caption**

Append:

```css

.bs-turn-caption {
  --bs-turn-caption-in: clamp(0, calc((var(--bs-turn-progress, 0) - 0.65) / 0.2), 1);
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
  opacity: var(--bs-turn-caption-in);
}
```

- [ ] **Step 5: Extend the reduced-motion block**

Find:

```css
  .bs-ache-star,
  .bs-ache-ink,
  .bs-ache-void {
    display: none !important;
  }
```

Replace with:

```css
  .bs-ache-star,
  .bs-ache-ink,
  .bs-ache-void {
    display: none !important;
  }

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

- [ ] **Step 6: Build and verify**

```bash
cd "/mnt/c/Users/SirenDesign/Desktop/Portfolio/.worktrees/bonheur-story-page"
SCRATCH=/tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop/43b3ca1f-3b51-40c0-aaac-c587e2f02505/scratchpad
rm -rf "$SCRATCH/hugo-build"
./bin/hugo --minify -d "$SCRATCH/hugo-build" 2>&1 | tail -20
BUILD="$SCRATCH/hugo-build"
grep -c 'bs-turn-progress' "$BUILD/css/bonheur-story.css"
grep -c 'bs-turn-draw' "$BUILD/css/bonheur-story.css"
grep -c 'bs-turn-peel' "$BUILD/css/bonheur-story.css"
grep -c 'bs-turn-caption-in' "$BUILD/css/bonheur-story.css"
```

Expected: build succeeds with zero `ERROR` lines; all four greps print `1` or more.

- [ ] **Step 7: Commit**

```bash
git add static/css/bonheur-story.css
git commit -m "Add Turn beat CSS: photo, cut-line trace, peeling sticker, caption"
```

---

### Task 3: JS — turn progress engine

**Files:**
- Modify: `static/js/bonheur-story.js`

**Interfaces:**
- Consumes: `#bs-turn` (from Task 1).
- Produces: `--bs-turn-progress` on `document.documentElement`.

- [ ] **Step 1: Add the turn progress engine**

At the end of `static/js/bonheur-story.js`, append:

```js

// Drives --bs-turn-progress (0-1) from how far the user has scrolled
// through #bs-turn -- a third, independent instance of the same pattern
// --bs-intro-progress and --bs-ache-progress already use. Unlike Ache,
// this beat has no JS-generated elements or per-frame drift -- all visual
// behavior lives in bonheur-story.css as calc()/clamp() expressions
// reading this one property.
(function () {
  "use strict";

  var turn = document.getElementById("bs-turn");
  if (!turn) return;

  var ticking = false;

  function updateTurnProgress() {
    ticking = false;
    var rect = turn.getBoundingClientRect();
    var scrollableDistance = rect.height - window.innerHeight;
    var progress = scrollableDistance > 0 ? (0 - rect.top) / scrollableDistance : 1;
    progress = Math.min(1, Math.max(0, progress));
    document.documentElement.style.setProperty("--bs-turn-progress", progress.toFixed(4));
  }

  function onScrollOrResize() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(updateTurnProgress);
  }

  window.addEventListener("scroll", onScrollOrResize, { passive: true });
  window.addEventListener("resize", onScrollOrResize);
  updateTurnProgress();
})();
```

- [ ] **Step 2: Build and verify the syntax still checks out**

```bash
cd "/mnt/c/Users/SirenDesign/Desktop/Portfolio/.worktrees/bonheur-story-page"
SCRATCH=/tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop/43b3ca1f-3b51-40c0-aaac-c587e2f02505/scratchpad
rm -rf "$SCRATCH/hugo-build"
./bin/hugo --minify -d "$SCRATCH/hugo-build" 2>&1 | tail -20
BUILD="$SCRATCH/hugo-build"
node --check "$BUILD/js/bonheur-story.js" && echo "syntax ok"
```

Expected: build succeeds with zero `ERROR` lines; `node --check` prints nothing followed by `syntax ok`.

- [ ] **Step 3: Commit**

```bash
git add static/js/bonheur-story.js
git commit -m "Add the Turn beat's own scroll-scrubbed progress engine"
```

---

### Task 4: Browser verification

**Files:** none (verification only)

- [ ] **Step 1: Start a clean Hugo dev server**

```bash
pkill -f "bin/hugo server" 2>/dev/null
cd "/mnt/c/Users/SirenDesign/Desktop/Portfolio/.worktrees/bonheur-story-page"
SCRATCH=/tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop/43b3ca1f-3b51-40c0-aaac-c587e2f02505/scratchpad
./bin/hugo server -D --port 1313 > "$SCRATCH/hugo-server.log" 2>&1 &
for i in $(seq 1 20); do
  code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:1313/Portfolio/work/bonheur/)
  if [ "$code" = "200" ]; then echo "up after $i tries"; break; fi
  sleep 1
done
curl -s http://localhost:1313/Portfolio/css/bonheur-story.css | grep -c 'bs-turn-progress'
curl -s http://localhost:1313/Portfolio/js/bonheur-story.js | grep -c 'bs-turn-progress'
```

Expected: prints `up after N tries`; both grep counts are non-zero (confirms fresh files are served).

- [ ] **Step 2: Write and run the check script**

Create `$SCRATCH/check-turn.js` (substitute the real `$SCRATCH` path):

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

  const turnGeom = await page.evaluate(() => {
    const el = document.getElementById('bs-turn');
    const rect = el.getBoundingClientRect();
    return { top: rect.top + window.scrollY, height: rect.height };
  });
  console.log('turn geometry:', JSON.stringify(turnGeom));

  const scrollable = turnGeom.height - 900;

  async function readAt(progressFraction) {
    const y = turnGeom.top + scrollable * progressFraction;
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await page.waitForTimeout(200);
    return page.evaluate(() => {
      const cutline = document.querySelector('.bs-turn-cutline circle');
      return {
        turnProgress: getComputedStyle(document.documentElement).getPropertyValue('--bs-turn-progress').trim(),
        photoOpacity: getComputedStyle(document.querySelector('.bs-turn-photo')).opacity,
        cutlineDashoffset: getComputedStyle(cutline).strokeDashoffset,
        cutlineOpacity: getComputedStyle(document.querySelector('.bs-turn-cutline')).opacity,
        stickerOpacity: getComputedStyle(document.querySelector('.bs-turn-sticker')).opacity,
        stickerTransform: getComputedStyle(document.querySelector('.bs-turn-sticker')).transform,
        captionOpacity: getComputedStyle(document.querySelector('.bs-turn-caption')).opacity,
      };
    });
  }

  const at05 = await readAt(0.05);
  console.log('AT ~0.05 (photo entering):', JSON.stringify(at05));

  const at30 = await readAt(0.30);
  console.log('AT ~0.30 (cut-line mid-trace):', JSON.stringify(at30));

  const at55 = await readAt(0.55);
  console.log('AT ~0.55 (mid-peel):', JSON.stringify(at55));

  const at95 = await readAt(0.95);
  console.log('AT ~0.95 (caption settled):', JSON.stringify(at95));

  // Regression guard: Ache beat and a later beat unaffected.
  const acheGeom = await page.evaluate(() => {
    const el = document.getElementById('bs-ache');
    const rect = el.getBoundingClientRect();
    return { top: rect.top + window.scrollY, height: rect.height };
  });
  await page.evaluate((y) => window.scrollTo(0, y), acheGeom.top + (acheGeom.height - 900) * 0.95);
  await page.waitForTimeout(300);
  const acheStillWorks = await page.evaluate(() => ({
    textOpacity: getComputedStyle(document.querySelector('.bs-ache-text')).opacity,
  }));
  console.log('ACHE REGRESSION GUARD:', JSON.stringify(acheStillWorks));

  await page.evaluate(() => {
    document.querySelector('[data-beat-id="jar"]').scrollIntoView();
  });
  await page.waitForTimeout(800);
  const jarBeat = await page.evaluate(() => {
    const beat = document.querySelector('[data-beat-id="jar"]');
    return {
      isVisible: beat.classList.contains('is-visible'),
      motif: document.getElementById('bs-motif').getAttribute('data-motif'),
    };
  });
  console.log('BEAT "jar" REGRESSION GUARD:', JSON.stringify(jarBeat));

  console.log('console/page errors:', JSON.stringify(errors));
  await browser.close();

  const browser2 = await chromium.launch();
  const page2 = await browser2.newContext({ reducedMotion: 'reduce' }).then((c) => c.newPage());
  await page2.goto('http://localhost:1313/Portfolio/work/bonheur/', { waitUntil: 'load' });
  await page2.waitForTimeout(300);
  const reduced = await page2.evaluate(() => ({
    photoDisplay: getComputedStyle(document.querySelector('.bs-turn-photo')).display,
    cutlineDisplay: getComputedStyle(document.querySelector('.bs-turn-cutline')).display,
    stickerOpacity: getComputedStyle(document.querySelector('.bs-turn-sticker')).opacity,
    captionOpacity: getComputedStyle(document.querySelector('.bs-turn-caption')).opacity,
  }));
  console.log('REDUCED MOTION:', JSON.stringify(reduced));
  await browser2.close();
})();
```

Run it:

```bash
SCRATCH=/tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop/43b3ca1f-3b51-40c0-aaac-c587e2f02505/scratchpad
NODE_PATH="/home/sirendesign/.npm/_npx/705bc6b22212b352/node_modules" node "$SCRATCH/check-turn.js"
```

Expected, checking the printed JSON by hand:
- `AT ~0.05`: `photoOpacity` a low-but-nonzero value less than 1 (still fading/scaling in); `cutlineOpacity` `"1"`, `cutlineDashoffset` at/near `"339.29px"` (nothing drawn yet, progress is before 0.15); `stickerOpacity` `"0"`; `captionOpacity` `"0"`.
- `AT ~0.30`: `photoOpacity` `"1"`; `cutlineDashoffset` roughly half of `339.29px` (trace ~50% drawn, since 0.30 is the midpoint of the 0.15-0.45 draw range); `stickerOpacity` still `"0"` (fade-in starts at 0.35); `captionOpacity` `"0"`.
- `AT ~0.55`: `photoOpacity` below `1` (dimming toward 0.55 minimum); `cutlineOpacity` below `1` (fading out mid-peel); `stickerOpacity` `"1"`; `stickerTransform` is NOT `"none"` and differs from the ~0.30 reading (translate/rotate/scale actively applied); `captionOpacity` still low/`"0"`.
- `AT ~0.95`: `stickerOpacity` `"1"` at its final transform; `captionOpacity` `"1"`.
- `ACHE REGRESSION GUARD`: `textOpacity` `"1"` — beat 2 unaffected.
- `BEAT "jar" REGRESSION GUARD`: `isVisible` `true`, `motif` `"jar-fill"` — beat 4 and the persistent spark's motif-sync still work exactly as before.
- `console/page errors: []`.
- `REDUCED MOTION`: `photoDisplay` `"none"`, `cutlineDisplay` `"none"`, `stickerOpacity` `"1"`, `captionOpacity` `"1"`.

If any value doesn't match, stop and fix the CSS/JS before continuing.

- [ ] **Step 3: Screenshot pass**

```bash
SCRATCH=/tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop/43b3ca1f-3b51-40c0-aaac-c587e2f02505/scratchpad
cd "$SCRATCH"
mkdir -p shots-turn
cat > shot-turn.js <<'EOF'
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto('http://localhost:1313/Portfolio/work/bonheur/', { waitUntil: 'load' });
  await page.waitForTimeout(300);
  const turnGeom = await page.evaluate(() => {
    const el = document.getElementById('bs-turn');
    const rect = el.getBoundingClientRect();
    return { top: rect.top + window.scrollY, height: rect.height };
  });
  const scrollable = turnGeom.height - 900;
  const targets = [
    ['00-photo-in', 0.10],
    ['01-cutline-tracing', 0.30],
    ['02-peeling', 0.55],
    ['03-caption-settled', 0.95],
  ];
  for (const [name, frac] of targets) {
    await page.evaluate((yy) => window.scrollTo(0, yy), turnGeom.top + scrollable * frac);
    await page.waitForTimeout(250);
    await page.screenshot({ path: `shots-turn/${name}.png` });
  }
  await browser.close();
})();
EOF
NODE_PATH="/home/sirendesign/.npm/_npx/705bc6b22212b352/node_modules" node shot-turn.js
ls shots-turn/
```

Expected: 4 screenshots generated. Review each (via the Read tool on the PNG paths) to confirm: `00-photo-in` shows the polaroid fading/scaling into a black screen; `01-cutline-tracing` shows a partial dashed circle around the spark inside the photo (not a complete circle, not empty); `02-peeling` shows the sticker visibly separated from the photo with a drop shadow, the photo noticeably dimmer than in the first two shots; `03-caption-settled` shows the fully peeled sticker with the caption text legible in light lavender-white beneath it.

- [ ] **Step 4: Stop the dev server**

```bash
pkill -f "bin/hugo server" 2>/dev/null; echo done
```

- [ ] **Step 5: No commit for this task** (verification only).
