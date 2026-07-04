# Portfolio Structure & Visual System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the approved information architecture, navigation, visual design system, and page templates from `docs/superpowers/specs/2026-07-04-portfolio-redesign-design.md`, replacing the theme's placeholder ("Alex Morgan") content with Amber Li's real structure — without yet writing the full body of content, which is explicitly deferred to a later phase (see spec §7, open items).

**Architecture:** Hugo static site, `hugo-minimal-black` theme kept as an untouched git submodule at `themes/hugo-minimal-black`. All customization happens via Hugo's project-level override mechanism: any file placed at the same relative path under the project root (`layouts/...`, `static/...`) takes precedence over the theme's copy of that path, with zero changes to the submodule. The theme already pipes its six core colors through CSS custom properties (`--color-bg`, `--color-surface`, `--color-text`, `--color-text-muted`, `--color-border`, `--color-accent`) consumed by pre-compiled Tailwind classes in `static/css/main.css` — so the entire visual reskin is achieved by redefining those variables in one new override stylesheet, with no Tailwind rebuild required.

**Tech Stack:** Hugo (vendored binary at `./bin/hugo`, confirmed working: `hugo v0.163.3`), plain CSS custom properties, vanilla JS (no framework, no build step) — matches the spec's explicit tech-stack decision (§2).

**How to test each task:** This is a static site with no unit test runner. "Testing" means: build the site with the vendored Hugo binary into a scratch directory, confirm the build has zero `ERROR` lines, then `grep` the generated HTML/CSS for the exact strings each task is supposed to produce (and, where relevant, confirm strings that should be *gone* are gone). Every task's steps show the exact build and grep commands and their expected output.

Use this scratch output directory for every build in this plan (outside the repo, per project convention):
```
/tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop/085a7853-dfd4-40af-ab63-eb149445f4b8/scratchpad/hugo-build
```

## Global Constraints

- Site owner is **Amber Li**, targeting Design Engineering roles (Anthropic/Linear/Notion/Stripe tier). Copy voice: warm, confident, humble, reflective, curious — evidence over claims. Never: "I wear many hats," "I founded...," "I built everything myself," self-promotion, buzzwords, overqualification signals.
- Never introduce: timeline/roadmap UI, masonry/Behance-style project galleries, visible star ratings, a blog section.
- Color system (spec §4) — exact hex values, foundation tones ≈90% of any screen, accents earned by meaning:
  | Role | Color | Hex | Usage |
  |---|---|---|---|
  | Foundation | Walnut | `#8D5F48` | Structural elements |
  | Foundation | Espresso | `#433531` | Primary ink/text |
  | Foundation | Warm Grey | `#A19AA6` | Secondary/muted text, default inactive states |
  | Functional accent | Chartreuse | `#B0C375` | Reserved for active/hover/current-section/selected-text only |
  | Secondary accent | Dusty Denim | `#495A78` | System connections, diagrams, code, links |
  | Emotional accent | Lavender | `#D9D1EA` | Handwritten annotations, reflections, quotes — sparing use |
  | Background (placeholder, adjustable) | Warm cream | `#F4EFE8` | Base surface |
- Typography (spec §4, not fully locked): a serif for headlines (`Georgia, 'Iowan Old Style', 'Times New Roman', serif`), a sans for UI/nav/labels (`Helvetica, Arial, sans-serif`).
- Grain/texture: a very fine noise overlay, low opacity, `mix-blend-mode: overlay`, applied globally.
- IA (spec §3): `Home` (Hero / Selected Work teaser / Perspective one-liner / Footer — no dropdowns, no "now" quick-facts block, no tech marquee), `Work` (numbered case studies, 3–5 skill chips each), `Experiments` (light grid, six categories, no long explanations), `About` (Who I Am / How I Think / Current Interests / Capability Map / Resume / Contact).
- Case-study skeleton (spec §3.1) applies to every Work page, digital or spatial: Hero → Project Summary → The Opportunity → Context → Understanding → Design Thinking → Solution → Outcome.
- Capability Map (spec §5): tree metaphor — roots (Engineering), trunk (throughline), branches (Materials, Spatial Design, Illustration, Community), canopy (convergence = "Design Engineering"), graft (Automation, joins the trunk low down, not the canopy). Organic/hand-drawn-feeling shapes, not circles/rectangles. Structural elements in Espresso/Walnut, connecting lines always Dusty Denim, node dots default Warm Grey → Chartreuse + label reveal on hover/focus.
- Content population (bio prose, additional case studies, resume PDF, real LinkedIn/email) is **out of scope for this plan** per spec §7 and the user's explicit choice to build structure/system first. Where a real value doesn't exist yet (LinkedIn URL, contact email), this plan uses an unmistakably-named placeholder in `hugo.toml` rather than inventing one, and calls that out as a pre-launch checklist item.

---

### Task 1: Content cleanup & section restructure

**Files:**
- Move: `content/projects/` → `content/work/` (git mv, preserves history)
- Modify: `content/work/_index.md`
- Delete: `content/work/coming-soon.md`, `content/work/nexus-analytics.md`, `content/work/sentinel-design-system.md` (theme demo content)
- Delete: `content/about-alternative/` (theme demo variant, not part of the approved IA)
- Delete: `content/blog/` (spec explicitly excludes a blog)

**Interfaces:**
- Produces: a `work` content section (used by Task 5's `layouts/work/*` templates and Task 4's homepage teaser).

- [ ] **Step 1: Rename the section**

```bash
cd "/mnt/c/Users/SirenDesign/Desktop/Portfolio"
git mv content/projects content/work
```

- [ ] **Step 2: Remove the theme's demo project pages**

```bash
git rm content/work/coming-soon.md content/work/nexus-analytics.md content/work/sentinel-design-system.md
```

- [ ] **Step 3: Remove the unused About Alternative and Blog content**

```bash
git rm -r content/about-alternative content/blog
```

- [ ] **Step 4: Rewrite `content/work/_index.md`**

```markdown
+++
title = "Work"
+++
```

- [ ] **Step 5: Build and verify the section rename took effect**

```bash
./bin/hugo --minify -d /tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop/085a7853-dfd4-40af-ab63-eb149445f4b8/scratchpad/hugo-build 2>&1 | tail -20
```

Expected: build succeeds (no `ERROR` lines). At this point `hugo` falls back to the theme's generic `_default/list.html`/`_default/single.html` for the `work` section since no `work`-specific templates exist yet — that's fine, Task 5 adds those. There will be no `/work/` output pages yet since `content/work/` currently has no Markdown pages besides `_index.md` (Bonheur is added in Task 6) — this step is only confirming the move didn't break the build.

```bash
ls /tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop/085a7853-dfd4-40af-ab63-eb149445f4b8/scratchpad/hugo-build/about-alternative 2>&1
ls /tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop/085a7853-dfd4-40af-ab63-eb149445f4b8/scratchpad/hugo-build/blog 2>&1
```

Expected: both `ls` calls print `No such file or directory` — confirms those pages are no longer generated.

- [ ] **Step 6: Commit**

```bash
git add -A content/
git commit -m "Rename projects section to work, remove blog and About Alt demo content"
```

---

### Task 2: Site configuration & navigation

