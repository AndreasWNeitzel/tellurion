# REVIEW AST3014-sedov-taylor-blastwave

## Verdict
CONFIRMED CODE FIX + RECAPTURE

## Defect
**playground.js line 48** ignores captureFraction parameter from visual.test.mjs. Line 4 reads CAPTURE_NAME, but there is no corresponding read of captureFraction. Line 48 sets st.t = 3 unconditionally; when CAPTURE_NAME is set, the animation loop (line 49) is skipped. All five golden frames capture the playground at t = 3 kyr (same state), producing byte-identical outputs (62,810 bytes each, same MD5).

**Correct code:**
Add captureFraction read at line 4:
```javascript
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');
```

Then modify bootSync (line 48) to span time across captures:
```javascript
function bootSync() { if (CAPTURE_NAME) st.t = 0.1 + CAPTURE_FRAC * 9.9; render(); if (DETERMINISTIC) requestAnimationFrame(...); }
```

This maps CAPTURE_FRAC = 0, 0.25, 0.5, 0.75, 1.0 to t = 0.1, 2.575, 5.05, 7.525, 10 kyr, showing R(t) evolving from small to large following the self-similar scaling R propto t^(2/5).

**First-principles:** The Sedov-Taylor solution is parametrized by time; as t advances, the blast-wave radius grows monotonically as R(t) = xi (E*t^2/rho)^(1/5). Different times produce qualitatively distinct visual states. The golden frames should show the shock expanding, rings marking earlier timesteps moving outward, and speed decreasing (v_s = 2/5 R/t decreases with t at fixed R and E). Frame progression is essential for demonstrating the self-similarity and pedagogical value of the visualization.

## Gate
**invariants.test.mjs** verifies the R(t) scaling law (R propto t^(2/5)) algebraically. All frames at different times will pass these checks because they test closed-form identities. After the code fix, the five golden frames will show visibly different shock radii, confirming temporal progression across the capture sequence.

## Fix steps
1. **playground.js line 4** add captureFraction read:
   const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');
2. **playground.js line 48** modify bootSync to use captureFraction:
   function bootSync() { if (CAPTURE_NAME) st.t = 0.1 + CAPTURE_FRAC * 9.9; render(); if (DETERMINISTIC) requestAnimationFrame(...); }
3. Verify node --check playground.js passes
4. Run pnpm test:invariants to confirm physics checks remain clean
5. **Recapture:** Run pnpm run test:visual -- AST3014-sedov-taylor-blastwave --deterministic to generate five new golden frames with R(t) advancing monotonically
6. Verify golden frames show shock radius growing from ~0.1 pc to ~450 pc, speed decreasing, history rings moving outward
7. Commit .verified marker after frame capture succeeds
