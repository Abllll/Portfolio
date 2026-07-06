# The Explorer's Path Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a working, reviewable prototype of the interactive illustrated-forest homepage described in `docs/superpowers/specs/2026-07-06-explorers-path-design.md` — arrow-key/cursor movement along a 4-chapter path, light-shaft hotspots that reveal case studies / "at the time" notes / meme placeholders, footstep + discovery sound effects, and a fully accessible no-JS fallback — using real art for Chapter 2 and clearly-labeled placeholder art for Chapters 1/3/4.

**Architecture:** A new project-level `layouts/index.html` override replaces the theme's default homepage composition with a single interactive scene. Chapter/hotspot content lives in one Hugo data file (`data/explorers_path.yaml`) and is server-rendered twice from that single source: once as the interactive DOM (hotspot buttons + hidden content panels) and once as a plain `<details>` list fallback — so nothing needs to be authored twice and no-JS visitors still reach every piece of content. A vanilla-JS engine handles keyboard/pointer movement, camera-follow, proximity-based hotspot activation, and panel/audio toggling. No canvas, no framework, no build step — matches the site's existing stack.

**Tech Stack:** Hugo (vendored binary at `./bin/hugo`), plain CSS custom properties (reusing the existing `--color-*` tokens from `static/css/overrides.css`), vanilla JS, Python 3 + PIL/numpy (one-time asset prep, not part of the shipped site).

**How to test each task:** Same convention as the prior structure-and-visual-system plan: build with the vendored Hugo binary into a scratch directory, confirm zero `ERROR` lines, then grep the generated output for the exact strings/attributes each task produces. The final task adds a manual browser spot-check, since keyboard/pointer interaction can't be grep-tested.

Use this scratch output directory for every build in this plan:
```
/tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop/f45f1257-6ea0-436a-a556-22be3ab8481b/scratchpad/hugo-build
```

## Global Constraints

- Static Hugo site, vanilla JS, no framework, no build step (spec §6) — every file created here must run with zero compilation.
- Tonight's build only replaces the **homepage** (`/`). `/about/`, its content, and its nav entry are explicitly untouched — reconciling them is deferred (spec §2, §8).
- Only Chapter 2 ("The Spark") has real illustration (`IMG_6573.PNG` from `Desktop/Illustration/`). Chapters 1, 3, 4 use clearly-labeled placeholder backgrounds — do not attempt to fake finished forest art for them (spec §3, §7).
- Three hotspot content types only: `case-study` (links to a real `/work/` page — never invents one), `note` (first-person short text), `meme` (placeholder body text explicitly says the real caption/authorship is pending Amber — never write a finished-sounding fake meme) (spec §4, §8).
- Audio is sound-effects-only this phase: a footstep/rustle sound while moving, a discovery chime the first time each hotspot opens. No music/score system (spec §5, §8 — explicitly parked).
- Every hotspot's content must also be reachable through a plain, always-in-the-DOM `<details>` list that needs no JS and no pointer precision (spec §5) — rendered from the same data file as the interactive version, not duplicated by hand.
- Rendering is DOM + CSS transforms, not `<canvas>` (spec §6) — hotspots must be real, focusable, keyboard-activatable elements.

---

### Task 1: Placeholder visual & audio assets

**Files:**
- Create: `static/images/explorers-path/chapter-2-bg.jpg`
- Create: `static/audio/explorers-path/footstep.wav`
- Create: `static/audio/explorers-path/discovery.wav`

**Interfaces:**
- Produces: `images/explorers-path/chapter-2-bg.jpg`, `audio/explorers-path/footstep.wav`, `audio/explorers-path/discovery.wav` as site-root-relative static paths, consumed by Task 2's template (`.art` field resolving to this image) and Task 4's JS (audio element `src` attributes).

- [ ] **Step 1: Convert the real Chapter 2 illustration to a web-sized JPG**

```bash
mkdir -p "/mnt/c/Users/SirenDesign/Desktop/Portfolio/static/images/explorers-path"
python3 - <<'EOF'
from PIL import Image

src = Image.open("/mnt/c/Users/SirenDesign/Desktop/Illustration/IMG_6573.PNG").convert("RGBA")
target_width = 1920
ratio = target_width / src.width
target_height = round(src.height * ratio)
resized = src.resize((target_width, target_height), Image.LANCZOS)

# Flatten transparency onto the site's cream background token (#F4EFE8)
# so no PNG alpha channel survives into a JPG (which has none).
background = Image.new("RGB", resized.size, (244, 239, 232))
background.paste(resized, mask=resized.split()[3])
background.save(
    "/mnt/c/Users/SirenDesign/Desktop/Portfolio/static/images/explorers-path/chapter-2-bg.jpg",
    "JPEG",
    quality=87,
)
print("saved", background.size)
EOF
```

