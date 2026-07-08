# Bonheur Story Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the plain-prose Bonheur work page with a scrollytelling case-study page (6 narrative beats: Spark → The Ache → The Turn → The Jar → The Star Cloud → The Keeping), sharing one persistent light-motif across beats, with placeholders for any missing image/video assets, and update the homepage hotspot that already links to it.

**Architecture:** A new Hugo layout (`layouts/work/bonheur-story.html`) selected only for `content/work/bonheur.md` via a `layout` front-matter override — every other Work entry keeps using `layouts/work/single.html` untouched. Beat copy and per-beat state live in a new data file (`data/bonheur_story.yaml`), mirroring the existing `data/explorers_path.yaml` pattern already used by the homepage. A single sticky motif element persists across all beats; a scoped `IntersectionObserver` script (`static/js/bonheur-story.js`) toggles its `data-motif` state as each beat scrolls into view. The homepage's existing `now-case-study-1` hotspot (already linking to `/work/bonheur/`) gets updated teaser copy and an optional per-hotspot icon override so it visually stands out from the other (still-default-sparkle) hotspots.

**Tech Stack:** Hugo v0.163.3 (extended), static site, no JS framework, no automated test runner — this repo verifies via `./bin/hugo --minify` builds + `grep` assertions on the built HTML, plus a manual browser spot-check, matching the convention already used in `docs/superpowers/plans/2026-07-06-explorers-path.md`.

## Global Constraints

- `layouts/work/single.html` must remain untouched — it's still the default template for every other Work entry.
- Every hotspot in `data/explorers_path.yaml` except `now-case-study-1` must keep rendering the existing default sparkle glyph (`&#10022;`) — do not change their visual appearance.
- No new page-transition code — `static/css/page-transitions.css` already applies a sitewide crossfade via the native View Transitions API to this exact link (see its own header comment); do not add a second transition mechanism.
- Any beat with no real image/video asset yet must render a labeled placeholder block, not a broken `<img>`/`<video>` tag or blank space.
- Beat body copy must be real, final narrative copy (not lorem ipsum) — the 6-beat narrative is already settled (see `docs/superpowers/specs/2026-07-08-bonheur-story-page-design.md`).
- New CSS/JS for this page must load only on this page, following the existing `{{ if .IsHome }}` conditional-load pattern already used for `explorers-path.css`/`explorers-path.js`.

---

### Task 1: Beat data file + page skeleton

**Files:**
- Create: `data/bonheur_story.yaml`
- Modify: `content/work/bonheur.md` (front matter + body)
- Create: `layouts/work/bonheur-story.html`

**Interfaces:**
- Produces: `.Site.Data.bonheur_story.beats` — a slice of maps, each with keys `id` (string), `number` (int), `title` (string), `body` (string), `motif` (string, one of `drifting`/`fading`/`caught`/`jar-fill`/`cloud`/`settled`), `media` (string path or YAML `null`), and — beat 6 only — `video` (string path or YAML `null`). Task 2 and Task 3 read these keys; Task 3 also reads `.media`/`.video` to decide whether to render a placeholder.
- Produces: the page `/work/bonheur/` rendered via `layouts/work/bonheur-story.html` instead of `layouts/work/single.html`.

- [ ] **Step 1: Create the beat data file**

```yaml
# data/bonheur_story.yaml
beats:
  - id: spark
    number: 1
    title: "Spark"
    body: "Bonheur — bon + heur, a good hour. A life is just an accumulation of them. This is a practice of noticing the ones that already happened, before they disappear."
    motif: drifting
    media: null

  - id: ache
    number: 2
    title: "The Ache"
    body: "We remember the bad hour instantly and let the good one slip by unclaimed — negativity bias, not a flaw of memory but a habit of attention. Most of what actually moved you today is already gone by tonight."
    motif: fading
    media: null

  - id: turn
    number: 3
    title: "The Turn"
    body: "So: catch it before it fades. A photo, a word for what it was — a breeze, a small win, someone's laugh. Bonheur cuts the moment out of its own photo and keeps it as a spark — a little sticker of the thing itself."
    motif: caught
    media: null

  - id: jar
    number: 4
    title: "The Jar"
    body: "Every day gets its own jar. Drop a spark in and it glows — brighter with every good hour you caught that day. Up to three a day; some days the jar stays dim, and that's allowed to just be true."
    motif: jar-fill
    media: null

  - id: star-cloud
    number: 5
    title: "The Star Cloud"
    body: "Zoom out to a year, and every spark you've kept becomes a point of light. The ones that repeat — the same person, the same small ritual, the same word — drift together into their own cluster, orbiting a sun at the center. Not a mood board. A map of what actually moves you, drawn by you without meaning to."
    motif: cloud
    media: null

  - id: keeping
    number: 6
    title: "The Keeping"
    body: "No streaks. No feed. No score to keep. Just the good hours, kept — however many there turn out to be."
    motif: settled
    media: null
    video: null
```

