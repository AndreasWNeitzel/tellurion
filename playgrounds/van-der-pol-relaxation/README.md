# Van der Pol: limit cycle to relaxation oscillator

The Van der Pol equation x'' - mu (1 - x^2) x' + x = 0 has a single
parameter mu controlling the strength of nonlinear self-excitation. For
mu = 0 it is a harmonic oscillator. For mu > 0 it has a unique stable
limit cycle: when |x| < 1 the system gains energy (negative damping),
and when |x| > 1 it loses energy (positive damping). At small mu the
cycle is nearly circular; at large mu it deforms into a relaxation
oscillation with slow phases punctuated by sudden jumps.

Look for: at mu = 0 the phase orbit on the left is a circle and x(t) on
the right is a pure sinusoid. At mu = 1 the limit cycle is slightly
distorted but still smooth. At mu = 5 to 8 the relaxation regime is
unmistakable: the phase orbit becomes D-shaped and the time series
shows long flat sections punctuated by abrupt transitions.

Use the mu slider to vary the nonlinearity. Speed controls integrator
steps per frame. Reset re-initializes at x = 1.5, v = 0.

## Reference

- Strogatz, Nonlinear Dynamics and Chaos 2e Ch. 7.

## Verification

- Strong invariant: limit cycle uniqueness, mu = 0 SHO, asymptotic period
  formula, peak |x| approaching 2 at moderate mu.
- Visual gate: SSIM > 0.92 across 5 frames.
- Last verified: see `.verified`.
