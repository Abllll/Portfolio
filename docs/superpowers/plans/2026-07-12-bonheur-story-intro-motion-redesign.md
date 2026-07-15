# Bonheur Story Intro Motion Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Bonheur story page's static header + idle-spark opening with a scroll-scrubbed sequence where "Bon" and "heur" converge from opposite bottom corners, ignite the persistent spark motif, then recede and fade.

**Architecture:** A new `#bs-intro` section (220vh spacer, sticky 100vh inner stage) sits before the existing beats loop. A new vanilla scroll+`requestAnimationFrame` handler in `static/js/bonheur-story.js` computes a single 0→1 progress value and writes it to `--bs-intro-progress` on `document.documentElement`; all motion (word position, color, opacity, spark ignition) is plain CSS `calc()`/`clamp()` reading that one variable — no other JS drives visuals. The existing per-beat `IntersectionObserver` reveal and `data-motif` engine are untouched.

**Tech Stack:** Hugo v0.163.3 (extended), static site, no JS framework, no automated test runner — verified via `./bin/hugo --minify` builds + `grep` assertions, plus a Playwright-driven headless-browser check (this repo has no browser test harness, so the check script is written ad hoc for this plan) and a manual browser spot-check.

## Global Constraints

- Scope is beat 1's opening only — beats 2–6 (Ache, Turn, Jar, Star Cloud, Keeping), their copy, motifs, and reveal mechanism are untouched.
- No new dependency (no scroll library) — plain `scroll` + `requestAnimationFrame` + CSS `calc()`/`clamp()`/`color-mix()`, per the approved design spec's rejection of GSAP/native-scroll-timeline in favor of this pattern.
- The persistent `#bs-motif`/`.bs-spark` element is not duplicated — it keeps its existing architecture; only a new opacity rule is added to it.
- `prefers-reduced-motion: reduce` must hide `.bs-intro-word` entirely and force `.bs-spark` to opacity 1 immediately, consistent with the rest of the page's existing reduced-motion behavior.
- This repo's file-watcher (Hugo dev server) does not reliably pick up edits on this `/mnt/c/...` WSL mount — always fully stop and restart `./bin/hugo server` after making edits, don't rely on live-reload.
- Reference spec: `docs/superpowers/specs/2026-07-12-bonheur-story-intro-motion-redesign-design.md`.

---

### Task 1: HTML — remove static header, add sr-only title + intro markup

**Files:**
- Modify: `layouts/work/bonheur-story.html`

**Interfaces:**
- Produces: `#bs-intro` (the new intro section), `.bs-intro-stage` (its sticky inner stage), `.bs-intro-word--bon` / `.bs-intro-word--heur` (the two word spans) — consumed by Task 2 (CSS) and Task 3 (JS, which only needs `#bs-intro`).
- Consumes: nothing new from other tasks.

- [ ] **Step 1: Replace the static header with an sr-only title and the intro block**

In `layouts/work/bonheur-story.html`, find:

```html
    <header class="bs-beat bs-beat-header page-int">
      <div class="bs-beat-inner">
        {{ with .Params.subtitle }}
          <p class="eyebrow text-accent">{{ . }}</p>
        {{ end }}
        <h1 class="heading-page text-2xl sm:text-3xl">{{ .Title }}</h1>
      </div>
    </header>
```

Replace with:

```html
    <h1 class="sr-only">{{ .Title }}{{ with .Params.subtitle }} — {{ . }}{{ end }}</h1>

    <section class="bs-intro" id="bs-intro">
      <div class="bs-intro-stage">
        <span class="bs-intro-word bs-intro-word--bon" aria-hidden="true">Bon</span>
        <span class="bs-intro-word bs-intro-word--heur" aria-hidden="true">heur</span>
      </div>
    </section>
```

