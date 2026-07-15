# Bonheur Story Page — Beat 3 ("The Turn") Redesign — Design Spec

**Date:** 2026-07-13
**Status:** Proposed

## 1. What this replaces

Beat 3 currently renders through the standard per-beat card template (number
"03" / "The Turn" / body copy "So: catch it before it fades..." /
placeholder), with the persistent `#bs-motif` spark set to
`data-motif="caught"` (scaled up, ringed with a dashed circle) for the beat's
duration.

This redesign replaces that card entirely with a new scroll-scrubbed
sequence, architecturally mirroring beat 2's Ache redesign
(`#bs-ache`/`--bs-ache-progress`): the screen stays black from Ache's ending,
a polaroid-style photo fades into view holding the spark, a dashed cut-line
traces itself around the spark, the spark peels free as a sticker with a
growing drop shadow, and only once it's fully peeled does the beat's caption
text fade in beneath it:

> "So: catch it before it fades. A photo, a word for what it was — a breeze,
> a small win, someone's laugh. Bonheur cuts the moment out of its own photo
> and keeps it as a spark — a little sticker of the thing itself."

**Scope:** this pass touches beat 3 only. Beats 1, 2, 4-6 are unchanged.

## 2. Architecture

### 2.1 Structure

The "turn" entry in the beats loop (`layouts/work/bonheur-story.html`)
renders a new dedicated block instead of the standard card:

- `<section class="bs-beat bs-turn" data-beat-id="turn" data-motif="caught" id="bs-turn">`
  — still carries `data-beat-id`/`data-motif` so the existing
  `IntersectionObserver`-driven persistent-spark motif sync keeps working
  unchanged; visually it's a 220vh spacer (shorter than Ache's 280vh — this
  beat has fewer, more sequential phases and no extended twinkle/drift
  hold) rather than the standard 100vh card.
- Inside it, a `position: sticky` 100vh inner stage (`.bs-turn-stage`,
  matching `.bs-ache-stage`) with a `#0A0816` background filling the full
  viewport for the entire beat — a direct visual continuation of where
  Ache leaves off, so there's no hard cut into daylight. Contains, in DOM
  order (also visual stacking order):
  1. `.bs-turn-photo` — the polaroid frame (Section 2.3).
  2. `.bs-turn-cutline` — the SVG trace (Section 2.4).
  3. `.bs-turn-sticker` — the peeled spark (Section 2.5).
  4. `.bs-turn-caption` — the caption text (Section 2.6), hardcoded in the
     template (same pattern as `.bs-ache-text` — not sourced from
     `data/bonheur_story.yaml`).
