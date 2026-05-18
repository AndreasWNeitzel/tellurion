# REVIEW AST3014-bondi-accretion-spherical

## Verdict
CONFIRMED CODE FIX + RECAPTURE

## Defect
**playground.js line 108** ignores captureFraction parameter from visual.test.mjs. Line 4 reads CAPTURE_NAME, but there is no corresponding read of captureFraction. Line 108 sets st.t = 1 unconditionally; when CAPTURE_NAME is set, the animation loop (line 109) is skipped. All five golden frames capture the playground at t = 1 (same state), producing byte-identical MD5 hashes.

**Correct code:**
```javascript
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');
```
Then in bootSync():
```javascript
if (CAPTURE_NAME) st.t = 1 + CAPTURE_FRAC * 9;  // span t from 1 to 10 across captures
```

This maps CAPTURE_FRAC = 0, 0.25, 0.5, 0.75, 1.0 to t = 1, 3.25, 5.5, 7.75, 10 (in the same physical units as the render loop).

**First-principles:** Bondi accretion is a steady-state solution; time does not appear explicitly in the governing equations. However, the playground animates tracer particles falling from infinity toward the sonic radius (lines 56-68 in playground.js). The phase variable (st.t * 0.5 + k * 0.13 + m * 0.25) modulates the radial position of these tracers via r_now = maxRDisplay * exp(-phase * log(maxRDisplay / r_inner)). Advancing st.t changes the visual appearance of the infall animation. Frames at different st.t values show particles at different stages of infall, providing visual progression that matches the pedagogical intent (showing transonic flow from subsonic to supersonic regions).

## Gate
The invariants (Bondi radius r_B, accretion rate Mdot, sonic-point Mach number) do not change with time in the steady-state solution. They are correctly computed and constant across frames, which is good. However, the visualization should show particle infall progression, which requires st.t to vary. After the code fix, the five golden frames will show tracers at different radii, confirming that the animation spans a meaningful temporal range.

## Fix steps
1. **playground.js line 4** add captureFraction read:
   const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');
2. **playground.js line 108** modify bootSync to use captureFraction:
   function bootSync() { if (CAPTURE_NAME) st.t = 1 + CAPTURE_FRAC * 9; render(); if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
3. Verify node --check playground.js passes
4. **Recapture:** Run pnpm run test:visual -- AST3014-bondi-accretion-spherical --deterministic to generate five new golden frames with particles at different infall stages
5. Verify golden frames show visual progression in particle positions and stream brightness (which tracks Mdot)
6. Commit .verified marker after frame capture succeeds
