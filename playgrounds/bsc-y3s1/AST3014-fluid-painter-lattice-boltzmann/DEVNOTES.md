# DEVNOTES - bsc-y3s1/AST3014-fluid-painter-lattice-boltzmann (hidden dev ref)

Repo-only.

## Sweep 2026-05-18
Rewrote placeholder hook/one_paragraph as first-exposure-undergrad prose; render-neutral.
invariants  + visual 5/5 x3. Shipped.

## Sweep 2026-05-19
REVIEW verdict BROKEN was PARTLY valid: D2Q9 LBM physics was sound but (1) no sim.js, (2) invariants.test.mjs was a skeleton mock, (3) capture path ran a fixed 30 steps with no captureFraction so all 5 goldens were byte-identical, (4) spec/Explainer over-promised a Worker, dye, streamlines, 256x192, shift-drag dye (shift=erase). Fixed: extracted DOM-free sim.js (D2Q9 BGK + bounce-back), playground.js imports it and drives deterministic capture by captureFraction (warmup 20 -> 1400 steps), real 7-test invariants (equilibrium moments, rest fixed point, determinism, mass bounded, wake momentum deficit, viscosity law) all pass, recaptured 5 distinct goldens (read t-025/t-100: flow accelerates around the cylinder, developing wake, 60fps), scrubbed all rendered text to the actual implementation (leak-free, leakscan2=0). Shipped.

## Sweep 2026-05-19
REVIEW BROKEN partly valid: LBM physics sound but no sim.js, skeleton invariants, capture froze at 30 steps (5 identical goldens), spec over-promised Worker/dye/streamlines. Extracted DOM-free sim.js, fraction-driven deterministic capture, 7 real invariants pass, recaptured 5 distinct goldens, rendered text corrected to actual implementation.
invariants Tests  7 passed + visual 5/5 x3. Shipped.
