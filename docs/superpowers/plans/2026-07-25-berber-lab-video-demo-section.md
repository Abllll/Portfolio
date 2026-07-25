# Berber Lab Video Demo Section Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fill the homepage's empty `project-3` slot with a Berber Lab case study presented as a single demo video on a sage stage.

**Architecture:** A new Hugo partial renders a full-viewport section using Berber Lab's own palette and fonts. The video uses the same deferred-load / in-view-play pattern as the Tide section, plus a click-to-unmute pill. A `fileExists` check renders a placeholder tile at exact final dimensions until the real video is dropped in, so the whole section is buildable and verifiable before the video exists.

**Tech Stack:** Hugo (v0.163, extended — see `berber.lab` binary; this repo builds with `./bin/hugo`), vanilla CSS, vanilla ES5-style JS (matching `tide-project.js`), Google Fonts.

## Global Constraints

- The homepage reads **bottom-up**: sections are in reverse DOM order, driven entirely by `data/home_sections.yaml`. Do not reorder or hardcode; the dot-nav ranges over the same file.
- Section adopts **Berber Lab's palette and faces**, not the portfolio's: `--berber-bg #dfe7dc`, `--berber-bg-alt #d3ddd0`, `--berber-ink #1c1c1a`, `--berber-muted #6b6f66`; display `'Cormorant Garamond', Georgia, serif`; body `'Inter', -apple-system, sans-serif`. Scope all tokens to the section root, as `.tide-project` does.
- Video defaults: `muted loop playsinline preload="none"`, source behind `data-src`. Silent loop on view; click pill **or** video to unmute + reveal native `controls`.
- Under `prefers-reduced-motion: reduce`: no autoplay, show poster + `controls`, no pill.
- Video aspect is governed by a single CSS var `--berber-video-ratio` (default `16 / 9`).
- Asset paths: `static/images/berber/berber-demo.mp4`, `static/images/berber/berber-demo-poster.jpg`. File presence switches the placeholder off — no template edit when the video lands.
- Build command: `./bin/hugo`. Must finish with **no new warnings**. The site base path is `/Portfolio/` (see memory: portfolio-run-and-verify).
- Reveal animation is global: `home-sections.js` adds `.is-visible` to any `.reveal-group` in view. Use `reveal-group` + `reveal-item reveal-item--N` classes; do **not** re-implement reveal logic.

---

### Task 1: Fonts, data flip, and template branch

Wires the new section into the page and loads its two typefaces. After this task the section renders (empty, unstyled) and the dot-nav shows "Berber Lab". Grouped because none is independently testable — the branch does nothing until the data flips, and the data flip errors until the branch exists.

**Files:**
- Modify: `data/home_sections.yaml` (the `project-3` entry)
- Modify: `layouts/index.html` (the `range` block over `.Site.Data.home_sections`)
- Modify: `layouts/partials/head.html:58` (the Google Fonts `<link>`)
- Create: `layouts/partials/home/berber-section.html` (minimal stub this task; fleshed out in Task 2)

**Interfaces:**
- Produces: a section with `kind: berber` routed to `partial "home/berber-section.html"`, receiving the section's data map (`.id`, `.label`, `.number`) as its context `.` — matching how `tide` and `placeholder` are called with `.` in `index.html`.

- [ ] **Step 1: Flip the data entry**

In `data/home_sections.yaml`, change the `project-3` block from:

```yaml
- id: project-3
  kind: placeholder
  label: "Project 3"
  number: 3
```

to:

```yaml
- id: project-3
  kind: berber
  label: "Berber Lab"
  number: 3
```

- [ ] **Step 2: Add the template branch**

In `layouts/index.html`, inside the `{{ range .Site.Data.home_sections }}` block, add a branch alongside the existing `tide`/`placeholder` ones. Match their calling convention (`.`, not `$`):

```go-html-template
    {{ else if eq .kind "berber" }}
      {{ partial "home/berber-section.html" . }}
```

