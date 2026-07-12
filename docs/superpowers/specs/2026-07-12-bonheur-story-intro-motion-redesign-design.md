# Bonheur Story Page — Opening Intro Motion Redesign — Design Spec

**Date:** 2026-07-12
**Status:** Proposed

## 1. What this replaces

Beat 1 ("Spark") of the Bonheur story page (`docs/superpowers/specs/2026-07-08-bonheur-story-page-design.md`)
currently opens with a static page header (eyebrow subtitle + "Bonheur" H1,
fades in once on load) followed by a normal 100vh beat section: the
`#bs-motif` spark sits centered and idly "drifts" from the moment the page
loads, while the beat-1 card (number/title/body/placeholder) reveals via the
existing threshold-based `IntersectionObserver`.

This redesign replaces that opening with a scroll-scrubbed sequence: the
words **"Bon"** and **"Heur"** enter from the bottom-left and bottom-right
corners of the screen respectively, converge to the center as the user
scrolls down, meet and ignite the persistent spark motif, then recede apart
and fade out — dramatizing the "bon + heur" etymology visually instead of
only stating it in the beat-1 body copy.

**Scope:** this pass touches beat 1's opening only. Beats 2–6 (The Ache, The
Turn, The Jar, The Star Cloud, The Keeping) — their copy, motifs, and reveal
mechanism — are unchanged.

## 2. Architecture

### 2.1 Structure & scroll geography

Beat 1 splits into two stacked pieces:

1. **A new intro block** (new markup, before the existing beats loop),
   approximately **220vh tall**. Its inner "stage" (`.bs-intro-stage`) is
   `position: sticky; top: 0; height: 100vh`, so it pins to the top of the
   viewport for the ~120vh of scroll distance between the container's start
   and end, then releases and scrolls away normally as usual for a sticky
   element inside a taller container.
2. **The existing beat-1 card** (number "01" / "Spark" / body copy /
   placeholder), unchanged in size (100vh) and unchanged in how it reveals
   (`IntersectionObserver` + `.is-visible`, same as every other beat).

Net effect: the page's opening grows from 100vh to ~320vh of scroll before
reaching beat 2 ("The Ache"). This is an intentional size/pacing increase
for the sake of a proper hero moment.

The persistent spark (`#bs-motif` → `.bs-spark`) is **not duplicated**. It
keeps its existing architecture exactly as-is — one sticky element pinned
for the whole page (via the `margin-bottom: -100vh` overlay technique
already in place), whose appearance changes via `data-motif`. This redesign
adds one new rule: its opacity is tied to intro progress (see §2.3) so it's
invisible until ignition, then handed off to the existing
`data-motif="drifting"` idle animation, completely unchanged from today.

The separate static page header (eyebrow + "Bonheur" H1) is removed from
the visual layout. A screen-reader-only `<h1>` (using the site's existing
`.sr-only` utility class in `themes/hugo-minimal-black/static/css/main.css`)
takes its place in the DOM, built from the same `.Title` /
`.Params.subtitle` template values the old visible header used, so the page
keeps a real, accessible title without an on-screen element competing with
the animated wordmark.

### 2.2 Progress engine

