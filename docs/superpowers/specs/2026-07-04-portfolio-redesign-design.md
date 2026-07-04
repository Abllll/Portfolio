# Portfolio Redesign — Design Spec

Status: **structure & visual system approved by user; content population not started.**
Date: 2026-07-04

## 1. Who this is for and why

Site owner: **Amber Li**, targeting Design Engineering roles at companies in the
Anthropic / Linear / Notion / Stripe tier — teams that value systems thinking,
restraint, and cross-functional collaboration over visual flash.

**Explicit optimization target:** the *right* teams, not the maximum number of
interviews. Every content and design decision should filter for fit, not
maximize broad appeal.

### The core story

Amber has worked across multiple disciplines:

- **Engineering Foundation** — Diploma in Sustainable Urban Design & Engineering; technical reasoning, systems thinking, sustainability.
- **Manufacturing & Product Communication** — marketing for a GFRC precast panel company; materials, manufacturing, technical communication, commercial awareness.
- **Spatial / Interior Design** — workplace design, experience design, environmental graphics, construction coordination, international stakeholders.
- **Creative Practice** — illustration, personal IP, visual storytelling.
- **Community Building** — designed and facilitated art workshops; marketing, operations, iteration on participant feedback.
- **Technology Exploration** — AI, automation, workflow optimization, parametric thinking, design engineering.

This is **not a career pivot** — it's convergence. Design Engineering is the
natural meeting point of everything above, not an escape from any of it. The
site should let the reader connect the dots themselves rather than being told
"I can do everything."

**Avoid:** "I wear many hats," "I founded...," "I built everything myself,"
timeline/roadmap UI, masonry/Behance-style project galleries, literal star
ratings shown to visitors, corporate jargon, buzzwords, self-promotion,
overqualification signals, founder-track framing.

