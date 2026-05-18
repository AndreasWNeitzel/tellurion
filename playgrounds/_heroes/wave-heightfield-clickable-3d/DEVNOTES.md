# DEVNOTES - wave-heightfield-clickable-3d (hidden dev reference)

Repo-only. NOT linked from index.html, NOT in the gallery, never shown
to site users. Exhaustive debugging/maintenance reference.

## What it is
WebGL2 hero. Damped 2D wave equation on a 256x256 Dirichlet grid,
click-seeded Gaussian impulses, Blinn-Phong-shaded 3D heightfield.
Engine shared/js/engine-gl/wave-2d.js (sole consumer this
playground); CPU reference shared/js/engine/wave-2d-cpu.js
(re-exported by sim.js, called by the invariant tests). Grid size is
N=256 (playground.js line ~62: `let N = 256;`).

## Physics / numerics
d2u/dt2 = c^2 lap(u) - gamma du/dt, u=0 on edges. Explicit leapfrog,
conditionally stable: Courant c dt/dx <= 1/sqrt(2) in 2D, so the
internal dt tracks the c slider. Energy = sum of (du/dt)^2 +
c^2|grad u|^2. Sliders: c (0.1..0.7), gamma (0..0.1), A (0.1..2.0),
sigma (1..16). Readout: E(t), gamma_abs, clicks, FPS.
share_state_keys [c,gamma,A,sigma] match the four sliders (note:
playground.js does not import share-state; wiring is a hero-promotion
item).

## Post-build sweep record (2026-05-18)
- Opus visual-reviewer on the committed goldens: 6/6 PASS (3D
  heightfield, spreading ring, wall reflection with pinned edges,
  multi-front interference, damping, no blowup, legible readout, all
  five frames distinct). Confirmed independently by my own direct
  full-res inspection (t-025 single ring; t-075 four-corner
  reflected interference). Render-correct, frames vary, NOT stale
  (unlike the black-hole hero), so this was a RENDER-NEUTRAL text
  sweep: no shader/playground change, no recapture, no visual-gate
  rerun (same precedent as the lorenz and tokamak sweeps).
- Defects fixed (text/metadata only):
  * hook="STATUS: needs_hook", one_paragraph="STATUS: needs_paragraph"
    rendered literally on the gallery card; rewrote both approachable.
  * Spec body was badly STALE: claimed a "96x96 grid" (real N=256),
    "Currently rendered in Canvas2D ... full WebGL2 path queued as a
    follow-up", and a "fast first hero while WebGL2 shaders are still
    being authored" Stack-exemption note. ALL FALSE: it is a fully
    working WebGL2 Blinn-Phong heightfield (goldens + reviewer + my
    inspection confirm). Replaced with truthful standard sections.
  * Raw `french-waves` bib key shown in the caption (french-waves IS
    a valid key, CITATIONS.bib line 1004; just not shown raw to users
    now). Dense LaTeX description softened.
  * index.html description + figcaption rewritten approachably.
- Invariants 5/5. Index rebuilt for the new card text.

## HERO-PROMOTION candidates (for the hero-promotion backlog item)
Already strong. Optional upgrades: caustic/specular highlights on
crests; subtle chromatic depth; an on-canvas colour/height legend;
wire share-state (parseUrlState + Share button) so c/gamma/A/sigma
round-trip in the URL.

## Invariants (invariants.test.mjs) and rationale
1. initial energy exactly 0.
2. impulse raises energy > 0.
3. gamma=0: |E1-E0|/E0 < 0.6 over 1000 steps (loose, explicit-scheme
   discretization error, NOT a physical leak).
4. gamma>0: energy decays below the post-impulse value.
5. Dirichlet: edge cells stay near zero.
All on the CPU reference; the GPU only renders.

## Gate commands
- node --check playground.js sim.js
  (engine: node --check ../../../shared/js/engine-gl/wave-2d.js)
- npx vitest run invariants.test.mjs   (5 tests)
- node scripts/build-index.mjs
- visual gate: npx playwright test visual.test.mjs (SSIM>0.92 x3)
  ONLY if the #stage render changes; this sweep was text-only so it
  was not rerun (6/6 visual-reviewer + direct inspection confirmed
  the existing goldens are valid and not stale).
