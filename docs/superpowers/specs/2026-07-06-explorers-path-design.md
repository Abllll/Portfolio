# The Explorer's Path — Design Spec

## 1. What this is

A replacement for the site's Home + About pages: instead of a hero section
and a separate text-based About page, visitors land directly in a long,
hand-illustrated forest scene in Amber's own illustration style. A small
explorer figure — Amber, stylized — moves along a winding path via arrow
keys or cursor, passing trees that light up with hidden content: case
studies, notes on what she was working on at the time, and personal-growth
reflections presented as literal captioned memes.

`Work` and `Experiments` remain ordinary Hugo pages, reachable from nav, for
anyone who wants to skip straight to evidence. The forest is the version of
the site for someone willing to spend a few minutes actually getting to
know her — it does not gate access to the portfolio content itself.

**Why this exists:** developed through a design conversation (see chat
history for full context) about how to present spatial/workplace project
history without either (a) exposing confidential client material or (b)
producing a generic case-study writeup that doesn't reflect who Amber
actually is. The throughline that emerged: Amber has repeatedly followed
the same instinct — build things that are solid, sustainable, and
beautiful — through sustainable urban design, a disillusioning marketing
job, discovering design (rooted in childhood memories of her aunt, an
architect, always carrying colored pencils and rendering by hand), several
years as an ID/spatial designer, and now toward technology as the medium
that lets all of those instincts move at the same speed. That story is
better told as an explored place than a written paragraph.

## 2. Site placement

- Replaces the current homepage (`layouts/partials/home/hero.html` +
  `home/projects.html` + `home/perspective.html` composition) **and** the
  current `/about/` page content (`layouts/_default/about.html` +
  `layouts/partials/capability-map.html`).
- `Work` (`/work/`) and `Experiments` (`/experiments/`) are unchanged and
  remain in nav.
- The forest becomes reachable at `/` (home). Whether `/about/` redirects
  to `/` or becomes a lighter fallback (e.g. plain-text bio for
  screen-reader/no-JS visitors) is an open item — see §8.

## 3. Structure — four chapters, one continuous path

Not four separate illustrated scenes: **one long horizontal path**, with
chapters as waypoints along it (technically implemented as a single wide
background strip the explorer walks across — see §6). In order:

1. **Roots** — sustainable urban design: the pull toward a field that
   combined architecture and engineering, still new, still forming.
2. **The Spark** — discovering design, anchored on the existing finished
   illustration (`IMG_6573.PNG`): a figure on a forest path, traced back to
   the sight of her aunt's colored pencils and hand-rendered drawings.
3. **The ID Years** — solo work and small led projects as a working
   designer; the growing sense that the industry's pace and tools were
   falling behind what she actually believed in.
4. **Now** — the graft toward technology: not a pivot, the same instinct
   finding a faster medium.

Only Chapter 2 has finished illustration (`IMG_6573.PNG`, plus its layered
Procreate source). Chapters 1, 3, and 4 need new artwork extending the same
path — produced with AI-assisted generation/outpainting, seeded from
Amber's existing illustrations and art-directed by her for style and color
match, not generated from a generic prompt. This is out of scope for
tonight's build (needs her iteration) — see §7 and §8.

## 4. Hotspot content model

Each hotspot is a light shaft visible through the trees — ambient scene
detail at first glance, not obviously a UI element. Two-stage disclosure:

- **Idle:** soft glow, part of the illustration's atmosphere.
- **Proximity/hover:** glow intensifies, a small icon fades in, signaling
  interactivity.
- **Click:** opens a content panel with the full detail.

Each hotspot carries one of three content types:

- **Case study card** — summary + link through to the real page under
  `/work/` (e.g. Bonheur). No content duplication; the forest teases, the
  Work page delivers detail.
- **"At the time" note** — short first-person context on what she was
  actually working on/thinking during that chapter.
- **Personal-growth meme** — a literal captioned-image meme, self-aware and
  funny, not corporate voice. Requires Amber's own captions/authorship —
  placeholder examples only for tonight's build (see §8).

## 5. Movement & interaction

- **Input:** ArrowLeft/ArrowRight (or A/D) move the explorer along the
  path; cursor click-to-walk-toward-point as an alternative input.