Expected output: `saved (1920, 2565)` (exact height depends on the source aspect ratio — any height is fine, width must read `1920`).

- [ ] **Step 2: Verify the image file**

```bash
python3 -c "
from PIL import Image
im = Image.open('/mnt/c/Users/SirenDesign/Desktop/Portfolio/static/images/explorers-path/chapter-2-bg.jpg')
print(im.format, im.size, im.mode)
"
```

Expected: `JPEG (1920, <some height>) RGB`

- [ ] **Step 3: Generate the two placeholder sound effects**

```bash
mkdir -p "/mnt/c/Users/SirenDesign/Desktop/Portfolio/static/audio/explorers-path"
python3 - <<'EOF'
import numpy as np
import wave

SR = 44100

def envelope(n, attack, release):
    t = np.linspace(0, 1, n)
    rise = np.clip(t / max(attack, 1e-6), 0, 1)
    fall = np.clip((1 - t) / max(release, 1e-6), 0, 1)
    return np.minimum(rise, fall)

def write_wav(path, signal):
    signal = np.clip(signal, -1, 1)
    pcm = (signal * 32767).astype(np.int16)
    with wave.open(path, "w") as f:
        f.setnchannels(1)
        f.setsampwidth(2)
        f.setframerate(SR)
        f.writeframes(pcm.tobytes())

# Footstep: a short, soft, low-pass-filtered noise burst.
dur = 0.16
n = int(SR * dur)
noise = np.random.uniform(-1, 1, n)
kernel = np.ones(30) / 30
filtered = np.convolve(noise, kernel, mode="same")
footstep = filtered * envelope(n, attack=0.005, release=0.12) * 0.5
write_wav(
    "/mnt/c/Users/SirenDesign/Desktop/Portfolio/static/audio/explorers-path/footstep.wav",
    footstep,
)

# Discovery chime: a quick two-note rise (E5 -> A5).
dur = 0.45
n = int(SR * dur)
t = np.linspace(0, dur, n, endpoint=False)
note1 = np.sin(2 * np.pi * 659.25 * t) * (t < dur * 0.45)
note2 = np.sin(2 * np.pi * 880.0 * t) * (t >= dur * 0.4)
chime = (note1 + note2) * envelope(n, attack=0.01, release=0.3) * 0.35
write_wav(
    "/mnt/c/Users/SirenDesign/Desktop/Portfolio/static/audio/explorers-path/discovery.wav",
    chime,
)

print("wrote footstep.wav and discovery.wav")
EOF
```

Expected output: `wrote footstep.wav and discovery.wav`

- [ ] **Step 4: Verify both audio files**

```bash
python3 -c "
import wave
for name in ('footstep', 'discovery'):
    with wave.open(f'/mnt/c/Users/SirenDesign/Desktop/Portfolio/static/audio/explorers-path/{name}.wav') as w:
        print(name, w.getnframes() / w.getframerate(), 'sec', w.getframerate(), 'Hz')
"
```

Expected: `footstep 0.16 sec 44100 Hz` and `discovery 0.45 sec 44100 Hz` (durations may print with floating-point noise, e.g. `0.15999...`).

- [ ] **Step 5: Commit**

```bash
cd "/mnt/c/Users/SirenDesign/Desktop/Portfolio"
git add static/images/explorers-path/chapter-2-bg.jpg static/audio/explorers-path/footstep.wav static/audio/explorers-path/discovery.wav
git commit -m "Add Chapter 2 background art and placeholder SFX for Explorer's Path"
```

---

### Task 2: Content data, scene markup, and homepage override

**Files:**
- Create: `data/explorers_path.yaml`
- Create: `layouts/partials/explorers-path/scene.html`
- Create: `layouts/index.html`

**Interfaces:**
- Consumes: `images/explorers-path/chapter-2-bg.jpg` (Task 1); `content/work/bonheur.md`'s permalink `/work/bonheur/` (existing content).
- Produces: HTML elements `#ep-viewport`, `#ep-world`, `.ep-chapter[data-chapter-id]`, `.ep-hotspot[data-hotspot-id]`, `#ep-explorer`, `#ep-panel`, `#ep-panel-content`, `.ep-panel-entry[data-panel-id]`, `#ep-panel-close` — all consumed by Task 4's JS. Produces CSS class names `ep-*` consumed by Task 3's stylesheet.

