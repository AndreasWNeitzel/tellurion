# REVIEW - thomas-precession

## Verdict
NEEDS CODE FIX + RECAPTURE

## Defect
playground.js: no CAPTURE_FRAC parameter to vary velocity during capture. All 5 golden frames byte-identical. The gyroscope spin axis orientation is frozen at a single angle. The spec emphasizes relativistic dynamics (precession accumulates as gamma - 1 rad per orbit), but capture shows no progression of the precession effect.

## Gate
Visual test expects distinct frames showing spin precession evolution. Invariant tests pass: Thomas factor = gamma - 1 (vanishes at beta=0, positive for beta>0, diverges as beta->1), Thomas rate = (gamma-1)*omega_orbit all verified.

## Fix steps
1. playground.js line 9: add `const CAPTURE_FRAC = parseFloat(urlParams.get('captureFraction') ?? '0');`
2. playground.js line 19 (bootSync function after DETERMINISTIC check): add CAPTURE_FRAC sweep. Current code does not have a bootSync function; add one:
   ```javascript
   function bootSync() {
     if (CAPTURE_NAME) {
       const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
       st.beta = 0.2 + frac * 0.6;    // sweep 0.2 to 0.8 over 5 frames
       vB.textContent = st.beta.toFixed(2);
       sB.value = st.beta;
       st.t = frac * T_ORBIT * 2;     // sweep 0 to 2 orbits
     }
     render();
     if (DETERMINISTIC) {
       requestAnimationFrame(() => {
         requestAnimationFrame(() => {
           window.__simulationReady = true;
           window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME } }));
         });
       });
     }
   }
   // Call at document load or on DOMContentLoaded
   ```
3. playground.js line 19 (last line): ensure bootSync is called at startup:
   ```javascript
   if (document.readyState === 'loading') {
     document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
   } else {
     bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick);
   }
   ```
4. Spec.md: replace placeholder hook and one_paragraph. Explain Thomas precession as a geometric effect in special relativity (spin-axis rotation in accelerated frame).
5. Rerun visual test with `--deterministic`.

## Notes
Physics is exact: Thomas precession frequency omega_T = (gamma - 1) * omega_orbit for circular motion derived from relativistic kinematics. Gamma function 1/sqrt(1 - beta^2) correct. All invariants pass.
