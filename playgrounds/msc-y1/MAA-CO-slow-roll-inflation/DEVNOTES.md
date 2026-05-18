# DEVNOTES - MAA-CO-slow-roll-inflation

Repo-only debugging notes. Not user-facing.

## Bugs found and fixed (2026-05-18)

1. **Starobinsky V'' was wrong.** The inline `Vpp` for the Starobinsky
   plateau evaluated to (4/3)(e^2 - e) instead of the correct
   (4/3)(2e^2 - e), where e = exp(-sqrt(2/3) phi). Re-derived from
   V = (1 - e)^2: V' = 2 K e (1 - e), V'' = (4/3)(2 e^2 - e) with
   K = sqrt(2/3). The wrong V'' shifted eta and therefore n_s on the
   Starobinsky branch.

2. **(n_s, r) panel rendered empty / garbage for phi^4.** The old panel
   sampled epsilon(phi), eta(phi) along the live rolling phi and set the
   observation point to `phiObs = max(state.phi, phiEnd + 0.2)`, i.e. at
   the end of inflation, not at the pivot scale. For phi^4 this produced
   an off-window point with readout `n_s = -1.667  r = 14.222` and no
   visible track. Replaced with a closed-form N-sweep N = 40..70 using
   `nsR_atN(N, model)` and a single observable dot at the CMB pivot
   N = 55. phi^4 now reads `n_s = 0.945  r = 0.291` (= 1 - 3/55, 16/55),
   correctly sitting outside the Planck-favoured ellipse.

3. **invariants.test.mjs was a skeleton mock.** It asserted a fabricated
   energy-drift number and never imported the inflation code, so the
   wrong V'' shipped clean. Rewrote as 7 real tests against sim.js:
   - V' = central-difference of V (all 3 models)
   - V'' = central-difference of V' (all 3 models) <- catches bug 1
   - Starobinsky V, V', V'' vs closed form
   - phi^2 epsilon(8) = eta(8) = 1/32
   - phi^4 epsilon(8) = 1/8, eta(8) = 3/16
   - inflation ends at epsilon = 1 (phi^2: phi = sqrt 2)
   - Starobinsky slow-rolls on the plateau (epsilon(6) < 0.01)

## Architecture change

Physics was extracted from playground.js into sim.js (pure,
model-parameterised: V, Vp, Vpp, epsilon, eta, nsR, nsR_atN). playground.js
now imports thin wrappers. This is what makes the invariant test able to
exercise the real physics headlessly.

## Closed forms (verified by first-principles derivation)

- V ~ phi^p, N e-folds: epsilon = p/(4N), eta = (p-1)/(2N),
  n_s = 1 - (p+2)/(2N), r = 4p/N.
- phi^2: n_s = 1 - 2/N, r = 8/N.
- phi^4: n_s = 1 - 3/N, r = 16/N.
- Starobinsky: n_s = 1 - 2/N, r = 12/N^2.

## Capture

5 deterministic frames cycle model in {phi2, phi4, starobinsky} and sweep
N; all 5 distinct (adjacent SSIM 0.876 / 0.723 / 0.885 / 0.693), no
frozen-frame defect. Visual gate 5/5 across 3 deterministic re-runs.