- [ ] **Step 2: Point `content/work/bonheur.md` at the new layout and drop the outdated prose**

Replace the entire file with:

```markdown
+++
title = "Bonheur"
subtitle = "A personal emotional memory cabinet"
description = "A calm, guilt-free way to keep small parenting moments — no streaks, no feed, no social pressure."
date = 2026-06-06
role = "Solo product designer & builder"
timeline = "Ongoing since June 2026"
team = "Solo (design, interaction, and build)"
tags = ["Product Design", "Systems Thinking", "Interaction Design", "React Native"]
featured = true
icon = "fa-solid fa-box-archive"
layout = "bonheur-story"
+++

<!-- Content for this page is driven entirely by data/bonheur_story.yaml,
     rendered by layouts/work/bonheur-story.html. This body is intentionally
     unused (that layout never calls .Content). -->
```

(Front matter is unchanged from the current file except the added `layout` line — the Work list page and homepage still read `.Title`, `.Params.description`, `.Date`, etc. from here, per `layouts/work/list.html` and `layouts/partials/components/work-row.html`.)

- [ ] **Step 3: Create the page skeleton layout**

```html
{{/* layouts/work/bonheur-story.html */}}
{{ define "main" }}
  <section class="layout-page bs-page">
    <div class="bs-motif" id="bs-motif" data-motif="{{ (index .Site.Data.bonheur_story.beats 0).motif }}" aria-hidden="true">
      <div class="bs-spark"></div>
      <div class="bs-jar"></div>
      <div class="bs-cluster"></div>
    </div>

    <header class="bs-beat bs-beat-header page-int">
      <div class="bs-beat-inner">
        {{ with .Params.subtitle }}
          <p class="eyebrow text-accent">{{ . }}</p>
        {{ end }}
        <h1 class="heading-page text-2xl sm:text-3xl">{{ .Title }}</h1>
      </div>
    </header>

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
  </section>

  <script src="{{ "js/bonheur-story.js" | relURL }}" defer></script>
{{ end }}
```

- [ ] **Step 4: Build and verify the page renders through the new layout**

```bash
cd "/mnt/c/Users/SirenDesign/Desktop/Portfolio"
rm -rf /tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop-Sceneca-Render-02/720263d5-81be-4887-97ed-27f714334279/scratchpad/hugo-build
./bin/hugo --minify -d /tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop-Sceneca-Render-02/720263d5-81be-4887-97ed-27f714334279/scratchpad/hugo-build 2>&1 | tail -20
BUILD=/tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop-Sceneca-Render-02/720263d5-81be-4887-97ed-27f714334279/scratchpad/hugo-build
grep -c 'class="bs-beat"' "$BUILD/work/bonheur/index.html"
grep -o '>Spark<\|>The Ache<\|>The Turn<\|>The Jar<\|>The Star Cloud<\|>The Keeping<' "$BUILD/work/bonheur/index.html"
grep -c 'bs-media-placeholder' "$BUILD/work/bonheur/index.html"
```

Expected: build succeeds with zero `ERROR` lines; first grep prints `6`; second grep prints all six titles, one per line, in that order; third grep prints `7` (all six beats have no `media` yet, so each renders one placeholder — plus beat 6 also has no `video` yet, so it renders a second placeholder for that, giving 6 + 1 = 7).

- [ ] **Step 5: Commit**

```bash
git add data/bonheur_story.yaml content/work/bonheur.md layouts/work/bonheur-story.html
git commit -m "Add Bonheur story page skeleton driven by beat data"
```

---

### Task 2: Motif engine — CSS + scroll-triggered JS

**Files:**
- Create: `static/css/bonheur-story.css`
- Create: `static/js/bonheur-story.js`
- Modify: `layouts/partials/head.html`

**Interfaces:**
- Consumes: `.bs-beat` elements and `#bs-motif` produced by Task 1's layout, each beat carrying `data-motif`.
- Produces: `.is-visible` class toggled onto beats as they scroll into view; `#bs-motif`'s `data-motif` attribute kept in sync with whichever beat is currently in view. No other task depends on this one's internals beyond these two DOM contracts.

