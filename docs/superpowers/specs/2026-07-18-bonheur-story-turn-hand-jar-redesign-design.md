# Bonheur Story Page — Beat 3 ("The Turn") Hand + Jar Redesign — Design Spec

**Date:** 2026-07-18
**Status:** Proposed

## 1. What this replaces

Beat 3 ("Turn") is currently implemented per the 2026-07-13 spec
(`docs/superpowers/specs/2026-07-13-bonheur-story-turn-redesign-design.md`)
as a polaroid-photo → dashed cut-line trace → sticker-peel sequence, with
caption "So: catch it before it fades. A photo, a word for what it was — a
breeze, a small win, someone's laugh. Bonheur cuts the moment out of its own
photo and keeps it as a spark — a little sticker of the thing itself."

This spec fully replaces that sequence with a new one: a spark ignites out
of the dark, a sketchy pencil-linework hand rises up and catches it, carries
it down, and drops it into a glowing mason jar. All markup
(`.bs-turn-photo`, `.bs-turn-cutline`, `.bs-turn-sticker`), its CSS, and its
JS references are deleted, not left dead.

New caption: "So: catch it before it fades. A photo, a word for what it was
— a breeze, a small win, someone's laugh. Bonheur stores the moments."

**Scope:** this pass touches beat 3 only. Beats 1, 2, 4-6 are unchanged.

## 2. Architecture

Same conventions this file already establishes for scroll-scrubbed beats
(Ache, the old Turn):

- `<section class="bs-beat bs-turn" data-beat-id="turn" data-motif="caught" id="bs-turn">`
  stays a scroll spacer (~220vh), still carrying `data-beat-id`/`data-motif`
  so the existing IntersectionObserver-driven persistent-spark motif sync
  keeps working unchanged.
- Inside it, a `position: sticky` 100vh inner stage (`.bs-turn-stage`) with
  the `#0A0816` background filling the full viewport for the beat's
  duration — a direct visual continuation of where Ache leaves off.
  Contains, in DOM order (also visual stacking order):
  1. `.bs-turn-jar` — the mason jar (Section 2.3), always present, dim/empty
     at rest.
  2. `.bs-turn-spark` — the ignited spark (Section 2.4).
  3. `.bs-turn-hand` — the sketchy linework hand (Section 2.5).
  4. `.bs-turn-caption` — the caption text (Section 2.6), hardcoded in the
     template (same pattern as `.bs-ache-text`).
- A new `--bs-turn-progress` (0→1) custom property, computed by a scroll+rAF
  handler in `bonheur-story.js` reading `#bs-turn`'s
  `getBoundingClientRect()` — a fourth independent instance of the same
  small-dedicated-IIFE pattern `--bs-intro-progress`/`--bs-ache-progress`/
  the old `--bs-turn-progress` already used. This replaces (not adds to)
  the old handler of the same name.
- `data/bonheur_story.yaml`'s `turn` entry is unchanged from its current
  state: keeps `id: turn`, `number: 3`, `motif: caught` only.

## 3. Choreography

All ranges below are values of `--bs-turn-progress` (0→1), following the
same `clamp(0, calc((progress - start) / (end - start)), 1)` phase-window
technique the Ache and old-Turn CSS already use throughout.