- [ ] **Step 1: Create `data/explorers_path.yaml`**

```yaml
chapters:
  - id: roots
    title: "Roots"
    art: placeholder
    hotspots:
      - id: roots-note-1
        type: note
        title: "Why sustainable urban design"
        teaser: "Architecture and engineering, one new field."
        body: "I started in sustainable urban design because it combined architecture and engineering — a field new enough that nobody had fully defined what it should look like yet. That was the appeal: real technical reasoning, in service of something that mattered."
        xPercent: 50
        yPercent: 55

  - id: spark
    title: "The Spark"
    art: chapter-2-bg.jpg
    hotspots:
      - id: spark-note-1
        type: note
        title: "My aunt's colored pencils"
        teaser: "Where the aesthetic sense actually comes from."
        body: "Long before design was a career idea, I watched my aunt — an architect — always carrying colored pencils, rendering by hand. That's the real origin of whatever eye I have now, not a design-school module."
        xPercent: 40
        yPercent: 55
      - id: spark-meme-1
        type: meme
        title: "Same energy, different decade"
        teaser: "Placeholder — real caption pending."
        body: "Placeholder hotspot. The real meme image and caption need Amber's own authorship — personal-growth reflections have to be in her actual voice, not a drafted stand-in. This entry marks where it goes."
        xPercent: 65
        yPercent: 40

  - id: id-years
    title: "The ID Years"
    art: placeholder
    hotspots:
      - id: id-years-note-1
        type: note
        title: "Solo, and a few small teams"
        teaser: "Learning the craft, and its limits."
        body: "A few years in as a working designer — solo projects, and leading a few small ones — I loved the craft, but kept noticing how far behind the industry's tools and pace were from what I actually believed in."
        xPercent: 50
        yPercent: 55

  - id: now
    title: "Now"
    art: placeholder
    hotspots:
      - id: now-case-study-1
        type: case-study
        title: "Bonheur"
        teaser: "A personal emotional memory cabinet — the first real Work entry."
        workRef: "/work/bonheur/"
        xPercent: 35
        yPercent: 55
      - id: now-note-1
        type: note
        title: "The graft, not a pivot"
        teaser: "Same roots, new tool."
        body: "Technology is a new graft onto roots that were already there — sustainability, systems thinking, an eye for how things should feel — not a different tree."
        xPercent: 65
        yPercent: 50
```

- [ ] **Step 2: Validate the YAML parses correctly**

```bash
python3 -c "
import yaml
data = yaml.safe_load(open('/mnt/c/Users/SirenDesign/Desktop/Portfolio/data/explorers_path.yaml'))
assert len(data['chapters']) == 4
total_hotspots = sum(len(c['hotspots']) for c in data['chapters'])
print('chapters:', len(data['chapters']), 'hotspots:', total_hotspots)
"
```

Expected: `chapters: 4 hotspots: 6`

- [ ] **Step 3: Create `layouts/partials/explorers-path/scene.html`**