- [ ] **Step 1: Create the scoped stylesheet**

```css
/* static/css/bonheur-story.css
   BONHEUR STORY PAGE — scrollytelling case study.
   Loaded only on this page (see layouts/partials/head.html). All rules are
   scoped under bs- prefixed classes so nothing here leaks onto other pages. */

.bs-page {
  position: relative;
}

.bs-motif {
  position: sticky;
  top: 0;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  z-index: 0;
}

.bs-spark {
  position: relative;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: radial-gradient(circle, #fff8e7 0%, #f4c869 45%, transparent 75%);
  box-shadow: 0 0 24px 8px rgba(244, 200, 105, 0.55);
  transition: transform 0.6s ease, opacity 0.6s ease, box-shadow 0.6s ease;
}

.bs-motif[data-motif="drifting"] .bs-spark {
  animation: bs-drift 6s ease-in-out infinite;
}

.bs-motif[data-motif="fading"] .bs-spark {
  animation: bs-flicker 2.2s ease-in-out infinite;
  opacity: 0.4;
}

.bs-motif[data-motif="caught"] .bs-spark {
  transform: scale(1.3);
  box-shadow: 0 0 0 2px rgba(244, 200, 105, 0.8), 0 0 24px 8px rgba(244, 200, 105, 0.55);
}

.bs-motif[data-motif="caught"] .bs-spark::after {
  content: "";
  position: absolute;
  inset: -14px;
  border: 1px dashed rgba(244, 200, 105, 0.7);
  border-radius: 50%;
}

.bs-jar {
  position: absolute;
  width: 96px;
  height: 128px;
  border: 2px solid rgba(244, 200, 105, 0.5);
  border-radius: 12px 12px 28px 28px;
  opacity: 0;
  overflow: hidden;
  transition: opacity 0.6s ease;
}

.bs-jar::before {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 55%;
  background: linear-gradient(to top, rgba(244, 200, 105, 0.55), transparent);
}

.bs-motif[data-motif="jar-fill"] .bs-jar {
  opacity: 1;
}

.bs-cluster {
  position: absolute;
  width: 220px;
  height: 220px;
  opacity: 0;
  transition: opacity 0.6s ease;
}

.bs-cluster::before,
.bs-cluster::after {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #f4c869;
  box-shadow: 0 0 10px 3px rgba(244, 200, 105, 0.6);
  animation: bs-orbit 8s linear infinite;
}

.bs-cluster::after {
  animation-duration: 11s;
  animation-direction: reverse;
}

.bs-motif[data-motif="cloud"] .bs-cluster {
  opacity: 1;
}

.bs-motif[data-motif="settled"] .bs-spark {
  animation: none;
  opacity: 1;
  transform: scale(1);
}

@keyframes bs-drift {
  0%, 100% { transform: translateX(-12px); }
  50% { transform: translateX(12px); }
}

@keyframes bs-flicker {
  0%, 100% { opacity: 0.15; }
  50% { opacity: 0.5; }
}

@keyframes bs-orbit {
  from { transform: rotate(0deg) translateX(90px) rotate(0deg); }
  to { transform: rotate(360deg) translateX(90px) rotate(-360deg); }
}

@media (prefers-reduced-motion: reduce) {
  .bs-spark,
  .bs-cluster::before,
  .bs-cluster::after {
    animation: none !important;
  }
}

.bs-beat {
  position: relative;
  z-index: 1;
  min-height: 100vh;
  display: flex;
  align-items: center;
  padding: 3rem 1.5rem;
  opacity: 0;
  transform: translateY(24px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}

.bs-beat.is-visible {
  opacity: 1;
  transform: translateY(0);
}

.bs-beat-inner {
  max-width: 34rem;
  margin: 0 auto;
  background: rgba(0, 0, 0, 0.35);
  border-radius: 12px;
  padding: 1.5rem 1.75rem;
}

.bs-beat-number {
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  opacity: 0.6;
}

.bs-beat-media {
  margin-top: 1.5rem;
}

.bs-media-placeholder {
  border: 1px dashed rgba(255, 255, 255, 0.35);
  border-radius: 8px;
  padding: 2.5rem 1rem;
  text-align: center;
  font-size: 0.8rem;
  opacity: 0.6;
}
```

- [ ] **Step 2: Create the scroll-triggered motif script**