| Progress | Phase |
|---|---|
| 0 → 0.12 | Screen holds black (continuing from Ache's ending). `.bs-turn-jar` fades in at bottom-center, dim/empty, resting on the stage's bottom edge. |
| 0.12 → 0.30 | `.bs-turn-spark` ignites center-screen (fade + scale in), settles into a light idle drift (reusing the same drift technique the persistent `.bs-spark` motif already uses elsewhere on this page). |
| 0.30 → 0.45 | `.bs-turn-hand` rises from the bottom edge of the stage, fingers open, reaching up toward the spark's position. |
| 0.45 → 0.55 | Fingers curl closed around the spark. The spark's opacity/visibility is driven down as the hand closes (per Section 2.4), reading as "swallowed" by the closing fingers — its glow only peeks through the finger gaps rather than sitting fully exposed on top of the hand. |
| 0.55 → 0.75 | The closed hand (spark hidden inside) translates back down toward the jar's mouth. |
| 0.75 → 0.85 | Fingers open over the jar mouth. A second spark instance (`.bs-turn-jar-spark`, positioned inside the jar) fades in as the hand's spark fades out — reading as the drop — while `.bs-turn-jar`'s glass fill transitions from dim/grey to a warm gold glow. |
| 0.85 → 1.0 | `.bs-turn-hand` withdraws back down out of frame (translate + fade). `.bs-turn-caption` fades in beside/below the now-glowing jar. Holds as the resting end-state through progress 1.0. |

## 4. Visual details

### 4.1 The jar (`.bs-turn-jar`)

Inline SVG, mason-jar silhouette: straight-sided cylindrical body (rounded
bottom corners), a ridged neck (two horizontal lines near the top), flat
lid with a small knob. ~110px × 170px at rest, centered at the stage's
bottom-center, anchored so ~20% of its height sits below the visible
viewport edge (jar reads as "sitting on the floor" of the scene, not
floating).

- **Glass body**: linear gradient left-to-right — bright edge highlight
  (`rgba(255,255,255,0.35)`) → warm gold tint (`rgba(244,200,105,0.08-0.12)`)
  → bright edge highlight again — same technique already used for
  `.bs-turn-photo`'s inner gradient in the current CSS, just applied to a
  jar-shaped path instead of a rounded rect. Stroke: `rgba(244,200,105,0.7)`,
  2px, matching the existing cut-line gold.
- **Lid**: flat grey-metal fill (`#8a8f9a`) with a lighter rim
  (`#c8cdd6`), matching neither gold nor glass — reads as a separate
  material.
- **Empty state** (progress 0 → 0.75): no inner glow, just the dim glass
  gradient.
- **Lit state** (progress 0.75 → 0.85, then held): a radial gold glow
  (`#F4C869`, low opacity, large blur radius) grows from 0 behind
  `.bs-turn-jar-spark`, filling the jar's lower two-thirds — driven by the
  same `--bs-turn-progress` phase window as the spark drop in Section 3.

### 4.2 The spark (`.bs-turn-spark` / `.bs-turn-jar-spark`)

Reuses the site's existing `.bs-spark` visual unchanged: solid `#F4C869`
circle core with a large, low-opacity halo behind it (matching the app's
Star Cloud style, already established elsewhere on this page). Two
positioned instances — one that ignites center-screen and travels with the
hand, one that fades in inside the jar — rather than one element animated
along a path, avoiding a repaint-heavy `transform`-along-arbitrary-curve
animation.

### 4.3 The hand (`.bs-turn-hand`)

Inline SVG, drawn as an open-palm-with-fingers path (side profile, reaching
upward) that curls to a closed fist via a second path — the two states
cross-faded (or, if feasible with one path's `d` attribute animated via
CSS custom property-driven `clip-path`/stroke interpolation, whichever
proves simpler to implement cleanly) across the 0.45 → 0.55 curl window.

**Sketchy linework technique**: each stroke of the hand is drawn twice —
a primary path plus a second copy at ~1px positional offset, slightly
lower opacity (`~0.5`), and a marginally different `stroke-width` — so the
two overlapping lines read as a hand-drawn "wobble" rather than a single
clean vector line. Stroke color: warm off-white (`#E8E4DA`), no fill (pure
linework, per the request). No color/shading — this is intentionally left
as a sketch, not a rendered illustration.

### 4.4 The caption (`.bs-turn-caption`)

"So: catch it before it fades. A photo, a word for what it was — a breeze,
a small win, someone's laugh. Bonheur stores the moments."

Fades in only once the hand has withdrawn and the jar is lit (progress
0.85 → 1.0), positioned beside/below the jar. Light text color (`#f4f0ff`,
matching `.bs-ache-text`) against the dark backdrop. No fade-out — resting
end-state through progress 1.0, same as the caption it replaces.

## 5. Reduced motion

Static end-state only, extending the existing `prefers-reduced-motion:
reduce` block: `.bs-turn-stage` background is `#0A0816`; `.bs-turn-jar` is
shown lit/glowing (its progress-0.85+ state); `.bs-turn-spark` (the
free-floating one) and `.bs-turn-hand` are both hidden entirely (`display:
none` — transient props, not part of the resting state); `.bs-turn-jar-spark`
is shown at full opacity inside the jar; `.bs-turn-caption` is fully visible
(`opacity: 1 !important`). No ignite/curl/lower/drop animation. Same
convention as the Ache and former-Turn reduced-motion rules.

## 6. Explicitly deferred / out of scope

- Any second hand, or fingers individually articulated as separate
  elements — one single-path hand silhouette is sufficient for the sketch
  style requested.
- A literal "jar lid closing" animation after the drop — the sequence ends
  with the lid already on and the jar simply lighting up; no additional
  lid-motion beat.
- Any change to beats 1, 2, 4-6, or to the persistent spark's own "caught"
  motif CSS — left untouched; this beat's custom `#0A0816` stage visually
  covers it for the beat's duration, same as Ache's ink blobs do.
- Real photography/illustration assets for the hand or jar — both are pure
  CSS/SVG per the approved approach, no image files added.

## 7. Verification

After building: `./bin/hugo --minify` succeeds with zero errors. Manual
browser scroll-through confirms:

- Screen stays black entering the beat; the dim jar fades in at
  bottom-center before anything else appears.
- The spark ignites center-screen and settles into a light idle drift.
- The sketchy hand visibly rises from the bottom, fingers open, and the
  double-stroke "wobble" reads as pencil linework rather than a clean
  vector line.
- Fingers visibly curl closed around the spark (spark dims/hides as the
  hand closes, not an instant cut).
- The hand lowers back toward the jar and opens over its mouth; the spark
  reappears inside the jar as the hand's copy fades, and the jar's glass
  visibly transitions from dim to a warm gold glow.
- The hand withdraws out of frame; the caption fades in only after the
  hand is gone and the jar is lit — not before.
- Beats 1, 2, 4-6 are pixel-for-pixel unaffected; the persistent spark
  still correctly re-ignites (`motif="jar-fill"`) entering beat 4.
- `prefers-reduced-motion: reduce` shows the static lit-jar end-state
  described in Section 5 with no animation, and no leftover `.bs-turn-photo`/
  `.bs-turn-cutline`/`.bs-turn-sticker` elements or CSS remain anywhere in
  the codebase.
- No new console errors.
