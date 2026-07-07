# The Explorer's Path — Layered Diorama — Design Spec

## 1. What this supersedes

This replaces the movement/technical/art-production sections of
`2026-07-06-explorers-path-design.md` (the original 4-chapter,
arrow-key-walking design) **and** the ad-hoc rework that followed it
(commits `ce58024`, `dfb470e`): a single flat background with a generic
SVG "cursor marker" standing in for the explorer. Neither shipped design
is correct. This spec is what actually gets built next.

Unchanged from the original spec, still in force: §2 (site placement —
replaces homepage, `Work`/`Experiments` untouched), §4 (hotspot content
model — three content types, two-stage glow disclosure, real content
authored later), §9 (out of scope generally). Superseded: §3 (chapter
structure), §5 (movement/sound), §6 (technical approach), §7 (art
pipeline).

## 2. What this is

Not four chapters, not a walking explorer, not a flat image with a
cursor icon glued on top of it. **One real illustrated scene — the
existing "Spark" forest path — rebuilt as a layered diorama.** Amber
already drew this in depth-separated layers (Procreate) and exported them
as individual transparent PNGs to `Portfolio/layer/`. The site was never
using that — it flattened her art back down to one JPG and invented a
placeholder figure to represent her, on top of her own drawn character.

The fix is architectural, not additive: stack her actual layers at their
actual depths, let the mouse shift each layer at a rate proportional to
how close it is, and leave her hand-drawn girl exactly where she drew
her — sketchbook, shadow, and all. No synthetic sprite. No walking
metaphor. The feeling is looking into a diorama, not steering a
character through it.

The four life-chapters (Roots / Spark / ID Years / Now) remain as
**content grouping only** — labels on hotspots (`chapter` field, already
in `data/explorers_path.yaml`) — not separate visual scenes. Chapters 1,
3, and 4 do not get their own backgrounds in this phase; their hotspots
sit on this one scene, same as today. Revisiting that is a later, separate
decision — not part of this spec (see §7).

## 3. Source assets

All nine files below live in `Portfolio/layer/`, all `1242×1660` RGBA,
all registered to the same canvas (they composite back into the original
`IMG_6573.PNG` scene with plain alpha-over — confirmed by prototype, no
special blend modes needed):

| Role | File | Notes |
|---|---|---|
| Ambient wash | `IMG_6586 (1).PNG` | soft pink/green atmosphere, furthest back |
| Trunks | `IMG_6581.PNG` | bamboo/tree trunks |
| Foliage A | `IMG_6580.PNG` | mid-depth leaf clusters, path cut out of it |
| Path | `IMG_6583.PNG` | the path surface |
| Path glow | `IMG_6584.PNG` | warm light-shaft highlight along the path |
| The girl | `IMG_6585.PNG` | final version: hat, backpack, sketchbook in hand, own contact shadow |
| Foliage B | `IMG_6582.PNG` | foreground canopy, closest layer |
| Dust | `IMG_6578.PNG` | dark speckle texture, scattered |
| Sparkle | `IMG_6579.PNG` | white light-particle texture, scattered |

Not used: `IMG_6576.PNG`, `IMG_6577.PNG` (earlier draft versions of the
girl, superseded by `IMG_6585.PNG`), `IMG_6580 (1).PNG` (duplicate of
`IMG_6580.PNG`). `IMG_6574.PNG`/`IMG_6575.PNG` in `Desktop/Illustration/`
(sunset-over-water, night park path) are explicitly **not** used —
confirmed with Amber, they're not part of this scene.

## 4. Layer stack, depth, and motion

Back to front, each an absolutely-positioned element sized larger than
the viewport (oversize margin so parallax translation never reveals a
transparent edge):

| Layer | Parallax weight | Idle motion |
|---|---|---|
| Wash | lightest | none |
| Trunks | light | none |
| Foliage A | moderate | slow sway |
| Path | near-static | none |
| Path glow | near-static | none |
| **Girl** | near-static (moves with the path/ground plane) | **none — fixed** |
| Foliage B | strongest | slow sway |
| Dust | strong | slow independent drift |
| Sparkle | strongest | twinkle (opacity pulse) + slow independent drift |

- **Parallax:** on `mousemove` within the scene, each layer's translate
  offset is `-relativeMouse * layerWeight`, eased (not 1:1 tracking) —
  same easing-follow approach as the current (to-be-replaced) cursor
  marker, just applied per-layer instead of to one synthetic sprite.
  `mouseleave` eases every layer back toward zero offset. Each layer
  element is oversized to `inset: -8%` relative to the viewport (matches
  the validated prototype) so the largest parallax weight never reveals a
  transparent edge; if a later weight tuning pass needs more travel than
  that margin covers, the margin scales with it, not the other way round.
