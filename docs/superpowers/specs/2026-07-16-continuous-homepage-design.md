# Continuous homepage — design spec

## Problem

The site is currently three disconnected things: the Explorer's Path
illustration (`/`), a personal-intro hero that nothing links to
(`layouts/partials/home/hero.html`, unused dead code left over from a
prior homepage design), and a single project page (`/work/bonheur/`)
reached only via one hotspot on the illustration. There's no page that
introduces Amber by name, and no way to browse projects except finding
the one hotspot that has one.

## Goal

Turn the homepage into one continuous scrollable document:

```
Illustration (Explorer's Path, unchanged)
  ↓
Intro section (Amber Li / Design Engineering / summary)
  ↓
Project 1 — Bonheur (real content, existing beats)
  ↓
Project 2 — placeholder
  ↓
Project 3 — placeholder
  ↓
Project 4 — placeholder
  ↓
Footer (unchanged)
```

A left-edge dot-nav (5 dots: illustration + 4 projects) stays pinned
through the intro/projects portion, scrollspy-highlights the current
section, and jumps to any section on click from wherever the user
currently is.

## Non-goals

- Writing real content for projects 2–4. They're empty placeholders
  ("title TBD" / "content coming soon") — filled in later, one at a
  time, each its own future spec.
- Changing how the illustration itself works (WASD movement, hotspot
  panels, parallax). It is reused exactly as-is.
- A generic "beat engine" that renders arbitrary projects from a
  shared schema. Bonheur's rendering is bespoke per-beat markup and
  bespoke CSS/JS (see "Why Bonheur isn't generalized" below) — it
  stays bespoke, just relocated.

## Scroll-direction rule (settled, non-negotiable)

Scrolling down always reveals what's next in the document — same as
every other page on the web. It is never inverted, on this section or
any other.

The illustration's "walking up the path" feeling comes entirely from
WASD input (W already reads as "forward/up," standard game-input
convention) — not from scroll. Scrolling is reserved exclusively for
moving between the illustration and the intro/project sections below
it. Confirmed against the current implementation:
`layouts/partials/explorers-path/scene.html` renders `.ep-viewport` as
`position: relative` in normal document flow (`static/css/explorers-path.css:13-21`)
— scrolling past it into whatever comes next already works with zero
special "release" logic. WASD and mouse-look
(`static/js/explorers-path.js`) never listen for wheel/scroll events
today, and this design adds none.

## Why Bonheur isn't generalized into a shared template

`layouts/work/bonheur-story.html` hardcodes per-beat markup
(`{{ if eq .id "spark" }}`, `{{ if eq .id "ache" }}`, etc.), each with
its own bespoke CSS animation (scattering sparks, star-to-darkness
transitions, the jar/star-cloud motif) built specifically for
Bonheur's narrative. There is no reasonable shared schema between that
and an empty "coming soon" placeholder — trying to force one would
mean over-engineering the placeholders to fit a template built for
one very specific story. Instead:

- **Bonheur** keeps its existing bespoke rendering, just relocated
  from a standalone page into an inline section of the homepage.
- **Placeholders** get a separate, trivial generic partial (title +
  "coming soon" line). No shared engine between the two.

## Section order — single source of truth

A new data file, `data/home_sections.yaml`, lists all 5 sections in
order. Both the homepage's render loop and the dot-nav read from it,
so the two can never drift out of sync:

```yaml
- id: illustration
  kind: illustration
  label: "Explorer's Path"
- id: bonheur
  kind: bonheur
  label: "Bonheur"
- id: project-2
  kind: placeholder
  label: "Project — coming soon"
- id: project-3
  kind: placeholder
  label: "Project — coming soon"
- id: project-4
  kind: placeholder
  label: "Project — coming soon"
```

