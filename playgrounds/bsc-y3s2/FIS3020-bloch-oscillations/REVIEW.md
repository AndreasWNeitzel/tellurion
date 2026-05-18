# REVIEW - bloch-oscillations

## Verdict
CONFIRMED CODE FIX + RECAPTURE

## Defect
**File:** `playground.js:71` (bootSync capture harness)

The playground animates Bloch oscillations (quasi-momentum oscillating through the Brillouin zone, position oscillating in real space). However, capture frames are static at `st.t = 0` or `st.t = 2` (line 71, hardcoded). The `captureFraction` URL parameter is not used to vary time across the five golden frames.

**Exact wrong code:**
```javascript
// Line 71:
function bootSync() { st.t = CAPTURE_NAME ? 2 : 0; render(); ... }
```

This is hardcoded: frames are either at early time (st.t ≈ 0) or mid-cycle (st.t = 2). For the five captures to show progression through one complete Bloch oscillation, `st.t` must vary with CAPTURE_FRAC.

**Correct code pattern:**
```javascript
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');
// In bootSync():
if (CAPTURE_NAME) {
  const T_B = 2 * Math.PI / blochFrequency(st.F);
  st.t = CAPTURE_FRAC * (3 * T_B);  // sweep three complete periods
  render();
  // signal ready
}
```

**First-principles derivation:**
Bloch oscillation period: T_B = h / (e*F*a) = 2*pi*hbar / (e*F*a). In code units (hbar=1, e=1, a=1): T_B = 2*pi / F. For F=1, T_B ≈ 6.28 time units. Position x(t) = (W / 2*F) * (cos(arg(t)) - cos(arg0)), with period exactly T_B. Verified: quasi-momentum wraps to BZ with period T_B (test passes), position returns to x(0) at t=T_B with error <1e-9. All physics correct.

## Gate
**Invariant catch:** None (physics equations are correct, Bloch period verified to machine precision).

**Visual catch:** All five frames show E(k) and x(t) panels in identical state. Frame 0 should show k near 0 (top of band), frame 4 should show k near -pi (bottom, Bragg-reflected back). The live invariant readout (line 68, `rT.textContent = T_B.toFixed(2)`) is present and correct.

**New pinned test needed:** No (control flow is deterministic once st.t is set; invariant suite already passes).

## Fix steps

1. **playground.js:2** Add CAPTURE_FRAC parse:
   ```javascript
   const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');
   ```

2. **playground.js:1** Add import for blochFrequency:
   ```javascript
   import { blochFrequency, quasiMomentum, position } from './sim.js';
   ```
   (Already imported; no change needed.)

3. **playground.js:71** Replace bootSync with:
   ```javascript
   function bootSync() {
     if (CAPTURE_NAME) {
       const T_B = 2 * Math.PI / blochFrequency(st.F);
       st.t = CAPTURE_FRAC * (3 * T_B);
       render();
       if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { 
         window.__simulationReady = true; 
         window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); 
       }));
     } else {
       st.t = 0;
       render();
     }
     if (!CAPTURE_NAME) requestAnimationFrame(tick);
   }
   ```

4. **spec.md:12-13** Remove placeholders:
   ```yaml
   hook: 'Bloch oscillations: electron in a tilted lattice oscillates without net drift.'
   one_paragraph: 'A particle in a periodic potential under a uniform force oscillates periodically with frequency omega_B = e*F*a / hbar, not drifting. Quasi-momentum slides through the Brillouin zone and Bragg-reflects. Position oscillates with amplitude inversely proportional to field strength.'
   ```

5. **Recapture required:** Yes. Run `npm run visual-test -- --deterministic playgrounds/bsc-y3s2/FIS3020-bloch-oscillations` after edits.

---

## Summary
Physics and numerics are exact (semiclassical Bloch dynamics verified against first principles). Defect is capture harness: hardcoded st.t instead of CAPTURE_FRAC-driven progression. One-line fix sweeps time through three Bloch periods across the five frames.
