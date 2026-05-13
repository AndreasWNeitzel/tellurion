# q-state Potts model on a 2D square lattice

A generalization of the Ising model: each lattice site holds one of q colors. Like-colored neighbors lower the energy by J = 1. At low T the system forms large monochromatic patches; at high T it disorders. Transition temperature is T_c(q) = 1 / ln(1 + sqrt(q)).

What to look for: the trace in the right panel is the order parameter M, ranging from 1 (all one color) to 0 (uniform random). Slide T/T_c past 1 to see M collapse. For q in {2, 3, 4} the collapse is smooth (second-order); for q in {5, 6, 7, ..., 10} the change is sharper and you can sometimes see ordered and disordered patches coexisting (first-order).

Controls: q is the number of colors; T/T_c sets temperature in units of T_c(q); speed controls sweep rate; cold/hot start sets the initial config.

## Reference

Wu 1982, Rev. Mod. Phys. 54, 235; Newman and Barkema 1999, Monte Carlo Methods in Statistical Physics, Chapter 5.

## Verification

- Strong invariants: T_c(q) formula, cold-phase M > 0.95, hot-phase M < 0.10, energy bounds.
- Visual gate: SSIM > 0.92 against committed golden frames at seed 0xC0FFEE.
- Last verified: see `.verified`.
