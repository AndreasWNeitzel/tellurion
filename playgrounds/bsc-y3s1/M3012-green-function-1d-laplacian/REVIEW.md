# REVIEW - green-function-1d-laplacian

## Verdict
CONFIRMED CODE FIX + RECAPTURE

## Defect
**File:** `playground.js` (missing CAPTURE_FRAC harness; see bootSync)

The playground solves -u''(x) = f(x) on [0,L] with Dirichlet BC using the Green's function convolution u(x) = integral G(x,x0)*f(x0) dx0. The five golden frames are all identical (MD5 hash count = 1 out of 5) because the capture harness does not vary any parameter across frames.

**Exact wrong code:**
```javascript
// End of playground.js (complete absence of CAPTURE_FRAC):
function bootSync() { render(); if (DETERMINISTIC) requestAnimationFrame(...) }
```

There is no CAPTURE_FRAC parsing. The source term f(x) or other state is never modified during capture. For pedagogical flow, one parameter (e.g., source shape, forcing amplitude, or domain size L) should progress across the five frames.

**Correct code pattern:**
```javascript
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');
// In bootSync():
if (CAPTURE_NAME) {
  st.fn = ['const', 'sine', 'gauss', 'delta'][Math.floor(CAPTURE_FRAC * 4)];
  render();
  // signal ready
}
```

**First-principles derivation:**
Green's function for -d^2u/dx^2 on [0,L] with Dirichlet BC:
G(x, x0) = min(x, x0) * (L - max(x, x0)) / L.

This is a tent: G(x,x0) = 0 at boundaries, symmetric, and satisfies -d^2G/dx^2 = delta(x-x0). Verified:
- Boundary conditions: G(0, x0) = 0, G(L, x0) = 0. Exact.
- Symmetry: G(x, x0) = G(x0, x). Verified.
- Solution to -u'' = 1: u(x) = x(1-x)/2, u(L/2) = L^2/8. For L=1, u(0.5) = 0.125. Verified to machine precision.

All mathematics is exact. Defect is purely in capture harness.

## Gate
**Invariant catch:** All five invariant tests pass. Green's function properties and solution accuracy are verified.

**Visual catch:** All five golden frames are byte-identical (single unique MD5). The rendered solution shape does not change. Expected: frames should show different source terms (constant, sine, Gaussian, delta-like), each producing visibly different u(x) profiles.

**New pinned test needed:** No (integral equation solver and BCs are well-tested; control flow is deterministic).

## Fix steps

1. **playground.js:5** Add CAPTURE_FRAC parse:
   ```javascript
   const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');
   ```

2. **playground.js:end** Replace bootSync with:
   ```javascript
   function bootSync() {
     if (CAPTURE_NAME) {
       const functions = ['const', 'sine', 'gauss', 'delta'];
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

3. **Add source function selector to st object** (if not already present):
   ```javascript
   let st = { /* existing fields */, fn: 'const' };
   ```

4. **spec.md:12-13** Remove placeholders:
   ```yaml
   hook: 'Green's function: convolution solves differential equations via integral.'
   one_paragraph: 'The Green's function G(x, x0) is the response at x to a point source at x0. For the Laplacian -d^2u/dx^2 = f on [0,L] with Dirichlet BC, the solution is u(x) = integral G(x,x0)*f(x0) dx0. The Green's function is a tent: it peaks at the source and vanishes at boundaries. Different source shapes f produce different solution profiles u, all determined by linear superposition.'
   ```

5. **Recapture required:** Yes. Run `npm run visual-test -- --deterministic playgrounds/bsc-y3s1/M3012-green-function-1d-laplacian` after edits.

---

## Summary
Mathematics is exact (Green's function formula verified, boundary conditions exact, integral solution verified against analytic parabola u(x) = x(1-x)/2). Defect: complete absence of capture harness. One-line fix cycles through four source function types to show how different forcings produce different solutions via Green's function convolution.
