# Explorer's Path — reversed landing (sub-project #1 of 4) — design spec

## Context

This is the first of four planned changes to the Explorer's Path illustration,
agreed to be built in this order:

1. **This spec** — flip the landing so the girl starts at the bottom of the
   path, immediately visible, with a centered onboarding hint.
2. Spacebar reveals all hotspot icons (currently hidden/faint until
   proximity or hover).
3. A treasure-map zoom transition when clicking a revealed hotspot, landing
   directly on the associated project's content.
4. Scroll drives her continued walking (including out of a project once
   entered), plus a toggleable presenter companion showing tech-stack /
   interesting-point reflections.

Sub-projects 2-4 are explicitly out of scope here and get their own specs
once this one ships. Note up front: #4 will revisit the "scroll never drives
the illustration" rule this spec deliberately preserves (see "Scroll-
direction rule" below) — that's a conscious, separate decision for #4's own
spec, not something this spec should pre-empt.

## Problem

Today, `static/js/explorers-path.js` sets `START_PROGRESS = 17` — roughly
60% of the way along the `PATH` array (28 points, index 0 = nearest the
viewer/bottom of the trail, index 27 = deepest into the forest/top). She
starts mid-journey, past the "Roots" and "Spark" chapters.

Separately, `.ep-viewport` is a single tall block in normal document flow,
sized via `aspect-ratio: 1242/1660` to the full illustration canvas — taller
than the browser viewport on every normal screen (e.g. ~1710px tall vs. a
~720-800px viewport). Because it's plain block flow, scroll position 0
(page load) shows the canvas's **top** (small y%, the far/deep end — where
`PATH` index 27, "Now", lives), and scrolling down is required to reach the
canvas's **bottom** (large y%, the near end — index 0). So today, `PATH`
index 0 is genuinely off-screen below the fold at load.

The user wants: on landing (page load, no scroll), the girl is visible at
the absolute bottom of the path (index 0), with a centered onboarding
message — i.e. the *reverse* of today's reveal order.

## Goal

At page load: the sticky illustration window shows the canvas's bottom
region, with the girl standing at `PATH` index 0, visible without scrolling.
Scrolling down the page then reveals progressively higher regions of the
same canvas (toward index 27 / "Now"), until the illustration is fully
scrolled through, at which point the page continues into the intro section
exactly as it does today.

## Non-goals

- No changes to the artwork itself (no flipped/mirrored image assets).
- No changes to `PATH` coordinates or any hotspot's `xPercent`/`yPercent` —
  both stay defined in the same canvas-percent terms as today.
- No changes to WASD semantics (W still increases `progress`, still walks
  toward index 27) or to mouse-look parallax math.
