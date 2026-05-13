# Duffing oscillator

A particle in a double-well potential, damped and shaken at a fixed frequency. Two panels: phase portrait with stroboscopic Poincare points on the left, bifurcation diagram in the drive amplitude gamma on the right.

What to look for: as gamma rises past 0.4, the orange strobe in the phase portrait splits from one point to two to four, then sprays into a fractal cloud. The bifurcation diagram on the right shows the same cascade as a sideways tree of branching curves; a vertical orange marker tracks the current gamma value.

Controls: delta is damping; gamma is drive amplitude; omega is drive frequency. Speed sets integration steps per frame. The bifurcation diagram is heavy to compute and recomputes only when delta or omega change.

## Reference

Strogatz 2024, Nonlinear Dynamics and Chaos, 2e, Section 12.5; Ott 2002, Chaos in Dynamical Systems, 2e, Section 7.2.

## Verification

- Strong invariants: undriven energy conservation (1e-3 over 4000 steps), weak-drive strobe collapse (sigma < 0.02), chaotic-regime occupancy >= 6 bins.
- Visual gate: SSIM > 0.92 against committed golden frames at seed 0xC0FFEE.
- Last verified: see `.verified`.