- **Idle motion** (sway/drift/twinkle) runs continuously via CSS
  keyframe animation, independent of mouse position, so the scene feels
  alive at rest. Implemented as a wrapper-element split: an outer element
  carries the JS parallax `transform`, an inner element carries the CSS
  keyframe animation — the two must not fight over the same `transform`
  property on the same node.
- **Reduced motion:** `prefers-reduced-motion: reduce` disables both the
  parallax easing (layers snap to a neutral resting position and stay
  there) and all idle keyframe animations.
- **The girl is not draggable, not clickable, not cursor-linked.** She's
  art, fixed in her scene, same as the path and trunks. Hotspots remain
  separate interactive elements positioned on top of the composited
  scene, unchanged from the current implementation.

## 5. Sound

- **Footstep/rustle SFX: removed entirely.** It only made sense under the
  old "cursor is a walking explorer" metaphor. There is no walking in
  this design — the girl is stationary, mouse movement is camera
  parallax, not locomotion. `static/audio/explorers-path/footstep.wav`
  and its play/pause wiring in `explorers-path.js` are deleted, not just
  disabled.
- **Discovery chime: unchanged.** Still plays once, the first time each
  hotspot opens; still no replay on subsequent opens.
- No music/score — unchanged from the original spec, still deferred.

## 6. Technical approach

Still matches the site's existing constraints: static Hugo, vanilla JS,
no framework, no build step, hotspots as real focusable DOM buttons (not
canvas), same `data/explorers_path.yaml`-driven content model, same
`<details>`-based no-JS fallback list. What changes:

- **Asset prep:** the nine source PNGs above get resized/optimized for
  web (source files are camera-resolution RGBA PNGs, several multiple
  megabytes) into `static/images/explorers-path/`, at a resolution sharp
  enough for large desktop viewports (finalized in the implementation
  plan — likely full-bleed width, e.g. ~1600–1920px on the long edge,
  format decided per-layer by file size/content — flat-color layers
  compress well as PNG, painterly/textured ones likely smaller as WebP
  with a PNG fallback only if needed).
- **Markup:** `layouts/partials/explorers-path/scene.html` restructured
  to emit the nine-layer stack (ordered wrapper elements as in §4)
  instead of the current two-layer near/far background-image div pair.
  Hotspot buttons, panel markup, and the `<details>` fallback section are
  structurally unchanged — only the background scene markup they sit on
  top of changes.
- **Styling:** `static/css/explorers-path.css` gets the per-layer
  oversize/positioning rules and the sway/drift/twinkle keyframes,
  replacing the current `.ep-scene-layer--near`/`--far` two-layer rules.
  Existing hotspot/panel/fallback CSS is unchanged.
- **Script:** `static/js/explorers-path.js` — the mousemove handler now
  applies eased parallax transforms to N layers by weight instead of two
  fixed-ratio layers, and the cursor-marker creation/positioning code
  (the SVG figure + its `is-visible` toggling) is deleted outright, not
  just hidden. Footstep audio wiring deleted per §5. Hotspot
  click/keyboard/panel-open/discovery-chime logic is unchanged.
- **Data:** `data/explorers_path.yaml` content (6 hotspots, their
  chapter labels, copy, positions) is unchanged by this spec — only the
  background it renders onto changes. Hotspot `xPercent`/`yPercent`
  values may need re-tuning against the new layer positions in the
  implementation pass, since the composited scene's exact pixel layout
  may shift slightly from the current single-flat-image version.

## 7. Explicitly deferred / out of scope

- Chapters 1, 3, and 4 getting their own illustrated scenes (or any
  further discussion of the multi-chapter walking structure) —
  unresolved, not part of this spec, revisit separately later.
- `IMG_6574.PNG`/`IMG_6575.PNG` — confirmed not part of this or any
  current phase.
- Final hotspot copy (case-study teasers, "at the time" notes, meme
  captions/authorship) — unchanged placeholder status from the original
  spec.
- Mobile/touch equivalent of mouse-driven parallax — mobile still has no
  parallax input; this is a known, accepted gap (per the original spec),
  not addressed here.
- Music/score system — still parked.
- Whether `/about/` redirects to `/` or gets its own lighter fallback —
  still open, still not part of this spec.
