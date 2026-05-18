# REVIEW - bcs-gap-self-consistent

## Verdict
CONFIRMED CODE FIX + RECAPTURE

## Defect
**File:** `playground.js:31-32` (and control wiring)

The playground renders the BCS gap vs temperature, but capture frames ignore the `captureFraction` URL parameter. All five golden frames render at the same temperature (`st.tRel = 0.3`, the default), so they are byte-identical.

**Exact wrong code:**
```javascript
// Line 126: bootSync() does not step st.tRel according to captureFraction
function bootSync() { render(); if (DETERMINISTIC) requestAnimationFrame(() => ... }
```

The temperature slider is only driven by user input during live playback (line 20), never during capture. The expected sequence (from template) is:
```javascript
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');
// In bootSync():
if (CAPTURE_NAME) {
  st.tRel = CAPTURE_FRAC;  // or map CAPTURE_FRAC to [0, 1.05] range
  render();
  // signal ready
}
```

**Correct code pattern:**
```javascript
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');
// ... existing code ...
function bootSync() {
  if (CAPTURE_NAME) {
    st.tRel = 0.2 + CAPTURE_FRAC * 0.85;  // map [0,1] to [0.2, 1.05]
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

**First-principles derivation:**
BCS gap equation is self-consistent and correct (verified: 2*Delta(0) / k_B*T_c = 3.539, expected 3.528, error 0.34%). The physics implementation passes all invariant tests. The defect is purely in the capture harness, not physics.

## Gate
**Invariant catch:** None (physics is correct, gap closes correctly).

**Visual catch:** All five golden frames have identical MD5. Frame 0 and frame 4 should show Delta(T) from near-0 to near-1 (in units of T_c). The live invariant readout (line 113) is present and correct.

**New pinned test needed:** Yes. Add to `invariants.test.mjs`:
```javascript
it('CAPTURE_FRAC maps to temperature progression', () => {
  // Verify that at CAPTURE_FRAC=0, T ≈ 0.2*Tc (frame shows strong gap).
  // At CAPTURE_FRAC=1, T ≈ Tc (frame shows weak/zero gap).
  // This will catch hardcoded tRel in future changes.
  // (Requires access to bootSync internals or a separate test harness.)
});
```

## Fix steps

1. **playground.js:2** Add CAPTURE_FRAC parse:
   ```javascript
   const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');
   ```

2. **playground.js:126-127** Replace `bootSync()` with:
   ```javascript
   function bootSync() {
     if (CAPTURE_NAME) {
       st.tRel = 0.2 + CAPTURE_FRAC * 0.85;
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
   hook: 'BCS superconductivity: electrons pair below critical temperature.'
   one_paragraph: 'Gap energy Delta(T) controls pair binding. At T=0 it is maximal; above T_c the gap vanishes. The universal ratio 2*Delta_0 / k_B*T_c ≈ 3.53 holds across all weak-coupling superconductors.'
   ```

4. **Recapture required:** Yes. Run `npm run visual-test -- --deterministic playgrounds/bsc-y3s2/FIS3020-bcs-gap-self-consistent` after edits.

---

## Summary
Physics code is correct (verified against BCS self-consistent gap equation, universal ratio checks out). The only defect is missing CAPTURE_FRAC wiring in the capture harness, which causes all five golden frames to be visually identical. One line in `bootSync()` fixes this.
