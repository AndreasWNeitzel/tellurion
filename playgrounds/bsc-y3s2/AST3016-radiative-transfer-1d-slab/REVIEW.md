# REVIEW AST3016-radiative-transfer-1d-slab

## Verdict
CONFIRMED CODE FIX + RECAPTURE

## Defect
**playground.js line 47** ignores captureFraction parameter from visual.test.mjs. Line 4 reads CAPTURE_NAME, but there is no corresponding read of captureFraction. Line 47 calls render() once without modifying st parameters based on captureFraction. All five golden frames capture the playground at default state (Iin = 1, S = 3, tau = 2), producing byte-identical outputs.

While radiative transfer is not explicitly time-evolving, the pedagogical intent of the playground is to show how the intensity profile I(tau) changes as optical properties (S, tau) vary. The visual test expects captureFraction to control a meaningful visual progression across frames. The most natural choice is to sweep optical depth (tau) from small to large, showing how the intensity attenuation strengthens.

**Correct code:**
Add captureFraction read at line 4:
```javascript
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');
```

Then modify bootSync (line 47) to vary tau across captures:
```javascript
function bootSync() { if (CAPTURE_NAME) st.tau = 0.2 + CAPTURE_FRAC * 8; render(); if (DETERMINISTIC) requestAnimationFrame(...); }
```

This maps CAPTURE_FRAC = 0, 0.25, 0.5, 0.75, 1.0 to tau = 0.2, 2.2, 4.2, 6.2, 8.2, spanning the range where the profile visibly changes from nearly linear (low tau) to exponential (high tau).

**First-principles:** The radiative-transfer equation dI/dtau = -I + S has closed-form solution I(tau) = I_in * exp(-tau) + S * (1 - exp(-tau)). As tau increases, the exponential term dominates and the profile becomes less dependent on I_in (boundary condition). This is a fundamental aspect of radiative transfer pedagogy: understanding how increasing optical depth suppresses memory of the boundary condition. Frame progression across captureFraction naturally demonstrates this effect.

## Gate
The invariant tests (if present) should verify the closed-form solution algebraically. They will pass at any tau value because the formula is exact. After the code fix, the five golden frames will show visibly different I(tau) profiles as tau varies, confirming the pedagogical progression.

## Fix steps
1. **playground.js line 4** add captureFraction read:
   const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');
2. **playground.js line 47** modify bootSync to vary tau:
   function bootSync() { if (CAPTURE_NAME) st.tau = 0.2 + CAPTURE_FRAC * 8; render(); if (DETERMINISTIC) requestAnimationFrame(...); }
3. Verify node --check playground.js passes
4. **Recapture:** Run pnpm run test:visual -- AST3016-radiative-transfer-1d-slab --deterministic to generate five new golden frames with tau advancing from 0.2 to 8.2
5. Verify golden frames show I(tau) profile changing visibly: low tau frames nearly linear, high tau frames exponential with I_out approaching S
6. Commit .verified marker after frame capture succeeds