`layouts/index.html` ranges over this list and dispatches on `kind`:
`illustration` → existing `explorers-path/scene.html` partial (as
today, unchanged); `bonheur` → new
`layouts/partials/home/bonheur-section.html` (Bonheur's existing beat
markup, moved here from `layouts/work/bonheur-story.html`, wrapped in
`<section id="bonheur">`); `placeholder` → new
`layouts/partials/home/project-placeholder.html` (title + "coming
soon", wrapped in `<section id="{{ .id }}">`).

## New components

- **`layouts/partials/home/intro.html`** — renders `.Site.Params.hero`
  (title/badge/summary — already real copy in `hugo.toml`, no
  placeholder text needed). Sits between the illustration and the
  first project section.
- **`layouts/partials/home/bonheur-section.html`** — Bonheur's beat
  markup relocated here verbatim from `layouts/work/bonheur-story.html`,
  under `<section id="bonheur">`. Its scoped stylesheet and
  scroll-triggered motif script load on the homepage instead of a
  standalone page; both already key off IntersectionObserver against
  elements inside the section, so relocating them changes nothing
  about how they fire.
- **`layouts/partials/home/project-placeholder.html`** — title +
  "coming soon" line, wrapped in a `<section id="{{ .id }}">` matching
  its `home_sections.yaml` entry.
- **`layouts/partials/home/dot-nav.html`** + **`static/js/dot-nav.js`**
  — renders one dot per entry in `home_sections.yaml` (5 total:
  illustration counts as a dot too, since it's the "go back to the
  illustration" target).
  Icons only, no text labels (aria-label carries the accessible name).
  Hidden while the illustration is the active section; fades in once
  the intro section is reached and stays fixed for the rest of the
  page. An IntersectionObserver watches each section's boundary to
  set the active dot. Clicking a dot smooth-scrolls to that section's
  id from wherever the user currently is. On narrow viewports, the
  same dot-nav renders smaller (reduced size/touch targets), it does
  not disappear. Dots are plain circles (active state = filled/larger,
  matching the site's existing quiet visual language) — no new icon
  artwork required for this pass.

## Section transitions

The reference is the Shopify Editions Winter '26 page
(shopify.com/editions/winter2026): each chapter gets a full-bleed,
unhurried entrance — generous scroll runway before the next chapter
reveals, restrained motion (no bouncing, no parallax showing off),
minimal chrome. Screenshotted it directly (a plain markdown fetch
doesn't render its scroll-driven behavior) to confirm this rather than
guess from memory. Translated into concrete, buildable rules:

- **Illustration → intro.** No pin, no scroll-jack — the illustration
  simply ends and the intro section begins in normal document flow
  (per the "Scroll-direction rule" section above, this is already how
  `.ep-viewport` behaves). As the intro section crosses ~30% into the
  viewport, its content fades and rises in (`opacity 0→1`,
  `translateY 12px→0`), staggered: name first, badge ~120ms later,
  summary line ~120ms after that. This is the same fade-up-and-stagger
  technique already built and validated for Bonheur's own beats
  (see "Polish the Sparks beat: fade-in the heading... tighten
  spacing") — reused here rather than inventing a second animation
  language for the same site.
- **Intro → Bonheur.** No new work — Bonheur's own intro stage
  (`bs-intro`, `bs-scroll-cue`, the sky/mist/sunshine reveal) already
  does its own bespoke entrance. Nothing about that changes by being
  embedded; it fires exactly as it does today.
- **Bonheur → placeholder sections.** Same fade-and-rise treatment as
  the intro section: title fades up, then the "coming soon" line,
  ~120ms stagger. One shared CSS animation (a `.reveal` class toggled
  by IntersectionObserver, same 30%-visible threshold), applied to the
  intro section and each placeholder section — not Bonheur's, which
  keeps its own.
- **Scroll runway.** Every section other than Bonheur's (which sizes
  itself to its beats) gets `min-height: 100vh`, so the reveal has
  room to read as deliberate rather than rushed — the "unhurried
  pacing" part of the Shopify reference, applied as a concrete layout
  rule rather than left as a vibe.
- **Dot-nav appearance.** Fades in (`opacity 0→1`, slight slide in
  from the left edge) at the exact moment the intro section's
  IntersectionObserver entry fires — tied to actual section entry,
  not a hardcoded scroll-Y pixel value, so it stays correct regardless
  of viewport height or content changes later.

`prefers-reduced-motion` disables all of the above (fades/slides
resolve instantly to their end state) — matching the existing sitewide
cross-document transition rule, which already respects it.

## Bonheur hotspot → same-page anchor

`data/explorers_path.yaml`'s `now-case-study-1` hotspot currently sets
`workRef: "work/bonheur/"`, rendered in
`layouts/partials/explorers-path/scene.html` as
`href="{{ .workRef | relURL }}"` (two call sites, lines 39 and 61).
This changes to `workRef: "#bonheur"`. Because `relURL` is meant for
site-relative paths and its behavior on a bare `#fragment` is not
something to rely on unverified, both call sites change to skip
`relURL` when the value is a same-page anchor:

```go-html-template
<a href="{{ if hasPrefix .workRef "#" }}{{ .workRef }}{{ else }}{{ .workRef | relURL }}{{ end }}">
```

This keeps the field generic (still works if a future hotspot needs a
real cross-page `workRef`) while making the anchor case explicit
rather than assumed. The other three hotspots (Roots, Spark, ID Years
notes) are untouched — they don't use `workRef` at all.

No other hotspots gain `workRef` links in this pass — the other three
project slots are placeholders with no narrative placement in the
illustration's chapters yet. That's future work, done once each
project is real.

## Retiring `/work/bonheur/`

`content/work/bonheur.md` becomes a thin redirect stub instead of a
content page:

- Front matter changes `layout = "bonheur-story"` to
  `layout = "redirect"`, adds `redirectAnchor = "bonheur"` and
  `_build.list = false` (so it no longer appears in `/work/`'s
  listing — it isn't a browsable project anymore, it's a legacy URL).
  `_build.render` stays at its default (`true`), since the stub itself
  must still render at `/work/bonheur/`.
- New `layouts/work/redirect.html`: meta-refresh and the fallback link
  both target `{{ "/" | relURL }}#{{ .Params.redirectAnchor }}` — built
  with `relURL`, not a hardcoded `/#bonheur` string, so it resolves
  correctly under the site's `/Portfolio/` baseURL subpath (this is
  the exact class of bug already fixed once on this branch: "Fix
  Bonheur case-study link 404ing under the /Portfolio/ base path").
  Canonical link tag points to `{{ "/" | relURL }}` without the
  fragment, per normal canonical-URL convention. A visible fallback
  "Continue to Bonheur →" link covers the no-JS/no-meta-refresh case.
- `data/bonheur_story.yaml` is unchanged — it's the data source for
  the relocated `bonheur-section.html` partial now, not for a
  standalone page.

`/work/` (`layouts/work/list.html`) will show zero items after this
(the only entry it ever had is now hidden via `_build.list = false`).
That's expected and fine — project browsing now happens on the
homepage; `/work/` isn't linked to from anywhere in this design.

## Testing

This is a visual/interaction feature with no meaningful unit-test
surface — verification is manual browser spot-check:

1. WASD/mouse-look still moves the girl within the illustration;
   scrolling (wheel or trackpad, either direction) while the
   illustration is in view does not move her, and simply scrolls the
   page toward the intro section.
2. Dot-nav is invisible while the illustration is in view, fades in
   at the intro section, stays fixed afterward.
3. Dot-nav correctly highlights the active section while scrolling
   through intro → Bonheur → placeholders.
4. Clicking each of the 5 dots jumps to the right section, tested
   from multiple starting scroll positions (not just top-to-bottom).
5. Bonheur's beats still render and scroll-trigger correctly now that
   they're embedded rather than on their own page (spark scatter,
   ache darkness, motif sync — the things the last several commits on
   this branch specifically fixed).
6. The illustration's Bonheur hotspot smooth-scrolls to `#bonheur`
   with no full page navigation/reload.
7. Visiting `/work/bonheur/` directly redirects to `/#bonheur`.
8. `/work/` renders with zero listed projects, no error.
9. Mobile-width spot-check of the shrunk dot-nav.
10. Intro and each placeholder section fade/rise in with the staggered
    name → badge → summary (or title → "coming soon") timing, once
    ~30% visible — not before, not abruptly.
11. Bonheur's own intro reveal is unaffected by relocation.
12. With `prefers-reduced-motion` enabled, all fades/slides resolve
    instantly — no motion plays.