(Word casing is deliberate: "Bon" + "heur" concatenate to read "Bonheur" once they meet at center, matching the site's actual title casing.)

- [ ] **Step 2: Build and verify the markup**

```bash
cd "/mnt/c/Users/SirenDesign/Desktop/Portfolio/.worktrees/bonheur-story-page"
rm -rf /tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop/8f425d52-0d28-46cd-a43c-126b89fabac5/scratchpad/hugo-build
./bin/hugo --minify -d /tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop/8f425d52-0d28-46cd-a43c-126b89fabac5/scratchpad/hugo-build 2>&1 | tail -20
BUILD=/tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop/8f425d52-0d28-46cd-a43c-126b89fabac5/scratchpad/hugo-build
grep -c 'class="bs-intro"' "$BUILD/work/bonheur/index.html"
grep -c 'bs-intro-word--bon' "$BUILD/work/bonheur/index.html"
grep -c 'bs-intro-word--heur' "$BUILD/work/bonheur/index.html"
grep -c 'class="sr-only"' "$BUILD/work/bonheur/index.html"
grep -c 'bs-beat-header' "$BUILD/work/bonheur/index.html"
```

Expected: build succeeds with zero `ERROR` lines; first four greps each print `1`; the last grep (`bs-beat-header`) prints `0` (old header fully removed).

- [ ] **Step 3: Commit**

```bash
git add layouts/work/bonheur-story.html
git commit -m "Replace Bonheur story page's static header with sr-only title + intro skeleton"
```

---

### Task 2: CSS — intro layout, word motion formulas, spark ignition, reduced motion

**Files:**
- Modify: `static/css/bonheur-story.css`

**Interfaces:**
- Consumes: `#bs-intro`, `.bs-intro-stage`, `.bs-intro-word--bon`, `.bs-intro-word--heur` (from Task 1); `--bs-intro-progress` custom property (from Task 3, read via `var(--bs-intro-progress, 0)` with a `0` fallback so this task's CSS is valid and testable before Task 3 exists).
- Produces: all visual behavior of the intro sequence — no other task depends on this task's internals beyond the class names above.

- [ ] **Step 1: Add intro layout + word motion + spark ignition rules**

In `static/css/bonheur-story.css`, find the `.bs-spark` rule:

```css
.bs-spark {
  position: relative;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: radial-gradient(circle, #fff8e7 0%, #f4c869 45%, transparent 75%);
  box-shadow: 0 0 24px 8px rgba(244, 200, 105, 0.55);
  transition: transform 0.6s ease, opacity 0.6s ease, box-shadow 0.6s ease;
}
```

Replace with (adds one `opacity` line — invisible before ignition at progress 0.45, ramps in over the next 0.1 of scroll progress, stays fully visible for the rest of the page since `--bs-intro-progress` clamps at 1 once you scroll past the intro block):

```css
.bs-spark {
  position: relative;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: radial-gradient(circle, #fff8e7 0%, #f4c869 45%, transparent 75%);
  box-shadow: 0 0 24px 8px rgba(244, 200, 105, 0.55);
  opacity: clamp(0, calc((var(--bs-intro-progress, 0) - 0.45) / 0.1), 1);
  transition: transform 0.6s ease, opacity 0.6s ease, box-shadow 0.6s ease;
}
```

Then, at the end of the file (after `.bs-media-placeholder`), append:

```css

/* BON/HEUR INTRO SEQUENCE
   Driven entirely by --bs-intro-progress (0-1), written by the scroll/rAF
   handler in bonheur-story.js. Everything below is plain CSS reading that
   one variable -- no other JS touches these elements. */

.bs-intro {
  position: relative;
  height: 220vh;
}

.bs-intro-stage {
  position: sticky;
  top: 0;
  height: 100vh;
  overflow: hidden;
}

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

- [ ] **Step 2: Extend the reduced-motion block**

Find:

```css
@media (prefers-reduced-motion: reduce) {
  .bs-spark,
  .bs-cluster::before,
  .bs-cluster::after {
    animation: none !important;
  }

  .bs-beat-inner > * {
    transition-duration: 0s !important;
    transition-delay: 0s !important;
  }
}
```

Replace with:

```css
@media (prefers-reduced-motion: reduce) {
  .bs-spark,
  .bs-cluster::before,
  .bs-cluster::after {
    animation: none !important;
  }

  .bs-beat-inner > * {
    transition-duration: 0s !important;
    transition-delay: 0s !important;
  }

  .bs-intro-word {
    display: none !important;
  }

  .bs-spark {
    opacity: 1 !important;
  }
}
```

- [ ] **Step 3: Build and verify the CSS ships**

```bash
cd "/mnt/c/Users/SirenDesign/Desktop/Portfolio/.worktrees/bonheur-story-page"
rm -rf /tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop/8f425d52-0d28-46cd-a43c-126b89fabac5/scratchpad/hugo-build
./bin/hugo --minify -d /tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop/8f425d52-0d28-46cd-a43c-126b89fabac5/scratchpad/hugo-build 2>&1 | tail -20
BUILD=/tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop/8f425d52-0d28-46cd-a43c-126b89fabac5/scratchpad/hugo-build
grep -c 'bs-intro-progress' "$BUILD/css/bonheur-story.css"
grep -c 'prefers-reduced-motion' "$BUILD/css/bonheur-story.css"
```

Expected: build succeeds with zero `ERROR` lines; first grep prints `5` or more (the property is referenced multiple times); second grep prints `1`.

- [ ] **Step 4: Commit**

```bash
git add static/css/bonheur-story.css
git commit -m "Add Bon/heur intro motion CSS driven by --bs-intro-progress"
```

---

### Task 3: JS — scroll + rAF progress engine

**Files:**
- Modify: `static/js/bonheur-story.js`

**Interfaces:**
- Consumes: `#bs-intro` (from Task 1).
- Produces: `--bs-intro-progress` custom property on `document.documentElement`, a number from `"0.0000"` to `"1.0000"` — consumed by Task 2's CSS. No other task depends on this task's internals beyond that one property.

- [ ] **Step 1: Add the progress engine**

At the end of `static/js/bonheur-story.js` (after the existing `IntersectionObserver` IIFE), append:

```js

// Drives --bs-intro-progress (0-1) from how far the user has scrolled
// through #bs-intro. All visual behavior lives in bonheur-story.css as
// calc()/clamp() expressions reading this one property -- this script only
// computes and writes the number.
(function () {
  "use strict";

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

  function onScrollOrResize() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(updateProgress);
  }

  window.addEventListener("scroll", onScrollOrResize, { passive: true });
  window.addEventListener("resize", onScrollOrResize);
  updateProgress();
})();
```

- [ ] **Step 2: Build and verify the script ships with valid syntax**

```bash
cd "/mnt/c/Users/SirenDesign/Desktop/Portfolio/.worktrees/bonheur-story-page"
rm -rf /tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop/8f425d52-0d28-46cd-a43c-126b89fabac5/scratchpad/hugo-build
./bin/hugo --minify -d /tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop/8f425d52-0d28-46cd-a43c-126b89fabac5/scratchpad/hugo-build 2>&1 | tail -20
BUILD=/tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop/8f425d52-0d28-46cd-a43c-126b89fabac5/scratchpad/hugo-build
node --check "$BUILD/js/bonheur-story.js" && echo "syntax ok"
```

Expected: build succeeds with zero `ERROR` lines; `node --check` prints nothing (success) followed by `syntax ok`.

- [ ] **Step 3: Commit**

```bash
git add static/js/bonheur-story.js
git commit -m "Add scroll-scrubbed progress engine for the Bon/heur intro sequence"
```

---

### Task 4: Browser verification — scroll-scrub behavior end-to-end

**Files:** none (verification only)

This task exercises the actual scroll-scrubbing behavior, which a static-HTML `grep` cannot verify. It reuses the Playwright + locally-extracted-libs approach already validated earlier in this project against this same worktree's Hugo server (no `sudo` available in this environment, so Chromium's shared-library dependencies are downloaded as `.deb` packages via `apt-get download` — which does not require root — and extracted locally rather than installed system-wide).

- [ ] **Step 1: Ensure the headless-Chromium runtime libraries are available**

```bash
LIBDIR=/tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop/8f425d52-0d28-46cd-a43c-126b89fabac5/scratchpad/debs/extracted/usr/lib/x86_64-linux-gnu
if [ ! -f "$LIBDIR/libnspr4.so" ]; then
  mkdir -p /tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop/8f425d52-0d28-46cd-a43c-126b89fabac5/scratchpad/debs
  cd /tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop/8f425d52-0d28-46cd-a43c-126b89fabac5/scratchpad/debs
  apt-get download libnspr4 libnss3 libatk1.0-0t64 libatk-bridge2.0-0t64 libcups2t64 libxkbcommon0 libatspi2.0-0t64 libxdamage1 libgbm1 libasound2t64
  mkdir -p extracted
  for f in *.deb; do dpkg-deb -x "$f" extracted; done
fi
test -f "$LIBDIR/libnspr4.so" && echo "libs ready"
```

Expected: prints `libs ready` (either immediately, if already present from an earlier session, or after downloading/extracting).

- [ ] **Step 2: Start a clean Hugo dev server**

```bash
pkill -f "bin/hugo server" 2>/dev/null
cd "/mnt/c/Users/SirenDesign/Desktop/Portfolio/.worktrees/bonheur-story-page"
```

Then start it in the background (this repo's file watcher is unreliable on this WSL mount, so this must be a fresh start made *after* all Task 1-3 edits are already saved):

```bash
./bin/hugo server -D --port 1313 > /tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop/8f425d52-0d28-46cd-a43c-126b89fabac5/scratchpad/hugo-server.log 2>&1 &
```

Wait for it, then confirm the new CSS/JS are actually being served:

```bash
for i in $(seq 1 20); do
  code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:1313/Portfolio/work/bonheur/)
  if [ "$code" = "200" ]; then echo "up after $i tries"; break; fi
  sleep 1
done
curl -s http://localhost:1313/Portfolio/css/bonheur-story.css | grep -c 'bs-intro-progress'
curl -s http://localhost:1313/Portfolio/js/bonheur-story.js | grep -c 'bs-intro-progress'
```

Expected: prints `up after N tries`; both grep counts are non-zero (confirms the server is serving the edited files, not a stale cache).

- [ ] **Step 3: Write and run the scroll-scrub check script**

Create `/tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop/8f425d52-0d28-46cd-a43c-126b89fabac5/scratchpad/check-intro.js`:

```js
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();

  // 1. Full-motion pass: check start, mid, and post-intro states.
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
      return {
        introProgress: getComputedStyle(document.documentElement).getPropertyValue('--bs-intro-progress').trim(),
        bonOpacity: getComputedStyle(bon).opacity,
        heurOpacity: getComputedStyle(heur).opacity,
        bonRect: bon.getBoundingClientRect(),
        heurRect: heur.getBoundingClientRect(),
        sparkOpacity: getComputedStyle(spark).opacity,
      };
    });
  }

  const atStart = await readState();
  console.log('AT START:', JSON.stringify(atStart));

  // Scroll to roughly the ignition point (~50% of the 220vh-100vh=120vh pinned range).
  await page.evaluate(() => window.scrollTo(0, window.innerHeight * 1.1));
  await page.waitForTimeout(200);
  const atMid = await readState();
  console.log('AT MID (~ignition):', JSON.stringify(atMid));

  // Scroll well past the intro block.
  await page.evaluate(() => window.scrollTo(0, window.innerHeight * 2.5));
  await page.waitForTimeout(500);
  const afterIntro = await readState();
  console.log('AFTER INTRO:', JSON.stringify(afterIntro));

  const beat1Visible = await page.evaluate(() => {
    const beat = document.querySelector('[data-beat-id="spark"]');
    return beat.classList.contains('is-visible');
  });
  console.log('beat1 card is-visible:', beat1Visible);

  // Reversibility: scroll back up into the middle of the intro and confirm
  // it's truly scroll-scrubbed (tracks position both ways), not a one-shot
  // animation that ignores backward scroll.
  await page.evaluate(() => window.scrollTo(0, window.innerHeight * 1.1));
  await page.waitForTimeout(200);
  const scrolledBack = await readState();
  console.log('SCROLLED BACK UP:', JSON.stringify(scrolledBack));

  // Existing data-motif system regression guard: confirm beat 2 ("Ache",
  // motif "fading") still overrides the new base .bs-spark opacity rule via
  // CSS specificity, per the design spec's cascade analysis.
  await page.evaluate(() => {
    document.querySelector('[data-beat-id="ache"]').scrollIntoView();
  });
  await page.waitForTimeout(800);
  const beat2 = await page.evaluate(() => ({
    motif: document.getElementById('bs-motif').getAttribute('data-motif'),
    sparkOpacity: getComputedStyle(document.querySelector('.bs-spark')).opacity,
  }));
  console.log('BEAT 2 (ache):', JSON.stringify(beat2));

  console.log('console/page errors:', JSON.stringify(errors));
  await browser.close();

  // 2. Reduced-motion pass in a fresh browser/context.
  const browser2 = await chromium.launch();
  const page2 = await browser2.newContext({ reducedMotion: 'reduce' }).then((c) => c.newPage());
  await page2.goto('http://localhost:1313/Portfolio/work/bonheur/', { waitUntil: 'load' });
  await page2.waitForTimeout(300);
  const reduced = await page2.evaluate(() => {
    const bon = document.querySelector('.bs-intro-word--bon');
    const spark = document.querySelector('.bs-spark');
    return {
      bonDisplay: getComputedStyle(bon).display,
      sparkOpacity: getComputedStyle(spark).opacity,
    };
  });
  console.log('REDUCED MOTION:', JSON.stringify(reduced));
  await browser2.close();
})();
```

Run it:

```bash
export LD_LIBRARY_PATH="/tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop/8f425d52-0d28-46cd-a43c-126b89fabac5/scratchpad/debs/extracted/usr/lib/x86_64-linux-gnu:$LD_LIBRARY_PATH"
NODE_PATH="/home/sirendesign/.npm/_npx/705bc6b22212b352/node_modules" node /tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop/8f425d52-0d28-46cd-a43c-126b89fabac5/scratchpad/check-intro.js
```

Expected, checking the printed JSON by hand:
- `AT START`: `introProgress` is `"0.0000"`; `bonOpacity`/`heurOpacity` are `"1"`; `bonRect`/`heurRect` place the words away from screen center (left word's `x` well left of center, right word's `x` well right of center, both `y` well below vertical center) -- confirming the bottom-corner starting positions; `sparkOpacity` is `"0"`.
- `AT MID`: `introProgress` is roughly `"0.4"`-`"0.6"`; `sparkOpacity` is greater than `"0"` (ignition ramping or complete).
- `AFTER INTRO`: `introProgress` is `"1.0000"`; `bonOpacity`/`heurOpacity` are `"0"`; `sparkOpacity` is `"1"`.
- `beat1 card is-visible: true`.
- `SCROLLED BACK UP`: `introProgress` is roughly `"0.4"`-`"0.6"` again (matches `AT MID`, not stuck at `"1.0000"`) and `bonOpacity`/`heurOpacity` are back above `"0"` -- confirms the sequence is genuinely scroll-scrubbed both directions, not a one-shot animation.
- `BEAT 2 (ache)`: `motif` is `"fading"`; `sparkOpacity` is `"0.4"` -- confirms the existing per-beat `data-motif` system still overrides the new base `.bs-spark` opacity rule via CSS specificity, so beats 2-6 are unaffected.
- `console/page errors: []`.
- `REDUCED MOTION`: `bonDisplay` is `"none"`; `sparkOpacity` is `"1"`.

If any value doesn't match, stop and fix the CSS/JS before continuing -- do not proceed to Step 4 with a failing check.

- [ ] **Step 4: Manual eyeball pass (screenshots)**

```bash
cd /tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop/8f425d52-0d28-46cd-a43c-126b89fabac5/scratchpad
mkdir -p shots
cat > shot-intro.js <<'EOF'
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto('http://localhost:1313/Portfolio/work/bonheur/', { waitUntil: 'load' });
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'shots/intro-00-start.png' });
  const steps = [0.3, 0.6, 0.9, 1.1, 1.5, 2.5];
  for (const mult of steps) {
    await page.evaluate((m) => window.scrollTo(0, window.innerHeight * m), mult);
    await page.waitForTimeout(200);
    await page.screenshot({ path: `shots/intro-${mult}.png` });
  }
  await browser.close();
})();
EOF
NODE_PATH="/home/sirendesign/.npm/_npx/705bc6b22212b352/node_modules" node shot-intro.js
ls -la shots/
```

Expected: all screenshots generated without error. Review each visually (via the Read tool on the PNG paths) to confirm: words start near the bottom corners, converge and read "Bonheur" together around the 0.9-1.1 multiplier shots, the spark is visible and glowing by then, and by the 2.5 multiplier shot the words are gone and the beat-1 card (number/title/body/placeholder) is visible next to the drifting spark.

- [ ] **Step 5: Stop the dev server**

```bash
pkill -f "bin/hugo server" 2>/dev/null; echo done
```

- [ ] **Step 6: No commit for this task** (verification only).