- Hotspot reveal-on-space (#2), the zoom transition (#3), and scroll-driven
  walking + presenter companion (#4) are not part of this spec.

## Why not just flip the art or the data

Two approaches were considered and rejected:

- **Flip the image layers** (`transform: scaleY(-1)` on each background
  layer, with `PATH`/hotspot y-values inverted to `100 - y` to match):
  visually flips trees, path, and dust upside-down. The art wasn't drawn to
  be shown inverted, and counter-flipping just the girl/hotspot text back
  upright while leaving the background flipped doesn't fix the background
  itself looking wrong.
- **A "rotate 180° then counter-rotate the content 180°" CSS trick**: this
  was considered but the two rotations exactly cancel (rotate(180) twice =
  identity) — it changes nothing about which part of the canvas is exposed
  at any scroll position. Not viable; ruled out during design rather than
  discovered mid-build.

The approach below instead changes *which slice of the unmodified canvas*
the visible window frames at a given scroll position — no asset or data
changes, no transform trickery, just an explicit scroll-progress-driven pan.

## Architecture

Restructure `.ep-viewport` into the same sticky-stage + scroll-progress
pattern already used four times over in `bonheur-story.css`/`.js`
(`.bs-intro-stage`, `.bs-ache-stage`, etc. driven by
`--bs-intro-progress`/`--bs-ache-progress`):

```html
<div class="ep-spacer" id="ep-spacer">        <!-- new: defines scroll distance -->
  <section class="ep-viewport" id="ep-viewport">  <!-- becomes the sticky stage -->
    ...unchanged internal structure (layers, hotspot layer, controls hint, scroll cue)...
  </section>
</div>
```

- **`.ep-spacer`**: height equal to the full canvas's rendered height at the
  current viewport width (`100% * (1660/1242)`, computed in JS on load/
  resize since it depends on rendered width) — i.e. the same total scroll
  distance the illustration already consumes today, just now provided by an
  explicit spacer instead of implicitly by `.ep-viewport`'s own height.
- **`.ep-viewport`**: changes from `position: relative` (full canvas height)
  to `position: sticky; top: 0; height: 100vh; overflow: hidden` — a fixed
  ~one-screen-tall window, pinned for the scroll duration of `.ep-spacer`.
- A new scroll handler (same pattern as the existing
  `updateAcheProgress`/`updateSparkBeatProgress` functions in
  `bonheur-story.js`, added instead to `explorers-path.js`) computes
  `--ep-scroll-progress` (0-1) from `.ep-spacer`'s bounding rect, same
  formula already used elsewhere: `progress = (0 - rect.top) / (rect.height
  - window.innerHeight)`, clamped 0-1.

## Pan mapping

Let `V` = the fraction of canvas height one viewport covers (~42% on a
typical laptop, computed live from `.ep-viewport`'s actual rendered
height vs. `window.innerHeight` — not hardcoded, since it varies by screen).

- At `progress = 0`: the sticky window frames canvas y ∈ `[100-V, 100]`
  (the bottom/near region, where index 0 lives).
- At `progress = 1`: the sticky window frames canvas y ∈ `[0, V]` (the
  top/far region, where index 27 lives).
- For any `progress` in between, the frame's top edge (in canvas %) is
  `lerp(100-V, 0, progress)`.

Implemented as a single `translateY` applied to the full layer stack (all
background layers + hotspot layer + girl layer), computed in pixels each
frame from `progress` and the canvas's current rendered height — not a
CSS-only calc, since it needs the same live rendered-height number the
spacer's height computation uses.

## Interaction composition (how this combines with existing mouse-look/WASD)

The existing `tick()` function in `explorers-path.js` already composes,
per background layer, a mouse-driven `translate(dx, dy)` from `data-factor`.
The pan offset is added into that same composition — every layer currently
in `backgroundLayers` (which already includes `#ep-hotspot-layer`, since it
carries `data-factor="4"` today) gets `translateY` shifted by the same pan
amount, on top of its existing mouse-parallax dx/dy. The girl's own
transform (already computing `pathOffsetX/Y + lookDx/Dy + bob + jump`) gets
the same pan offset added so she stays correctly aligned with the panned
background and hotspots. No per-layer depth-scaling of the pan itself
(every layer pans by the identical amount) — the point is one coherent
camera window sliding over fixed content, not additional parallax depth
during the pan.

WASD and mouse-look behavior are otherwise completely unchanged: she still
only moves along `PATH` via keyboard, background still only parallaxes via
mouse position. Scroll and WASD remain independent inputs that are simply
summed into the same final transform, not coupled to each other.

## Scroll-direction rule — still holds

The site-wide rule ("scrolling down always reveals what's next, never
inverted") stays true in the literal sense: scrolling down still only ever
moves forward through the document. What's reversed is *which end of the
canvas* is considered "first" in that reveal order — a content decision
within this one section, not a violation of the rule that scrolling itself
must go one direction. Once `--ep-scroll-progress` reaches 1, continued
scrolling proceeds normally into `.bs-page`'s intro section exactly as
today — no change to that boundary or anything below it.

## Start position

`START_PROGRESS` changes from `17` to `0` in `static/js/explorers-path.js`.
At load, `--ep-scroll-progress` is 0 (spacer hasn't been scrolled), so the
sticky window already frames the canvas's bottom region — she's visible
immediately, standing at the very start of the trail, with nothing
discovered yet (the nearest hotspot, "Roots," sits further up the path).

Side effect worth calling out: `FORWARD_SCALE_BOOST`'s shrink-with-distance
formula (`depthFrac = (progress - START_PROGRESS) / (PATH.length - 1)`)
now spans the *entire* path (0 → 27) instead of just its tail (17 → 27), so
she'll shrink noticeably more by the time she reaches index 27 than she
does today. This reads as appropriate for a now much longer walked
distance, but is a visible consequence worth a look during verification,
not a separately tuned request.

## Onboarding hint

`.ep-controls-hint` (currently `position: fixed; bottom: 1.5rem`, centered
horizontally only) moves to screen-center (both axes) and gains a flicker/
pulse animation (opacity oscillation, matching the site's existing flicker
motion language used elsewhere — a new keyframe local to
`explorers-path.css`, not reusing `bonheur-story.css`'s `bs-flicker`, since
these are separate stylesheets for separate concerns). Copy changes from "W A S D [SPACE] + mouse to look" to:

```
[W][A][S][D] to move   [SPACE] to explore
```

— keeping the existing key-badge visual style (`.ep-key` elements), dropping
the "+ mouse to look" clause (mouse-look is a background nicety, not core to
the two actions being taught) to keep the centered message short and quick
to read before it's dismissed.

The dismiss behavior (hidden after first WASD/Space/scroll input) stays
exactly as today, only now the underlying scroll listener reads from the
new `.ep-spacer`-based progress rather than raw `window.scrollY`.

The `aria-label` on `#ep-viewport` stays as-is (still accurately describes
spacebar as "jump" — it should not claim spacebar reveals anything until
sub-project #2 actually ships that behavior; accessibility text must
describe real current behavior, not upcoming features).

## Testing

No unit-test surface (visual/interaction feature). Manual + scripted
Playwright verification after implementation:

1. At page load (no scroll), the girl is visible on-screen at `PATH` index
   0, standing at the bottom/near end of the trail.
2. Scrolling down smoothly pans the illustration toward the canvas's top
   (index 27 / "Now" region), with background layers, hotspot layer, and
   girl all panning together with no visible seams or desync.
3. WASD still moves her along `PATH` independent of scroll position;
   mouse-look parallax still works independent of scroll and WASD.
4. Once scroll reaches the end of `.ep-spacer`, continued scrolling
   proceeds into the intro section exactly as today — no dead zone, no
   double-scroll requirement, no jump/snap at the boundary.
5. The onboarding hint appears centered on screen, flickers, shows updated
   copy, and dismisses on first WASD/Space/scroll input — same as today's
   dismiss behavior, just relocated/restyled.
6. Hotspot proximity glow (`is-near`) still triggers correctly as she nears
   a hotspot, accounting for the pan offset.
7. Resize the window (or test at a few viewport heights/widths) — `V` (the
   canvas-fraction-per-viewport) and the spacer height both stay correct,
   since both depend on live rendered dimensions, not hardcoded numbers.
8. `prefers-reduced-motion`: confirm the hint's flicker (and any other new
   motion) respects the existing reduced-motion handling pattern used
   elsewhere on the site.
