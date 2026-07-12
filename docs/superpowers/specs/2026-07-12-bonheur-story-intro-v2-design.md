# Bonheur Story Page — Intro Sequence v2 (Tagline, Backdrop, Scroll Cue) — Design Spec

**Date:** 2026-07-12
**Status:** Approved

## 1. What this changes

This is a follow-up to `docs/superpowers/specs/2026-07-12-bonheur-story-intro-motion-redesign-design.md`
(the Bon/heur convergence sequence, already shipped in commits `ea68cfe`..`8d580c7`
on `bonheur-story-page`). That version is not re-litigated here — corner entry,
scroll-scrubbed architecture, spark ignition mechanics, reduced-motion handling,
and the persistent `#bs-motif` spark all stay as already built. This spec covers
four additions on top of it:

1. Tighten the corner reveal so only one full letter is visible at rest.
2. Add a scroll-down affordance (pulsing chevron) shown only before scrolling starts.
3. Insert a tagline reveal phase between the word-merge and the spark ignition.
4. Add a living-light noise backdrop behind the intro, ported from the real
   Bonheur app.

## 2. One-letter corner reveal

Today's shipped version reveals roughly 1.5-2 letters of "Bon"/"heur" at rest
(progress 0). Tighten the corner-entry offset (`.bs-intro-word--bon`/`--heur`'s
`(1 - var(--bs-enter)) * ±38vw` term) so only **one full letter** — "n" (Bon's
trailing/center-facing letter) and "h" (heur's leading/center-facing letter) —
is visible at rest, with the clip boundary landing on a full glyph edge rather
than mid-character. The exact vw value is tuned empirically against a real
rendered screenshot during implementation (font metrics make this imprecise to
compute analytically); start from roughly `50vw` (up from `38vw`) and adjust
from there.

## 3. Scroll-down cue

A new `.bs-scroll-cue` element: a minimal white chevron (down-arrow), centered
in `.bs-intro-stage`, visible only before the user scrolls.

- **Structure:** an outer wrapper (`.bs-scroll-cue`) whose opacity is driven by
  `--bs-intro-progress` — full opacity at progress 0, collapsing to 0 within the
  first 3% of progress (`clamp(0, 1 - var(--bs-intro-progress, 0) / 0.03, 1)`)
  — and an inner icon (`.bs-scroll-cue-icon`) that continuously pulses via the
  same `bs-flicker` keyframe animation already defined for beat 2's spark
  (reused as-is for visual consistency, not a new animation).
- **Markup:** a simple CSS-drawn chevron (two rotated border edges, no new SVG
  asset, no icon font dependency) rather than an image.
- **Behavior:** purely decorative (`aria-hidden="true"`, `pointer-events: none`)
  — it never blocks interaction and disappears well before any other phase
  begins.

## 4. Tagline reveal phase

### 4.1 Timeline change

The intro's total scroll height grows from 220vh to **320vh** (scrollable
pinned range: 120vh → 220vh) to give the tagline room without rushing the
existing phases. Revised phase table (progress 0→1 across the new range):

| Progress | Behavior |
|---|---|
| 0.00 – 0.30 | "Bon"/"heur" converge from bottom corners (one letter each visible at 0.00), color shifts ink → gold. Same mechanic as shipped, re-scaled to the new range. |
| 0.30 – 0.55 | Words hold, merged, reading "Bonheur." Tagline fades in beneath it (~0.30–0.40), holds fully legible, then plays a brief one-time flicker (2-3 quick pulses, not a continuous loop). |
| 0.55 – 0.65 | Tagline fades back out. |
| 0.65 – 0.75 | Spark ignites at the seam between the words (opacity 0→1). |
| 0.75 – 0.95 | Words recede outward and fade (same mechanic as shipped, re-scaled). Backdrop (Section 5) also fades out over this range. |
| 0.95 – 1.00 | Settled: spark alone, drifting; beat-1 card follows as today. |

### 4.2 Tagline content & styling

- Copy (exact, final): **"A personal memory companion that helps people
  cultivate happiness by collecting meaningful everyday moments."**
- Element: a new `<p class="bs-intro-tagline">` inside `.bs-intro-stage`,
  centered horizontally, positioned below the merged wordmark (e.g. `top: 62%`
  vs. the wordmark's `top: 50%`), constrained to a readable max-width (e.g.
  `32rem`) so it wraps as body copy, not a single long line.
- Opacity formula: two independent ramps combined —
  `fadeIn = clamp(0, (progress - 0.30) / 0.10, 1)`,
  `fadeOut = clamp(0, (progress - 0.55) / 0.10, 1)`,
  `opacity = fadeIn * (1 - fadeOut)`.
