# Berber Lab — Video Demo Section (Project 03)

Date: 2026-07-24

## Purpose

Fill the homepage's empty `project-3` slot with a Berber Lab case study presented as a **single demo video on a sage stage**, not as a chaptered scroll narrative.

Tide (`project-2`) already uses the narrative treatment: six numbered motion scenes, each with its own caption, read upward through a sticky deck. Berber Lab deliberately does not repeat that. The project's value is a continuous interaction — explore the canvas, open a piece, try it on, change the scene, save the preview — which reads far better as one uninterrupted take than as six captioned fragments. The section is therefore a quiet stage whose only job is to hold that video well.

The video itself is produced separately and supplied later. This work builds everything around it.

## Visual direction

The stage adopts **Berber Lab's own palette rather than restyling the project to the portfolio**, so scrolling into this section feels like arriving in the project's world. Tokens are lifted from `berber.lab/static/css/main.css:5` and scoped to the section root, matching how `.tide-project` scopes `--tide-ink`/`--tide-muted` in `home-sections.css:52`.

| Token | Value | Role |
|---|---|---|
| `--berber-bg` | `#dfe7dc` | flat sage field, the whole section |
| `--berber-bg-alt` | `#d3ddd0` | placeholder tile before the video exists |
| `--berber-ink` | `#1c1c1a` | wordmark, headline, sound pill |
| `--berber-muted` | `#6b6f66` | eyebrow, caption body, meta label |
| `--berber-display` | `'Cormorant Garamond', Georgia, serif` | wordmark, headline |
| `--berber-body` | `'Inter', -apple-system, sans-serif` | labels, caption body, pill |

The portfolio currently loads Caveat, Literata, Space Grotesk and Space Mono — neither Berber Lab face is present, so both must be added to the font link. The section uses its own two tokens rather than the portfolio's `--font-serif`/`--font-sans`, for the same reason it uses its own palette.

The source site is built on enormous negative space with jewelry cutouts floating on flat sage under soft shadows, a Cormorant Garamond wordmark, wide-tracked uppercase Inter labels, and exactly one hard shape (the black EXPERIENCE/GRID pill). The stage reproduces that restraint: nothing on the field moves except the video.

### Layout

```
┌──────────────────────────────────────────┐
│ Berber Lab              CASE STUDY  03   │
│                                          │
│      ╭──────────────────────────╮        │
│      │      [ demo video ]      │        │
│      │                 ┌──────┐ │        │
│      ╰─────────────────│SOUND │─╯        │
│         ░ soft shadow  └──────┘          │
│                                          │
│      Berber Lab · Jewelry storefront     │
│      Try the piece on before you buy it. │
│      A mockup fine-jewelry store …       │
└──────────────────────────────────────────┘
```

- Section is full-viewport (`min-height: 100svh`), flex column, centred, flat `--berber-bg`.
- **Header row**: "Berber Lab" wordmark left in Cormorant Garamond; `CASE STUDY 03` right, uppercase Inter, wide tracking, `--berber-muted`.
- **Video**: centred, `max-width: 1040px`, aspect governed by `--berber-video-ratio` (default `16 / 9`), `border-radius: 4px`, no border, and the cutout shadow `0 40px 80px -30px rgba(28, 28, 26, .28)`.
- **Caption**: below the video, max-width `46ch`, centred — eyebrow (uppercase Inter, muted), serif headline, one muted body line.
- Entry animation reuses the existing `reveal-group` / `reveal-item--N` classes so the section arrives like every other one.

### Copy

> Berber Lab · Jewelry storefront concept
> **Try the piece on before you buy it.**
> A mockup fine-jewelry store built around an exploration canvas instead of a product grid — and an AI try-on that puts the piece on you.

## Playback

Silent loop by default, click for sound.

- Markup ships `muted loop playsinline preload="none"` with the source behind `data-src` — the deferred pattern from `static/js/tide-project.js:4`, which exists so no video on this long homepage fetches before it is approached, and so a video without known dimensions never renders its collapsed 300×150 fallback box.
- An IntersectionObserver loads and plays the video on entry and pauses it on exit.
- A small black pill sits in the video's lower-right, echoing the site's EXPERIENCE/GRID toggle, labelled `SOUND OFF`. Clicking the pill *or* the video unmutes, swaps the label to `SOUND ON`, and hands over native `controls`; looping continues. The pill exists because a click-to-unmute affordance is otherwise undiscoverable.
- Unmuting is one-way in the sense that native controls then own mute state; the pill hides once controls are visible rather than competing with them.
- Under `prefers-reduced-motion: reduce` the video does not autoplay: it shows its poster with `controls` from the start, and the pill is not rendered.

## Assets

The video is supplied later. Until then the stage renders a `--berber-bg-alt` placeholder tile at exact final dimensions, so layout, shadow, reveal, and responsive behaviour are all verifiable now and the real file is a drop-in.

- `static/images/berber/berber-demo.mp4` — the demo video.
- `static/images/berber/berber-demo-poster.jpg` — poster frame; used by the reduced-motion path and as the pre-play frame.

Presence of the file is what switches the placeholder off, via a `resources`/file-exists check in the partial, so no template edit is needed when the video lands.

**Assumption:** 16:9 landscape, matching the desktop 3-panel Try-On UI. A vertical or 16:10 cut is a one-line change to `--berber-video-ratio`.

## Files

| File | Change |
|---|---|
| `data/home_sections.yaml` | `project-3`: `kind: placeholder` → `kind: berber`, `label: "Berber Lab"` |
| `layouts/index.html` | add `{{ else if eq .kind "berber" }}` branch |
| `layouts/partials/home/berber-section.html` | new — the section markup |
| `layouts/partials/head.html` | add Cormorant Garamond **and Inter** to the font link at line 58; add `berber-section.css` beside the other section sheets |
| `static/css/berber-section.css` | new — stage, video frame, caption, pill, responsive, reduced-motion |
| `static/js/berber-project.js` | new — deferred load, in-view play/pause, click-to-unmute |

`layouts/partials/home/project-placeholder.html` and its styles stay: it is the reusable empty-slot type for a future project 4.

The dot-nav needs no change — it ranges over `data/home_sections.yaml`, so the new label propagates on its own.

## Testing

- `./bin/hugo` builds clean, no new warnings.
- Screenshots at 1440px and 390px wide confirm the stage, shadow, caption measure, and header row.
- Scrolling in plays the video and scrolling out pauses it; the source is not fetched until approach.
- Clicking the pill and clicking the video both unmute and reveal controls.
- With `prefers-reduced-motion: reduce` the video does not autoplay and shows controls.
- The placeholder tile occupies the same box as the real video, verified by swapping a stand-in file in and out.
- Homepage still loads at the illustration and scrolls upward correctly, with the dot-nav showing "Berber Lab".

## Out of scope

- Producing, cutting, or captioning the video.
- A dedicated `/berber-lab/` case-study page — the homepage section is the whole presentation for now.
- Any change to the Berber Lab site itself, which is a separate repository.
