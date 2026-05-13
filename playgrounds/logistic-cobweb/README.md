# Logistic Cobweb

A two-panel interactive view of the iterated logistic map x_{n+1} = r x_n (1 - x_n). The left panel is the cobweb diagram: parabola, diagonal, and staircase tracing successive iterates from an initial condition x_0. The right panel is the bifurcation diagram from r in [2.0, 4.0]; the current r is set by dragging the vertical line on this panel.

At r below 3, the cobweb staircase converges to the fixed point x* = (r - 1) / r. Crossing r = 3 the fixed point loses stability and the period doubles to 2; further period doublings accumulate at r_inf approximately 3.5699, the onset of chaos. Look for the canonical period-3 window near r = 3.83 in the chaotic regime, and for the Feigenbaum delta readout converging to 4.669 as the cascade is resolved.

Controls: drag the vertical r-line on the bifurcation panel, or use the left and right arrow keys to nudge r (Shift for fine steps). Reset returns to r = 3.2 and x_0 = 0.1. The x_0 input sets the initial condition for the cobweb staircase. Live readouts show r, the detected period (or "chaotic" if the period exceeds 64), the Lyapunov exponent over a short orbit, and the Feigenbaum delta estimated from the superstable cascade up to n = 5.

## Reference

Primary citation: Strogatz, "Nonlinear Dynamics and Chaos", 2nd ed., Chapter 10 (bib key `strogatz2015`). The bifurcation diagram corresponds to Newman, "Computational Physics", 2013, Ch. 3 Exercise 3.6 "Deterministic Chaos and the Feigenbaum Plot" (bib key `newman2013`).

## Verification

- Strong invariants:
  - Lyapunov exponent at r = 4: |lambda - ln 2| < 0.01 ln 2 over N = 2 x 10^5 iterations after 10^3 burn-in.
  - Feigenbaum delta from the superstable cascade: |delta_5 - 4.669201609| / 4.669201609 < 0.001 (0.1 percent).
- Visual gate: SSIM > 0.92 against committed golden frames at seed 0xC0FFEE.
- Last verified: see `.verified`.
