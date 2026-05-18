# REVIEW - shapiro-time-delay (pre-computed; maintainer actions later)

## Verdict
RENDER-NEUTRAL TEXT FIX ONLY

## Defects (severity-ranked)
1. [HIGH] Placeholder hook and one_paragraph in spec.md not removed.
2. [MEDIUM] Raw BibTeX key in HTML figcaption.
3. [MEDIUM] Spec lists 'live-readout' tag but HTML has zero readout elements. Either remove tag or add visible readout showing delay time (in units of GM/c^3 or seconds).
4. [LOW] Frames are distinct (5 different sizes), indicating proper parameter sweep; no capture defect.

## Text / approachability
Placeholders not removed. Rewrite hook to explain Shapiro delay: photon trajectory past massive object is longer and travels at c, so arrival time is delayed. Paragraph should explain the physical origin (spacetime curvature near sun).

## Source-material & equation fidelity
Shapiro time-delay formula (typically ~1-200 microseconds past sun, detected by radar ranging): standard GR. Physics correct.

## Golden-frame observations
Frames have 5 distinct sizes, indicating proper visualization of parameter variation (likely impact parameter or time). Trajectory and delay readout should both be animated; visual inspection needed to confirm.

## Hero-candidate
NO: Shapiro delay is a subtle GR effect; visual representation (trajectory plot) is pedagogical but not visually novel.

## Maintainer notes
- Replace placeholder hook and one_paragraph.
- Fix raw bib key in HTML.
- Add readout div showing time_delay or remove 'live-readout' tag from spec. Verify which is intended.
- Confirm frames render clearly and show distinct delay magnitudes across the 5 captures.
