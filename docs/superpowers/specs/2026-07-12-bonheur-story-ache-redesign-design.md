# Bonheur Story Page — Beat 2 ("The Ache") Redesign — Design Spec

**Date:** 2026-07-12
**Status:** Approved

## 1. What this replaces

Beat 2 currently renders through the standard per-beat card template (number
"02" / "The Ache" / body copy "We remember the bad hour instantly..." /
placeholder), with the persistent `#bs-motif` spark set to `data-motif="fading"`
(a dim, flickering 0.4-opacity state) for the beat's duration.

This redesign replaces that card entirely with a new scroll-scrubbed sequence,
architecturally mirroring the beat-1 intro (`#bs-intro`/`--bs-intro-progress`):
~13 stars scatter into view, drift and twinkle, then fade out one by one while
dark, liquid ink-blob shapes grow and merge to cover the screen — at which
point new text appears:

> "We often let the good moments slip away unnoticed. Our minds are wired
> with a negativity bias, so what captures our attention isn't always what
> truly mattered. What moved us most is often forgotten first."

**Scope:** this pass touches beat 2 only. Beats 1, 3-6 are unchanged.

## 2. Architecture

### 2.1 Structure

The "ache" entry in the beats loop (`layouts/work/bonheur-story.html`) renders
a new dedicated block instead of the standard card:

- `<section class="bs-beat bs-ache" data-beat-id="ache" data-motif="fading" id="bs-ache">`
  — still carries `data-beat-id`/`data-motif` so the existing
  `IntersectionObserver`-driven persistent-spark motif sync (in
  `bonheur-story.js`) keeps working unchanged; visually it's a ~280vh tall
  spacer (matching the ~280-300vh scroll budget agreed for this beat) rather
  than the standard 100vh card.
- Inside it, a `position: sticky` 100vh inner stage (`.bs-ache-stage`,
  mirroring `.bs-intro-stage`) contains:
  - ~13 star elements, JS-generated at runtime (not hand-authored in the
    Hugo template, since their positions must be genuinely random).
  - 3-4 dark ink-blob elements (also JS-generated, positioned at a few of
    the stars' own coordinates).
  - The new text paragraph (`.bs-ache-text`), hardcoded directly in the
    template (same pattern as the intro's `.bs-intro-tagline` — not sourced
    from `data/bonheur_story.yaml`).
- `data/bonheur_story.yaml`'s `ache` entry drops its now-unused `title`,
  `body`, and `media` fields (the new template block doesn't read them) but
  keeps `id: ache`, `number: 2`, and `motif: fading` (still referenced by
  the front-matter-driven Work-list rendering and the persistent-spark sync
  respectively).

### 2.2 Progress engine

A new `--bs-ache-progress` (0→1) custom property, computed by a scroll+rAF
handler in `bonheur-story.js` reading `#bs-ache`'s `getBoundingClientRect()`
— structurally identical to the existing `--bs-intro-progress` computation,
a second independent instance of the same pattern, not a generalization of
it (each stays a small, separately-readable function, consistent with this
file's existing style of one dedicated IIFE per concern).

### 2.3 Star mechanics

Each of the ~13 stars is a small element reusing `.bs-spark`'s exact visual
language (radial-gradient warm gold glow) at a smaller scale. Created once
by JS at page load with these properties baked in as inline CSS custom
properties (not recomputed every frame):

- `--bs-star-x` / `--bs-star-y`: a random position scattered across the
  viewport (`fixed` positioning, matching the fix already applied to the
  intro's words/backdrop, so stars aren't clipped by the page's
  max-width/padded container on wide viewports).
- `--bs-star-in`: a random threshold in `[0.00, 0.20]` — when this star
  starts fading in.
- `--bs-star-out`: a random threshold in `[0.55, 0.90]` — when this star
  starts fading out.
- A random `animation-delay` (negative, so the shared `bs-flicker` keyframe
  starts pre-offset) for independent twinkle phase per star.
- A random noise seed, consumed each frame by the same `simplex2` port
  already in `bonheur-story.js`, driving a small drift wobble
  (`--bs-star-wobble-x`/`-y`), same technique as the intro's word wobble
  and mist drift.

Per-star opacity formula (all using the shared `--bs-ache-progress` plus
that star's own static thresholds):

```
fadeIn  = clamp(0, (progress - star-in)  / 0.08, 1)
fadeOut = clamp(0, (progress - star-out) / 0.08, 1)
opacity = fadeIn * (1 - fadeOut)
```

### 2.4 Darkness: growing ink blobs

3-4 dark purple-black blob elements (`#0A0816`, the real app's own near-black
background tone from `CabinetScreen.js`'s `styles.safe.backgroundColor` —
consistent with reusing the app's actual palette, same as the day-mode
backdrop did), each:

- Positioned at a few of the stars' own coordinates (not fixed screen
  corners) so the darkness visibly originates from where stars are.
- Blurred (`filter: blur(...)`), same soft-edge technique as the mist blobs,
  for a liquid rather than hard-circle look.
- Scales from 0 to a size large enough that 3-4 of them overlapping cover
  the full viewport, over `--bs-ache-progress` 0.55-0.90, each blob's own
  growth rate slightly randomized (not lockstep).
- Carries the same noise-driven wobble as the mist blobs, so its edges
  shift organically while growing rather than scaling as a mechanical
  perfect circle.
- `position: fixed`, full-bleed, `z-index` above the stars but below the
  text.

Stars fade on their own independent schedule (Section 2.3) — the blobs are
not physically linked to individual stars' positions once created (no
per-star attraction physics; that fancier version was considered and
explicitly deferred, see Section 3).

### 2.5 Text reveal

`.bs-ache-text` (the new copy above) fades in once the screen is
sufficiently dark — roughly `--bs-ache-progress` 0.75-0.90, holding through
1.0 — using the same `fadeIn`-only half of the tagline's formula (no
fade-out needed here, unlike the intro's tagline, since this text is the
beat's resting end-state). Since the background here is dark (unlike the
intro's light pastel), the text color is light (`var(--color-bg)` from the
light theme, or a fixed off-white) rather than `var(--color-text)` — this
is the first place on the page where beat content needs a light-on-dark
treatment; beats 3-6 are unaffected and keep their existing light-background
card styling.

## 3. Explicitly deferred / out of scope

- Stars visibly drifting toward / being absorbed into the nearest ink blob
  as they fade (considered, would tie the two effects together more
  tightly, but adds real complexity — per-star nearest-blob targeting and
  a second motion phase per star). Deferred; the current design's two
  independent-but-compounding effects (stars fading + blobs growing) is
  judged sufficient for this pass.
- Any change to beats 1, 3-6.
- Any change to the persistent spark's own "fading" motif CSS/opacity
  logic — left untouched; the growing ink blobs visually cover it as they
  expand, achieving "until the sparks totally gone from the screen" without
  needing to touch that existing rule.

## 4. Verification

After building: `./bin/hugo --minify` succeeds with zero errors. Manual/
Playwright browser scroll-through confirms:

- Stars materialize scattered across the screen, staggered (not all at
  once), then drift and twinkle independently.
- Stars fade out in a staggered (not synchronized, not simple left-to-right)
  order.
- Dark ink blobs grow from a few of the stars' positions, merge, and cover
  the full screen by the time the text appears.
- The new text is legible (light-on-dark) and appears only once the screen
  is substantially dark.
- Beats 1, 3-6 are pixel-for-pixel unaffected; the persistent spark still
  correctly re-ignites (`motif="caught"`) entering beat 3.
- No new console errors.
