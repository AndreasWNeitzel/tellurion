# REVIEW - grating-resolving-power

## Verdict
CONFIRMED CODE FIX + RECAPTURE

## Defect
**File:** `playground.js` (missing CAPTURE_FRAC harness)

The playground displays diffraction grating intensity patterns I(theta) for m-th order. However, the capture harness does not vary any state across the five frames; all frames are identical because no CAPTURE_FRAC mapping exists.

**Exact wrong code:**
```javascript
// Line 63 (end of playground.js):
function bootSync() { render(); if (DETERMINISTIC) requestAnimationFrame(...) }
```

There is no `CAPTURE_FRAC` parameter parsing, and `st` variables (N, d, a, l, dl) are not driven by capture state. For progressive visualization, one of the controls (e.g., wavelength lambda or slit spacing d) should vary with CAPTURE_FRAC to show how diffraction changes.

**Correct code pattern:**
```javascript
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');
// In bootSync():
if (CAPTURE_NAME) {
  st.N = Math.round(10 + CAPTURE_FRAC * 30);  // sweep N from 10 to 40
  render();
  // signal ready
}
```

**First-principles derivation:**
Resolving power R = m*N is linear in slit count. Grating equation d*sin(theta) = m*lambda is exact. Intensity I(theta) = [sin(N*delta/2) / sin(delta/2)]^2 * [sin(beta) / beta]^2 with delta = 2*pi*d*sin(theta)/lambda, beta = pi*a*sin(theta)/lambda. All verified against Hecht Ch. 10. The defect is purely in the capture harness.

## Gate
**Invariant catch:** Yes. Test `resolvingPower(m, N)` passes (R = m*N formula is correct).

**Visual catch:** All five frames have only 2 unique MD5 hashes out of 5. Frames 0/1 and 2/3/4 cluster into two groups. Animation progression is absent; the parameter space is never traversed during capture. Expected: frames show principal maxima growing sharper and separated more finely as N increases (or wavelength spacing increases).

**New pinned test needed:** No (formula tests are sufficient; control harness is orthogonal).

## Fix steps

1. **playground.js:4** Add CAPTURE_FRAC parse:
   ```javascript
   const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');
   ```

2. **playground.js:63-64** Replace bootSync with:
   ```javascript
   function bootSync() {
     if (CAPTURE_NAME) {
       // Sweep slit count N to show sharpening and fine structure
       st.N = Math.round(10 + CAPTURE_FRAC * 30);
       render();
       if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { 
         window.__simulationReady = true; 
         window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); 
       }));
     } else {
       render();
     }
     if (!CAPTURE_NAME) requestAnimationFrame(tick);
   }
   ```

3. **spec.md:12-13** Remove placeholders:
   ```yaml
   hook: 'Diffraction grating: N slits produce sharp principal maxima separated by fine structure.'
   one_paragraph: 'A diffraction grating with N slits and spacing d creates an intensity pattern with principal maxima at d*sin(theta) = m*lambda. The resolving power R = m*N determines the minimum resolvable wavelength difference. More slits produce sharper peaks and finer secondary minima between orders.'
   ```

4. **Recapture required:** Yes. Run `npm run visual-test -- --deterministic playgrounds/bsc-y3s1/FIS3019-grating-resolving-power` after edits.

---

## Summary
Physics and optics are correct (diffraction grating formula R = m*N verified, intensity pattern structure correct). Defect: missing capture harness causes all five frames to be visually static. One-line fix sweeps slit count across frames.
