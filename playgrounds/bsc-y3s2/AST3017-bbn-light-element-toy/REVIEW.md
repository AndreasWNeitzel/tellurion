# REVIEW - bbn-light-element-toy

## Verdict
NEEDS CODE FIX + RECAPTURE

## Defect
playground.js: no CAPTURE_FRAC parameter sweep during capture phase. All 5 golden frames are byte-identical, showing eta frozen at 6.10 (Planck default). Visual test requires distinct frames demonstrating the interactive slider effect. Compare to AST3017-gravitational-redshift, which sweeps emission radius via `state.rRatio = 1.05 + CAPTURE_FRAC * 18.95;` in bootSync().

## Gate
Visual test expects SSIM > 0.92 between each frame. Byte-identical frames will fail. Invariant tests pass (BBN empirical fits Yp, D/H, 7Li/H are monotonic and match Planck expectations within threshold).

## Fix steps
1. playground.js line 9: add `const CAPTURE_FRAC = parseFloat(urlParams.get('captureFraction') ?? '0');`
2. playground.js line 55 (bootSync function): replace static render with conditional CAPTURE_FRAC sweep:
   ```javascript
   function bootSync() {
     if (CAPTURE_NAME) {
       st.eta = 1 + 19 * CAPTURE_FRAC;
       vE.textContent = st.eta.toFixed(2);
       sE.value = st.eta;
     }
     render();
     if (DETERMINISTIC) { /* ... dispatch simulation-ready ... */ }
   }
   ```
3. Verify slider label and value readout render visually in final frames.
4. Rerun visual test with `--deterministic` to capture 5 distinct golden frames (eta sweeping 1 -> 20).
5. Spec.md: replace placeholder hook and one_paragraph with prose explaining eta (baryon-to-photon ratio) and BBN sensitivity.

## Notes
Physics correct. Empirical fits from Steigman 2007 and Koldle Ch. 11 match assertions. No code defects beyond capture. Readout element present (readout-e).
