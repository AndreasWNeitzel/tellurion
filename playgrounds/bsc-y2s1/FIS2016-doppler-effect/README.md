# Doppler effect from a moving source

A point source moves at constant velocity v to the right (cyan dot) and
emits a circular wavefront once per period T = 1 / f. Each wavefront then
expands at the wave speed c. Because the source displaces between
emissions, the wavefronts cluster in front of the source and stretch
behind, producing the classical Doppler shift in observed frequency.

Look for: at low v / c the wavefronts are nearly concentric; turn v / c
up and the front circles pile up tightly while the back circles space
out. The two orange observers, in front (theta = 0) and behind
(theta = pi), display their observed frequencies; the bar at the bottom
shows the full f_obs(theta) curve relative to the source-frame f = 1.
At theta = pi / 2 the non-relativistic formula gives f_obs = f.

Use the v / c slider to set source speed. Speed controls how fast the
animation advances. Reset returns the source to its starting position.

## Reference

- Crawford, Waves and Oscillations, Berkeley Physics Vol. 3 Ch. 4
  (`crawford-waves`).

## Verification

- Strong invariant: closed-form f_obs(theta) verified for limits 0, pi/2, pi
  to 1e-12; wavefront radius linear in (t - t_emit) c.
- Visual gate: SSIM > 0.92 against committed golden frames.
- Last verified: see `.verified`.
