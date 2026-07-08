# Bonheur Story Page — Scrollytelling Case Study — Design Spec

**Date:** 2026-07-08
**Status:** Proposed

## 1. What this replaces

`content/work/bonheur.md` currently renders through the generic `layouts/work/single.html`
template as plain prose sections (Opportunity/Context/Understanding/Design
Thinking/Solution/Outcome), and describes an outdated **cabinet/drawer/canvas**
product concept. This spec replaces both: a dedicated scrollytelling page, and
narrative content grounded in the app's actual, current concept (per the latest
specs in `Desktop/bonheur/docs/superpowers/specs/`, see project memory
`project-bonheur-source-of-truth`): **sparks → a glowing jar per day → a star
cloud per year.**

`layouts/work/single.html` is untouched — other Work entries keep using it.

## 2. Narrative structure — 6 beats

One continuous scroll, not separate pages. A single persistent motif element
(a spark of light) is present throughout and changes what it's doing at each
beat, rather than being reintroduced per section (per the Oryzo-style reference
the user provided: motif consistency across scenarios).

1. **Spark** — a single point of light in the dark. Tagline: "bon + heur —
   good hour."
2. **The Ache** — negativity bias: bad hours stick, good ones fade unclaimed.
   Sparks flicker and vanish, uncaught.
3. **The Turn** — the reframe: catch it. A spark gets cut out of its photo,
   becomes a sticker.
4. **The Jar** — today's jar glows and fills as sparks drop in (real
   product mockup of the jar/glow UI).
5. **The Star Cloud** — zoom out to the Year view: sparks cluster into
   labeled constellations orbiting a sun, the emergent map of what actually
   moves you.
6. **The Keeping** — final polished mockups + a short walkthrough video
   retracing beats 3→5 in sequence, then close.

Each beat is a full-viewport-height `<section>`; scrolling past its threshold
triggers its reveal (copy fades/slides in, motif transforms) via
`IntersectionObserver`, same architectural pattern as `explorers-path.js`'s
hotspot-reveal logic — scoped, no site-wide scroll library.

## 3. Architecture

- **Layout:** new `layouts/work/bonheur-story.html`, selected via a
  `layout = "bonheur-story"` param in `content/work/bonheur.md`'s front
  matter (standard Hugo per-page layout override — `layouts/work/single.html`
  stays the default for every other Work entry).
- **Content data:** new `data/bonheur_story.yaml`, one entry per beat —
  `id`, `title`, `body` (copy), `media` (image/video ref or `null`), `motif`
  (a short state name the JS/CSS reads to pose the spark, e.g. `drifting`,
  `caught`, `jar-fill`, `cloud`). Mirrors the existing
  `data/explorers_path.yaml` pattern: content editable without touching
  templates or code.
- **Engine:** new scoped `static/js/bonheur-story.js` (IntersectionObserver
  per beat, drives motif state + reveal classes) and a scoped stylesheet
  (motif SVG/CSS, per-beat layout, beat transitions). Loaded only on this
  page, deferred, same pattern as `explorers-path.js`.
- **Video (beat 6):** a plain `<video>` tag, muted/looped or click-to-play;
  source path from the data file.

## 4. Placeholder policy

This pass builds structure, not final assets. Any beat whose `media` field
has no real asset yet renders a labeled placeholder block (dashed border,
"Artwork pending: <beat name>") — the same convention already used for
Explorer's Path chapters 1/3/4, so the pattern is consistent sitewide. Body
copy is written for real (not lorem ipsum) since the narrative is already
settled; only images/video/the final walkthrough clip are placeholders.

## 5. Homepage hotspot (the trigger link)

The homepage (`data/explorers_path.yaml`) already has a working `case-study`
hotspot (`now-case-study-1`) linking to `/work/bonheur/` — this is the
existing trigger; it does not need to be newly built. Two changes:

- **Teaser copy** updates to reflect the jar/star-cloud framing instead of
  the old generic line.
- **Icon:** every hotspot currently renders the same sparkle glyph
  (`&#10022;`, hardcoded in `layouts/partials/explorers-path/scene.html`).
  Add an optional `icon` field to the hotspot data schema (a literal
  character/HTML entity), read in `scene.html` with a fallback to the
  current sparkle for every hotspot that doesn't set one. Only
  `now-case-study-1` sets one (a star, distinct from the generic hotspot
  sparkle), so it visually stands out on the tree as *the* project link,
  foreshadowing the story page's motif. No other hotspot's appearance
  changes.

## 6. Page transition

No new work needed. `static/css/page-transitions.css` already applies a
sitewide crossfade via the native View Transitions API to every same-origin
navigation, and its own header comment specifically calls out the "View the
case study →" link out of the Explorer's Path panel as a case it covers.
The new page is a normal Hugo page, so it's covered automatically.

## 7. Explicitly deferred / out of scope (this pass)

- Real photography/mockup images and the final walkthrough video — placeholders
  per §4.
- A bespoke shared-element transition (e.g. the hotspot's star morphing into
  the page's opening spark) — the existing crossfade is sufficient for now;
  worth considering later as a polish pass, not this one.
- Rewriting `content/work/bonheur.md`'s current prose sections into beat copy
  is IN scope (the file's content changes to match the new concept and
  layout), but any further real-app screenshots/video capture is not — that
  depends on assets that don't exist yet.
- Mobile-specific scroll-triggered tuning beyond "doesn't break" — a full
  mobile motion pass is not part of this structure-first build.

## 8. Verification

No automated tests in this repo. After building: `./bin/hugo --minify` build
succeeds with zero errors; the new page renders all 6 beats in order with
placeholder blocks where media is missing; the homepage hotspot shows the new
icon and updated teaser and its link still resolves to `/work/bonheur/`;
manual scroll-through in a browser confirms each beat reveals in order and
the motif persists (not reset) between beats.
