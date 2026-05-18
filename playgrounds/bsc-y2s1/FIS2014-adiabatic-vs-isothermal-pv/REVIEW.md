# REVIEW adiabatic-vs-isothermal-pv

## Verdict
CONFIRMED CODE FIX + RECAPTURE

## Defect
**playground.js line 82** captures volume via a sine wave: st.V = 1 + 1.4 * Math.sin(CAPTURE_FRAC * Math.PI * 2). This produces:

CAPTURE_FRAC = 0: sin(0) = 0, V = 1
CAPTURE_FRAC = 0.25: sin(pi/2) = 1, V = 2.4
CAPTURE_FRAC = 0.5: sin(pi) = 0, V = 1
CAPTURE_FRAC = 0.75: sin(3*pi/2) = -1, V = -0.4 (clamps to 0.3)
CAPTURE_FRAC = 1.0: sin(2*pi) = 0, V = 1

Frames t-000 and t-100 both render at V = 1, producing byte-identical golden images. The progression should monotonically span V from 0.3 to 2.4 across captures, showing compression, equilibrium, and expansion as distinct visual states.

**Correct expression:**
st.V = 0.3 + CAPTURE_FRAC * 2.1

This yields V = 0.3, 0.825, 1.35, 1.875, 2.4 for FRAC = 0, 0.25, 0.5, 0.75, 1.0. Full sweep from compression to expansion.

**First-principles:** The capture pipeline expects captureFraction in [0,1] to map monotonically to qualitatively distinct visual states. For a PV-diagram animation showing a process along a curve, frames must advance smoothly. A sine wave is periodic and symmetric; it violates monotonicity and repeats endpoints, defeating the purpose of frame progression.

## Gate
**invariants.test.mjs** validates the physics (P-V laws, temperature changes) correctly. The capture defect is visual, not physical. After the code fix, recapture generates five distinct frames that all pass invariant checks.

## Fix steps
1. **playground.js line 82** replace sine term with linear: st.V = 0.3 + CAPTURE_FRAC * 2.1
2. Verify node --check playground.js passes
3. Run pnpm test:invariants to confirm physics checks remain clean
4. **Recapture:** Run pnpm run test:visual -- FIS2014-adiabatic-vs-isothermal-pv --deterministic to generate five new golden frames with distinct V values
5. Verify golden frames show compression (high P), isothermal path, adiabatic path steeper, expansion (low P)
6. Commit .verified marker after frame capture succeeds
