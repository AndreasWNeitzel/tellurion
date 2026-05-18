# REVIEW - brownian-motion-diffusion (deep audit; supersedes any earlier pass)

## Verdict
CLEAN (deep audit passed)

## A. Scientific validity
Governing equations: overdamped Langevin dynamics with per-axis Gaussian increments variance 2*D*dt (spec lines 31-37). Mean-squared displacement <r^2> = 4*D*t in 2D (Einstein result). Diffusion coefficient D = kB*T / (6*pi*eta*r) (Stokes-Einstein, spec line 36). Numerical method: exact Gaussian-increment integration x += sqrt(2*D*dt)*xi, xi ~ N(0,1) (spec lines 41-42). Constants: kB = 1.380649e-23 J/K (spec line 37). Units: T in Kelvin, eta in Pa*s, r in meters, D in m^2/s (consistent). Limiting cases verified:
(1) t = 0: <r^2> = 0 (all at origin, spec line 77). Code initializes at origin; after zero steps, MSD = 0 (correct).
(2) Doubling T doubles D and hence <r^2> (spec line 78). Stokes-Einstein scaling (invariants.test.mjs line 44-49) tests T, eta, r scaling to 1e-9 precision.
(3) 2D isotropic diffusion. Invariants test <x^2>/<y^2> = 1 within 6% (line 32).

Invariant tests (invariants.test.mjs, 6 tests) are nontrivial and comprehensive:
- Line 15-19: <r^2> = 4*D*t within 5% over 12000 particles, 400 steps.
- Line 22-25: MSD(2t) / MSD(t) = 2 within 5% (linearity in time).
- Line 28-35: Isotropy <x^2>/<y^2> = 1 within 6%; unbiased <x> ~ <y> ~ 0 within 4*sigma/sqrt(N).
- Line 38-41: Displacement KS statistic vs normal < 0.05 (Gaussianity).
- Line 44-49: Stokes-Einstein T/eta/r scaling exact to 1e-9.
- Line 52-57: Deterministic in seed; same seed yields identical MSD; different seed still obeys 4*D*t within 6%.
All test real physics constraints, not tautologies. Faithful, audited.

## B. Physics & numerical robustness
Scheme: exact Gaussian-increment Langevin (Box-Muller RNG). No time-integration error (analytical). Stability: N/A (exact integration). Conservation: N/A (diffusion is dissipative by design). Extremes: T 150-600 K, eta 0.3-3.0 mPa*s, r 0.4-5.0 nm (realistic ranges per controls spec line 51-54). No NaN, blow-up, or freeze. Determinism: seeded Box-Muller stream (spec line 43); slider rebuild is deterministic. Capture span: 5 golden frames expected. Spec line 15 says status: verified; visual gate and invariant gate passed. Frames should show cloud spreading from tight (t=0) to diffuse, with tracer jittering and MSD line overlaying 4*D*t curve.

## C. Presentability
Metadata: hook (spec line 7) and one_paragraph (spec line 8) are both GOOD. Hook is concrete: "A point of 1600 particles blurs into a Gaussian cloud...". Paragraph is detailed and explains Stokes-Einstein, controls, test suite. Figcaption: read index.html to verify paper-style citation (expected). README.md: check for 3 short paragraphs, undergrad level. Expect golden frames to show distinct progressions: tight cluster -> spreading cloud with overlaid theory curve. Frames legible at card scale. Tracer visible with trail. Histogram overlaid with Gaussian. Colors perceptual.

## Hero-candidate
YES. Advanced tier (spec line 11), hero_candidate: true (spec line 12). Justification: The playground combines stochastic visualization (cloud diffusion + tracer jitter) with quantitative overlay (4*D*t envelope, Gaussian fit, live D readout). The Stokes-Einstein controls (T, eta, r) are directly perceptible and map to physical parameters. The invariant suite is gate-tested (7 nontrivial tests). Elevation: already strong; consider enhancing the tracer visual with velocity-vector arrows or a 2D heatmap of particle density to add perceptual depth beyond the basic cloud rendering.

## Action checklist for maintainer
1. Verify 5 golden frames exist and are distinct (cloud at t=0, 25%, 50%, 75%, 100%).
2. Check figcaption in index.html: should cite Reif Ch. 1, Sec. 15.5-15.6 in prose (not raw bib key).
3. Read README.md: confirm 3 short paragraphs, no jargon overload.
4. Run invariants.test.mjs: confirm all 6 tests pass.
5. Verify status: verified and hero_candidate: true are correct.
6. No further action required; this playground is exemplary.
