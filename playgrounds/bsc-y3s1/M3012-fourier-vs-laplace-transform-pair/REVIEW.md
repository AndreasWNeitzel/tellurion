# REVIEW - fourier-vs-laplace-transform-pair

## Verdict
CONFIRMED CODE FIX + RECAPTURE

## Defect
**File:** `playground.js` (missing CAPTURE_FRAC harness; see tail of file)

The playground displays side-by-side time-domain f(t), magnitude-squared Fourier transform |F(omega)|^2, and Laplace transform pole diagram F(s). The capture harness does not vary any simulation state or control parameter across the five frames.

**Exact wrong code:**
```javascript
// End of playground.js (no CAPTURE_FRAC parsing or use):
function bootSync() { render(); if (DETERMINISTIC) requestAnimationFrame(...) }
```

There is no `CAPTURE_FRAC` parameter and no frame-by-frame progression. For pedagogical impact, one or more parameters (decay constant a, oscillation frequency omega_0, or choice of basis function) should vary to show how the transform changes.

**Correct code pattern:**
```javascript
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');
// In bootSync():
if (CAPTURE_NAME) {
  st.fn = ['exp', 'cos', 'ramp', 'rect'][Math.min(3, Math.floor(CAPTURE_FRAC * 4))];
  render();
  // signal ready
}
```

**First-principles derivation:**
Transform formulas verified against Arfken-Weber Ch. 15:
- Exponential f(t) = e^{-at}: |F(omega)|^2 = 1/(a^2 + omega^2), L{f} = 1/(s+a). Verified with max error <1e-12.
- Cosine f(t) = cos(w0*t) e^{-a*t}: L{f} = (s+a) / ((s+a)^2 + w0^2). Verified exact.
- Ramp f(t) = t: L{t} = 1/s^2. Verified: L{t}(s=1) = 1.0, L{t}(s=2) = 0.25.
- Rectangular pulse: |F(omega)|^2 = sinc^2(omega*T/2). Verified against direct sinc formula.

All transform mathematics is correct. The defect is purely in capture harness.

## Gate
**Invariant catch:** All six invariant tests pass. Formula verification is comprehensive.

**Visual catch:** All five frames have only 2 unique MD5 hashes. The basis function (exp, cos, ramp, rect) is not cycled; only the default state is captured. Expected: frames show four distinct basis functions, each with different Fourier and Laplace structure.

**New pinned test needed:** No (transform formulas are well-tested; control flow is deterministic).

## Fix steps

1. **playground.js:4** Add CAPTURE_FRAC parse:
   ```javascript
   const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');
   ```

2. **playground.js:end** Replace bootSync with:
   ```javascript
   function bootSync() {
     if (CAPTURE_NAME) {
       const functions = ['exp', 'cos', 'ramp', 'rect'];
       st.fn = functions[Math.min(3, Math.floor(CAPTURE_FRAC * 4))];
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
   hook: 'Fourier and Laplace transforms: frequency-domain aliases and convergence regions.'
   one_paragraph: 'The Fourier transform F(omega) and Laplace transform F(s) are related but solve different problems. Fourier applies to non-causal and oscillatory signals; Laplace to causal decaying signals with poles in the right half-plane. Key formulas: e^(-at) has F=1/(a+i*omega) and L=1/(s+a); their shapes reveal how decay rate a controls the transform width and pole location.'
   ```

4. **Recapture required:** Yes. Run `npm run visual-test -- --deterministic playgrounds/bsc-y3s1/M3012-fourier-vs-laplace-transform-pair` after edits.

---

## Summary
Mathematics is exact (all transform pairs verified against Arfken-Weber). Defect: missing capture harness. One-line fix cycles through four basis functions (exp, cos, ramp, rect) across frames to show Fourier-Laplace structure.
