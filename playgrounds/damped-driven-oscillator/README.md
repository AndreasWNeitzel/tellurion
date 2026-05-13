# Damped, driven oscillator and the resonance curve

The classical mass-spring system with linear damping driven sinusoidally:
x'' + 2 gamma x' + omega_0^2 x = F_0 cos(omega t), omega_0 = F_0 = 1.
The top panel shows the live integrated x(t) trace (cyan) against the
drive (faint orange). The bottom panel is the analytic steady-state
amplitude curve A(omega) with a cursor at the chosen drive frequency.

Look for: the peak in A(omega) sits at omega_r = omega_0 sqrt(1 - 2(gamma/omega_0)^2),
just below omega_0 for non-zero damping. The peak height is approximately
Q = omega_0 / (2 gamma) for small damping. Slide omega across the peak
and watch the live response grow; raise gamma and the peak both lowers
and broadens. At high gamma (Q < 1/sqrt(2)) the peak disappears entirely.

Use the omega slider to set the drive frequency and gamma to set the
damping. Speed controls integrator steps per frame. Reset re-initializes
at x = 0, v = 0.

## Reference

- Strogatz, Nonlinear Dynamics 2e Ch. 7.
- Marion and Thornton, Classical Dynamics Ch. 3 (`marion-thornton`).

## Verification

- Strong invariant: analytic resonance peak position; Q factor;
  high-frequency limit; numerical steady-state amplitude within 5 percent
  of analytic.
- Visual gate: SSIM > 0.92 across 5 frames at fixed seed.
- Last verified: see `.verified`.
