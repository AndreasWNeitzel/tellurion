# Magnus effect on a spinning ball

A baseball under gravity, quadratic drag, and Magnus lift from spin.
With top-spin the ball curls downward (shorter range); with back-spin
it floats upward (longer range). Three trajectories on common axes
make the spin effect immediately legible.

Look for: at v_0 = 25 m/s, angle = 20 deg: spin = 0 reaches about 23 m;
spin = +50 (top-spin) reaches only 21 m; spin = -50 (back-spin) reaches
25 m. The dashed yellow no-spin line stays in the middle; the cyan
opposite-spin line and the orange current-spin line straddle it.

Use the sliders to vary v_0, angle, and spin.

## Reference

- Adair 1990, The Physics of Baseball (`adair1990`).

## Verification

- Strong invariant: top-spin shortens range, back-spin extends; landing
  at y = 0.
- Visual gate: SSIM > 0.92 across 5 frames showing animated ball.
- Last verified: see `.verified`.
