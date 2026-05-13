# Two-stream instability (1D PIC plasma)

Two counter-streaming beams of electrons in a plasma. Any tiny density perturbation grows exponentially; the beams roll into phase-space vortices and eventually thermalize. The canonical kinetic plasma instability.

What to look for: in the (x, v) phase plot, the two beams start as horizontal lines. By t ~ 3 a sinusoidal wave appears; by t ~ 5-7 the beams have wound into "electron holes" (closed vortices). The log mode-1 amplitude trace below is straight during the linear growth phase, then saturates.

Controls: v_0 (beam speed), speed, reset, pause / play.

## Reference

Hockney and Eastwood 1988, Computer Simulation Using Particles, Chapters 5 - 8.

## Verification

- Strong invariants: mode-1 grows > 5x in [2, 5], momentum conserved, particles in domain.
- Visual gate: SSIM > 0.92 against committed golden frames at seed 0xC0FFEE.
- Last verified: see `.verified`.
