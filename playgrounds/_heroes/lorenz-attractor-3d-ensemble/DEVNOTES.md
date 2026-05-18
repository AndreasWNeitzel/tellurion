# DEVNOTES - lorenz-attractor-3d-ensemble (hidden dev reference)

Repo-only. NOT linked from index.html, NOT in the gallery, never shown
to site users. Exhaustive debugging/maintenance reference.

## What it is
WebGL2 hero. N=4096 Lorenz trajectories, CPU RK4 (fixed sigma=10,
rho=28, beta=8/3), positions splatted by engine-gl/lorenz-ensemble.js
into an HDR additive density accumulator (viridis, ACES, vignette).
28-layer world-space trail re-projected each frame so rotation does
not smear. Slow camera self-rotation (7 deg/s) when not dragging.

## Engine reuse (hard rule 6)
- CPU truth: shared/js/engine/lorenz-cpu.js (initEnsemble, rk4Step,
  centroid, diameter). sigma/rho/beta are MODULE CONSTANTS; rk4Step
  takes only (state, dt), no parameter knobs. Sole consumer is this
  playground (grep confirmed), so the fixed-parameter design is
  localised.
- Local sim.js mirrors the math with an rk4(state,dt,sigma,rho,beta)
  signature for the vitest invariants only; it is NOT what the live
  page runs (the page imports the shared rk4Step). Keep them in sync.
- GL engine: engine-gl/lorenz-ensemble.js does upload + splat +
  compose only. It does NOT integrate. The earlier "RK4 in a fragment
  shader" claim was false; integration is entirely CPU.

## Numerical method
Classical RK4, dt=0.005 live (0.01 in the capture warmup). Capture
warms ~2000+ steps onto the attractor, fills the 28-step trail ring,
renders one deterministic frame; DETERMINISTIC fires simulation-ready
after 2 rAF. Volume contracts at -(sigma+1+beta) ~ -13.67, attractor
has zero volume.

## Invariants (invariants.test.mjs) and rationale
1. seeded centroid within 0.01 of (1,1,1): the 1e-3 ball.
2. centroid z in (15,30) after 4000 steps: attractor mean z ~ rho-1.
3. spread grows over 500 steps: exponential divergence (chaos).
Plus in-page __cpuVsGpu (diameter band 20..80) and __physicsCheck
(saturation diameter 30..100 by t=20). All physics analytic/CPU; the
GPU only renders, so it cannot affect the physics claims.

## Post-build sweep record (2026-05-18)
- Opus visual-reviewer (multimodal, 5 golden frames + rubric):
  6/6 PASS. Two-lobed butterfly sharp and recognizable in every
  frame, viridis density structure legible (3D thin sheet, not mush),
  camera rotation progressive across t-000..t-100, no escape/clip/NaN,
  readout legible and non-overlapping, aesthetic coherent. No render
  defect, so NO shader/playground.js change and NO golden recapture /
  visual-gate rerun (render-neutral, same precedent as the
  earth-precession sweep).
- Defects found and fixed (all text/metadata, render-neutral):
  * hook="STATUS: needs_hook", one_paragraph="STATUS: needs_paragraph"
    rendered literally on the gallery card; rewrote both approachable.
  * primary_citation was marion-thornton ch 11 (rigid-body, the WRONG
    reference for Lorenz). Corrected to strogatz2015 ch 9 (the bib has
    the Strogatz entry keyed strogatz2015 with chapter_index listing
    9.2 "Simple Properties of the Lorenz Equations"; "strogatz-nonlin"
    in the old caption was a DANGLING key, only this spec used it).
  * Factual errors in desc/caption/body vs the implementation:
    - "10^4" / "1024" trajectories  -> actual N=4096.
    - "integrated RK4 in a fragment shader, rho slider-controlled"
      -> CPU RK4, fixed rho=28, GPU only splats.
    - "one tracked lead particle drawing its recent path"
      -> a 28-layer whole-ensemble world-space trail.
    Rewrote desc/caption/body truthfully and added the standard spec
    sections. index.html description + figcaption rewritten to match.
  * DEVNOTES.md created (this file).
- Index rebuilt for the new card text. Invariants 3/3 still pass.

## HERO-PROMOTION candidate (for the later hero-promotion backlog item)
The single highest-value upgrade is a working rho slider. rho is THE
Lorenz bifurcation parameter (rho<1 origin stable; 1<rho<24.74 two
stable foci; rho>24.74 chaotic butterfly; periodic windows at large
rho). It is deliberately NOT added in this sweep because:
  (a) the sweep mandate is QA + truthful text + DEVNOTES, not feature
      additions; (b) it needs the shared rk4Step signature changed to
      accept rho and threaded through playground.js; (c) it forces new
      goldens + full re-verify and risks the verified state.
When hero-promotion runs: add `rho` (param to a new
rk4Step(state,dt,rho) or a rho-aware variant), wire a slider +
share_state_keys:[rho], recapture goldens at rho=28 (unchanged
default keeps SSIM), add an invariant for the rho<24.74 fixed-point
limiting case, and showcase the bifurcation as the headline
interaction. Also consider per-trajectory hue by lobe and a
depth-true 3D splat for extra visual supremacy.

## Gate commands
- node --check playground.js sim.js
- npx vitest run invariants.test.mjs   (3 tests)
- node scripts/build-index.mjs         (regenerate gallery card)
- visual gate: npx playwright test visual.test.mjs (SSIM>0.92 x3) ONLY
  if the #stage render changes; this sweep was text-only so it was not
  rerun (6/6 visual-reviewer confirmed the existing goldens).
