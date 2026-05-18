# REVIEW - schwarzschild-geodesics

## Verdict
NEEDS CODE FIX + RECAPTURE

## Defect
playground.js: no CAPTURE_FRAC parameter to sweep impact parameter during capture. The 5 golden frames show only 3 distinct file sizes, meaning 2 frames are byte-identical. The spec promises to demonstrate the photon-bending fan from head-on (b=0) to grazing (b=b_crit and beyond), but the capture shows incomplete trajectory evolution.

## Gate
Visual test expects 5 distinct frame outputs. Invariant tests all pass (critical impact parameter 5.0 < b_crit < 5.3, weak-field deflection ~4M/b within tolerance, reproduciblity). The geodesic equations and energy conservation are correct.

## Fix steps
1. playground.js line 26: add `const CAPTURE_FRAC = parseFloat(urlParams.get('captureFraction') ?? '0');`
2. playground.js line 85 (bootSync function): replace current static buildSwarm with CAPTURE_FRAC-driven parameter:
   ```javascript
   function bootSync() {
     if (CAPTURE_NAME) {
       const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
       state.N = 41;
       state.bMax = 2 + frac * 8;      // sweep 2 to 10 over 5 frames
       state.stepsSoFar = Math.floor(frac * CAPTURE_TOTAL_STEPS);
     }
     buildSwarm();
     stepN(state.stepsSoFar);
     render();
     if (DETERMINISTIC) { /* ... dispatch simulation-ready ... */ }
   }
   ```
   This sweeps both simulation progress (stepsSoFar) and the impact-parameter range (bMax), ensuring photon trajectories evolve visibly across frames.
3. Verify all 7 readout elements render (N, bMax, b_crit, swallowed, deflected counts).
4. Rerun visual test with `--deterministic`. Confirm 5 distinct frame sizes.
5. Spec.md: replace placeholder hook and one_paragraph. Add 'live-readout' tag if not present.

## Notes
Physics is exact: null geodesics in Schwarzschild metric, critical impact parameter b_crit = 3*sqrt(3) derived from marginal condition V_null(3, b_crit) = E^2/2, photon-sphere instability all verified. Weak-field deflection angle matches Carroll 5.4 within empirical 0.5-2x range due to finite b corrections. All invariants pass.
