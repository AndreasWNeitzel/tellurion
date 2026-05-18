# REVIEW - transmission-line-impedance-matching (deep audit; supersedes any earlier pass)

## Verdict
RENDER-NEUTRAL TEXT FIX ONLY

## A. Scientific validity
Governing equations: Gamma = (Z_L - Z_0)/(Z_L + Z_0) (sim.js line 20), VSWR = (1 + |Gamma|)/(1 - |Gamma|) (sim.js lines 24-26), P_delivered = 1 - |Gamma|^2 (sim.js line 31), return loss = -20 log10(|Gamma|) (sim.js line 38). All match Jackson 1998 Ch. 8 equations cited in spec.md. Constants: Z_0 = 50 Ohm (correct for coaxial lines). Units: all dimensionally consistent (impedance in Ohm, power ratio dimensionless, dB for logarithmic). Waveform animation (playground.js lines 71-73): V(x,t) = cos(omega*t - k*xPhys) + g*cos(omega*t + k*xPhys) matches spec line 40 exactly. Envelope formula (playground.js line 87): sqrt(1 + g^2 + 2*g*cos(2*k*xPhys)) matches |V(x)| derivation. Limiting cases verified:
(1) Z_L = 50 Ohm (matched): g -> 0, envelope = sqrt(1) = 1 at g=0 (correct).
(2) Z_L -> infinity (open): g -> 1, envelope ripples maximally (correct).
(3) Intermediate loads: progressive modulation visible in frames. Invariant tests (invariants.test.mjs, 9 tests) nontrivial and comprehensive. Faithful, audited.

## B. Physics & numerical robustness
Scheme: closed-form analytical, no integration error. Conservation: power balance P_delivered + |Gamma|^2 = 1 tested invariants.test.mjs line 36-41, tolerance 1e-12. Extremes: Z_L = 1 to 500 Ohm slider; short at 0 gives g = -1 (exact), open at 1e9 gives g > 0.999 (correct). Determinism: t_0 reset per capture (playground.js line 141). Capture concern: frames t-025 and t-050 both show Z_L = 210 Ohm, g = 0.615 (identical). Code computes ZL = 10 + frac*400, so frac=0.025 yields 20 Ohm and frac=0.050 yields 30 Ohm; PNG labels contradict. Recapture required. No dt mixing (closed-form render).

## C. Presentability
BLOCKER: spec.md lines 12-13 contain raw status strings `hook: 'STATUS: needs_hook'` and `one_paragraph: 'STATUS: needs_paragraph'` that render on public gallery card. Figcaption (index.html lines 49-54) correct paper-style. README.md adequate (3 short paragraphs, undergrad level). Golden frames legible, colors perceptual, no overlap/garble. Frames t-025 and t-050 visually identical (recapture needed).

## Hero-candidate
NO. Closed-form analytic, no emergent dynamics.

## Action checklist for maintainer
1. Edit spec.md line 12: replace `hook: 'STATUS: needs_hook'` with actual hook (e.g., `hook: 'Watch voltage standing waves form and collapse as impedance mismatch changes.'`).
2. Edit spec.md line 13: replace `one_paragraph: 'STATUS: needs_paragraph'` with description (e.g., `one_paragraph: 'A 50-Ohm transmission line terminated by a variable resistive load. The reflection coefficient measures mismatch and drives standing wave formation. Adjust the load to see envelope shape evolve from flat (matched) to fully modulated (open/short).'`).
3. Recapture golden frames at fractions 0, 0.25, 0.5, 0.75, 1.0 with deterministic flag to yield Z_L = 10, 110, 210, 310, 410 Ohm and visually distinct frames.
4. Re-verify invariants.test.mjs passes.