- **Camera:** viewport follows the explorer horizontally within the wide
  background strip (side-scroll model — pragmatic simplification of the
  illustrated path's depth perspective into a horizontal traversal).
- **Hotspot proximity:** a hotspot activates its hover state when the
  explorer is within a fixed pixel radius, OR on direct mouse hover,
  whichever comes first — supports both "walk up to it" and "scan with the
  cursor" play styles.
- **Sound:** short royalty-free SFX only for this phase — a footstep/rustle
  loop while moving, a discovery chime when a hotspot activates for the
  first time. No music/score in this phase (see §8 — deferred).
- **Accessibility fallback:** the forest is a progressive-enhancement
  layer. All chapter content (case studies, notes, memes) must also be
  reachable through a plain keyboard-navigable list/skip-link for
  screen-reader and no-JS visitors — the illustrated interaction is not the
  only way to reach the content.

## 6. Technical approach

Matches the site's existing constraints: static Hugo build, vanilla JS, no
framework, no build step (per the original structure-and-visual-system
plan's tech-stack decision).

- **New template:** `layouts/index.html` override (project-level, replaces
  the theme's default homepage composition) rendering a single full-bleed
  `<section>` containing the forest.
- **Rendering:** DOM + CSS transforms, not `<canvas>` — a wide background
  image (or CSS-positioned image strip for chapter segments) inside a
  fixed-height viewport with `overflow: hidden`; the explorer sprite is an
  absolutely-positioned `<img>` moved via `transform: translateX(...)`;
  camera-follow achieved by translating the background/world container the
  opposite direction. Chosen over canvas because it keeps hotspots as real,
  focusable, accessible DOM elements (needed for §5's keyboard/no-JS
  fallback) rather than manually-drawn/hit-tested canvas regions.
- **Data-driven hotspots:** a JS array/config
  (`static/js/explorers-path-data.js` or JSON) of
  `{ x, chapter, type, title, teaser, contentHref | contentHTML, iconAsset }`
  — content authored in this data file, not hardcoded into the interaction
  script, so adding/editing hotspots doesn't require touching movement
  logic.
- **New files (planning-time estimate, finalized in the implementation
  plan):**
  - `layouts/index.html` (override)
  - `layouts/partials/explorers-path/scene.html`
  - `static/js/explorers-path.js` (movement, camera, proximity detection,
    keyboard input, content-panel open/close)
  - `static/js/explorers-path-data.js` (hotspot content)
  - `static/css/explorers-path.css`
  - `static/images/explorers-path/*` (background strip segments, sprite,
    icons — see §7 for sourcing)
  - `static/audio/explorers-path/*` (SFX only, no music this phase)
- **Placeholder art for tonight:** Chapters 1/3/4 use simple
  placeholder background segments (not final AI-extended art — that needs
  Amber's iteration) so the full path is navigable end-to-end for review.
  Chapter 2 uses the real `IMG_6573.PNG` art, with the explorer sprite
  separated either from Amber's layered Procreate export (if provided in
  time) or a manually cut-out version of the flattened PNG otherwise.

## 7. Art production pipeline (partially deferred)

- Amber provides (already available): `IMG_6573.PNG` (flattened), ideally
  layer-separated exports of the explorer figure and background alone.
- New chapter segments (1, 3, 4) and the connective forest between all four
  waypoints: AI-assisted generation/outpainting seeded from Amber's
  existing illustrations, under her art direction (color grading, texture,
  composition notes) — **not** part of tonight's build; tracked as a
  follow-up requiring her iteration and approval.
- Icon design for hotspot markers (the "light shaft" reveal glyph): simple
  placeholder (glow + generic dot/icon) for tonight; final treatment TBD
  with Amber.

## 8. Explicitly deferred to a later phase

- Final AI-extended background art for Chapters 1, 3, and 4, and the
  connective path between all four waypoints.
- Final hotspot content copy: real case-study teaser text, real "at the
  time" notes, and — especially — real meme captions/authorship (personal
  voice, cannot be authentically drafted by anyone but Amber; tonight's
  build uses clearly-labeled placeholder examples only).
- The classical-to-jazz music system (discussed and explicitly parked in
  favor of SFX-only for now; revisit once the core interaction is proven).
- Whether `/about/` becomes a redirect to `/`, or a lighter plain-text
  fallback page of its own.
- Mobile/touch input scheme (arrow keys don't exist on mobile — needs a
  touch-drag or on-screen-button equivalent; not designed yet).
- Final hotspot marker icon/glow art treatment.

## 9. Explicitly out of scope (unchanged from prior phase)

Everything the original structure-and-visual-system plan already ruled
out — timeline/roadmap UI, masonry galleries, visible star ratings, a blog
section — still applies. The forest replaces the *homepage and About
content*, not the sitewide design system, Work templates, or nav.