```html
{{- $data := .Site.Data.explorers_path -}}
<section class="ep-viewport" id="ep-viewport" tabindex="0" aria-label="{{ .Site.Params.brand }}'s illustrated journey — use the left and right arrow keys, or click, to explore">
  <div class="ep-world" id="ep-world">
    {{- range $data.chapters }}
    {{- $isPlaceholder := eq .art "placeholder" }}
    <div class="ep-chapter {{ if $isPlaceholder }}ep-chapter--placeholder{{ else }}ep-chapter--art{{ end }}"
         data-chapter-id="{{ .id }}"
         {{ if not $isPlaceholder }}style="background-image: url('{{ printf "images/explorers-path/%s" .art | relURL }}');"{{ end }}>
      {{- if $isPlaceholder }}
      <span class="ep-chapter-label">{{ .title }} <em>— artwork in progress</em></span>
      {{- end }}
      {{- range .hotspots }}
      <button type="button"
              class="ep-hotspot"
              id="hotspot-{{ .id }}"
              data-hotspot-id="{{ .id }}"
              style="left: {{ .xPercent }}%; top: {{ .yPercent }}%;"
              aria-label="{{ .title }} — {{ .teaser }}"
              aria-controls="panel-{{ .id }}">
        <span class="ep-hotspot-glow" aria-hidden="true"></span>
        <span class="ep-hotspot-icon" aria-hidden="true">&#10022;</span>
      </button>
      {{- end }}
    </div>
    {{- end }}
  </div>
  <div class="ep-explorer" id="ep-explorer" aria-hidden="true"></div>
</section>

<div class="ep-panel" id="ep-panel" hidden role="dialog" aria-modal="true">
  <div class="ep-panel-inner card card-pad">
    <button type="button" class="ep-panel-close" id="ep-panel-close" aria-label="Close">&times;</button>
    <div class="ep-panel-content" id="ep-panel-content">
      {{- range $data.chapters }}
      {{- $chapterTitle := .title }}
      {{- range .hotspots }}
      <div class="ep-panel-entry" id="panel-{{ .id }}" hidden data-panel-id="{{ .id }}">
        <p class="ep-panel-kicker">{{ $chapterTitle }}</p>
        <h2 id="ep-panel-title-{{ .id }}" class="ep-panel-heading">{{ .title }}</h2>
        {{- if eq .type "case-study" }}
        <p>{{ .teaser }}</p>
        <a href="{{ .workRef | relURL }}" class="btn-primary btn-primary-sm">View the case study →</a>
        {{- else }}
        <p>{{ .body }}</p>
        {{- end }}
      </div>
      {{- end }}
      {{- end }}
    </div>
  </div>
</div>

<audio id="ep-audio-footstep" src="{{ "audio/explorers-path/footstep.wav" | relURL }}" preload="auto" loop></audio>
<audio id="ep-audio-discovery" src="{{ "audio/explorers-path/discovery.wav" | relURL }}" preload="auto"></audio>

<section class="ep-fallback">
  <div class="page-int section-stack">
    <h2 class="heading-section">Prefer a plain list?</h2>
    {{- range $data.chapters }}
    <h3 class="ep-fallback-chapter">{{ .title }}</h3>
    <div class="ep-fallback-items">
      {{- range .hotspots }}
      <details class="ep-fallback-item">
        <summary>{{ .title }}</summary>
        {{- if eq .type "case-study" }}
        <p>{{ .teaser }}</p>
        <a href="{{ .workRef | relURL }}">View the case study →</a>
        {{- else }}
        <p>{{ .body }}</p>
        {{- end }}
      </details>
      {{- end }}
    </div>
    {{- end }}
  </div>
</section>
```

- [ ] **Step 4: Create `layouts/index.html`**

```html
{{ define "main" }}
  <section class="layout-page">
    <div class="page-int section-stack section-stack--home">
      {{ partial "explorers-path/scene.html" . }}
    </div>
  </section>
{{ end }}
```

- [ ] **Step 5: Build and verify**

```bash
cd "/mnt/c/Users/SirenDesign/Desktop/Portfolio"
./bin/hugo --minify -d /tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop/f45f1257-6ea0-436a-a556-22be3ab8481b/scratchpad/hugo-build 2>&1 | tail -20
BUILD=/tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop/f45f1257-6ea0-436a-a556-22be3ab8481b/scratchpad/hugo-build
grep -c 'class="ep-chapter' "$BUILD/index.html"
grep -c 'class="ep-hotspot"' "$BUILD/index.html"
grep -c 'class="ep-panel-entry"' "$BUILD/index.html"
grep -o 'chapter-2-bg.jpg' "$BUILD/index.html"
grep -o '/work/bonheur/' "$BUILD/index.html"
grep -c 'class="ep-fallback-item"' "$BUILD/index.html"
```

Expected: build succeeds with no `ERROR` lines; first grep prints `4`; second and third print `6`; fourth prints `chapter-2-bg.jpg`; fifth prints `/work/bonheur/`; sixth prints `6`.

- [ ] **Step 6: Commit**

```bash
git add data/explorers_path.yaml layouts/partials/explorers-path/scene.html layouts/index.html
git commit -m "Add Explorer's Path content data, scene markup, and homepage override"
```

---

### Task 3: Visual styling

**Files:**
- Create: `static/css/explorers-path.css`
- Modify: `layouts/partials/head.html`