**Voice:** warm, confident, humble, reflective, curious — evidence over claims.
Reference point for tone: [jackiehu.design](https://jackiehu.design) — conversational,
personality-driven, zero corporate jargon, understated confidence. (Note: that
site's *structure* — reverse-chronological project list — was considered and
explicitly rejected in favor of the structure below; only its **voice** and
**restraint** are being borrowed.)

## 2. Decision log (so we don't re-litigate)

| Decision | Chosen | Rejected | Why |
|---|---|---|---|
| Tech stack | Stay on existing Hugo + Tailwind, add hand-written vanilla JS/CSS | Rebuild in React/Next.js; Hugo shell + JS "island" | No framework needed once IA simplified to Home/Work/Experiments/About — Hugo's list/single templating is a natural fit. Keeps existing GitHub Pages deploy pipeline intact. |
| Overall IA | Lean, project-first MVP (Home / Work / Experiments / About) | Elaborate 7-section scroll-narrative ("Why I Build" → "How I Think" → "Building My Perspective" → "Design Principles" → "Evidence" → "Continuous Exploration" → "Looking Forward") | The 7-section version was explored at length (see §6 for salvaged pieces) but was a large, slow-to-build, hard-to-populate structure. User chose to pivot fully to a leaner, shippable structure inspired by jackiehu.design, while keeping the convergence narrative alive through the Capability Map and homepage copy. |
| Core visual metaphor | Tree (roots/trunk/branches/canopy/graft) | Constellation/universe metaphor; pure abstract node-link "capability graph" | Tree maps literally onto Amber's own biography (sustainability = roots; branches = distinct disciplines fed by one trunk; canopy = convergence; AI/automation = a graft onto an established root system, not a new tree). Constellation risked reading as "creative-studio" self-mythologizing; pure graph risked reading as clinical/corporate org-chart. |
| Where the tree lives | Compact interactive widget on the **About** page, as the "Capability Map" | A giant illustrated hero/landscape scene on the homepage | Once the IA pivoted to project-first, the tree no longer needed to carry the whole homepage. Right-sized down to a compact, high-craft component. |
| Illustration production | Hybrid: this spec/prototype defines the interactive *structure*; Amber supplies real hand-illustrated art assets later | Fully AI/code-generated illustration | Illustration is one of Amber's actual stated skills — real hand-drawn art is both more authentic and higher-ceiling quality than generated vector shapes. |
| Capability map interaction | Hover-to-reveal (dot → label + short reflective caption) | Forced scroll-driven reveal | Calmer, more explorable; user explicitly preferred this after trying both live. |
| Color system | User-authored functional palette (§4) | Mid-century poster color-blocked landscape (sky/sea/field bands) | The poster/landscape direction was fully prototyped (rolling hills, grain texture, tree-in-a-field) but superseded once the user supplied a more sophisticated, function-mapped palette closer to MUJI/Aesop/HAY. That palette has no "sky/sea/field" colors, so the landscape-scene treatment no longer fits. |
| Star ratings on projects | Internal planning notes only | Visible UI on the live site | Self-rating your own work ⭐⭐⭐⭐⭐ for visitors would undercut "confidence with humility." |
| Site owner name | **Amber Li** | Placeholder "Alex Morgan" (old theme) / "Xiaoyan Li" (draft typo) | Confirmed by user. |

## 3. Information Architecture

### Site map

```
Home
├── Hero (one sentence, current focus, scroll indicator)
├── Selected Work (teaser — 3–4 projects, one hero image or one subtle
│                   interaction each; do not over-invest in homepage visuals)
├── Perspective (short — one line, e.g. "Engineering × Spatial × Systems × AI",
│                links through to the full Capability Map on About)
└── Footer

Work (list page)
└── Featured Projects (numbered 01, 02, 03…), each tagged with 3–5 skill/domain
    chips (e.g. Product Strategy, UX, Research, Brand, Prototype)
    → each project links to its own case-study page (template below)

Experiments (single lighter page — "Pinterest meets R&D lab," no long
             explanations)
├── Illustration
├── Workshop
├── AI Experiments
├── Automation
├── Physical Prototypes
└── Sketchbook

About (short — no full life story)
├── Who I Am
├── How I Think
├── Current Interests
├── Capability Map (compact interactive tree widget — see §5)
├── Resume
└── Contact
```

### Navigation

Simple top nav, no dropdowns, no blog, no gallery-as-its-own-thing, no literal
timeline UI:

```
Amber Li          Work   Experiments   About   Resume   LinkedIn
```

### Project roster (as currently known)

- **Bonheur** — real, in-progress project (folder already exists on disk).
- **Parent Community Platform**
- 2–3 **spatial/workplace design case studies** (e.g. a "Workplace Experience"
  project) — these are physical/interior design work, but must be **written and
  structured using the same product/design-engineering case-study skeleton**
  as the digital projects (see §3.1), not as an architecture-portfolio writeup.
  This is deliberate: it demonstrates that Amber applies the same systems-thinking
  process regardless of medium. Exact number and names of these projects to be
  finalized during content population.
- **Creative Explorations** — likely maps to illustration/personal-IP work;
  may live on Work as a lighter entry, or purely on Experiments. Decide during
  content population based on how substantial the material is.

### 3.1 Case-study page template

Every project page follows the same skeleton. Each project can emphasize
different sections more than others, but the shape stays consistent site-wide:

1. **Hero** — video or image, or one subtle interaction
2. **Project Summary** — short framing
3. **The Opportunity** — what problem existed, why it mattered
4. **Context** — timeline, team, role, deliverables
5. **Understanding** — research, insights, key observations
6. **Design Thinking** — how the problem was approached, key decisions,
   trade-offs, iterations
7. **Solution** — prototype, screens, videos, animations
8. **Outcome** — impact, metrics, reflection

This skeleton is what makes the spatial-design projects sit naturally
alongside the digital-product projects — same rigor, same structure,
different medium.

## 4. Visual design system

### Color — functional, not decorative

| Role | Color | Hex | Usage |
|---|---|---|---|
| Foundation | Walnut | `#8D5F48` | Structural elements, warm mid-tone |
| Foundation | Espresso | `#433531` | Primary ink/text, darkest structural tone |
| Foundation | Warm Grey | `#A19AA6` | Secondary/muted text, default (inactive) states |
| Functional accent | Chartreuse | `#B0C375` | **Reserved strictly** for: active node, hover, current section, progress indicator, selected text. Never decorative. |
| Secondary accent | Dusty Denim | `#495A78` | System connections, diagrams, engineering concepts, code snippets, links |
| Emotional accent | Lavender | `#D9D1EA` | Used sparingly for handwritten annotations, reflections, personal notes, quotes |

Foundation tones should make up ~90% of what's on screen at any time; the
three accents are earned by meaning, not sprinkled for decoration.

Mood reference points: MUJI, Aesop, HAY, Frama, Notem Studio, Kinfolk —
warm, honest, human, editorial, contemporary, slightly nostalgic, creative
without being loud.

**Open item:** background/paper tone. The palette above doesn't specify a
base surface color. A warm cream (~`#F4EFE8`) was prototyped as a placeholder
and read fine in the mockups, but has not been explicitly confirmed — treat as
adjustable during implementation, not a blocking decision.

**Resolved by the palette's own stated rules:** connection lines between
capability-map nodes stay **dusty denim** at all times (their explicit job is
"system connections"); chartreuse is reserved only for the node/dot/label
itself when active. This was tested both ways live; denim-only-on-lines is
the version consistent with the user's own rule set.

### Typography

Not yet locked. Mockups used generic Georgia (serif, headlines) / Helvetica
(sans, UI/labels/nav) as placeholders. Refine during implementation — no
decision made here beyond "a considered serif for editorial/headline moments,
a clean sans for UI/nav/labels," which is what's currently prototyped.

### Grain/texture

A very fine grain/noise overlay (low opacity, `mix-blend-mode: overlay`) was
prototyped during the (now-superseded) mid-century landscape exploration and
read well as a way to add warmth without decoration. Worth keeping as a subtle
global texture even though the landscape scene itself was dropped — revisit
during implementation.

## 5. The Capability Map (About page component)

A compact, interactive tree diagram — **not** a homepage hero, **not** a full
illustrated landscape scene.

**Structure (metaphor mapping):**
- **Roots** — Engineering & Sustainable Urban Design (invisible foundation)
- **Trunk** — the throughline: systems thinking, care for people, curiosity
- **Branches** — Materials & Manufacturing, Spatial Design, Illustration,
  Community
- **Canopy** — where the branches converge = Design Engineering
- **Graft** (a branch drawn separately, joining the established trunk lower
  down rather than growing from the canopy) — Automation/AI, deliberately
  visualized as *joined onto* existing roots rather than a new tree

**Rendering style:** organic/hand-drawn-feeling shapes (irregular canopy
blob, tapered trunk, curved roots) — explicitly **not** perfect circles/
rectangles/straight lines, which were tested and read as rigid/"PowerPoint."
Structural elements (trunk, canopy, roots) render in Espresso/Walnut.
Connecting lines render in Dusty Denim. Node dots default to Warm Grey.

**Interaction:** hover (or focus, for keyboard/touch via tap) on a node:
- dot scales up and turns Chartreuse
- a label fades/slides in (serif, Espresso)
- a short one-line reflective caption fades in with a slight delay (sans,
  Lavender) — e.g. "roots — technical reasoning," "a new graft, same roots"

This was built and tested as a live CSS/JS prototype during design
(hover-reveal, `IntersectionObserver`-free — pure `:hover`/`:focus` +
transitions). No framework required; matches the vanilla-JS tech decision.

**Homepage "Perspective" section** is a **short text line only**
(e.g. "Engineering × Spatial × Systems × AI") that teases this idea —
it should **not** duplicate the interactive widget. The full Capability Map
experience lives only on the About page, to avoid redundant build cost and
keep the homepage light per the "don't spend more than a day on this"
principle in the MVP structure.

## 6. Explicitly out of scope (superseded during this design process)

These were explored in depth and deliberately dropped. Documented so they
aren't accidentally reintroduced or re-debated from scratch:

- The 7-section immersive scroll-narrative IA (Why I Build / How I Think /
  Building My Perspective / Design Principles / Evidence / Continuous
  Exploration / Looking Forward).
- Constellation/universe visual metaphor for the capability map.
- A full illustrated mid-century-poster landscape scene (rolling hill bands
  for sky/sea/field, tree standing in an open field) as the capability-map
  backdrop.
- A pure abstract node-link "capability graph" (engineering-diagram style,
  no tree/organic structure) as the primary metaphor.
- Forced scroll-driven reveal as the primary interaction pattern for the
  capability map (kept hover-to-reveal instead).
- Blog section, masonry/gallery project display, visible star ratings, big
  graphical timeline/roadmap UI.

## 7. Open items for the next phase

1. Finalize which 2–3 spatial/workplace projects to feature, and their real
   names (currently placeholder: "Workplace Experience").
2. Decide whether "Creative Explorations" is a Work entry or an Experiments
   entry (depends on how substantial the material turns out to be).
3. Confirm/adjust the background/paper color (currently placeholder warm
   cream `#F4EFE8`).
4. Lock actual typefaces (currently generic Georgia/Helvetica placeholders).
5. Write real content for all pages — this spec defines structure and system,
   not final copy. Bio, project write-ups, resume content, and Experiments
   entries all need to be gathered/written next.
6. Amber to produce (or commission) the real hand-illustrated Capability Map
   artwork to eventually replace the current SVG/CSS prototype shapes.

## 8. Prototype reference

Live interactive prototypes built during this design session (hover-reveal
capability map, palette application, rejected landscape direction, etc.) are
saved under `.superpowers/brainstorm/` in this repo (git-ignored, local only —
not part of the shipped site). They're throwaway exploration artifacts, not
production code, but can be referenced during implementation to see exactly
how the hover interaction was prototyped.