```js
// static/js/bonheur-story.js
// Toggles .is-visible on each beat as it scrolls into view, and keeps the
// persistent #bs-motif element's data-motif in sync with the beat currently
// in view. Loaded only on /work/bonheur/ (see layouts/work/bonheur-story.html).
(function () {
  "use strict";

  var motif = document.getElementById("bs-motif");
  var beats = document.querySelectorAll(".bs-beat");

  if (!motif || !beats.length) return;

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        var nextMotif = entry.target.getAttribute("data-motif");
        if (nextMotif) {
          motif.setAttribute("data-motif", nextMotif);
        }
      });
    },
    { threshold: 0.5 }
  );

  beats.forEach(function (beat) {
    observer.observe(beat);
  });
})();
```

- [ ] **Step 3: Load the stylesheet only on this page**

In `layouts/partials/head.html`, find:

```html
{{ if .IsHome }}
<link rel="stylesheet" href="{{ "css/explorers-path.css" | relURL }}">
{{ end }}
```

Add immediately after it:

```html
{{ if eq .Layout "bonheur-story" }}
<link rel="stylesheet" href="{{ "css/bonheur-story.css" | relURL }}">
{{ end }}
```

- [ ] **Step 4: Build and verify**

```bash
cd "/mnt/c/Users/SirenDesign/Desktop/Portfolio"
rm -rf /tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop-Sceneca-Render-02/720263d5-81be-4887-97ed-27f714334279/scratchpad/hugo-build
./bin/hugo --minify -d /tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop-Sceneca-Render-02/720263d5-81be-4887-97ed-27f714334279/scratchpad/hugo-build 2>&1 | tail -20
BUILD=/tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop-Sceneca-Render-02/720263d5-81be-4887-97ed-27f714334279/scratchpad/hugo-build
grep -o 'css/bonheur-story.css' "$BUILD/work/bonheur/index.html"
grep -o 'css/bonheur-story.css' "$BUILD/index.html"
grep -o 'js/bonheur-story.js' "$BUILD/work/bonheur/index.html"
test -f "$BUILD/css/bonheur-story.css" && echo "css built: ok"
test -f "$BUILD/js/bonheur-story.js" && echo "js built: ok"
node --check "$BUILD/js/bonheur-story.js" 2>&1 || echo "(node not available — skip syntax check)"
```

Expected: build succeeds; first grep prints `css/bonheur-story.css` (loaded on the Bonheur page); second grep prints nothing (not loaded on the homepage); third grep prints `js/bonheur-story.js`; both `test -f` lines print their `ok` message; `node --check` either prints nothing or the fallback message — if `node` is available and prints a `SyntaxError`, stop and fix the script before continuing.

- [ ] **Step 5: Commit**

```bash
git add static/css/bonheur-story.css static/js/bonheur-story.js layouts/partials/head.html
git commit -m "Add scroll-triggered motif engine for the Bonheur story page"
```

---

### Task 3: Homepage hotspot — teaser copy + distinct icon

**Files:**
- Modify: `data/explorers_path.yaml`
- Modify: `layouts/partials/explorers-path/scene.html:18`

**Interfaces:**
- Consumes: nothing from Tasks 1–2.
- Produces: an `icon` key on the `now-case-study-1` hotspot map, read by `scene.html`'s hotspot-icon rendering with a default fallback — no other task depends on this.

- [ ] **Step 1: Update the hotspot's teaser copy and add its icon override**

In `data/explorers_path.yaml`, find:

```yaml
  - id: now-case-study-1
    chapter: "Now"
    type: case-study
    title: "Bonheur"
    teaser: "A personal emotional memory cabinet — the first real Work entry."
    workRef: "work/bonheur/"
    xPercent: 25
    yPercent: 20
```

Replace with:

```yaml
  - id: now-case-study-1
    chapter: "Now"
    type: case-study
    title: "Bonheur"
    teaser: "Every good hour becomes a spark — kept in a jar, mapped into a star cloud by year's end."
    icon: "&#9733;"
    workRef: "work/bonheur/"
    xPercent: 25
    yPercent: 20
```

- [ ] **Step 2: Render the icon override with a fallback for every other hotspot**

In `layouts/partials/explorers-path/scene.html`, find line 18:

```html
      <span class="ep-hotspot-icon" aria-hidden="true">&#10022;</span>
```

Replace with:

```html
      <span class="ep-hotspot-icon" aria-hidden="true">{{ (default "&#10022;" .icon) | safeHTML }}</span>
```

- [ ] **Step 3: Build and verify**