**Interfaces:**
- Consumes: CSS custom properties `--color-walnut`, `--color-denim`, `--color-text-muted`, `--color-accent`, `--color-border`, `--color-surface`, `--font-serif`, `--font-sans` from `static/css/overrides.css`. Class names from Task 2's markup (`ep-viewport`, `ep-world`, `ep-chapter`, `ep-chapter--placeholder`, `ep-chapter-label`, `ep-hotspot`, `ep-hotspot-glow`, `ep-hotspot-icon`, `ep-explorer`, `ep-panel`, `ep-panel-inner`, `ep-panel-close`, `ep-panel-content`, `ep-panel-entry`, `ep-panel-kicker`, `ep-panel-heading`, `ep-fallback`, `ep-fallback-chapter`, `ep-fallback-items`, `ep-fallback-item`).
- Produces: the state classes `is-near` and `is-open` that Task 4's JS toggles on `.ep-hotspot` and `.ep-panel` respectively.

- [ ] **Step 1: Create `static/css/explorers-path.css`**

```css
/* ==========================================================================
   THE EXPLORER'S PATH — interactive homepage journey
   Loaded only on the homepage (see layouts/partials/head.html). Reuses the
   site's existing color tokens from overrides.css — no new palette.
   ========================================================================== */

.ep-viewport {
  position: relative;
  width: 100%;
  height: min(70vh, 720px);
  min-height: 420px;
  overflow: hidden;
  border-radius: 1rem;
  outline: none;
  background: var(--color-surface);
}

.ep-world {
  display: flex;
  height: 100%;
  will-change: transform;
}

.ep-chapter {
  position: relative;
  flex: 0 0 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.ep-chapter--placeholder {
  background: linear-gradient(160deg, var(--color-walnut) 0%, var(--color-denim) 100%);
  opacity: 0.85;
}

.ep-chapter-label {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  text-align: center;
  color: var(--color-surface);
  font-family: var(--font-serif);
  font-size: 1.1rem;
  opacity: 0.9;
  pointer-events: none;
}

.ep-chapter-label em {
  font-family: var(--font-sans);
  font-size: 0.7rem;
  font-style: normal;
  display: block;
  margin-top: 0.35rem;
  opacity: 0.75;
}

.ep-hotspot {
  position: absolute;
  transform: translate(-50%, -50%);
  width: 48px;
  height: 48px;
  border: none;
  background: none;
  padding: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ep-hotspot-glow {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(circle, var(--color-accent) 0%, transparent 70%);
  opacity: 0.25;
  transform: scale(0.8);
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.ep-hotspot-icon {
  position: relative;
  color: var(--color-accent);
  font-size: 1.1rem;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.ep-hotspot.is-near .ep-hotspot-glow,
.ep-hotspot:hover .ep-hotspot-glow,
.ep-hotspot:focus .ep-hotspot-glow {
  opacity: 0.8;
  transform: scale(1.3);
}

.ep-hotspot.is-near .ep-hotspot-icon,
.ep-hotspot:hover .ep-hotspot-icon,
.ep-hotspot:focus .ep-hotspot-icon {
  opacity: 1;
}

.ep-explorer {
  position: absolute;
  left: 50%;
  top: 68%;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--color-walnut);
  border: 2px solid var(--color-surface);
  box-shadow: 0 0 0 2px var(--color-walnut);
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 5;
}

.ep-panel {
  display: flex;
  position: fixed;
  inset: 0;
  z-index: 100;
  align-items: center;
  justify-content: center;
  background: rgba(67, 53, 49, 0.45);
  padding: 1rem;
}

.ep-panel[hidden] {
  display: none;
}

.ep-panel-inner {
  position: relative;
  max-width: 32rem;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
}

.ep-panel-close {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  border: none;
  background: none;
  font-size: 1.4rem;
  line-height: 1;
  cursor: pointer;
  color: var(--color-text-muted);
}

.ep-panel-entry[hidden] {
  display: none;
}

.ep-panel-kicker {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-text-muted);
  margin-bottom: 0.25rem;
}

.ep-panel-heading {
  font-family: var(--font-serif);
  margin-bottom: 0.5rem;
}

.ep-fallback {
  margin-top: 2rem;
}

.ep-fallback-chapter {
  font-family: var(--font-serif);
  margin-top: 1.25rem;
  margin-bottom: 0.5rem;
}

.ep-fallback-items {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.ep-fallback-item {
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  padding: 0.6rem 0.9rem;
}

.ep-fallback-item summary {
  cursor: pointer;
  font-weight: 600;
}
```

- [ ] **Step 2: Link the stylesheet on the homepage only**

```bash
cd "/mnt/c/Users/SirenDesign/Desktop/Portfolio"
grep -n 'css/overrides.css' layouts/partials/head.html
```

Confirm the line exists, then edit `layouts/partials/head.html` to add one conditional line directly after it:

