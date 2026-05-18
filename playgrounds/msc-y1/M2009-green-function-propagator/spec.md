---
title: "Green's Function: Building a Solution from Tent Responses"
slug: green-function-propagator
status: verified
audience: portfolio
created: 2026-05-18
primary_uc: M2009
supporting_ucs: []
curriculum_year: msc-y1
primary_citation: arfken-weber
hook: 'Solve -u'''' = f the smart way: first solve it for a single spike, which gives a tent-shaped Green''s function that is zero at both walls with a kink where the spike sits. Any source is a pile of spikes, so the answer is the same pile of tents, each scaled by the source strength: u(x) = integral G(x, x'') f(x'') dx''.'
one_paragraph: 'A Green''s-function playground for the 1D problem -u'''' = f on [0, 1] with the ends pinned at zero. The response to a single point spike is the tent G(x, x''): zero at both walls, peaked at the spike, with a unit downward kink there. Because the equation is linear, the response to any source is the superposition of tents weighted by the source value, u = integral G f. Panel A shows the source and the solution it produces (each on its own scale, since the solution is usually far smaller); Panel B is the draggable tent and the faint stack of weighted tents that build u; Panel C shows that the recovered u really does satisfy -u'''' = f and lists the defining facts. The direct tridiagonal solve (the shared cn-tridiag engine) is the reference. Deterministic and gate-tested; the invariants check G symmetry, the boundary values, the unit slope jump, the ODE residual, agreement with the direct solve and the analytic sine, and linearity.'
tags: [math-methods, greens-function, bvp, superposition, live-readout]
difficulty: 4
tier: standard
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 4
share_state_keys: [src, p, xp]
---

# Green's Function: Building a Solution from Tent Responses

## Physical setup

The boundary-value problem -u'' = f on [0, L] with u(0) = u(L) = 0. The Green's function G(x, x') is the solution when the source is a single unit spike at x'. It is the tent that is zero at both walls and has a kink at x'. Because the operator is linear, the solution for any source is the superposition of these tents weighted by the source value at each point, u(x) = integral G(x, x') f(x') dx'.

## Governing equations

G(x, x') = x (L - x') / L for x <= x', and x' (L - x) / L for x >= x'. It is symmetric, vanishes at x = 0 and x = L, peaks at G(x', x') = x'(L - x')/L, and its x-slope jumps by -1 across x = x' (because -G'' = delta). The solution is u(x) = integral_0^L G(x, x') f(x') dx'. For f = sin(m pi x / L) the exact solution is sin(m pi x / L) / (m pi / L)^2.

## Numerical method

The tent is closed form. The solution is the composite-trapezoid superposition of weighted tents. The reference is a direct tridiagonal solve of -u'' = f via the shared complex Thomas solver (imaginary parts zero). Deterministic; no RNG.

## Controls

- `src`: source profile (sine mode / box pulse / point-like bump / two bumps).
- `p`: a source parameter (mode number, width or position depending on the profile).
- `xp`: the tent source position x'; dragging it pauses the sweep so you can place it.
- Reset, Pause/Play. Pause freezes the x' sweep.

## Expected qualitative features

- The tent is zero at both walls and kinked at x'; dragging x' slides the kink.
- The solution has the boundary values zero and is smoother than the source (the Green operator integrates twice, suppressing high-frequency detail).
- The recovered u satisfies -u'' = f to machine precision; it matches the direct solve.
- A sine source gives a sine solution; two bumps give a smooth single arch.

## Invariants and acceptance thresholds

`invariants.test.mjs` (vitest, offline):

1. G is symmetric to 1e-12.
2. G(0, x') = G(L, x') = 0 exactly; the apex equals x'(L - x')/L.
3. The slope of G jumps by -1 at x = x' and G is continuous there.
4. u = integral G f satisfies -u'' = f (residual < 1e-4) with u(0) = u(L) = 0.
5. The Green solution matches the direct tridiagonal solve (1e-9) and the analytic sine (1e-4).
6. The Green operator is linear; a zero source gives a zero solution.
7. Determinism.

Visual gate: SSIM > 0.92 against committed golden frames at 60 fps.

## Limiting cases for verification

- Source at one point: u is exactly the tent.
- Sine source mode m: u = sin / (m pi / L)^2 (amplitude falls as 1/m^2).
- Zero source: zero solution.
- High-frequency source: strongly smoothed (the operator is a double integral).

## Visual fallback

All panels are static reads; only the tent-position sweep animates and it loops.

## Citations

- Arfken, Weber and Harris, Mathematical Methods for Physicists: Green's functions for the Sturm-Liouville BVP.

## Stretch goals

- Add Neumann and mixed boundary conditions and show how the tent changes.
- Add the time-dependent propagator (heat or Schrodinger kernel).

## Risk register

- A real defect was found and fixed in review: the solution was plotted on the same scale as the much larger source and rendered as a flat invisible line; the panels now use independent per-curve scales with the peak magnitudes labelled, which is the load-bearing pedagogical point.