**Files:**
- Modify: `hugo.toml`
- Create: `layouts/partials/header.html` (project-level override of the theme's header, to open external nav links in a new tab)

**Interfaces:**
- Produces: `.Site.Menus.main` = Work, Experiments, About, Resume, LinkedIn (in that order); `.Site.Params.hero.*`, `.Site.Params.home.*`, `.Site.Params.social` used by Task 4/8's partials.

- [ ] **Step 1: Rewrite `hugo.toml`**

```toml
baseURL = 'https://abllll.github.io/Portfolio/'
languageCode = 'en-us'
title = 'Amber Li — Design Engineering'
theme = "hugo-minimal-black"

[outputs]
  home = ["HTML", "RSS", "JSON", "WebAppManifest"]

[outputFormats.WebAppManifest]
  mediaType = "application/manifest+json"
  rel = "manifest"
  baseName = "manifest"
  isPlainText = true
  notAlternative = true

[params]
  brand = "Amber Li"
  description = "Design engineering portfolio of Amber Li — systems thinking across engineering, spatial design, and AI."

  favicon = "icons/favicon.svg"
  appleTouchIcon = "apple-touch-icon.png"

  projectsIntro = "Case studies across product, spatial, and systems work — same process, different medium."

  [params.manifest]
    themeColor = "#B0C375"
    backgroundColor = "#F4EFE8"
    categories = ["portfolio", "design"]

  [params.theme]
    defaultTheme = "light"

  [params.home]
    sections = ["hero", "projects", "perspective"]
    showFeaturedProjects = true
    featuredProjectsLimit = 4
    projectsTitle = "Selected Work"
    projectsSubtitle = "A few projects, picked for fit rather than volume."

  [params.hero]
    badge = "Design Engineering"
    title = "Hi, I'm Amber Li."
    role = "I work at the meeting point of engineering, spatial design, and systems thinking."
    summary = "My path runs through sustainable engineering, manufacturing, workplace design, illustration, and community building — not a pivot, but a convergence. Design engineering is where all of it meets."
    location = "Singapore"
    focus = "Currently exploring how AI and automation extend the same systems-thinking instincts I've always worked with — a new graft, not a new tree."
    available = true
    availableLabel = "Open to design engineering roles"

    [params.hero.primary]
      label = "See the work"
      href = "/work/"

    [params.hero.secondary]
      label = "More about how I think"
      href = "/about/"

  [params.icons]
    useFontAwesome = true
    useDevicon = false

  [[params.social]]
    label = "LinkedIn"
    url = "https://www.linkedin.com/in/REPLACE-WITH-AMBER-LINKEDIN-HANDLE/"
    icon = "fa-brands fa-linkedin-in"

  [[params.social]]
    label = "Email"
    url = "mailto:REPLACE-WITH-AMBER-EMAIL@example.com"
    icon = "fa-regular fa-envelope"

[menu]
  [[menu.main]]
    name = "Work"
    pageRef = "work"
    url = "/work/"
    weight = 1
    identifier = "work"

  [[menu.main]]
    name = "Experiments"
    pageRef = "experiments"
    url = "/experiments/"
    weight = 2
    identifier = "experiments"

  [[menu.main]]
    name = "About"
    pageRef = "about"
    url = "/about/"
    weight = 3
    identifier = "about"

  [[menu.main]]
    name = "Resume"
    url = "/about/#resume"
    weight = 4
    identifier = "resume"

  [[menu.main]]
    name = "LinkedIn"
    url = "https://www.linkedin.com/in/REPLACE-WITH-AMBER-LINKEDIN-HANDLE/"
    weight = 5
    identifier = "linkedin-nav"

[markup]
  [markup.tableOfContents]
    startLevel = 2
    endLevel = 4

  [markup.goldmark.renderer]
    unsafe = true

  [markup.goldmark.parser]
      [markup.goldmark.parser.attribute]
        block = true

  [markup.goldmark.extensions]
    typographer = true
    linkify = true
    table = true
    strikethrough = true
    taskList = true
    definitionList = true
    footnote = true

    [markup.goldmark.extensions.extras.delete]
      enable = true
    [markup.goldmark.extensions.extras.insert]
      enable = true
    [markup.goldmark.extensions.extras.mark]
      enable = true

  [markup.highlight]
    codeFences = true
    guessSyntax = true
    lineNos = false
    lineNumbersInTable = false
    noClasses = false
    style = "monokai"
    tabWidth = 2

[taxonomies]
  tag = "tags"
  category = "categories"

[privacy]
  [privacy.youtube]
    privacyEnhanced = true
```

- [ ] **Step 2: Override `layouts/partials/header.html` so external nav links (LinkedIn) open in a new tab**

Read the theme's version first to confirm you're overriding the right file:

```bash
cat themes/hugo-minimal-black/layouts/partials/header.html
```

Create `layouts/partials/header.html` with this content (identical to the theme's version, except each menu-loop `<a>` now checks whether the URL is external):

```html
<header class="pt-6">
  {{/* Brand string for logo/monogram */}}
  {{- $brand := .Site.Params.brand | default .Site.Title}}
  {{- $mono := upper (substr $brand 0 2) -}}

  <div class="mx-auto max-w-7xl px-4 sm:px-6">
    <!-- Floating nav container -->
    <div class="nav-shell">
      <div class="nav-inner">
        <!-- Brand: logo or monogram, always links to root -->
        <a href="{{ "/" | relURL }}" class="flex items-center gap-2">
          {{ with .Site.Params.logo }}
            <div class="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-surface">
              <img
                src="{{ . | relURL }}"
                alt="{{ $brand }}"
                class="h-full w-full object-cover"
              >
            </div>
          {{ else }}
            <div class="logo-badge">
              {{ $mono }}
            </div>
          {{ end }}
          <span class="text-xs font-semibold tracking-wide">
            {{ $brand }}
          </span>
        </a>

        <div class="flex items-center gap-2">
          <!-- Desktop nav (configurable) -->
          <nav class="hidden items-center gap-5 md:flex">
            {{- $current := . -}}
            {{- range .Site.Menus.main }}
              {{- $external := strings.HasPrefix .URL "http" -}}
              <a
                href="{{ if $external }}{{ .URL }}{{ else }}{{ .URL | relURL }}{{ end }}"
                {{ if $external }}target="_blank" rel="noopener noreferrer"{{ end }}
                class="nav-link link-underline flex items-center gap-1 {{ if $current.IsMenuCurrent "main" . }}text-text{{ end }}"
              >
                {{ with .Params.icon }}
                  <i class="{{ . }} text-[0.75rem]"></i>
                {{ end }}
                <span>{{ .Name }}</span>
              </a>
            {{- end }}
          </nav>

          <!-- Theme toggle, sized to match nav -->
          {{ partial "dark-toggle.html" . }}

          <!-- Mobile menu button -->
          <button
            type="button"
            class="ml-1 inline-flex items-center justify-center rounded-full border border-border bg-bg p-2 text-muted shadow-sm hover:text-accent md:hidden"
            aria-label="Toggle navigation"
            data-mobile-nav-toggle
          >
            <span class="sr-only">Open navigation</span>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="18" x2="20" y2="18" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Mobile nav (uses same menu config) -->
  <div class="mx-auto mt-2 max-w-7xl px-4 sm:px-6 md:hidden">
    <nav
      class="hidden rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-muted shadow-md"
      data-mobile-nav
    >
      {{ range .Site.Menus.main }}
        {{- $external := strings.HasPrefix .URL "http" -}}
        <a
          href="{{ if $external }}{{ .URL }}{{ else }}{{ .URL | relURL }}{{ end }}"
          {{ if $external }}target="_blank" rel="noopener noreferrer"{{ end }}
          class="flex items-center gap-2 py-1.5"
        >
          {{ with .Params.icon }}
            <i class="{{ . }} text-[0.8rem]"></i>
          {{ end }}
          <span>{{ .Name }}</span>
        </a>
      {{ end }}
    </nav>
  </div>
</header>
```

- [ ] **Step 3: Build and verify**

```bash
./bin/hugo --minify -d /tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop/085a7853-dfd4-40af-ab63-eb149445f4b8/scratchpad/hugo-build 2>&1 | tail -20
grep -o 'Amber Li' /tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop/085a7853-dfd4-40af-ab63-eb149445f4b8/scratchpad/hugo-build/index.html | head -1
grep -c 'target="_blank" rel="noopener noreferrer"' /tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop/085a7853-dfd4-40af-ab63-eb149445f4b8/scratchpad/hugo-build/index.html
grep -o '>Work<\|>Experiments<\|>About<\|>Resume<\|>LinkedIn<' /tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop/085a7853-dfd4-40af-ab63-eb149445f4b8/scratchpad/hugo-build/index.html
```

Expected: build succeeds; first grep prints `Amber Li`; second grep prints a count ≥ 2 (desktop + mobile LinkedIn links); third grep lists all five nav labels in order.

- [ ] **Step 4: Commit**

```bash
git add hugo.toml layouts/partials/header.html
git commit -m "Rewrite site config for Amber Li IA and add external-link handling to nav"
```

---

### Task 3: Design tokens, typography & grain texture

**Files:**
- Create: `static/css/overrides.css`
- Create: `layouts/partials/head.html` (project-level override, adds one `<link>`)
- Create: `layouts/_default/baseof.html` (project-level override, adds one grain `<div>`)

**Interfaces:**
- Produces: CSS custom properties `--color-walnut`, `--color-denim`, `--color-lavender`, `--font-serif`, `--font-sans` (consumed by Task 8's Capability Map CSS) in addition to overriding the theme's existing six `--color-*` variables. Produces class `.grain-overlay` and `.card-index` (consumed by Task 5).

- [ ] **Step 1: Create `static/css/overrides.css`**

```css
/* ==========================================================================
   AMBER LI PORTFOLIO — DESIGN TOKEN OVERRIDES
   Loaded after main.css (see layouts/partials/head.html). Redefines the
   theme's CSS custom properties with the spec's functional palette:
   docs/superpowers/specs/2026-07-04-portfolio-redesign-design.md §4.
   ========================================================================== */

:root,
html[data-theme="dark"] {
  --color-bg: #F4EFE8;
  --color-surface: #FBF8F2;
  --color-text: #433531;
  --color-text-muted: #A19AA6;
  --color-border: #E4DDD1;
  --color-accent: #B0C375;

  --color-walnut: #8D5F48;
  --color-denim: #495A78;
  --color-lavender: #D9D1EA;

  --font-serif: Georgia, 'Iowan Old Style', 'Times New Roman', serif;
  --font-sans: Helvetica, Arial, sans-serif;
}

body {
  font-family: var(--font-sans);
}

h1, h2, h3,
.heading-page,
.heading-section,
.about-title,
.card-index {
  font-family: var(--font-serif);
}

.markdown-body a {
  color: var(--color-denim);
}

.markdown-body a:hover {
  color: var(--color-accent);
}

.markdown-body code {
  color: var(--color-denim);
}

.markdown-body blockquote,
.markdown-body .md-blockquote {
  border-left-color: var(--color-lavender);
}

/* Grain texture overlay — see layouts/_default/baseof.html */
.grain-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  pointer-events: none;
  opacity: 0.05;
  mix-blend-mode: overlay;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>");
  background-size: 160px 160px;
}

/* Work list numbering — spec §3: "Featured Projects (numbered 01, 02, 03…)" */
.card-index {
  display: inline-block;
  margin-right: 0.4rem;
  font-size: 0.75rem;
  color: var(--color-text-muted);
}
```

- [ ] **Step 2: Override `layouts/partials/head.html`**

```bash
cat themes/hugo-minimal-black/layouts/partials/head.html
```

Create `layouts/partials/head.html` identical to the theme's file, with one new `<link>` line added directly after the `main.css` line:

```html
{{- $title := cond (ne .Title "") (printf "%s | %s" .Title .Site.Title)
.Site.Title -}}
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />

<title>{{ $title }}</title>

{{ partial "meta.html" . }}

<!-- Favicon -->
{{ with .Site.Params.favicon }}
  <link rel="icon" type="image/x-icon" href="{{ . | relURL }}" />
{{ else }}
  <!-- Default favicon paths -->
  {{ if fileExists "static/favicon.ico" }}
    <link rel="icon" type="image/x-icon" href="{{ "favicon.ico" | relURL }}" />
  {{ end }}
  {{ if fileExists "static/favicon.png" }}
    <link rel="icon" type="image/png" href="{{ "favicon.png" | relURL }}" />
  {{ end }}
  {{ if fileExists "static/favicon.svg" }}
    <link rel="icon" type="image/svg+xml" href="{{ "favicon.svg" | relURL }}" />
  {{ end }}
{{ end }}

<!-- Apple Touch Icon -->
{{ if .Site.Params.appleTouchIcon }}
  <link rel="apple-touch-icon" href="{{ . | relURL }}" />
{{ else if fileExists "static/apple-touch-icon.png" }}
  <link rel="apple-touch-icon" href="{{ "apple-touch-icon.png" | relURL }}" />
{{ end }}

<!-- Web App Manifest -->
{{ with .Site.GetPage "/" }}
  {{ range .OutputFormats }}
    {{ if eq .Name "webappmanifest" }}
      <link rel="manifest" href="{{ .Permalink }}" />
    {{ end }}
  {{ end }}
{{ end }}

<link rel="stylesheet" href="{{ "css/main.css" | relURL }}">
<link rel="stylesheet" href="{{ "css/overrides.css" | relURL }}">

{{ if .Site.Params.icons.useFontAwesome }}
  <link
    rel="stylesheet"
    href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/7.0.1/css/all.min.css"
  >
{{ end }}

{{ if .Site.Params.icons.useDevicon }}
  <link
    rel="stylesheet"
    href="https://cdn.jsdelivr.net/gh/devicons/devicon@v2.17.0/devicon.min.css"
  >
{{ end }}

<!-- GLightbox -->
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/glightbox/dist/css/glightbox.min.css"
/>

<!-- Justified Gallery (Vanilla) -->
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/justified-gallery@3.8.2/dist/css/justifiedGallery.min.css"
/>

<script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
<script>
  mermaid.initialize({ theme: "dark" });
</script>

<script>
  (function () {
    try {
      var stored = localStorage.getItem("theme");
      var systemDark =
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches;
      var defaultTheme =
        '{{ default "system" .Site.Params.theme.defaultTheme }}';

      var theme =
        stored ||
        (defaultTheme === "dark"
          ? "dark"
          : defaultTheme === "light"
          ? "light"
          : systemDark
          ? "dark"
          : "light");

      document.documentElement.setAttribute("data-theme", theme);
    } catch (e) {
      document.documentElement.setAttribute("data-theme", "light");
    }
  })();
</script>

<!-- Analytics -->
{{ partial "analytics.html" . }}
```

- [ ] **Step 3: Override `layouts/_default/baseof.html`**

```bash
cat themes/hugo-minimal-black/layouts/_default/baseof.html
```

Create `layouts/_default/baseof.html` identical to the theme's file, with one new `<div class="grain-overlay">` added as the first child of `<body>`:

```html
<!DOCTYPE html>
<html lang="{{ .Site.Language.Lang }}"
  data-cb-collapse-enabled="{{ .Site.Params.features.codeblock.collapse.enabled }}"
  data-cb-collapse-default="{{ .Site.Params.features.codeblock.collapse.defaultState }}"
  data-cb-collapse-lines="{{ .Site.Params.features.codeblock.collapse.autoCollapseLines }}"
  data-cb-collapse-auto-height="{{ .Site.Params.features.codeblock.collapse.autoCollapseHeight }}"
  data-cb-collapse-collapsed-height="{{ .Site.Params.features.codeblock.collapse.collapsedHeight }}">
  <head>
    {{ partial "head.html" . }}
  </head>
  <body class="min-h-screen bg-bg text-text antialiased">
    <div class="grain-overlay" aria-hidden="true"></div>
    <div class="flex min-h-screen flex-col">
      {{ partial "header.html" . }}

      <main class="flex-1">
        {{ block "main" . }}{{ end }}
      </main>

      {{ partial "footer.html" . }}
    </div>
    {{ partial "search-overlay.html" . }}
    {{ partial "dock.html" . }}
    <script src="{{ "js/main.js" | relURL }}" defer></script>
    <script src="{{ "js/search.js" | relURL }}" defer></script>
    <script src="https://cdn.jsdelivr.net/npm/glightbox/dist/js/glightbox.min.js" defer></script>
    <script src="https://cdn.jsdelivr.net/npm/justified-gallery@3.8.2/dist/js/justifiedGallery.min.js" defer></script>
    <script src="{{ "js/lightbox.js" | relURL }}" defer></script>
    <script src="{{ "js/gallery.js" | relURL }}" defer></script>
  </body>
</html>
```

- [ ] **Step 4: Build and verify**

```bash
./bin/hugo --minify -d /tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop/085a7853-dfd4-40af-ab63-eb149445f4b8/scratchpad/hugo-build 2>&1 | tail -20
grep -o 'overrides.css' /tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop/085a7853-dfd4-40af-ab63-eb149445f4b8/scratchpad/hugo-build/index.html
grep -o 'grain-overlay' /tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop/085a7853-dfd4-40af-ab63-eb149445f4b8/scratchpad/hugo-build/index.html
grep -o '#B0C375' /tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop/085a7853-dfd4-40af-ab63-eb149445f4b8/scratchpad/hugo-build/css/overrides.css
```

Expected: build succeeds; each grep prints the matched string at least once, confirming the stylesheet is linked, the grain div is in the markup, and the palette shipped.

- [ ] **Step 5: Commit**

```bash
git add static/css/overrides.css layouts/partials/head.html layouts/_default/baseof.html
git commit -m "Add design tokens, typography, and grain texture overrides"
```

---

### Task 4: Homepage — Perspective section

**Files:**
- Create: `layouts/partials/home/perspective.html`

**Interfaces:**
- Consumes: nothing new — `params.home.sections` (Task 2) already includes `"perspective"`, which makes `index.html`'s `{{ range $sections }}{{ partial (printf "home/%s.html" .) $ }}{{ end }}` loop call this partial automatically.
- Produces: a link to `/about/#capability-map`, which Task 8 must create as a real anchor.

- [ ] **Step 1: Create `layouts/partials/home/perspective.html`**

```html
<div class="space-y-2 animate-fade-up">
  <p class="text-sm text-muted">
    Engineering <span class="text-accent">×</span> Spatial Design <span class="text-accent">×</span> Systems <span class="text-accent">×</span> AI
  </p>
  <a href="{{ "/about/#capability-map" | relURL }}" class="link-underline text-xs font-medium text-muted">
    How the pieces connect →
  </a>
</div>
```

- [ ] **Step 2: Build and verify**

```bash
./bin/hugo --minify -d /tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop/085a7853-dfd4-40af-ab63-eb149445f4b8/scratchpad/hugo-build 2>&1 | tail -20
grep -o 'Engineering.*Spatial Design.*Systems.*AI' /tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop/085a7853-dfd4-40af-ab63-eb149445f4b8/scratchpad/hugo-build/index.html
grep -o 'about/#capability-map' /tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop/085a7853-dfd4-40af-ab63-eb149445f4b8/scratchpad/hugo-build/index.html
```

Expected: build succeeds; both greps find a match on the homepage. (The `#capability-map` anchor itself won't exist until Task 8 — that's expected at this point.)

- [ ] **Step 3: Commit**

```bash
git add layouts/partials/home/perspective.html
git commit -m "Add homepage Perspective section"
```

---

### Task 5: Work list & case-study templates

**Files:**
- Create: `layouts/partials/home/projects.html` (project-level override — same as the theme's, but filters on the `work` section instead of `projects`)
- Create: `layouts/partials/components/project-card.html` (project-level override — adds the spec's numbered-index badge)
- Create: `layouts/work/list.html`
- Create: `layouts/work/single.html`

**Interfaces:**
- Consumes: `content/work/*` pages (Task 1), each expected to carry front matter fields `subtitle`, `description`, `role`, `timeline`, `team`, `tags` (a string list), `featured` (bool) — used by Task 6's `content/work/bonheur.md`.
- Produces: `.Index` (1-based int) passed into `project-card.html`'s dict when called from the Work list page — the homepage teaser passes no `Index`, so the badge is simply omitted there via `{{ with .Index }}`.

- [ ] **Step 1: Override `layouts/partials/home/projects.html`**

```bash
cat themes/hugo-minimal-black/layouts/partials/home/projects.html
```

Create `layouts/partials/home/projects.html`, identical except `"Section" "projects"` becomes `"Section" "work"`:

```html
{{- $home := .Site.Params.home -}}
{{ if ne $home.showFeaturedProjects false }}
  <div class="space-y-3 animate-fade-up">
    <div class="space-y-1">
      <h2 class="heading-section">
        {{ default "Selected work" $home.projectsTitle }}
      </h2>
      {{ with $home.projectsSubtitle }}
        <p class="text-xs text-muted">
          {{ . }}
        </p>
      {{ end }}
    </div>

    {{ $limit := cond (gt (int $home.featuredProjectsLimit) 0) (int $home.featuredProjectsLimit) 3 }}
    {{ $allProjects := where .Site.RegularPages "Section" "work" }}
    {{ $featured := where $allProjects "Params.featured" true }}
    {{ if not (gt (len $featured) 0) }}
      {{ $featured = $allProjects }}
    {{ end }}
    {{ $list := first $limit $featured }}

    <div class="grid gap-4 md:grid-cols-2">
      {{ range $list }}
        {{ partial "components/project-card.html" (dict "Page" . "Root" $) }}
      {{ else }}
        <p class="text-xs text-muted">
          No projects yet. Add some under <code>content/work</code>.
        </p>
      {{ end }}
    </div>

    <div class="mt-3 flex justify-end">
      <a
        href="{{ "/work/" | relURL }}"
        class="btn-primary btn-primary-sm inline-flex items-center gap-2"
      >
        <span>View all work</span>
        <i class="fa-solid fa-arrow-right-long text-[0.8rem]"></i>
      </a>
    </div>
  </div>
{{ end }}
```

- [ ] **Step 2: Override `layouts/partials/components/project-card.html`**

```bash
cat themes/hugo-minimal-black/layouts/partials/components/project-card.html
```

Create `layouts/partials/components/project-card.html`, identical except the title line now prefixes an optional numbered badge:

```html
{{/* props: Page (project page), Index (optional 1-based int) */}}
{{- $p := .Page -}}

{{- $icon := $p.Params.icon | default "fa-solid fa-folder-tree" -}}
{{- $badge := cond ($p.Params.featured) "Featured" "" -}}
{{- $index := .Index -}}

{{- $repo := $p.Params.repo -}}
{{- $repoIcon := $p.Params.repoIcon | default "fa-brands fa-github" -}}
{{- $repoLabel := $p.Params.repoLabel | default "Repo" -}}

{{- $demo := $p.Params.demo -}}
{{- $demoIcon := $p.Params.demoIcon | default "fa-solid fa-play" -}}
{{- $demoLabel := $p.Params.demoLabel | default "Demo" -}}

{{- $website := $p.Params.website -}}
{{- $websiteIcon := $p.Params.websiteIcon | default "fa-solid fa-globe" -}}
{{- $websiteLabel := $p.Params.websiteLabel | default "Website" -}}

<article class="card card-pad card-home card-home--project group">
  <!-- Entire main body is clickable -->
  <a href="{{ $p.RelPermalink }}" class="card-home-body">
    <div class="card-home-header">
      <div class="card-home-icon">
        <i class="{{ $icon }}"></i>
      </div>

      <div class="min-w-0">
        <div class="inline-flex items-center gap-1">
          <h3 class="truncate text-sm font-semibold tracking-tight group-hover:text-accent">
            {{ with $index }}<span class="card-index">{{ printf "%02d" . }}</span>{{ end }}{{ $p.Title }}
          </h3>
          {{ with $badge }}
            <span class="card-badge">{{ . }}</span>
          {{ end }}
        </div>

        {{ with $p.Params.subtitle }}
          <p class="mt-0.5 truncate text-[0.7rem] text-muted">
            {{ . }}
          </p>
        {{ end }}
      </div>
    </div>

    {{ with $p.Params.description }}
      <p class="mt-2 text-xs text-muted">
        {{ . }}
      </p>
    {{ end }}

    {{ with $p.Params.tags }}
      <div class="mt-3 card-tag-row">
        {{ range . }}
          <span class="card-tag-pill">{{ . }}</span>
        {{ end }}
      </div>
    {{ end }}
  </a>

  <!-- Footer buttons: repo, demo, website -->
  <div class="card-home-footer card-home-footer--buttons">
    <div class="flex items-center gap-2">

      {{ with $repo }}
        <a href="{{ . }}" class="card-cta-btn" target="_blank" rel="noopener noreferrer">
          <i class="{{ $repoIcon }} text-[0.75rem]"></i>
          <span>{{ $repoLabel }}</span>
        </a>
      {{ end }}

      {{ with $demo }}
        <a href="{{ . }}" class="card-cta-btn" target="_blank" rel="noopener noreferrer">
          <i class="{{ $demoIcon }} text-[0.75rem]"></i>
          <span>{{ $demoLabel }}</span>
        </a>
      {{ end }}

      {{ with $website }}
        <a href="{{ . }}" class="card-cta-btn" target="_blank" rel="noopener noreferrer">
          <i class="{{ $websiteIcon }} text-[0.75rem]"></i>
          <span>{{ $websiteLabel }}</span>
        </a>
      {{ end }}

    </div>
  </div>
</article>
```

Note: this changes the card's tag source from `Params.stack` to `Params.tags`, matching the front-matter field name Task 6 uses (spec §3 calls them "skill/domain chips" — `tags` is the more natural Hugo-idiomatic name and doubles as taxonomy input).

- [ ] **Step 3: Create `layouts/work/list.html`**

```html
{{ define "main" }}
  <section class="layout-page">
    <div class="page-int section-stack">
      <header class="space-y-2">
        <h1 class="heading-page text-2xl sm:text-3xl">{{ .Title }}</h1>
        {{ with .Site.Params.projectsIntro }}
          <p class="max-w-xl text-sm text-muted">{{ . }}</p>
        {{ end }}
      </header>

      <div class="grid gap-4 md:grid-cols-2">
        {{ range $i, $page := .Pages.ByDate.Reverse }}
          {{ partial "components/project-card.html" (dict "Page" $page "Root" $ "Index" (add $i 1)) }}
        {{ end }}
      </div>
    </div>
  </section>
{{ end }}
```

- [ ] **Step 4: Create `layouts/work/single.html`**

```html
{{ define "main" }}
  <section class="layout-page section-stack">
    <article class="article-layout">
      <div class="article-main space-y-6">
        <header class="space-y-3">
          {{ with .Params.subtitle }}
            <p class="eyebrow text-accent">{{ . }}</p>
          {{ end }}
          <h1 class="heading-page text-2xl sm:text-3xl">{{ .Title }}</h1>
          {{ with .Params.description }}
            <p class="max-w-2xl text-sm text-muted">{{ . }}</p>
          {{ end }}

          <div class="flex flex-wrap gap-x-6 gap-y-1 text-[0.75rem] text-muted">
            {{ with .Params.role }}<span><strong class="text-text">Role</strong> — {{ . }}</span>{{ end }}
            {{ with .Params.timeline }}<span><strong class="text-text">Timeline</strong> — {{ . }}</span>{{ end }}
            {{ with .Params.team }}<span><strong class="text-text">Team</strong> — {{ . }}</span>{{ end }}
          </div>

          {{ with .Params.tags }}
            <div class="card-tag-row">
              {{ range . }}<span class="card-tag-pill">{{ . }}</span>{{ end }}
            </div>
          {{ end }}
        </header>

        <div class="card card-pad">
          <div class="markdown-body">
            {{ .Content }}
          </div>
        </div>
      </div>
    </article>
  </section>
{{ end }}
```

- [ ] **Step 5: Build and verify (template-only; content lands in Task 6)**

```bash
./bin/hugo --minify -d /tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop/085a7853-dfd4-40af-ab63-eb149445f4b8/scratchpad/hugo-build 2>&1 | tail -20
grep -o 'No projects yet' /tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop/085a7853-dfd4-40af-ab63-eb149445f4b8/scratchpad/hugo-build/work/index.html
```

Expected: build succeeds; the Work list page renders with the "no projects yet" empty state (`content/work` has no case-study pages until Task 6).

- [ ] **Step 6: Commit**

```bash
git add layouts/partials/home/projects.html layouts/partials/components/project-card.html layouts/work/
git commit -m "Add Work list and case-study templates with numbered index badges"
```

---

### Task 6: Bonheur case study content

**Files:**
- Create: `content/work/bonheur.md`

**Interfaces:**
- Consumes: front-matter schema and `layouts/work/single.html` from Task 5.

This is the one real, fully-populated case study for this phase — chosen because it's a real, currently-in-progress project (`Desktop/bonheur/`, an Expo/React Native app) with enough documented material to write honestly about, unlike the still-unnamed spatial/workplace projects (spec §7, open item #1) or the placeholder "Parent Community Platform" (no material exists yet for either — adding them now would mean fabricating content, which is out of scope for this phase).

- [ ] **Step 1: Create `content/work/bonheur.md`**

```markdown
+++
title = "Bonheur"
subtitle = "A personal emotional memory cabinet"
description = "A calm, guilt-free way to keep small parenting moments — no streaks, no feed, no social pressure."
date = 2026-06-06
role = "Solo product designer & builder"
timeline = "Ongoing since June 2026"
team = "Solo (design, interaction, and build)"
tags = ["Product Design", "Systems Thinking", "Interaction Design", "React Native"]
featured = true
icon = "fa-solid fa-box-archive"
+++

## The Opportunity

Most journaling and memory-keeping apps ask for more than most parents have time to give: daily entries, tags, streaks. I wanted to capture the small, in-between moments of raising a child — a doodle, a photo, a two-line note — without turning memory-keeping into another task to keep up with.

## Context

Solo project, ongoing since June 2026. I'm the designer, interaction author, and builder, working in Expo/React Native. No team, no deadline — built in the open, iterated in short design cycles as the interaction model itself changed.

## Understanding

Early versions treated each day as a flat list of entries — functional, but it read like a to-do app wearing a memory-keeping costume. The insight that unlocked the rest of the project: memories aren't ordered, they're kept. A drawer that's empty on a hard day shouldn't look like a missed streak — it should look like a drawer that's just empty, and that has to be fine.

## Design Thinking

That reframing produced the core metaphor the app is built on: a month is a cabinet, a day is a drawer, and a memory — a photo, a video, a sticker, a note, a doodle — is an object placed inside it. Objects aren't listed, they're scattered and layered, like things actually left in a drawer. Capture had to stay to one or two taps, because the moment a memory-keeping tool asks for more attention than the moment itself, people stop using it. A later revision replaced an auto-scattered layout with a free-form sandbox canvas — drag, resize, and stack objects by hand — because a fixed layout, however organic-looking, was still telling the user where their own memory should sit.

## Solution

The shipped interaction model: a month view of drawers (cabinet), each opening into a free-form canvas (drawer) where photos, videos, stickers, notes, and sketches can be dropped, dragged, resized, and layered by hand. Photos can be turned into polaroids or die-cut stickers non-destructively. Everything is deliberately calm — soft cream and wood tones, no counters, no streaks, no social feed.

## Outcome

Bonheur isn't published yet, so there's no usage data to point to — the outcome, for now, is the discipline the constraint imposed on the design: every feature had to earn its place against "does this add guilt or friction to keeping a memory." Several early ideas (auto-generated monthly recaps, reminder notifications, sharing) were cut for exactly that reason. That restraint is the part of this project most relevant to how I'd approach product work generally.
```

- [ ] **Step 2: Build and verify**

```bash
./bin/hugo --minify -d /tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop/085a7853-dfd4-40af-ab63-eb149445f4b8/scratchpad/hugo-build 2>&1 | tail -20
grep -o 'card-index">01' /tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop/085a7853-dfd4-40af-ab63-eb149445f4b8/scratchpad/hugo-build/work/index.html
grep -o 'Bonheur' /tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop/085a7853-dfd4-40af-ab63-eb149445f4b8/scratchpad/hugo-build/work/bonheur/index.html
grep -o 'The Opportunity' /tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop/085a7853-dfd4-40af-ab63-eb149445f4b8/scratchpad/hugo-build/work/bonheur/index.html
grep -o 'Bonheur' /tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop/085a7853-dfd4-40af-ab63-eb149445f4b8/scratchpad/hugo-build/index.html
```

Expected: build succeeds; the Work list page shows the `01` badge on Bonheur's card; the case-study page renders with its title and "The Opportunity" heading; Bonheur also appears on the homepage teaser (it's the only `work` page, so it's featured by default).

- [ ] **Step 3: Commit**

```bash
git add content/work/bonheur.md
git commit -m "Add Bonheur case study as the first populated Work entry"
```

---

### Task 7: Experiments page

**Files:**
- Create: `content/experiments/_index.md`
- Create: `layouts/experiments/list.html`

**Interfaces:**
- Consumes: `.Params.intro` (string) and `.Params.categories` (list of `{name, caption}`) from front matter.

- [ ] **Step 1: Create `content/experiments/_index.md`**

```markdown
+++
title = "Experiments"
intro = "Sketchbook material, not case studies — things I make because I'm curious, not because they're finished."

[[categories]]
  name = "Illustration"
  caption = "Personal visual storytelling, kept alive alongside everything else."

[[categories]]
  name = "Workshop"
  caption = "Art workshops I've designed and facilitated, iterated on real participant feedback."

[[categories]]
  name = "AI Experiments"
  caption = "Small prototypes exploring how generative tools change design and building workflows."

[[categories]]
  name = "Automation"
  caption = "Scripts and small tools that remove repetitive steps from my own process."

[[categories]]
  name = "Physical Prototypes"
  caption = "Material and manufacturing explorations carried over from precast and spatial work."

[[categories]]
  name = "Sketchbook"
  caption = "Loose sketches and drafts that never became anything else — and don't need to."
+++
```

- [ ] **Step 2: Create `layouts/experiments/list.html`**

```html
{{ define "main" }}
  <section class="layout-page">
    <div class="page-int section-stack">
      <header class="space-y-2">
        <h1 class="heading-page text-2xl sm:text-3xl">{{ .Title }}</h1>
        {{ with .Params.intro }}
          <p class="max-w-xl text-sm text-muted">{{ . }}</p>
        {{ end }}
      </header>

      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {{ range .Params.categories }}
          <div class="card card-pad card-hover">
            <h3 class="heading-section">{{ .name }}</h3>
            <p class="mt-2 text-xs text-muted">{{ .caption }}</p>
          </div>
        {{ end }}
      </div>
    </div>
  </section>
{{ end }}
```

- [ ] **Step 3: Build and verify**

```bash
./bin/hugo --minify -d /tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop/085a7853-dfd4-40af-ab63-eb149445f4b8/scratchpad/hugo-build 2>&1 | tail -20
grep -o 'Illustration\|Workshop\|AI Experiments\|Automation\|Physical Prototypes\|Sketchbook' /tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop/085a7853-dfd4-40af-ab63-eb149445f4b8/scratchpad/hugo-build/experiments/index.html
```

Expected: build succeeds; all six category names appear in the generated page.

- [ ] **Step 4: Commit**

```bash
git add content/experiments/ layouts/experiments/
git commit -m "Add Experiments page with six lightweight categories"
```

---

### Task 8: About page rebuild + Capability Map component

**Files:**
- Create: `content/about/_index.md`
- Create: `layouts/_default/about.html` (project-level override — replaces the theme's timeline-based version)
- Create: `layouts/partials/capability-map.html`
- Create: `static/css/capability-map.css`
- Create: `static/js/capability-map.js`

**Interfaces:**
- Produces: `id="capability-map"` and `id="resume"` anchors, which the homepage Perspective link (Task 4) and the `Resume` nav item (Task 2) point to.
- Consumes: `--color-walnut`, `--color-denim`, `--color-lavender`, `--font-serif`, `--font-sans`, `--color-text-muted`, `--color-accent` from Task 3's `overrides.css`.

- [ ] **Step 1: Rewrite `content/about/_index.md`**

Real bio content, drawn directly from the approved spec's "core story" (spec §1) — not fabricated job history.

```markdown
+++
title = "About"
subtitle = "Engineering × Spatial Design × Systems × AI"
+++

## Who I Am

I've worked across more disciplines than fit neatly on one resume line: sustainable engineering, manufacturing and product communication, spatial and interior design, illustration, and community-building. I used to think of these as separate chapters. They're not — they're branches off the same root system.

Design engineering is where they meet: the place that rewards systems thinking, care for how people actually experience a space or a product, and curiosity about how new tools change the work. It's not a pivot away from anything above. It's what all of it was pointing toward.

## How I Think

I started in sustainable urban design and engineering, which is where the systems-thinking habit came from — every design decision has downstream consequences, and the constraints are usually the interesting part, not the obstacle. That habit followed me into manufacturing (understanding how a precast panel actually gets made changes how you design around it), into spatial design (coordinating international stakeholders and construction teams means a plan is only as good as its weakest handoff), and into community work (a workshop only works if you iterate on what participants actually tell you, not what you hoped they'd say).

I bring the same process regardless of medium: understand the real constraint, make the trade-offs explicit, build the smallest thing that tests the idea, and let feedback change the plan.

## Current Interests

Right now I'm spending most of my curiosity on AI and automation — not as a new direction, but as a new tool for the same instincts. Parametric thinking, workflow automation, and generative tools are a graft onto roots that were already there, not a different tree.
```

- [ ] **Step 2: Create `layouts/partials/capability-map.html`**

```html
<link rel="stylesheet" href="{{ "css/capability-map.css" | relURL }}">

<div class="capability-map" role="img" aria-label="Interactive diagram of Amber's disciplines as a tree: roots in engineering, branches in materials, spatial design, illustration, and community, converging in a canopy of design engineering, with a graft of automation and AI joining the trunk lower down.">
  <svg class="capability-map__tree" viewBox="0 0 640 420" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
    <!-- roots -->
    <path d="M300,390 C280,400 265,408 248,414" class="cm-root" />
    <path d="M300,390 C300,402 300,410 300,417" class="cm-root" />
    <path d="M300,390 C318,400 333,408 350,414" class="cm-root" />

    <!-- trunk -->
    <path d="M292,390 C294,320 296,220 299,150 L303,150 C306,220 308,320 310,390 Z" class="cm-trunk" />

    <!-- canopy -->
    <path d="M255,140 C232,112 258,80 293,90 C316,68 358,90 347,120 C373,130 362,166 332,171 C337,197 300,208 283,187 C259,203 228,187 239,161 C218,153 224,129 255,140 Z" class="cm-canopy" />

    <!-- branch connectors (always dusty denim, per spec) -->
    <path d="M238,118 C195,110 165,100 143,95" class="cm-connector" data-node="materials" />
    <path d="M253,88 C230,60 210,42 192,30" class="cm-connector" data-node="spatial" />
    <path d="M345,92 C368,68 390,48 411,35" class="cm-connector" data-node="illustration" />
    <path d="M362,122 C400,113 432,105 461,100" class="cm-connector" data-node="community" />

    <!-- root connector -->
    <path d="M296,388 C275,395 258,400 246,405" class="cm-connector" data-node="engineering" />

    <!-- graft connector — joins the trunk lower down, not the canopy -->
    <path d="M307,262 C345,270 385,280 420,290" class="cm-connector cm-connector--graft" data-node="automation" />

    <!-- canopy convergence label (always visible, not a hover node) -->
    <text x="300" y="52" class="cm-canopy-label" text-anchor="middle">Design Engineering</text>
  </svg>

  <div class="cm-node cm-node--left" style="top: 96.4%; left: 38.4%;" tabindex="0" data-node="engineering">
    <span class="cm-dot"></span>
    <span class="cm-node-text">
      <span class="cm-node-label">Engineering</span>
      <span class="cm-node-caption">roots — technical reasoning, sustainable urban design</span>
    </span>
  </div>

  <div class="cm-node cm-node--left" style="top: 22.6%; left: 22.3%;" tabindex="0" data-node="materials">
    <span class="cm-dot"></span>
    <span class="cm-node-text">
      <span class="cm-node-label">Materials</span>
      <span class="cm-node-caption">manufacturing &amp; commercial awareness</span>
    </span>
  </div>

  <div class="cm-node cm-node--left" style="top: 7.1%; left: 30%;" tabindex="0" data-node="spatial">
    <span class="cm-dot"></span>
    <span class="cm-node-text">
      <span class="cm-node-label">Spatial Design</span>
      <span class="cm-node-caption">complexity, coordination, construction</span>
    </span>
  </div>

  <div class="cm-node cm-node--right" style="top: 8.3%; left: 64.2%;" tabindex="0" data-node="illustration">
    <span class="cm-dot"></span>
    <span class="cm-node-text">
      <span class="cm-node-label">Illustration</span>
      <span class="cm-node-caption">visual storytelling, personal IP</span>
    </span>
  </div>

  <div class="cm-node cm-node--right" style="top: 23.8%; left: 72%;" tabindex="0" data-node="community">
    <span class="cm-dot"></span>
    <span class="cm-node-text">
      <span class="cm-node-label">Community</span>
      <span class="cm-node-caption">facilitation, iteration on real feedback</span>
    </span>
  </div>

  <div class="cm-node cm-node--right cm-node--graft" style="top: 69%; left: 65.6%;" tabindex="0" data-node="automation">
    <span class="cm-dot"></span>
    <span class="cm-node-text">
      <span class="cm-node-label">Automation</span>
      <span class="cm-node-caption">a new graft, same roots</span>
    </span>
  </div>
</div>

<script src="{{ "js/capability-map.js" | relURL }}" defer></script>
```

- [ ] **Step 3: Create `static/css/capability-map.css`**

```css
.capability-map {
  position: relative;
  width: 100%;
  max-width: 640px;
  margin-inline: auto;
  aspect-ratio: 640 / 420;
  font-family: var(--font-sans, Helvetica, Arial, sans-serif);
}

.capability-map__tree {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.cm-trunk {
  fill: var(--color-walnut, #8D5F48);
}

.cm-canopy {
  fill: var(--color-text, #433531);
}

.cm-root {
  fill: none;
  stroke: var(--color-walnut, #8D5F48);
  stroke-width: 1.6;
  stroke-linecap: round;
  opacity: 0.85;
}

.cm-connector {
  fill: none;
  stroke: var(--color-denim, #495A78);
  stroke-width: 1.4;
  opacity: 0.55;
  transition: opacity 0.3s ease;
}

.cm-connector--graft {
  stroke-dasharray: 3 3;
}

.cm-canopy-label {
  font-family: var(--font-serif, Georgia, serif);
  font-size: 13px;
  fill: var(--color-text, #433531);
  letter-spacing: 0.04em;
}

.cm-node {
  position: absolute;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  cursor: pointer;
  transform: translate(-50%, -50%);
  outline: none;
}

.cm-node--right {
  flex-direction: row;
}

.cm-node--left {
  flex-direction: row-reverse;
}

.cm-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--color-text-muted, #A19AA6);
  transition: transform 0.35s ease, background-color 0.35s ease;
  flex-shrink: 0;
}

.cm-node-text {
  display: flex;
  flex-direction: column;
  line-height: 1.3;
  white-space: nowrap;
  opacity: 0;
  transform: translateX(6px);
  transition: opacity 0.35s ease, transform 0.35s ease;
}

.cm-node--left .cm-node-text {
  transform: translateX(-6px);
  text-align: right;
}

.cm-node-label {
  font-family: var(--font-serif, Georgia, serif);
  font-size: 0.8rem;
  color: var(--color-text, #433531);
}

.cm-node-caption {
  font-size: 0.65rem;
  color: var(--color-lavender, #D9D1EA);
  margin-top: 0.1rem;
}

.cm-node:hover .cm-dot,
.cm-node:focus .cm-dot,
.cm-node.is-active .cm-dot {
  background: var(--color-accent, #B0C375);
  transform: scale(1.7);
}

.cm-node:hover .cm-node-text,
.cm-node:focus .cm-node-text,
.cm-node.is-active .cm-node-text {
  opacity: 1;
  transform: translateX(0);
}

@media (max-width: 640px) {
  .cm-node-caption {
    display: none;
  }
}
```

- [ ] **Step 4: Create `static/js/capability-map.js`**

```js
(function () {
  var root = document.querySelector('.capability-map');
  if (!root) return;

  var svg = root.querySelector('.capability-map__tree');
  var nodes = root.querySelectorAll('.cm-node');

  nodes.forEach(function (node) {
    var key = node.getAttribute('data-node');
    var connector = svg ? svg.querySelector('.cm-connector[data-node="' + key + '"]') : null;

    function activate() {
      node.classList.add('is-active');
      if (connector) connector.style.opacity = '0.9';
    }

    function deactivate() {
      node.classList.remove('is-active');
      if (connector) connector.style.opacity = '';
    }

    node.addEventListener('mouseenter', activate);
    node.addEventListener('mouseleave', deactivate);
    node.addEventListener('focus', activate);
    node.addEventListener('blur', deactivate);
  });
})();
```

- [ ] **Step 5: Create `layouts/_default/about.html`**

```bash
cat themes/hugo-minimal-black/layouts/_default/about.html
```

Replace it (project-level override) — this drops the theme's `<hr>`-splitting timeline logic entirely (spec explicitly rejects timeline UI) in favor of explicit sections:

```html
{{ define "main" }}
  <section class="layout-page">
    <article class="about-page">
      <header class="about-hero">
        <div class="about-hero-content">
          <h1 class="about-title">{{ .Title }}</h1>
          {{ with .Params.subtitle }}
            <p class="about-subtitle">{{ . }}</p>
          {{ end }}
        </div>
      </header>

      <div class="about-content">
        <div class="card card-pad markdown-body">
          {{ .Content }}
        </div>
      </div>

      <div class="about-content" id="capability-map">
        <div class="card card-pad">
          <h2 class="heading-section mb-4">Capability Map</h2>
          {{ partial "capability-map.html" . }}
        </div>
      </div>

      <div class="about-content" id="resume">
        <div class="card card-pad markdown-body">
          <h2>Resume</h2>
          <p>I don't have one canonical public resume posted here yet — I tailor mine per role. Reach out below and I'll send the right version.</p>
        </div>
      </div>

      {{ with .Site.Params.social }}
        <div class="about-social" id="contact">
          <h3 class="about-social-title">Contact</h3>
          <div class="about-social-links">
            {{ range . }}
              <a
                href="{{ .url }}"
                class="about-social-link"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="{{ .label }}"
              >
                <i class="{{ .icon }}"></i>
                <span>{{ .label }}</span>
              </a>
            {{ end }}
          </div>
        </div>
      {{ end }}
    </article>
  </section>
{{ end }}
```

- [ ] **Step 6: Build and verify**

```bash
./bin/hugo --minify -d /tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop/085a7853-dfd4-40af-ab63-eb149445f4b8/scratchpad/hugo-build 2>&1 | tail -20
grep -o 'id="capability-map"' /tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop/085a7853-dfd4-40af-ab63-eb149445f4b8/scratchpad/hugo-build/about/index.html
grep -o 'id="resume"' /tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop/085a7853-dfd4-40af-ab63-eb149445f4b8/scratchpad/hugo-build/about/index.html
grep -o 'id="contact"' /tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop/085a7853-dfd4-40af-ab63-eb149445f4b8/scratchpad/hugo-build/about/index.html
grep -o 'Design Engineering' /tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop/085a7853-dfd4-40af-ab63-eb149445f4b8/scratchpad/hugo-build/about/index.html
grep -o 'cm-node' /tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop/085a7853-dfd4-40af-ab63-eb149445f4b8/scratchpad/hugo-build/about/index.html | wc -l
grep -c 'timeline' /tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop/085a7853-dfd4-40af-ab63-eb149445f4b8/scratchpad/hugo-build/about/index.html
ls /tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop/085a7853-dfd4-40af-ab63-eb149445f4b8/scratchpad/hugo-build/css/capability-map.css /tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop/085a7853-dfd4-40af-ab63-eb149445f4b8/scratchpad/hugo-build/js/capability-map.js
```

Expected: build succeeds; the three `id=` anchors are present; the canopy label text appears; `cm-node` appears at least 6 times (one per interactive node); the `timeline` grep count is `0` (confirms the rejected timeline UI is gone); both the CSS and JS files exist in the build output.

- [ ] **Step 7: Commit**

```bash
git add content/about/_index.md layouts/_default/about.html layouts/partials/capability-map.html static/css/capability-map.css static/js/capability-map.js
git commit -m "Rebuild About page with real bio content and interactive Capability Map"
```

---

### Task 9: Full-site verification pass

**Files:** none (verification only)

- [ ] **Step 1: Clean build**

```bash
rm -rf /tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop/085a7853-dfd4-40af-ab63-eb149445f4b8/scratchpad/hugo-build
cd "/mnt/c/Users/SirenDesign/Desktop/Portfolio"
./bin/hugo --minify -d /tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop/085a7853-dfd4-40af-ab63-eb149445f4b8/scratchpad/hugo-build 2>&1 | tail -30
```

Expected: build succeeds with zero `ERROR` lines.

- [ ] **Step 2: Confirm every IA page exists exactly once and nothing extra leaked through**

```bash
BUILD=/tmp/claude-1000/-mnt-c-Users-SirenDesign-Desktop/085a7853-dfd4-40af-ab63-eb149445f4b8/scratchpad/hugo-build
test -f "$BUILD/index.html" && echo "home: ok"
test -f "$BUILD/work/index.html" && echo "work list: ok"
test -f "$BUILD/work/bonheur/index.html" && echo "work/bonheur: ok"
test -f "$BUILD/experiments/index.html" && echo "experiments: ok"
test -f "$BUILD/about/index.html" && echo "about: ok"
test ! -d "$BUILD/blog" && echo "blog removed: ok"
test ! -d "$BUILD/about-alternative" && echo "about-alternative removed: ok"
test ! -f "$BUILD/work/coming-soon/index.html" && echo "coming-soon removed: ok"
test ! -f "$BUILD/work/nexus-analytics/index.html" && echo "nexus-analytics removed: ok"
test ! -f "$BUILD/work/sentinel-design-system/index.html" && echo "sentinel-design-system removed: ok"
```

Expected: all ten lines print their `ok` message.

- [ ] **Step 3: Confirm the nav is exactly the five approved items, in order, on every page**

```bash
for p in index.html work/index.html experiments/index.html about/index.html; do
  echo "== $p =="
  grep -o '>Work<\|>Experiments<\|>About<\|>Resume<\|>LinkedIn<' "$BUILD/$p" | tr '\n' ' '
  echo
done
```

Expected: each page prints `>Work< >Experiments< >About< >Resume< >LinkedIn< >Work< >Experiments< >About< >Resume< >LinkedIn< ` (desktop nav + mobile nav, same order, no extra items like "Blog" or "About Alt").

- [ ] **Step 4: Confirm the palette shipped and no theme-default purple accent (`#a855f7`) leaked into the active stylesheet**

```bash
grep -o '#B0C375\|#8D5F48\|#433531\|#A19AA6\|#495A78\|#D9D1EA' "$BUILD/css/overrides.css" | sort -u
grep -c '#a855f7' "$BUILD/css/overrides.css"
```

Expected: first command lists all six hex values; second command prints `0`.

- [ ] **Step 5: Fix anything that fails, then re-run Steps 1–4 until everything passes.**

- [ ] **Step 6: Manual spot-check in a browser (not automatable — do this before considering the phase done)**

```bash
cd "/mnt/c/Users/SirenDesign/Desktop/Portfolio"
./bin/hugo server -D
```

Open `http://localhost:1313/Portfolio/` and confirm by eye:
- Homepage shows Hero → Selected Work (Bonheur) → Perspective line → Footer, in that order, with no "now"/quick-facts block and no tech marquee.
- `/work/` shows Bonheur with a `01` badge; opening it shows all 8 case-study sections.
- `/experiments/` shows all 6 categories in a grid.
- `/about/` shows Who I Am / How I Think / Current Interests / Capability Map / Resume / Contact, with **no** timeline UI.
- Hovering (and tab-focusing) each Capability Map node scales its dot, turns it Chartreuse, and reveals its label + caption; the connecting lines are Dusty Denim at all times, never Chartreuse.
- The homepage "How the pieces connect →" link scrolls to the Capability Map on About.
- The nav's "Resume" link scrolls to the About page's Resume section; "LinkedIn" opens in a new tab.

Stop the dev server (Ctrl+C) when done.

- [ ] **Step 7: No commit for this task** (verification only — if Step 5 required fixes, those fixes should already be committed as part of whichever task's files they touched).

---

## What this plan intentionally does not cover

Per spec §7 and the user's explicit "structure & system first" choice:
- Real content for additional Work case studies (spatial/workplace projects, Parent Community Platform) — no material exists yet to write honestly about them.
- Locking the background cream color or typefaces beyond the spec's current placeholders (spec calls both "adjustable during implementation, not a blocking decision").
- Replacing the Capability Map's placeholder SVG shapes with Amber's real hand-illustrated artwork (spec §7, item #6).
- Filling in the real LinkedIn URL, contact email, and a real resume PDF — `hugo.toml` and the About page currently reference these honestly rather than inventing them; replacing the two `REPLACE-WITH-...` placeholders in `hugo.toml` before publishing is the only pre-launch step this plan defers to the user.