```html
<link rel="stylesheet" href="{{ "css/overrides.css" | relURL }}">
{{ if .IsHome }}
<link rel="stylesheet" href="{{ "css/explorers-path.css" | relURL }}">
{{ end }}
```

- [ ] **Step 3: Build and verify**

```bash
./bin/hugo --minify -d /tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop/f45f1257-6ea0-436a-a556-22be3ab8481b/scratchpad/hugo-build 2>&1 | tail -20
BUILD=/tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop/f45f1257-6ea0-436a-a556-22be3ab8481b/scratchpad/hugo-build
grep -o 'explorers-path.css' "$BUILD/index.html"
grep -o 'explorers-path.css' "$BUILD/work/index.html"
test -f "$BUILD/css/explorers-path.css" && echo "stylesheet built: ok"
```

Expected: build succeeds; first grep prints `explorers-path.css` (linked on home); second grep prints nothing (not linked on other pages — confirms the `.IsHome` guard works); third line prints `stylesheet built: ok`.

- [ ] **Step 4: Commit**

```bash
git add static/css/explorers-path.css layouts/partials/head.html
git commit -m "Add Explorer's Path visual styling, scoped to the homepage"
```

---

### Task 4: Movement, hotspot, panel, and audio engine

**Files:**
- Create: `static/js/explorers-path.js`
- Modify: `layouts/index.html`

**Interfaces:**
- Consumes: DOM elements and classes from Task 2 (`#ep-viewport`, `#ep-world`, `.ep-chapter`, `.ep-hotspot[data-hotspot-id]`, `#ep-explorer`, `#ep-panel`, `#ep-panel-content`, `.ep-panel-entry[data-panel-id]`, `#ep-panel-close`, `#ep-audio-footstep`, `#ep-audio-discovery`) and CSS state classes from Task 3 (`is-near` on `.ep-hotspot`).
- Produces: no new interfaces for later tasks — this is the last functional task.

- [ ] **Step 1: Create `static/js/explorers-path.js`**

