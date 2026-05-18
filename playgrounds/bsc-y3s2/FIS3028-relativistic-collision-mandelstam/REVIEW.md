# REVIEW - relativistic-collision-mandelstam

## Verdict
NEEDS CODE FIX + RECAPTURE

## Defect
playground.js: no CAPTURE_FRAC parameter to vary collision energy during capture. All 5 golden frames byte-identical. The Mandelstam s variable depends on collision energy and lab-frame vs. center-of-mass frame, but the curves are frozen at logE=3. The visualization promises to show why fixed-target experiments have sqrt(s) proportional to sqrt(E_lab) while symmetric colliders scale as E_lab, but the capture shows only one static plot.

## Gate
Visual test expects distinct frames. Invariant tests pass: fixed-target s = m1^2 + m2^2 + 2*m2*E_lab exact, collider head-on s = (E1+E2)^2 - (p1-p2)^2 exact, constraint s+t+u = sum m_i^2 satisfied in principle (not tested here).

## Fix steps
1. playground.js line 4: add `const CAPTURE_FRAC = parseFloat(urlParams.get('captureFraction') ?? '0');`
2. playground.js line 56 (bootSync function): replace current render with CAPTURE_FRAC sweep:
   ```javascript
   function bootSync() {
     if (CAPTURE_NAME) {
       st.logE = CAPTURE_FRAC * 5;    // sweep 0 to 5 (E from 1 GeV to 100 TeV)
       vE.textContent = st.logE.toFixed(2);
       sE.value = st.logE;
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
   // Ensure bootSync is called on startup (add if missing):
   if (document.readyState === 'loading') {
     document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
   } else {
     bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick);
   }
   ```
3. Spec.md: replace placeholder hook and one_paragraph. Explain Mandelstam s (invariant mass squared of initial system) and its contrasting energy scalings in fixed-target vs. collider modes.
4. Rerun visual test with `--deterministic`.

## Notes
Physics is exact: Mandelstam variables follow relativistic 4-momentum kinematics. Fixed-target formula s = m1^2 + m2^2 + 2*m2*E_lab and collider formula s = (E1+E2)^2 - (p1-p2)^2 both verified. gamma and Lorentz factor correct. All invariants pass.