Place it before the `placeholder` branch (order among `else if` arms doesn't matter functionally; keep projects grouped).

- [ ] **Step 3: Create the partial stub**

Create `layouts/partials/home/berber-section.html`:

```go-html-template
<section id="{{ .id }}" class="berber-project" aria-label="{{ .label }}">
  <p>Berber Lab section — stub</p>
</section>
```

- [ ] **Step 4: Add the two fonts**

In `layouts/partials/head.html:58`, extend the existing font `<link>` `href` to include Cormorant Garamond and Inter. The line is currently:

```html
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&family=Literata:ital,wght@0,400;0,500;1,400&family=Space+Grotesk:wght@400;500;600&family=Space+Mono:wght@400;700&display=swap">
```

Replace with (adds `Cormorant+Garamond:wght@500` and `Inter:wght@400;500`, keeps `&display=swap` last):

```html
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&family=Cormorant+Garamond:wght@500&family=Inter:wght@400;500&family=Literata:ital,wght@0,400;0,500;1,400&family=Space+Grotesk:wght@400;500;600&family=Space+Mono:wght@400;700&display=swap">
```

- [ ] **Step 5: Build and verify**

Run: `./bin/hugo`
Expected: build succeeds; the summary line count is unchanged from before; **no new WARN lines** beyond any that predate this work. Confirm `public/index.html` contains `class="berber-project"` and the string `Berber Lab section — stub`:

Run: `grep -c "berber-project" public/index.html`
Expected: `1`

- [ ] **Step 6: Commit**

```bash
git add data/home_sections.yaml layouts/index.html layouts/partials/head.html layouts/partials/home/berber-section.html
git commit -m "Wire Berber Lab (project 03) into the homepage and load its fonts

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01V7tXhd8J3xh9TvM9XsJ5vi"
```

---

### Task 2: Section markup and stage styling

Builds the full stage: header row, video/placeholder frame with the cutout shadow, caption, and the sound pill — all static (no JS yet). Uses `fileExists` so the real video or the placeholder tile renders automatically. After this task the section looks finished at rest; playback/unmute come in Task 3.

**Files:**
- Modify: `layouts/partials/home/berber-section.html` (replace the stub)
- Create: `static/css/berber-section.css`
- Modify: `layouts/partials/head.html` (add the stylesheet `<link>`, beside line 54–55 where the other section sheets load)

**Interfaces:**
- Consumes: section context `.` with `.id`, `.label`, `.number` (from Task 1).
- Produces: DOM hooks the Task 3 JS binds to — `video.berber-video` carrying a `<source data-src=…>`, and `button.berber-sound` inside `.berber-stage`. When no video file exists, neither element is rendered (placeholder path instead), and Task 3's JS must no-op gracefully.

- [ ] **Step 1: Write the partial**

Replace the entire contents of `layouts/partials/home/berber-section.html`:

```go-html-template
{{/* Project 03 — Berber Lab. Presented as one demo video on a sage
     stage in the project's own palette/faces, not a chaptered narrative
     like Tide. The video is produced separately; until the file lands at
     static/images/berber/berber-demo.mp4 a same-sized placeholder tile
     renders, so layout is verifiable before the video exists. The
     fileExists check is the only switch -- dropping the file in changes
     the section over with no template edit. Reveal animation is global
     (home-sections.js observes .reveal-group). */}}
{{ $video := "images/berber/berber-demo.mp4" }}
{{ $hasVideo := fileExists (printf "static/%s" $video) }}
{{ $poster := "images/berber/berber-demo-poster.jpg" }}
{{ $hasPoster := fileExists (printf "static/%s" $poster) }}
<section id="{{ .id }}" class="berber-project" aria-label="{{ .label }}">
  <div class="berber-stage reveal-group">
    <div class="berber-stage__head reveal-item reveal-item--1">
      <span class="berber-stage__wordmark">Berber Lab</span>
      <span class="berber-stage__meta">Case Study {{ printf "%02d" .number }}</span>
    </div>

    <div class="berber-stage__frame reveal-item reveal-item--2">
      {{ if $hasVideo }}
      <video class="berber-video" muted loop playsinline preload="none"
             aria-label="Berber Lab demo"
             {{ if $hasPoster }}poster="{{ $poster | relURL }}"{{ end }}>
        <source data-src="{{ $video | relURL }}" type="video/mp4">
      </video>
      <button type="button" class="berber-sound" aria-pressed="false">
        <span class="berber-sound__dot" aria-hidden="true"></span>
        <span class="berber-sound__label">Sound off</span>
      </button>
      {{ else }}
      <div class="berber-video berber-video--placeholder" role="img"
           aria-label="Berber Lab demo video — coming soon">
        <span>Demo video</span>
      </div>
      {{ end }}
    </div>

    <div class="berber-stage__caption reveal-item reveal-item--3">
      <p class="berber-stage__eyebrow">Berber Lab · Jewelry storefront concept</p>
      <h2 class="berber-stage__title">Try the piece on before you buy it.</h2>
      <p class="berber-stage__body">A mockup fine-jewelry store built around an exploration canvas instead of a product grid — and an AI try-on that puts the piece on you.</p>
    </div>
  </div>
</section>
```

- [ ] **Step 2: Write the stylesheet**

Create `static/css/berber-section.css`:

```css
/* static/css/berber-section.css
   Project 03 — Berber Lab. Palette and faces are the project's own
   (see berber.lab/static/css/main.css), scoped here so scrolling into
   this section feels like arriving in the project's world. */
.berber-project {
  --berber-bg: #dfe7dc;
  --berber-bg-alt: #d3ddd0;
  --berber-ink: #1c1c1a;
  --berber-muted: #6b6f66;
  --berber-display: 'Cormorant Garamond', Georgia, serif;
  --berber-body: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --berber-video-ratio: 16 / 9;

  min-height: 100svh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4rem 1.5rem;
  background: var(--berber-bg);
  color: var(--berber-ink);
}

.berber-stage {
  width: 100%;
  max-width: 1040px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2.5rem;
}

.berber-stage__head {
  width: 100%;
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
}

.berber-stage__wordmark {
  font-family: var(--berber-display);
  font-size: clamp(1.4rem, 2.4vw, 1.9rem);
  font-weight: 500;
  color: var(--berber-ink);
}

.berber-stage__meta {
  font-family: var(--berber-body);
  font-size: 0.72rem;
  font-weight: 500;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--berber-muted);
}

.berber-stage__frame {
  position: relative;
  width: 100%;
}

.berber-video {
  display: block;
  width: 100%;
  aspect-ratio: var(--berber-video-ratio);
  object-fit: cover;
  border-radius: 4px;
  background: var(--berber-bg-alt);
  box-shadow: 0 40px 80px -30px rgba(28, 28, 26, 0.28);
}

.berber-video--placeholder {
  display: grid;
  place-items: center;
  font-family: var(--berber-body);
  font-size: 0.78rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--berber-muted);
}

/* Sound pill — echoes the site's EXPERIENCE/GRID toggle: the one hard
   shape on an otherwise soft field. Hidden once native controls appear
   (Task 3 sets .is-playing-with-sound), so the two never compete. */
.berber-sound {
  position: absolute;
  right: 1rem;
  bottom: 1rem;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.9rem;
  border: 0;
  border-radius: 999px;
  background: var(--berber-ink);
  color: #fff;
  font-family: var(--berber-body);
  font-size: 0.68rem;
  font-weight: 500;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  cursor: pointer;
}

.berber-sound__dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background: #fff;
  opacity: 0.5;
}

.berber-sound[aria-pressed="true"] .berber-sound__dot { opacity: 1; }

.berber-stage__frame.is-playing-with-sound .berber-sound { display: none; }

.berber-stage__caption {
  max-width: 46ch;
  text-align: center;
}

.berber-stage__eyebrow {
  margin: 0 0 0.75rem;
  font-family: var(--berber-body);
  font-size: 0.72rem;
  font-weight: 500;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--berber-muted);
}

.berber-stage__title {
  margin: 0 0 0.75rem;
  font-family: var(--berber-display);
  font-weight: 500;
  font-size: clamp(1.8rem, 3.4vw, 2.6rem);
  line-height: 1.12;
  color: var(--berber-ink);
}

.berber-stage__body {
  margin: 0;
  font-family: var(--berber-body);
  font-size: 1rem;
  line-height: 1.6;
  color: var(--berber-muted);
}

@media (max-width: 640px) {
  .berber-project { padding: 3rem 1.1rem; }
  .berber-stage { gap: 1.75rem; }
}
```

- [ ] **Step 3: Link the stylesheet**

In `layouts/partials/head.html`, add a `<link>` for the new sheet next to the other section stylesheets (the block containing `home-sections.css` at line 54). Add after the `home-sections.css` line:

```html
<link rel="stylesheet" href="{{ "css/berber-section.css" | relURL }}">
```

- [ ] **Step 4: Build**

Run: `./bin/hugo`
Expected: succeeds, no new warnings. Since no video file exists yet, the placeholder path renders.

Run: `grep -c "berber-video--placeholder" public/index.html`
Expected: `1`
Run: `grep -c "berber-sound" public/index.html`
Expected: `0` (pill only renders when the video exists)

- [ ] **Step 5: Screenshot-verify the stage at two widths**

Start the server in the background and screenshot the section. (Chromium is at `~/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome`.) The section is `#project-3`; because the page loads scrolled to the illustration, navigate directly to the anchor.

```bash
./bin/hugo server -p 1314 &
sleep 3
CHROME=~/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome
SP="$(pwd)/scratch-shots"; mkdir -p "$SP"
"$CHROME" --headless --disable-gpu --no-sandbox --hide-scrollbars \
  --virtual-time-budget=5000 --window-size=1440,900 \
  --screenshot="$SP/berber-1440.png" "http://localhost:1314/Portfolio/#project-3"
"$CHROME" --headless --disable-gpu --no-sandbox --hide-scrollbars \
  --virtual-time-budget=5000 --window-size=390,844 \
  --screenshot="$SP/berber-390.png" "http://localhost:1314/Portfolio/#project-3"
```

Note: the homepage's landing script scrolls to the illustration and locks the body on load (see `index.html`). If the anchor screenshot lands on the illustration instead of the section, that is the known start-lock behavior (memory: portfolio-run-and-verify) — capture the section with a full-page screenshot instead by adding `--screenshot` with a tall `--window-size` (e.g. `1440,6000`) and inspect the Berber band, or temporarily scroll via a `--evaluate`-equivalent is not available in headless-shell so prefer the tall-viewport full capture.

Read both PNGs. Expected: sage field; wordmark left, "CASE STUDY 03" right; centered placeholder tile with soft shadow and 16:9 box; centered serif headline with muted eyebrow and body under it; nothing clipped at 390px.

Stop the server when done: `kill %1` (or `pkill -f "hugo server -p 1314"`).

- [ ] **Step 6: Commit**

```bash
git add layouts/partials/home/berber-section.html static/css/berber-section.css layouts/partials/head.html
git commit -m "Build the Berber Lab stage: header, video frame, caption, sound pill

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01V7tXhd8J3xh9TvM9XsJ5vi"
```

---

### Task 3: Playback JS — deferred load, in-view play, click to unmute

Adds the only script for this section: mirrors Tide's deferred-load/in-view-play observers and adds click-to-unmute on both the pill and the video. Must no-op cleanly when the placeholder is showing (no `.berber-video` with a source) and respect reduced motion.

**Files:**
- Create: `static/js/berber-project.js`
- Modify: `layouts/partials/home/berber-section.html` (add the `<script>` tag at the end of the section, matching how `tide-section.html:83` includes `tide-project.js`)

**Interfaces:**
- Consumes: `video.berber-video` with `<source data-src>`, `button.berber-sound`, container `.berber-stage__frame` (from Task 2).
- Produces: none consumed downstream — this is the terminal task.

- [ ] **Step 1: Write the script**

Create `static/js/berber-project.js`:

```js
// Project 03 — Berber Lab demo video.
// Deferred load + in-view play mirrors tide-project.js (nothing fetches
// on this long homepage until approached; a source behind data-src also
// avoids the collapsed 300x150 fallback box). Adds click-to-unmute on
// both the pill and the video, since a muted-autoplay clip gives the
// viewer no native affordance to turn sound on until they do.
(function () {
  var video = document.querySelector(".berber-video");
  // Placeholder path renders a <div>, not a <video> — nothing to do.
  if (!video || video.tagName !== "VIDEO") return;

  var frame = video.closest(".berber-stage__frame");
  var pill = frame ? frame.querySelector(".berber-sound") : null;
  var pillLabel = pill ? pill.querySelector(".berber-sound__label") : null;
  var source = video.querySelector("source[data-src]");
  var loaded = false;
  var reduceMotion = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function prepareVideo() {
    if (loaded || !source) return;
    source.src = source.dataset.src;
    source.removeAttribute("data-src");
    loaded = true;
    video.preload = "metadata";
    video.load();
  }

  function playVideo() {
    prepareVideo();
    var p = video.play();
    if (p && p.catch) p.catch(function () {});
  }

  function unmute() {
    prepareVideo();
    video.muted = false;
    video.controls = true;
    if (frame) frame.classList.add("is-playing-with-sound");
    if (pill) pill.setAttribute("aria-pressed", "true");
    if (pillLabel) pillLabel.textContent = "Sound on";
    var p = video.play();
    if (p && p.catch) p.catch(function () {});
  }

  // Reduced motion: no autoplay. Show poster + controls, drop the pill.
  if (reduceMotion) {
    prepareVideo();
    video.controls = true;
    if (pill) pill.remove();
    return;
  }

  if (pill) pill.addEventListener("click", unmute);
  // Clicking the video itself also unmutes — but not once native
  // controls are live, or the click would fight the scrubber.
  video.addEventListener("click", function () {
    if (!video.controls) unmute();
  });

  if (!("IntersectionObserver" in window)) {
    playVideo();
    return;
  }

  var loadObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      prepareVideo();
      loadObserver.unobserve(entry.target);
    });
  }, { rootMargin: "100% 0px", threshold: 0 });

  var playbackObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        playVideo();
      } else {
        video.pause();
      }
    });
  }, { threshold: 0.18 });

  loadObserver.observe(video);
  playbackObserver.observe(video);
})();
```

- [ ] **Step 2: Include the script in the section**

At the end of `layouts/partials/home/berber-section.html`, immediately before the closing `</section>`, add (matching `tide-section.html:83`):

```go-html-template
  <script src="{{ "js/berber-project.js" | relURL }}" defer></script>
```

- [ ] **Step 3: Build with placeholder — verify the script no-ops**

With no video file present, the script must load without error and do nothing.

Run: `./bin/hugo`
Expected: succeeds, no new warnings.
Run: `grep -c "berber-project.js" public/index.html`
Expected: `1`

Start the server and confirm no console errors on load with the placeholder showing:

```bash
./bin/hugo server -p 1314 &
sleep 3
CHROME=~/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome
"$CHROME" --headless --disable-gpu --no-sandbox \
  --virtual-time-budget=4000 --dump-dom "http://localhost:1314/Portfolio/" \
  > /dev/null 2> scratch-console.txt
grep -i "error\|uncaught" scratch-console.txt || echo "no JS errors"
```

Expected: `no JS errors`. Stop the server: `pkill -f "hugo server -p 1314"`.

- [ ] **Step 4: Verify playback with a stand-in video**

Drop a tiny stand-in clip in so the video path renders and playback/unmute can be exercised, then remove it (the real video is supplied later, so it must NOT be committed).

```bash
mkdir -p static/images/berber
# Generate a 3s silent 16:9 test clip with the bundled ffmpeg.
FF=~/.cache/ms-playwright/ffmpeg-1011/ffmpeg-linux
"$FF" -f lavfi -i color=c=0xd3ddd0:s=1280x720:d=3 -pix_fmt yuv420p \
  -y static/images/berber/berber-demo.mp4
./bin/hugo
grep -c "berber-sound" public/index.html   # expect 1 now
```

Expected: `berber-sound` count is `1` (pill renders when the video exists). Build succeeds.

Start the server, screenshot the section (video path), read it: expect the video box in place of the placeholder, with the black "SOUND OFF" pill in its lower-right.

```bash
./bin/hugo server -p 1314 &
sleep 3
CHROME=~/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome
SP="$(pwd)/scratch-shots"; mkdir -p "$SP"
"$CHROME" --headless --disable-gpu --no-sandbox --hide-scrollbars \
  --virtual-time-budget=5000 --window-size=1440,6000 \
  --screenshot="$SP/berber-video.png" "http://localhost:1314/Portfolio/"
pkill -f "hugo server -p 1314"
```

Read `scratch-shots/berber-video.png` and confirm the video frame + pill. (Click-to-unmute and in-view pause are interaction behaviors headless-shell can't easily script; verify them manually if a real browser is available, otherwise rely on the code review — the logic mirrors the proven Tide observers.)

- [ ] **Step 5: Remove the stand-in and confirm placeholder returns**

The real video is delivered later and must not be committed now.

```bash
rm static/images/berber/berber-demo.mp4
./bin/hugo
grep -c "berber-video--placeholder" public/index.html   # expect 1 again
```

Expected: `1` — placeholder path restored. Also confirm git sees no video file staged:

Run: `git status --short static/images/berber/`
Expected: no output (nothing to commit under that path).

- [ ] **Step 6: Commit**

```bash
git add static/js/berber-project.js layouts/partials/home/berber-section.html
git commit -m "Add Berber Lab demo playback: deferred load, in-view play, click to unmute

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01V7tXhd8J3xh9TvM9XsJ5vi"
```

---

### Task 4: Full-page verification and cleanup

Confirms the section sits correctly in the bottom-up homepage, the dot-nav reflects it, and no scratch files remain.

**Files:** none modified (verification + cleanup only).

- [ ] **Step 1: Dot-nav shows Berber Lab**

Run: `./bin/hugo && grep -o 'Berber Lab' public/index.html | wc -l`
Expected: at least `2` (once in the section wordmark, once in the dot-nav label — the dot-nav ranges over `home_sections.yaml`).

- [ ] **Step 2: Full-page screenshot, verify reading order intact**

```bash
./bin/hugo server -p 1314 &
sleep 3
CHROME=~/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome
SP="$(pwd)/scratch-shots"; mkdir -p "$SP"
"$CHROME" --headless --disable-gpu --no-sandbox --hide-scrollbars \
  --virtual-time-budget=6000 --window-size=1440,9000 \
  --screenshot="$SP/berber-fullpage.png" "http://localhost:1314/Portfolio/"
pkill -f "hugo server -p 1314"
```

Read `scratch-shots/berber-fullpage.png`. Expected top-to-bottom: footer content, then Project 03 (Berber Lab), then Tide, then Bonheur, then the illustration — the established bottom-up order. Berber's sage band is visually distinct and complete.

- [ ] **Step 3: Remove scratch artifacts**

```bash
rm -rf scratch-shots scratch-console.txt
git status --short
```

Expected: clean working tree for this feature's files (aside from any pre-existing unrelated changes on the branch).

- [ ] **Step 4: Final build gate**

Run: `./bin/hugo`
Expected: succeeds; no new WARN lines introduced by this work.

---

## Notes for the implementer

- **When the real video arrives:** drop `static/images/berber/berber-demo.mp4` (and optionally `berber-demo-poster.jpg`) into place and run `./bin/hugo`. The section switches from placeholder to video automatically. If the cut is vertical or a different ratio, set `--berber-video-ratio` in `berber-section.css` (e.g. `9 / 16` or `16 / 10`) — one line.
- **Do not commit any video file** as part of implementing this plan; the stand-in in Task 3 is temporary and removed before committing.
- The base path is `/Portfolio/`; always screenshot `http://localhost:.../Portfolio/`, never `/`.
