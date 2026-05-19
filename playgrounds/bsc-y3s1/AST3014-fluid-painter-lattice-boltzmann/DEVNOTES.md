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

## Live-fix 2026-05-19
User: "boring, simulation eventually breaks with the wave error going to infinity". Root cause: BGK LBM is unconditionally unstable as tau -> 0.5 (nu -> 0); the tau slider floor was 0.52 (nu ~ 0.007) and there was no velocity limiter or non-finite guard, so user-drawn high-Re geometry diverged to Inf over time. Fix: (1) sim.js gains an OFF-by-default velocity limiter (s.uClamp) and a rho>1e-6 guard - the pure BGK core that invariants.test.mjs exercises is byte-identical (uClamp=0); the playground sets uClamp=0.17 (Mach-safe). (2) tau slider floored at 0.56 (nu=0.02). (3) tick() self-heals (freshFlow) if fluid mass ever goes non-finite. (4) Engagement: vorticity (curl) diverging colormap so the +/- shear sheets and the von Karman wake are visible; default tau 0.57 for clear shedding; larger default obstacle. Verified live: stable + coherent over a 26 s run (was diverging), no pageerrors, 60 fps.
invariants 7/7, smoke OK, visual 5/5 x3.
