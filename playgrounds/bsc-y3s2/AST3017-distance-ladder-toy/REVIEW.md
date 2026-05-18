# REVIEW - distance-ladder-toy

## Verdict
NEEDS CODE FIX + RECAPTURE

## Defect
playground.js: no CAPTURE_FRAC parameter to vary sigma sliders during capture. All 5 golden frames byte-identical, showing fixed uncertainty bands for parallax (2%), Cepheids (5%), SN Ia (6%). The playground demonstrates error propagation (orthogonal sum), but capture shows no variation in the rung bands or Hubble-flow uncertainty.

## Gate
Visual test expects distinct frames. Invariant tests pass: distance modulus, orthogonal-sum uncertainty, parallax range all correct.

## Fix steps
1. playground.js line 4: add `const CAPTURE_FRAC = parseFloat(urlParams.get('captureFraction') ?? '0');`
2. playground.js line 62 (bootSync function): replace static render with CAPTURE_FRAC sweep:
   ```javascript
   function bootSync() {
     if (CAPTURE_NAME) {
       const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
       st.s1 = 0.005 + frac * 0.075;  // sweep 0.5% to 8% over 5 frames
       st.s2 = 0.01 + frac * 0.090;
       st.s3 = 0.01 + frac * 0.120;
       vS1.textContent = `${(st.s1 * 100).toFixed(1)}%`;
       vS2.textContent = `${(st.s2 * 100).toFixed(1)}%`;
       vS3.textContent = `${(st.s3 * 100).toFixed(1)}%`;
       sS1.value = st.s1; sS2.value = st.s2; sS3.value = st.s3;
     }
     render();
     if (DETERMINISTIC) { /* ... dispatch simulation-ready ... */ }
   }
   ```
3. Verify slider labels and readout element render (readout-s shows sigma_total).
4. Rerun visual test with `--deterministic`.
5. Spec.md: replace placeholder hook and one_paragraph with prose explaining cascade principle (each rung calibrated by lower, error propagates upward).

## Notes
Physics correct. Distance modulus 5*log10(d/10pc) and orthogonal-sum propagation (sqrt(s1^2 + s2^2 + s3^2)) both verified. Readout element present.
