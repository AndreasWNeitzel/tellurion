# REVIEW - gravitational-lensing-caustics (pre-computed; maintainer actions later)

## Verdict
NEEDS CODE FIX + RECAPTURE

## Defects (severity-ranked)
1. [CRITICAL] All 5 golden frames byte-identical. Playground has interactive source drag (core feature: "Drag the source across the source plane...") but capture is static. Images do not appear/disappear to demonstrate caustic crossing. CAPTURE_FRAC must drive source position to sweep across caustic to show multiple image formation and destruction.
2. [MEDIUM] Spec tags do not list "live-readout" but HTML has 3 readout elements (readout-invariant, readout-frame, others). Either remove unused readouts or update spec tag to "live-readout".

## Text / approachability
Hook and one_paragraph are well-written. Physics (deflection, critical curves, caustics) is explained clearly.

## Source-material & equation fidelity
Deflection formula, lens equation, critical-curve det(J)=0, caustic-finding via grid scan: all standard gravitational lensing. Physics faithful.

## Golden-frame observations
All 5 frames are identical. Source position frozen (likely at startup default), images stationary. No caustic-crossing event visible. Readout panels show image positions but they do not change across frames.

## Hero-candidate
MAYBE: caustic formation and multiple-image transitions are visually striking pedagogical moments. After recapture with proper source-position sweep, this playground could be a visual showcase. Defer decision until frames are re-captured.

## Maintainer notes
- Add CAPTURE_FRAC parameter to sweep source position from left of caustic to right (e.g., `state.source.x = -1.5 + 3 * CAPTURE_FRAC` to sweep x from -1.5 to 1.5).
- Rerun visual test with --deterministic.
- Check if 3 readout elements are all used; if not, prune. If yes, add "live-readout" tag to spec.
