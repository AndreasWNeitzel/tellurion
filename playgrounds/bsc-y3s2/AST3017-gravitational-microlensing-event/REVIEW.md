# REVIEW - gravitational-microlensing-event (pre-computed; maintainer actions later)

## Verdict
NEEDS CODE FIX + RECAPTURE

## Defects (severity-ranked)
1. [CRITICAL] All 5 golden frames byte-identical. Playground animates a time-dependent microlensing event (Paczynski light curve, image motions, Einstein ring formation) but capture is static at a fixed time (likely t=t_peak or t=0). CAPTURE_FRAC must drive time parameter to sweep across the event (e.g., t_min to t_max) to show light-curve rise, peak, and decay, plus image positions and magnification changes.
2. [MEDIUM] No raw bib keys or placeholder text detected; hook and one_paragraph are well-written.

## Text / approachability
Hook and one_paragraph are clear and describe the event arc well.

## Source-material & equation fidelity
Microlensing magnification formula A(u) and u(t) via t_E are standard (Paczynski). Physics correct.

## Golden-frame observations
All 5 frames identical. Static Paczynski bump and fixed image positions. No time evolution visible.

## Hero-candidate
YES: microlensing events are pedagogically rich (light curve is a textbook signature) and visually dynamic. The Paczynski bump, magnified images, and Einstein ring formation are compelling. After recapture with proper time sweep (0 to t_max), this playground has conference-spotlight potential. Benchmark: frames should show qualitatively different magnification and image geometry across the 5 frames.

## Maintainer notes
- Add `t = t_min + (t_max - t_min) * CAPTURE_FRAC;` to playground.js capture phase. Sweep time from well before peak (low magnification) to well after (magnification returning to 1).
- Rerun visual test with --deterministic.
- Elevation plan if frames pass recapture: move to playgrounds/_heroes/ after visual quality review.