- Flicker: a one-time (non-looping) CSS `@keyframes` flicker (2-3 opacity
  pulses over ~1s), triggered via a class (`.bs-intro-tagline--flicker`) added
  once by JS the first time progress crosses 0.40 (a one-way latch, matching
  the existing `.is-visible` latch pattern used by the per-beat reveal system
  — never removed once added, even if the user scrolls back up).

## 5. Living-light noise backdrop

### 5.1 Source & rationale

Ported from the real Bonheur app (`Desktop/bonheur/src/`), combining two
different existing components' techniques rather than one:

- **Palette/layout** from `src/components/Universe.js`'s `mood="day"` render
  — the app's actual persistent ambient background (used on the calendar,
  day view, and onboarding screens), not the data-driven jar glow. Exact
  colors:
  - Base sky radial gradient: `#F8EFFB` → `#EFE7FA` → `#F6E2EE`.
  - Sunshine wash from the top-right corner: `#FFE2A0` → `#FFD9A0` → `#FFF3D6`
    (linear gradient, diagonal, matching `Universe.js`'s `sunshine`/`sun`
    gradients).
  - Three mist blobs: pink `#F0BEDE`, purple `#C3A6EE`, teal `#C2E0E8`.
- **Motion** from `src/components/JarBackdrop.js` / `src/simplexNoise.js` — the
  `simplex2(x, y)` deterministic 2D simplex noise function (public-domain
  Gustavson algorithm, ~70 lines, no dependency) is ported verbatim into
  `bonheur-story.js`. Each of the three mist blobs samples `simplex2(t, seed)`
  with its own seed (matching `JarBackdrop`'s single-seed `simplex2(t, 11.3)`
  pattern, extended to three independent seeds) once per animation frame,
  driving its position (small drift, e.g. ±20px) and opacity (breathing,
  base ~0.3 ± 0.05 per blob, matching `JarBackdrop`'s
  `BASE_OPACITY`/`BREATHE` constants) — the base sky and sunshine layers stay
  static, only the three mist blobs breathe/drift.

### 5.2 Structure & scope

- Four new layered `div`s inside `.bs-intro-stage`, all behind the words/
  tagline/spark (`z-index` below them): `.bs-intro-sky` (static base
  gradient), `.bs-intro-sunshine` (static corner gradient), and three
  `.bs-intro-mist` elements (one per color, each independently
  noise-driven), all heavily blurred (`filter: blur(...)`) for the mist
  blobs specifically.
- **Scope:** intro-only, as already agreed — this backdrop is not added to
  beats 2-6, which keep today's plain background.
- **Lifecycle:** present for the intro's full duration; the three mist blobs'
  base opacity is additionally multiplied by the same recede-phase fade used
  for the words (0.75-0.95) so the whole backdrop fades out together with
  everything else as the intro concludes. The static sky/sunshine layers fade
  out over the same range.
- **Animation loop:** a second `requestAnimationFrame` loop, independent from
  the existing scroll-driven `--bs-intro-progress` loop, since the noise
  drift is continuous/time-based (keeps breathing even if the user pauses
  mid-scroll) rather than scroll-position-based. It only runs while `#bs-intro`
  is at least partially in the viewport (checked cheaply each frame via the
  same `getBoundingClientRect()` already computed for the progress loop) so it
  doesn't burn cycles after the user has scrolled well past the intro.

## 6. Explicitly deferred / out of scope

- Beats 2-6: still untouched (copy, motifs, reveal mechanism).
- Any further changes to word/spark colors, entry direction, or reduced-motion
  handling beyond what's already shipped — those stay as-is.
- The Universe/JarBackdrop source files in the Bonheur app itself are read
  from, not modified — this is a one-way port of technique/palette into the
  portfolio site, not a shared dependency between the two repos.

## 7. Verification

After building: `./bin/hugo --minify` succeeds with zero errors. Manual/
Playwright browser scroll-through confirms:

- At progress 0, only "n" and "h" are visible at the bottom corners, and the
  scroll cue chevron pulses centered on screen.
- Scrolling even slightly makes the scroll cue disappear within the first ~3%
  of progress.
- The tagline fades in under "Bonheur" once merged, is fully legible, flickers
  once (not continuously), then fades out before the spark ignites.
- The backdrop (sky/sunshine/mist) is visible and the three mist blobs
  visibly drift/breathe independently of each other during the sequence, then
  fade out together with the words during the recede phase.
- No new console errors; beats 2-6 are pixel-for-pixel unaffected; reduced-
  motion still shows the settled end-state immediately (words hidden, cue
  hidden, backdrop and tagline skipped entirely under reduced motion since
  they're purely decorative motion/reveal effects).
