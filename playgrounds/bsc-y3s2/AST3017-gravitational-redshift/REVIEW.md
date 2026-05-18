# REVIEW - gravitational-redshift

## Verdict
RENDER-NEUTRAL TEXT FIX ONLY + CRITICAL: MISSING READOUT

## Defect
HTML: spec.md lists 'live-readout' tag, but index.html contains no readout element for displaying z_grav or f_obs/f_em. Gate requires visible live invariant readout. Playground.js has all readout logic but nowhere to render it (readout-e, readout-s, readout-z undefined in DOM).

## Gate
Live invariant readout is mandatory per gate 6 in CLAUDE.md. Either add readout div to HTML or remove 'live-readout' tag from spec. Invariant tests all pass (weak-field, horizon, clock rate, reciprocity, z definition).

## Fix steps
1. index.html: add readout div. Insert after the control panel:
   ```html
   <div id="readout-panel" style="position: absolute; bottom: 10px; left: 10px; font-family: monospace; font-size: 11px; color: #9aa0a6; background: rgba(6,6,8,0.8); padding: 8px 12px; border-radius: 4px;">
     <div>r_em/2M = <span id="readout-r" style="color: #fff;">2.00</span></div>
     <div>f_obs/f_em = <span id="readout-f" style="color: #7fb1d8;">0.00000</span></div>
     <div>z = <span id="readout-z" style="color: #fff;">Infinity</span></div>
   </div>
   ```
2. playground.js line 50 (drawAll function): after computing z and cr, update readout:
   ```javascript
   const readoutR = document.getElementById('readout-r');
   const readoutF = document.getElementById('readout-f');
   const readoutZ = document.getElementById('readout-z');
   if (readoutR) readoutR.textContent = state.rRatio.toFixed(2);
   if (readoutF) readoutF.textContent = f.toFixed(5);
   if (readoutZ) readoutZ.textContent = z === Infinity ? 'Infinity' : z.toFixed(3);
   ```
3. Spec.md: replace placeholder hook and one_paragraph with prose explaining gravitational redshift (photon loses energy escaping gravity well, frequency-shift factor sqrt(1 - 2M/r)).
4. Rerun visual test to verify readout renders in frames (optional recapture; frames are already distinct).

## Notes
Physics is exact: redshiftFactor(r) = sqrt(1 - 2M/r) verified in invariants and against first-principles Schwarzschild metric. All 7 invariants pass. No code defects beyond missing HTML element.
