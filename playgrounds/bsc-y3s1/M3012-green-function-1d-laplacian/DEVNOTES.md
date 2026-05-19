# DEVNOTES - bsc-y3s1/M3012-green-function-1d-laplacian (hidden dev ref)

Repo-only.

## Sweep 2026-05-18
Rewrote placeholder hook/one_paragraph as first-exposure-undergrad prose; render-neutral.
invariants  + visual 5/5 x3. Shipped.

## Sweep 2026-05-18
Rewrote placeholder hook/one_paragraph as first-exposure-undergrad prose; render-neutral.
invariants  + visual 5/5 x3. Shipped.

## Sweep 2026-05-19
REVIEW (CONFIRMED CODE FIX + RECAPTURE) partly stale: Greens-function physics correct (tent peaks at x0, vanishes at Dirichlet boundaries; u = integral G f solves -u`` = f), sim.js + 5 real invariants pass, hook real, has Explainer. The REVIEW`s suggested fn list (const/sine/gauss/delta) was a wrong guess; actual options are const/step/gauss/sin. Sole genuine defect: bootSync ignored captureFraction so all 5 goldens identical at x0=0.5/const. Fixed: added CAPTURE_FRAC; deterministic capture steps through 5 (x0, fn) states (x0 0.20->0.80 with const/step/gauss/sin) and syncs the slider/select. Recaptured 5 distinct goldens; READ t-000 (x0=0.20 tent, f=const, u parabola) and t-050 (x0=0.50 tent, Gaussian f, smooth u) physically correct, 60fps. No sim/invariants/text change. leakscan2=0. Shipped.

## Sweep 2026-05-19
REVIEW CONFIRMED-CODE-FIX partly stale: Greens-function physics, sim.js, 5 invariants, text already correct (REVIEW fn list was a wrong guess). Sole genuine defect: bootSync ignored captureFraction so all 5 goldens identical. Added CAPTURE_FRAC; capture steps 5 (x0,fn) states; recaptured 5 distinct verified-correct goldens (tent peaks at x0, u solves -u''=f, Dirichlet).
invariants Tests  5 passed + visual 5/5 x3. Shipped.

## Hero rehaul 2026-05-19 (mission #286, no-plot-as-main)
Was the banned pattern: two stacked static 2D cartesian curves
(G on top, u/f on bottom). Rebuilt render-only (sim.js + the 5
invariants byte-identical):
- Primary is now the physical object. TOP: a taut string pinned at
  both ends with a draggable unit point load at x0; it sags into
  exactly greenFn(x,x0) (the elementary response) with a force arrow
  + bead; critically-damped relaxation when x0 changes.
- BOTTOM: the distributed load f drawn as a row of downward arrows;
  the string settles into u(x)=solve(f) built by an animated
  superposition sweep (a marker adds pokes left to right, the
  accumulated string converging onto the ghost of full u), making
  the hook "any load = a sum of pokes" literal.
- The analytic u(x)/f(x) curves are demoted to a thin bottom
  diagnostic strip carrying the exact checks (u(0)=u(L)=0,
  u(L/2)|f=1 = 0.1250 = L^2/8).
- Pointer-drag on the canvas sets x0; capture sweeps the 5 (x0,fn)
  states with the sweep completed (5 distinct deterministic frames).
Gate: 5 invariants + smoke + visual 5/5 x3 PASS. Shipped.

## Layout fix 2026-05-19 (user: messy, no intuition, overlap, out of bounds)
The #286 rehaul's auto scales (SC_T=150/0.25, SC_B=150/uMax) sagged
the top string ~150 px into the bottom panel's labels and the bottom
string past the diagnostic strip / off-canvas. Render-only; sim.js +
5 invariants byte-identical:
- Two explicit panels (TOP base 80 / sag<=110 within 50..218; BOT
  base 270 / sag<=110 within 240..408) each ctx.clip()'d to its
  rect; diagnostic strip clipped within 426..486. Scales bounded so
  a string can never leave its panel or collide.
- Removed the redundant faint analytic overlay in the main bottom
  panel (the cyan string IS u); one concise caption per panel; load
  arrow + sweep line confined to their bands.
The intuition reads now: one poke -> tent G; many pokes -> smooth u;
exact u(L/2)=L^2/8=0.125 check. Gate 5 + smoke + 5/5 x3.
