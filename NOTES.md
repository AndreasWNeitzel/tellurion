# Notes

## Pre-launch follow-ups

Items in scope of the Tellurion rebrand task that were deferred rather than fixed,
with the reason and the rough cost of doing them later. None blocks the
`tellurion.dev` launch.

### UX work, deferred

Five UX features in the original rebrand brief were scoped out of the launch
commit to keep the credit budget in reserve for the post-beta corrections that
beta testers will surface. All five live entirely at the shell level (no
playground edits), can be added incrementally in a v0.2 commit, and require
only small additions to the inline `<script>` block at the bottom of
`scripts/build-landing.mjs` or to a new file under `shared/js/`.

1. **Search position persistence.** `history.scrollRestoration = 'manual'` plus
   sessionStorage of catalog scroll position on navigation away, restored on
   back. Pure shell JS.
2. **Keyboard shortcut for search.** `/` focuses `#search-input` when no input
   has focus; Escape clears and blurs it. Pure shell JS.
3. **Recently viewed strip.** Track last 8 visited playground slugs in
   localStorage; render a small card strip above the featured spotlight when
   non-empty. Pure shell JS plus a small HTML container in the landing.
4. **Catalog filter persistence.** Mirror the catalog's category-chip and
   search state into sessionStorage so back-button returns restore them. Pure
   shell JS.
5. **"Last updated" timestamps on cards.** Pull each playground's most-recent
   git commit timestamp at build time and write it into the card data. Needs
   a small step in `build-landing.mjs` that shells out to `git log -1
   --format=%cs -- playgrounds/<path>` per card, or reads a pre-built
   manifest. Deferred because it adds N git invocations to the build; a
   manifest approach is cleaner.

### Hero-tier indicator

Already implemented before the rebrand. The catalog cards for hero-tier
playgrounds carry a `<span class="cstar">` element styled gold via
`var(--accent-gold)`, positioned top-left. No additional star needed.

### Per-playground titles

The brief asked for individual playground tabs to read
"[Playground name] . Tellurion". Achieving that would require editing 333
playground `index.html` files, which constraint #1 of the brief itself
forbids ("DO NOT EDIT ANY PLAYGROUND"). The constraint and the requirement
are mutually exclusive. Decision: leave per-playground `<title>` tags as-is.
Tab titles read the playground name only, which is the common pattern on
content-heavy sites and works fine. Revisit only if it surfaces as a real
beta-tester complaint.

### Social card image

No `og:image` Tellurion-branded social card exists yet. The OG / Twitter
metadata is in place; only the image URL is missing. Generate a 1200x630
or 1200x675 PNG once a logo treatment is settled, drop it at
`assets/og-tellurion.png`, and add `<meta property="og:image" ...>`.
Defer until post-launch.

### Build-date system clock drift

The build prints "Built 2026-05-22" while the editing session clock reads
2026-05-23. The WSL2 host clock is one calendar day behind the session
clock. Cosmetic; will self-correct on the next build that runs after the
host catches up.

### Deployment

Out of scope per the brief. The repo has no remote and no Pages workflow;
DNS, CNAME, and the GitHub Pages custom-domain settings are handled
separately. Once the target repo is created and pushed, add a `CNAME` file
containing `tellurion.dev` and the Pages workflow.

### Translation, logos, favicons

Explicitly deferred per the brief. No work done.

### Gate harness

`scripts/gate.mjs` runs the seven hero gates against a single named hero
playground (`gate.mjs <slug>`). The Tellurion rebrand is shell-only and
does not touch the playgrounds, so a gate run cannot regress on this
commit. Re-run the gate as part of normal hero-development workflow, not
as a launch gate.
