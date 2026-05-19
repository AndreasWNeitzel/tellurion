# DEVNOTES - bsc-y3s2/FIS3029-addition-of-angular-momenta (hidden dev ref)

Repo-only.

## Sweep 2026-05-18
Rewrote placeholder hook/one_paragraph as first-exposure-undergrad prose; render-neutral.
invariants  + visual 5/5 x3. Shipped.

## Sweep 2026-05-19
REVIEW (CODE FIX + RECAPTURE) partly stale: physics (Clebsch-Gordan allowedJ/multiplicity/sum-rule) correct, invariants real 4/4 pass, sim.js present, hook/one_paragraph already real prose (NOT placeholders; that REVIEW claim was stale), has ## Explainer. GENUINE current defect: bootSync ignored captureFraction so all 5 goldens were byte-identical at j1=j2=1/2. Fixed: added CAPTURE_FRAC read; deterministic capture sweeps (j1,j2) over [[.5,.5],[1,.5],[1,1],[1.5,1],[2,1]] (also syncs the sliders). Recaptured 5 distinct goldens; READ t-000 (1/2x1/2=0+1 dim4) and t-100 (2x1=1+2+3 dim15=3+5+7) physically correct, 60fps. No sim/invariants/text change. leakscan2=0. Shipped.

## Sweep 2026-05-19
REVIEW CODE-FIX partly stale: Clebsch-Gordan physics, sim.js and 4 invariants already correct, hook/one_paragraph real, has Explainer. Sole genuine defect: bootSync ignored captureFraction so all 5 goldens were identical at j1=j2=1/2. Added CAPTURE_FRAC; deterministic capture sweeps (j1,j2); recaptured 5 distinct verified-correct goldens (1/2x1/2=0+1; 2x1=1+2+3).
invariants Tests  4 passed + visual 5/5 x3. Shipped.

## Rebuild 2026-05-19 (live-review #279)
User: "incomplete, missing some kind of 3D visualization (e.g. spin
represented as a vector within a 3d spherical surface perhaps)." Old
playground.js was a text + dot-row list (no 3D). Rebuilt the render as
the semiclassical vector model in hand-rolled 3D:
- sim.js APPENDED (existing exports byte-identical): casimir(j)=j(j+1)
  and cosTheta12(j1,j2,J) = [J(J+1)-j1(j1+1)-j2(j2+1)] /
  (2 sqrt(j1(j1+1) j2(j2+1))), clamped. invariants 4 -> 7: equal
  spins to singlet exactly antiparallel; stretched cos =
  sqrt(j1 j2/((j1+1)(j2+1))); law of cosines reproduces J(J+1) and
  cos monotonic in J. Caught and removed a wrong first-pass test
  ("stretched = exactly parallel"): the quantum angle only -> +-1
  asymptotically, not at finite j.
- 3D: j1,j2 vectors length sqrt(j(j+1)) at the law-of-cosines angle,
  add tip-to-tail to J; J precesses on its cone about lab z, j1/j2
  precess about J; faint z-axis + equator ring; auto-cycles the shown
  total J; decomposition + dim-count demoted to a diagnostic panel.
- Degenerate extreme handled: J=0 singlet (LJ=0) was NaN/collapsed
  vectors + piled labels; added an isSinglet branch (full-length
  antiparallel j1/j2 through a J=0 origin dot), guarded beta/Jhat.
- Polish: scale up (188/(L1+L2+.55)), j2 label at the drawn-arrow
  midpoint not proj(j2v), panel last line shortened (was clipped).
- Capture sweeps the 5 (j1,j2) pairs; frozen psi/Psi -> deterministic.
Gate: 7 invariants + smoke + visual 5/5 x3 PASS. Shipped.