- `data/bonheur_story.yaml`'s `turn` entry drops its now-unused `title`,
  `body`, and `media` fields (the new block doesn't read them) but keeps
  `id: turn`, `number: 3`, and `motif: caught` — same precedent as `ache`.

### 2.2 Progress engine

A new `--bs-turn-progress` (0→1) custom property, computed by a scroll+rAF
handler in `bonheur-story.js` reading `#bs-turn`'s `getBoundingClientRect()`
— a third independent instance of the same small-dedicated-IIFE pattern
`--bs-intro-progress` and `--bs-ache-progress` already use. No shared
refactor; consistent with this file's established convention.

### 2.3 The photo (progress 0 → 0.15)

`.bs-turn-photo`: a polaroid-style card, centered, ~260px × 320px, cream
border (`#faf6ef`, ~14px on three sides, ~50px bottom margin for the classic
polaroid look), 2px rounded corners, soft drop shadow
(`0 12px 32px rgba(0,0,0,0.4)`). Its inner image area is a warm, softly
blurred gradient (`radial-gradient` mixing `#fff3d6`, `#f4c869`, a touch of
warm coral) with a light `blur()` filter — an out-of-focus "scene," matching
Ache's precedent of generated abstract visuals rather than a placeholder
label or real photography (none exists yet). The existing `.bs-spark` visual
language (radial-gradient gold glow), at roughly 1.4× its normal size, sits
centered inside that gradient.

Fades and scales in from `opacity: 0, scale(0.9)` to `opacity: 1, scale(1)`
over progress 0 → 0.15 — the black backdrop already fills the screen before
this starts, so the photo is the first thing to visibly arrive.

### 2.4 The cut-line (progress 0.15 → 0.45)

An inline SVG circle (`.bs-turn-cutline`), positioned to ring the spark
inside the photo (~54px radius), `stroke-dasharray`/`stroke-dashoffset`
animated via `--bs-turn-progress` so the dashed outline visibly traces
itself into existence rather than just fading in — `stroke-dashoffset`
interpolates from the full circumference (nothing drawn) to `0` (fully
drawn) linearly across this range. Stroke color matches the site's existing
dashed-placeholder gold-adjacent tone for continuity with the cut-line
metaphor already used elsewhere (`rgba(244, 200, 105, 0.8)`).

### 2.5 The peel (progress 0.45 → 0.65)

`.bs-turn-sticker` — a small circular element containing a clipped copy of
the gradient + spark (same visual content the cut-line just traced) —
animates from sitting exactly over the spark's position in the photo to a
lifted position (translated up/right ~40px, rotated ~8°, scaled to 1.1×),
with its drop shadow growing from `0` to a pronounced
`0 16px 24px rgba(0,0,0,0.5)` across the same range — reads as physically
lifting off the page. Simultaneously, `.bs-turn-photo` dims to `opacity:
0.55` over the same range, reinforcing that the piece has been removed from
it. The traced cut-line fades out as the sticker fully separates.

### 2.6 The caption (progress 0.65 → 0.85, holding to 1.0)

`.bs-turn-caption` (the copy quoted in Section 1) fades in only once the
sticker has fully peeled — mirroring `.bs-ache-text`'s "appears after the
sequence resolves" precedent rather than staging phrase-by-phrase. Positioned
below the sticker's resting position. Light text color (`#f4f0ff`, matching
`.bs-ache-text`) against the dark backdrop. No fade-out — this is the beat's
resting end-state through progress 1.0.

### 2.7 Handoff to beat 4 (The Jar)

No custom exit animation. Once scroll passes `#bs-turn`'s bottom edge, the
sticky stage releases naturally (same mechanism already governing every
other beat boundary on this page) and the Jar beat's existing plain card
scrolls in underneath. The finished sticker + caption simply stop being
sticky and scroll away with the page.

### 2.8 Reduced motion

Static end-state only, extending the existing `prefers-reduced-motion:
reduce` block: `.bs-turn-stage` background is `#0A0816`; `.bs-turn-photo` is
hidden (`display: none` — it's a transient prop, not part of the resting
state); `.bs-turn-sticker` is shown at its final peeled position/rotation
with full opacity and no cut-line; `.bs-turn-caption` is fully visible
(`opacity: 1 !important`). No SVG trace animation, no fade/scale
transitions. Same convention as the Ache and intro reduced-motion rules.

## 3. Explicitly deferred / out of scope

- Real photography for the polaroid's inner image — still a generated
  abstract gradient, per the placeholder-era constraint already accepted
  for Ache. Revisit once real app screenshots/photography exist (tracked as
  already deferred in the original page-level spec).
- A literal "sticker drops into the jar" connective animation carrying into
  beat 4 — considered, explicitly deferred; the sticker simply holds and
  normal scroll continues per Section 2.7.
- Any change to beats 1, 2, 4-6, or to the persistent spark's own "caught"
  motif CSS — left untouched; this beat's custom `#0A0816` stage visually
  covers it for the beat's duration the same way Ache's ink blobs do.

## 4. Verification

After building: `./bin/hugo --minify` succeeds with zero errors. Manual/
Playwright browser scroll-through confirms:

- Screen stays black entering the beat, then the polaroid photo fades and
  scales in.
- The dashed cut-line visibly draws itself around the spark (partial trace
  at intermediate scroll positions, not an instant pop-in).
- The sticker separates from the photo with a visibly growing drop shadow
  while the photo dims; the cut-line fades out as separation completes.
- The caption text is not visible until the sticker has substantially
  peeled, then holds fully visible through the end of the beat.
- Beats 1, 2, 4-6 are pixel-for-pixel unaffected; the persistent spark
  still correctly re-ignites (`motif="jar-fill"`) entering beat 4.
- `prefers-reduced-motion: reduce` shows the static end-state described in
  Section 2.8 with no animation.
- No new console errors.
