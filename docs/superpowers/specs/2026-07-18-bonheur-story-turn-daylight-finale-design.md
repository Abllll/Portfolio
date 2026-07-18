# Bonheur Story Page — Beat 3 ("The Turn") Daylight Finale — Design Spec

**Date:** 2026-07-18
**Status:** Proposed

## 1. What this adds

Builds on the current Turn beat (spark ignites → travels down on its own
into a jar rising from the bottom → jar lights up gold) with a new
finale, added after the spark is caught:

1. The jar's lit glow changes from a flat gold radial gradient to a
   living, simplex-noise-driven blend of purple and gold — echoing the
   site's own intro palette and the real Bonheur app's `JarBackdrop.js`
   technique (soft drifting color blobs, not a static gradient).
2. The jar's lid slides down to seal shut.
3. The whole jar rises a second time, from its bottom-resting spot up to
   dead-center of the screen.
4. Simultaneously, the dark backdrop (void + ink texture, present
   continuously since Ache) fades away, revealing the same soft pastel
   sky gradient the page opens on (`.bs-intro-sky`'s exact colors) —
   visually closing the loop back to the story's start.
5. The caption fades in underneath the now-centered jar, against the
   pastel backdrop, recolored to a dark plum (matching
   `.bs-intro-tagline`'s color) for readability on the now-light
   background.

This is Turn's actual ending — beat 4 ("The Jar") follows immediately
after via the normal scroll handoff, same mechanism as every other beat
boundary on this page.

**Scope:** beat 3 only. Beats 1, 2, 4-6 unchanged. Caption copy unchanged
— only its position, timing, and color change.

## 2. Choreography

Turn's total height increases from 220vh to 320vh to give this finale
room to read clearly. All ranges below are `--bs-turn-progress` (0→1),
recomputed against the new taller section (no JS change — the existing
handler already computes progress purely from `#bs-turn`'s own rect).

| Progress | Phase |
|---|---|
| 0 → 0.10 | Black hold (unchanged concept, compressed slightly for the new total height). |
| 0.10 → 0.22 | Spark ignites (unchanged concept). |
| 0.22 → 0.40 | Jar rises from below the viewport to its bottom-resting spot; spark travels down to meet it (unchanged concept, the existing shared `--bs-turn-lower` ramp). |
| 0.40 → 0.46 | Free spark fades out. |
| 0.42 → 0.50 | Jar lights up — new simplex-noise purple/gold glow blobs fade in inside the jar body, plus the existing small jar-interior spark dot. |
| 0.50 → 0.58 | **New:** the lid slides down onto the jar body, sealing it shut. |
| 0.58 → 0.75 | **New:** the jar rises a second time, from its bottom-resting spot up to screen-center. |
| 0.58 → 0.78 | **New:** the dark void + ink texture fades out (a new fade gated on Turn's own progress, distinct from the earlier bugfix which removed void's fade entirely — that fix stays; this is a fresh, intentional fade timed to Turn's finale, not Ache's). The pastel sky gradient (sitting behind everything, always rendered, simply revealed as the darkness lifts) becomes visible. |
| 0.80 → 0.90 | **New:** caption fades in beneath the centered jar, recolored for the light background. |
| 0.92 → 1.0 | Existing safety exit-fade (unchanged mechanism), now also covering the new daylight background element, so nothing ghosts into beat 4. |

## 3. Visual details

### 3.1 Jar glow (replaces the flat gold radial gradient)

Two small blurred color blobs inside `.bs-turn-jar-body` (clipped by its
existing `overflow: hidden`), one purple (`#C3A6EE`, matching
`.bs-intro-mist--purple`) and one gold (`#F4C869`, the site's existing
spark color), each independently drifting/breathing via a simplex-noise
JS loop — a new, dedicated IIFE in `bonheur-story.js` following this
file's established convention (Ache's ink blobs get their own duplicated
`simplex2` port rather than a shared refactor; this does the same). The
existing small solid jar-interior spark dot (`.bs-turn-jar-spark`) is
unchanged — it's the light source, the new blobs are its ambient glow.

### 3.2 Lid closing

`.bs-turn-jar-lid` currently floats above the jar body with a ~10px gap.
Closing translates it down (~16px) to sit flush against (slightly
overlapping) the body's top edge, driven by a new `--bs-turn-lid-close`
phase window.

### 3.3 Jar's second rise

A second `translateY` term added to `.bs-turn-jar`'s existing transform
chain, moving it from its bottom-resting position up toward screen
center (~-34vh), driven by a new `--bs-turn-jar-rise2` phase window,
independent of (and after) the first rise-from-offscreen term already in
place.

### 3.4 Daylight reveal

A new `.bs-turn-daylight` element, `position: fixed; inset: 0; z-index:
0` (behind the jar's `z-index: 1` and below the void's `z-index: 2`),
using `.bs-intro-sky`'s exact gradient
(`radial-gradient(circle at 50% 20%, #F8EFFB 0%, #EFE7FA 55%, #F6E2EE
100%)`). It needs no animation of its own — it's simply always rendered
at full opacity behind the void, so as the void's new finale fade-out
(Section 2) lowers the void's opacity toward 0, the daylight gradient is
revealed underneath, reading as one continuous crossfade rather than two
separately-timed animations.

### 3.5 Caption

Repositioned from `bottom: 24vh` to sit just beneath the centered jar
(`top: ~64vh`), recolored from `#f4f0ff` (light, for the dark backdrop)
to `#463452` (`.bs-intro-tagline`'s dark plum, for the now-light
backdrop). Copy unchanged. New fade-in window per Section 2's table.

## 4. Reduced motion

Static end-state extended: jar shown at its final centered position with
lid closed and glow blobs at rest opacity (no drift animation), daylight
background fully visible (void/ink hidden, matching the existing
reduced-motion treatment), caption visible in its new position/color.

## 5. Explicitly deferred / out of scope

- Any change to beats 1, 2, 4-6.
- Re-triggering or reusing `#bs-intro`'s actual DOM elements (word
  reveal, signature, logo) — the daylight reveal only reuses its
  *gradient colors*, implemented fresh within Turn's own stage.
- The upcoming video-mockup sections (Capture a Moment / Memory Jar /
  Year in Review) — tracked separately, unaffected by this change.

## 6. Verification

`./bin/hugo --minify` succeeds with zero errors. Manual/scripted browser
scroll-through confirms:

- Existing black-hold → ignite → catch → light-up sequence is unaffected
  in feel (just recompressed to fit the taller section).
- The jar's glow now visibly drifts/breathes in purple and gold rather
  than sitting static.
- The lid visibly slides down and seals.
- The jar visibly rises a second time to screen-center.
- The dark backdrop visibly lifts to reveal the same pastel gradient the
  page opens on, without any hard pop or exposed unstyled content
  underneath (re-run the same headless scroll-probe technique used for
  the earlier Ache/Turn background-flash bugfix to confirm no gaps).
- The caption appears under the centered jar, readable against the light
  background.
- `prefers-reduced-motion: reduce` shows the new static end-state.
- No leftover references to the old `.bs-turn-jar-glow` static-gradient
  approach.
