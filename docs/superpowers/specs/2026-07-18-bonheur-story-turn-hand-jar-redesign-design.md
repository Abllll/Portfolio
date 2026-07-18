# Bonheur Story Page — Beat 3 ("The Turn") Cradle + Jar Redesign — Design Spec

**Date:** 2026-07-18
**Status:** Proposed (supersedes this same file's earlier "one hand catches, mason jar" version, itself already implemented and now being replaced)

## 1. What this replaces

The previously implemented version of beat 3 (one sketchy-linework hand rising to catch a spark, then dropping it into a ridged mason jar) is fully replaced with a new sequence, based on user-supplied reference images:

- **Hands reference**: two solid flat-illustrated hands (not sketchy linework) enter from opposite diagonal corners and cradle a glowing spark between open, spread fingers — a gentle frame, not a grip.
- **Jar reference**: a soft, minimal rounded-rectangle jar with a separate floating pill-shaped lid (a gap between lid and body), filled with a diffuse gradient wash — no ridges, no hard glass-highlight streaks.

**Scope:** this pass touches beat 3 only. Beats 1, 2, 4-6 are unchanged. The caption text is unchanged from the prior version: "So: catch it before it fades. A photo, a word for what it was — a breeze, a small win, someone's laugh. Bonheur stores the moments."

## 2. Choreography

All ranges are values of `--bs-turn-progress` (0→1), same scroll+rAF-driven custom property already computed by the existing unmodified JS handler.

| Progress | Phase |
|---|---|
| 0 → 0.15 | Pure black hold, continuing straight from Ache's darkness. Nothing visible yet. |
| 0.15 → 0.32 | The spark gradually ignites center-screen (fade + scale in). |
| 0.32 → 0.50 | Two hands enter from opposite diagonal corners (one from bottom-left, one from top-right — a 180°-rotated copy of the same hand shape) and converge into a cradle flanking the spark, fingers spread, not touching it. |
| 0.50 → 0.68 | The jar rises up from the bottom edge into view. Simultaneously, the cradled hands + spark (moving together as one group) translate downward toward the jar's mouth. |
| 0.68 → 0.80 | The hands open apart slightly; the free spark fades out as a second spark instance fades in inside the jar; the jar's glass lights up gold. |
| 0.80 → 1.0 | The hands retreat outward and fade to transparent. The caption fades in (0.85→0.95) and holds. |

## 3. Visual details

### 3.1 The hands

One hand shape, authored once, reused twice (the second copy rotated 180° via CSS transform for the mirrored corner). Built from solid-fill primitive shapes (a tapered arm capsule, a palm ellipse, four fan-spread finger capsules, one thumb capsule) — all the same warm cream/off-white fill (`#F0E6D2`), no stroke, so overlapping shapes merge into one seamless flat silhouette. A few short, thin darker line strokes (`rgba(120, 95, 60, 0.35)`) sit on top of each finger as simple knuckle-crease details, matching the reference's "simple darker line details" look. This replaces the previous double-stroke sketchy-pencil hand entirely.

Each hand's own wrapper handles: an off-screen-corner-to-cradle entry translate (0.32→0.50), a shared downward "lower toward jar" translate (0.50→0.68, same delta both hands and the free spark share), an "open apart" separation translate (0.68→0.74), and an outward retreat + fade (0.80→1.0).

### 3.2 The jar

Plain CSS (no SVG needed — the reference shape is simple rounded rectangles):

- `.bs-turn-jar-lid`: a small floating rounded bar, sitting above the body with a visible gap, soft translucent white gradient.
- `.bs-turn-jar-body`: a rounded rectangle (border-radius ~22px, not a full pill), filled with a vertical gradient wash recolored to the site's warm gold palette — cream (`#FFF3D6`) at the top, through gold (`#F4C869`), to a deeper amber (`#B87F45`) at the bottom — replacing the reference's pink-to-blue wash with an on-palette equivalent. No ridge lines, no hard highlight streaks.
- Sized to ~140px wide, sitting centered with generous empty space on both sides (not full-bleed), matching the reference composition.
- Rises from fully below the viewport to its resting position via a single position translate during the 0.50→0.68 window — no separate opacity fade-in needed, since the rise itself is the reveal.
- Once the spark drops in (0.70→0.80), an internal radial glow and a second spark instance fade in inside the jar body, reusing the same `.bs-spark`-style gold dot the rest of the page already uses (per the user's explicit instruction to keep "our spark shape," not the reference's yellow starburst).

### 3.3 The spark

Unchanged visual (`.bs-spark`-style solid gold dot + soft halo). Ignites at a fixed anchor point (top: 38vh, centered), stays there through the cradle-forming phase, then travels down together with the hands during the "lower toward jar" phase, and fades out as the jar-interior spark fades in during the drop phase.

## 4. Reduced motion

Static end-state only: jar shown risen and lit, both hand elements and the free-floating spark hidden entirely (`display: none`), the jar-interior spark and glow at full opacity, caption fully visible. No entry/cradle/lower/drop/exit animation.

## 5. Explicitly deferred / out of scope

- Any change to beats 1, 2, 4-6.
- The upcoming "Capture a Moment / Your Memory Jar / Year in Review" video-mockup sections — a separate follow-on piece of work, tracked separately once video assets are available.
- Precise 1:1 pixel matching to the reference illustration's exact hand pose/arm curve — the hand is built from simple primitive shapes (capsules + ellipse) for implementability, not a traced vector copy; visual tuning of exact offsets/angles happens during the browser verification pass.

## 6. Verification

After building: `./bin/hugo --minify` succeeds with zero errors. Manual browser scroll-through confirms:

- Screen stays fully black entering the beat before the spark appears.
- The spark gradually ignites center-screen.
- Two hands enter from opposite corners and converge into a cradle around the spark without overlapping it.
- The jar visibly rises from below the screen while the cradled hands+spark move down together toward it.
- The hands open, the spark visibly transfers from the cradle into the jar, and the jar lights up gold.
- The hands retreat outward and fade away; the caption appears only after they're gone.
- Beats 1, 2, 4-6 are pixel-for-pixel unaffected.
- `prefers-reduced-motion: reduce` shows the static lit-jar end-state with no animation.
- No leftover references to the previous one-hand/mason-jar implementation anywhere in the codebase.