```bash
cd "/mnt/c/Users/SirenDesign/Desktop/Portfolio"
rm -rf /tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop-Sceneca-Render-02/720263d5-81be-4887-97ed-27f714334279/scratchpad/hugo-build
./bin/hugo --minify -d /tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop-Sceneca-Render-02/720263d5-81be-4887-97ed-27f714334279/scratchpad/hugo-build 2>&1 | tail -20
BUILD=/tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop-Sceneca-Render-02/720263d5-81be-4887-97ed-27f714334279/scratchpad/hugo-build
grep -c '&#10022;' "$BUILD/index.html"
grep -c '&#9733;' "$BUILD/index.html"
grep -o "Every good hour becomes a spark" "$BUILD/index.html"
```

Expected: build succeeds; first grep prints `5` (the five non-Bonheur hotspots still show the default sparkle); second grep prints `1` (only `now-case-study-1` shows the star); third grep prints the teaser text once, confirming it made it into the homepage output.

- [ ] **Step 4: Commit**

```bash
git add data/explorers_path.yaml layouts/partials/explorers-path/scene.html
git commit -m "Give the Bonheur hotspot a distinct icon and updated teaser"
```

---

### Task 4: Full-site verification pass

**Files:** none (verification only)

- [ ] **Step 1: Clean build**

```bash
rm -rf /tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop-Sceneca-Render-02/720263d5-81be-4887-97ed-27f714334279/scratchpad/hugo-build
cd "/mnt/c/Users/SirenDesign/Desktop/Portfolio"
./bin/hugo --minify -d /tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop-Sceneca-Render-02/720263d5-81be-4887-97ed-27f714334279/scratchpad/hugo-build 2>&1 | tail -30
```

Expected: build succeeds with zero `ERROR` lines.

- [ ] **Step 2: Confirm the rest of the site is untouched**

```bash
BUILD=/tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop-Sceneca-Render-02/720263d5-81be-4887-97ed-27f714334279/scratchpad/hugo-build
test -f "$BUILD/work/index.html" && echo "work list: ok"
test -f "$BUILD/experiments/index.html" && echo "experiments: ok"
test -f "$BUILD/about/index.html" && echo "about: ok"
grep -o 'Bonheur' "$BUILD/work/index.html"
```

Expected: all three `test -f` lines print their `ok` message; the last grep prints `Bonheur` (still listed on the Work index via `layouts/work/list.html`, unaffected by its own page using a different single-page layout).

- [ ] **Step 3: Confirm the story page structure end-to-end**

```bash
BUILD=/tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop-Sceneca-Render-02/720263d5-81be-4887-97ed-27f714334279/scratchpad/hugo-build
grep -c 'class="bs-beat"' "$BUILD/work/bonheur/index.html"
grep -c 'bs-media-placeholder' "$BUILD/work/bonheur/index.html"
grep -o 'id="bs-motif"' "$BUILD/work/bonheur/index.html"
```

Expected: `6` beat sections; `7` placeholder blocks (one per beat's missing image, plus one more for beat 6's missing video); the motif container present once.

- [ ] **Step 4: Fix anything that fails, then re-run Steps 1–3 until everything passes.**

- [ ] **Step 5: Manual browser spot-check (not automatable — do this before calling it done)**

```bash
cd "/mnt/c/Users/SirenDesign/Desktop/Portfolio"
./bin/hugo server -D
```

Open `http://localhost:1313/Portfolio/work/bonheur/` and confirm by eye:
- Scrolling down reveals each of the 6 beats in order (Spark, The Ache, The Turn, The Jar, The Star Cloud, The Keeping), each fading/sliding in as it enters view.
- The motif (a glowing spark, sticky in place behind the text) visibly changes behavior at each beat: drifting → flickering/fading → caught with a dashed ring → filling a jar shape → orbiting into a small cluster → settling calm.
- Every beat shows a clearly labeled "Artwork pending" placeholder box (and beat 6 additionally shows a "Walkthrough video pending" placeholder) rather than a broken image/video.
- Open `http://localhost:1313/Portfolio/` and confirm the "Now" chapter's Bonheur hotspot shows a star icon while every other hotspot still shows the original sparkle glyph; open its panel and confirm the new teaser text, and that "View the case study →" still navigates to the Bonheur page with the sitewide soft crossfade (no new/different transition, no jump-cut).
- Open the browser console and confirm there are no JS errors on either page.
- Resize the browser window and confirm the story page's beats and motif still lay out sensibly at a narrow mobile width.

Stop the dev server (Ctrl+C) when done.

- [ ] **Step 6: No commit for this task** (verification only — if Step 4 required fixes, those are already committed as part of whichever task's files they touched).