```js
(function () {
  "use strict";

  var viewport = document.getElementById("ep-viewport");
  var world = document.getElementById("ep-world");
  if (!viewport || !world) return;

  var chapters = Array.prototype.slice.call(world.querySelectorAll(".ep-chapter"));
  var hotspots = Array.prototype.slice.call(world.querySelectorAll(".ep-hotspot"));
  var panel = document.getElementById("ep-panel");
  var panelContent = document.getElementById("ep-panel-content");
  var panelClose = document.getElementById("ep-panel-close");
  var footstepAudio = document.getElementById("ep-audio-footstep");
  var discoveryAudio = document.getElementById("ep-audio-discovery");

  var NUM_CHAPTERS = chapters.length;
  var STEP_PX = 8;
  var PROXIMITY_PX = 70;

  var position = 0; // px, 0 .. (worldWidth - viewportWidth)
  var viewportWidth = viewport.clientWidth;
  var worldWidth = viewportWidth * NUM_CHAPTERS;
  var heldKeys = { left: false, right: false };
  var rafId = null;
  var visited = {};
  var lastFocusedHotspot = null;

  function layoutWorld() {
    viewportWidth = viewport.clientWidth;
    worldWidth = viewportWidth * NUM_CHAPTERS;
    world.style.width = worldWidth + "px";
    chapters.forEach(function (chapter) {
      chapter.style.width = viewportWidth + "px";
    });
    position = Math.min(position, worldWidth - viewportWidth);
    applyPosition();
  }

  function applyPosition() {
    world.style.transform = "translateX(-" + position + "px)";
    updateProximity();
  }

  function hotspotWorldX(hotspot) {
    var chapter = hotspot.closest(".ep-chapter");
    var chapterIndex = chapters.indexOf(chapter);
    var xPercent = parseFloat(hotspot.style.left) || 0;
    return chapterIndex * viewportWidth + (xPercent / 100) * viewportWidth;
  }

  function updateProximity() {
    var explorerWorldX = position + viewportWidth / 2;
    hotspots.forEach(function (hotspot) {
      var dx = Math.abs(hotspotWorldX(hotspot) - explorerWorldX);
      hotspot.classList.toggle("is-near", dx < PROXIMITY_PX);
    });
  }

  function step() {
    var delta = 0;
    if (heldKeys.left) delta -= STEP_PX;
    if (heldKeys.right) delta += STEP_PX;
    if (delta !== 0) {
      position = Math.max(0, Math.min(worldWidth - viewportWidth, position + delta));
      applyPosition();
      playFootstep();
      rafId = requestAnimationFrame(step);
    } else {
      stopFootstep();
      rafId = null;
    }
  }

  function startMoving() {
    if (rafId === null) {
      rafId = requestAnimationFrame(step);
    }
  }

  function playFootstep() {
    if (footstepAudio && footstepAudio.paused) {
      footstepAudio.currentTime = 0;
      footstepAudio.play().catch(function () {});
    }
  }

  function stopFootstep() {
    if (footstepAudio && !footstepAudio.paused) {
      footstepAudio.pause();
      footstepAudio.currentTime = 0;
    }
  }

  function openPanel(hotspotId) {
    var entry = document.getElementById("panel-" + hotspotId);
    if (!entry || !panel || !panelContent) return;

    Array.prototype.forEach.call(
      panelContent.querySelectorAll(".ep-panel-entry"),
      function (el) {
        el.hidden = el.id !== "panel-" + hotspotId;
      }
    );

    panel.hidden = false;
    panel.setAttribute("aria-labelledby", "ep-panel-title-" + hotspotId);
    lastFocusedHotspot = document.getElementById("hotspot-" + hotspotId);
    if (panelClose) panelClose.focus();

    if (!visited[hotspotId] && discoveryAudio) {
      visited[hotspotId] = true;
      discoveryAudio.currentTime = 0;
      discoveryAudio.play().catch(function () {});
    }
  }

  function closePanel() {
    if (!panel) return;
    panel.hidden = true;
    if (lastFocusedHotspot) {
      lastFocusedHotspot.focus();
      lastFocusedHotspot = null;
    }
  }

  hotspots.forEach(function (hotspot) {
    hotspot.addEventListener("click", function () {
      openPanel(hotspot.getAttribute("data-hotspot-id"));
    });
  });

  if (panelClose) {
    panelClose.addEventListener("click", closePanel);
  }

  document.addEventListener("keydown", function (event) {
    if (panel && !panel.hidden) {
      if (event.key === "Escape") closePanel();
      return;
    }
    if (event.key === "ArrowLeft" || event.key === "a" || event.key === "A") {
      heldKeys.left = true;
      startMoving();
    } else if (event.key === "ArrowRight" || event.key === "d" || event.key === "D") {
      heldKeys.right = true;
      startMoving();
    }
  });

  document.addEventListener("keyup", function (event) {
    if (event.key === "ArrowLeft" || event.key === "a" || event.key === "A") {
      heldKeys.left = false;
    } else if (event.key === "ArrowRight" || event.key === "d" || event.key === "D") {
      heldKeys.right = false;
    }
  });

  viewport.addEventListener("click", function (event) {
    if (event.target.closest(".ep-hotspot")) return;
    var rect = viewport.getBoundingClientRect();
    var clickX = event.clientX - rect.left;
    heldKeys.left = clickX < viewportWidth / 2;
    heldKeys.right = clickX >= viewportWidth / 2;
    startMoving();
    setTimeout(function () {
      heldKeys.left = false;
      heldKeys.right = false;
    }, 400);
  });

  window.addEventListener("resize", layoutWorld);
  layoutWorld();
})();
```

- [ ] **Step 2: Add the script tag to `layouts/index.html`**

Edit the file from Task 2 so the `main` block also loads the engine, deferred, homepage-only (the tag lives inside `index.html` itself, so it is never emitted on any other page):

```html
{{ define "main" }}
  <section class="layout-page">
    <div class="page-int section-stack section-stack--home">
      {{ partial "explorers-path/scene.html" . }}
    </div>
  </section>
  <script src="{{ "js/explorers-path.js" | relURL }}" defer></script>
{{ end }}
```

- [ ] **Step 3: Build and verify**

```bash
cd "/mnt/c/Users/SirenDesign/Desktop/Portfolio"
./bin/hugo --minify -d /tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop/f45f1257-6ea0-436a-a556-22be3ab8481b/scratchpad/hugo-build 2>&1 | tail -20
BUILD=/tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop/f45f1257-6ea0-436a-a556-22be3ab8481b/scratchpad/hugo-build
grep -o 'js/explorers-path.js' "$BUILD/index.html"
grep -o 'js/explorers-path.js' "$BUILD/work/index.html"
test -f "$BUILD/js/explorers-path.js" && echo "script built: ok"
node --check "$BUILD/js/explorers-path.js" 2>&1 || echo "(node not available — skip syntax check)"
```