New code added to the existing `static/js/bonheur-story.js` (no new file —
it's already scoped to this one page) computes a single continuous progress
value for the intro block only:

- On `scroll` (passive listener) and `resize`, schedule a
  `requestAnimationFrame` callback (skip if one is already pending, to
  naturally throttle to one computation per frame).
- Inside that callback, read the intro container's `getBoundingClientRect()`
  and compute `progress = clamp((0 - top) / (height - viewportHeight), 0, 1)`.
- Write the result to a CSS custom property on the intro container:
  `introEl.style.setProperty('--bs-intro-progress', progress)`.

All motion is plain CSS reading that one variable via `calc()` /
`clamp()` — no other JS drives position or opacity. This is a continuous
analog of the same "scoped vanilla script, no framework" pattern
`bonheur-story.js` and `explorers-path.js` already use elsewhere on this
site; it swaps a boolean intersection signal for a continuous one where
this one effect specifically needs scrubbing.

Chosen over: native CSS Scroll-Driven Animations (`animation-timeline:
scroll()`/`view()`) — rejected for now due to inconsistent cross-browser
support (a hero moment every visitor sees first shouldn't silently degrade
on some browsers); and a scroll library like GSAP ScrollTrigger — rejected
as a new dependency on an otherwise zero-dependency vanilla site, and
disproportionate for one beat's intro.

### 2.3 Motion timeline

Driven entirely by `--bs-intro-progress` (0 → 1 across the pinned dwell
range):

| Progress | Behavior |
|---|---|
| 0.00 – 0.45 | "Bon" travels from the bottom-left corner, "Heur" from the bottom-right, converging toward center via `transform: translate(...)` interpolated from `--bs-intro-progress`. Color interpolates ink → `#f4c869` (the spark's gold) over this same range. |
| 0.45 – 0.55 | Words arrive edge-to-edge at center, reading as one word, "Bonheur." Brief hold. `.bs-spark` opacity ramps 0→1 and scales up from the seam between the two words — the spark igniting. |
| 0.55 – 0.85 | Words drift back outward toward the two sides, opacity 1→0. Spark is now fully born, stays centered. |
| 0.85 – 1.00 | Words fully faded (opacity 0, `pointer-events: none`). Intro block finishes releasing its scroll pin. Spark continues under the existing `data-motif="drifting"` idle animation, unchanged from today. |

The existing beat-1 card reveal (number/title/body/placeholder) is
untouched — it fades in via the current `IntersectionObserver` mechanism
once its section scrolls into view after the intro block.

### 2.4 Typography

- Font: the site's existing heading serif (`heading-page` styling).
- Size: `clamp(3rem, 11vw, 8rem)`, responsive across mobile/desktop widths.
- Two elements, e.g. `.bs-intro-word--bon` / `.bs-intro-word--heur`,
  absolutely positioned within `.bs-intro-stage`, each with its own
  `transform`/`color` `calc()` expressions keyed off
  `--bs-intro-progress` (mirrored/opposite-signed between the two so they
  travel from opposite corners).

### 2.5 Reduced motion

Under `@media (prefers-reduced-motion: reduce)` (extending the existing
block in `static/css/bonheur-story.css`):

- `.bs-intro-word--bon` / `.bs-intro-word--heur` are hidden outright
  (`display: none`) — no travel is shown at all.
- `.bs-spark` shows at full opacity in its normal `drifting` state
  immediately, ignoring `--bs-intro-progress`.
- This matches the rest of the page's existing reduced-motion behavior
  (instant, no travel, no stagger). Beat 1's body copy already states "bon
  + heur, a good hour" in prose, so no information is lost for users with
  this preference.

## 3. Explicitly deferred / out of scope (this pass)

- Beats 2–6: no changes to copy, motifs, or reveal mechanism.
- Mobile-specific scroll-scrub tuning beyond "doesn't break" — consistent
  with the same deferral already made in the original story-page spec.
- Any change to the homepage hotspot, teaser copy, or icon — untouched from
  the prior pass.

## 4. Verification

No automated test runner in this repo (consistent with the rest of the
site). After building: `./bin/hugo --minify` succeeds with zero errors;
manual browser scroll-through (per `docs/superpowers/plans/` convention)
confirms:

- Scrolling from the top shows "Bon" and "Heur" converging from the bottom
  corners, meeting at center, igniting the spark, then receding and fading.
- Scrolling back up reverses the sequence smoothly (scroll-scrubbed, not a
  one-shot animation).
- After the intro block, the beat-1 card reveals exactly as it does today.
- The persistent spark continues into beat 2 onward with no visual seam
  (still driven by the unchanged `data-motif` system).
- With `prefers-reduced-motion: reduce` enabled, the words never appear/
  animate and the spark is visible immediately in its idle state.
- No new console errors; existing beats 2–6 are pixel-for-pixel unaffected.
