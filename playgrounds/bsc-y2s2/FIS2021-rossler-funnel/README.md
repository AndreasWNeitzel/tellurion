# Rossler funnel attractor

Otto Rossler's 1976 minimal chaotic flow. Three ODEs, one nonlinearity (z times x). The trajectory winds outward on a flat spiral, then a single fold throws it back to the center, producing a strange attractor.

What to look for: at the default parameters (c = 5.7) the geometry is a flat funnel with positive Lyapunov exponent around 0.07. Drop c to 4.0 and you see a clean period-2 limit cycle. Sweep c up from 4.2 to 5.4 and watch period doublings cascade into chaos. The lambda_1 readout collapses to zero in the periodic windows and rises above zero in the chaotic ones.

Sliders set a, b, c, and the integration speed. The reset button rebuilds the trajectory with the new parameters after a 1500-step warmup. Honors `prefers-reduced-motion` by pausing the animation.

## Reference

Rossler 1976, Phys. Lett. A 57, 397; Strogatz 2024, Nonlinear Dynamics and Chaos, 2e, Section 12.4.

## Verification

- Strong invariants: boundedness (max |x|, |y| < 20, max |z| < 40 over 30k steps), Lyapunov in [0.04, 0.15] for c = 5.7, |lambda_1| < 0.05 for c = 3.5.
- Visual gate: SSIM > 0.92 against committed golden frames at seed 0xC0FFEE.
- Last verified: see `.verified`.