Expected: build succeeds; first grep prints `js/explorers-path.js` (loaded on home); second grep prints nothing (not loaded elsewhere); third line prints `script built: ok`; the `node --check` line either prints nothing (valid syntax, no output means success) or the "(node not available...)" fallback message — either is fine, but if `node` is available and prints a `SyntaxError`, stop and fix the script before continuing.

- [ ] **Step 4: Commit**

```bash
git add static/js/explorers-path.js layouts/index.html
git commit -m "Add Explorer's Path movement, hotspot, panel, and audio engine"
```

---

### Task 5: Full-site verification pass

**Files:** none (verification only)

- [ ] **Step 1: Clean build**

```bash
rm -rf /tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop/f45f1257-6ea0-436a-a556-22be3ab8481b/scratchpad/hugo-build
cd "/mnt/c/Users/SirenDesign/Desktop/Portfolio"
./bin/hugo --minify -d /tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop/f45f1257-6ea0-436a-a556-22be3ab8481b/scratchpad/hugo-build 2>&1 | tail -30
```

Expected: build succeeds with zero `ERROR` lines.

- [ ] **Step 2: Confirm the rest of the site is untouched**

```bash
BUILD=/tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop/f45f1257-6ea0-436a-a556-22be3ab8481b/scratchpad/hugo-build
test -f "$BUILD/work/index.html" && echo "work list: ok"
test -f "$BUILD/work/bonheur/index.html" && echo "work/bonheur: ok"
test -f "$BUILD/experiments/index.html" && echo "experiments: ok"
test -f "$BUILD/about/index.html" && echo "about: ok"
grep -c 'cm-node' "$BUILD/about/index.html"
```

Expected: all four `test -f` lines print their `ok` message; the `cm-node` grep prints a count ≥ 6 (confirms the old Capability Map on `/about/` is untouched, per Global Constraints — this plan does not modify it).

- [ ] **Step 3: Confirm homepage structure end-to-end**

```bash
grep -c 'class="ep-hotspot"' "$BUILD/index.html"
grep -c 'class="ep-panel-entry"' "$BUILD/index.html"
grep -o '/work/bonheur/' "$BUILD/index.html"
grep -c 'ep-chapter--placeholder' "$BUILD/index.html"
grep -c 'ep-chapter--art' "$BUILD/index.html"
```

Expected: `6`, `6`, `/work/bonheur/`, `3` (Chapters 1, 3, 4), `1` (Chapter 2).

- [ ] **Step 4: Fix anything that fails, then re-run Steps 1–3 until everything passes.**

- [ ] **Step 5: Manual browser spot-check (not automatable — do this before calling it done)**

```bash
cd "/mnt/c/Users/SirenDesign/Desktop/Portfolio"
./bin/hugo server -D
```

Open `http://localhost:1313/Portfolio/` and confirm by eye:
- The forest scene loads where the old hero/collage used to be; Chapter 2 shows the real illustration, Chapters 1/3/4 show the labeled "artwork in progress" placeholder gradient.
- Pressing the right arrow key moves the world left (explorer appears to walk forward) and a soft footstep sound plays while the key is held; releasing the key stops the sound.
- Clicking on the left/right half of the scene (away from a hotspot) also moves the explorer in that direction.
- As the explorer nears a light-shaft hotspot, its glow and icon become visible without needing to hover directly on it; hovering or tab-focusing it does the same.
- Clicking a hotspot (or pressing Enter while it's focused) opens the content panel with the correct title/body for that hotspot; the Bonheur hotspot's panel shows a working "View the case study →" link to `/work/bonheur/`; the meme hotspot's panel clearly reads as a placeholder, not a fake finished meme.
- A discovery chime plays the first time each hotspot is opened, and does not replay on subsequent opens of the same hotspot.
- Pressing Escape, or clicking the × button, closes the panel and returns keyboard focus to the hotspot that opened it.
- Scrolling down below the interactive scene shows the "Prefer a plain list?" section with all 4 chapters and 6 items as native `<details>` elements — expand a couple and confirm the text matches what the interactive panel shows.
- Open the browser console and confirm there are no JS errors during any of the above.
- Resize the browser window (or use device toolbar) and confirm the scene, hotspot positions, and panel still lay out sensibly at a narrow mobile width (note: arrow-key movement won't work with touch — this is a known, already-documented gap, not a bug to fix in this pass, see spec §8).

Stop the dev server (Ctrl+C) when done.

- [ ] **Step 6: No commit for this task** (verification only — if Step 4 required fixes, those are already committed as part of whichever task's files they touched).
