# Tautochrone: cycloid isochronism

Five frictionless beads released from five different heights on the same
inverted cycloid bowl. Despite the wide range of starting amplitudes, all
five reach the bottom at exactly the same time. Huygens proved this in
1673: on a cycloid, the motion in arc-length s from the bottom is exact
simple harmonic motion s'' = -(g / 4R) s, so the period is independent
of amplitude.

Look for: the colored beads start at different heights along the bowl and
swing toward the bottom. Watch the time bar at the bottom: at t = T / 4
(first quarter mark) all five beads pass through the bottom simultaneously.
A normal pendulum (circular arc) does not have this property; only the
cycloid is truly isochronous.

Use the speed slider to set animation rate. Reset returns to t = 0 with
all beads at their starting positions.

## Reference

- Huygens 1673, Horologium Oscillatorium (`huygens1673`).

## Verification

- Strong invariant: bead y position equals 0 at t = T / 4 for every
  release amplitude, to 1e-9.
- Visual gate: SSIM > 0.92 across 5 frames spanning one full period.
- Last verified: see `.verified`.
