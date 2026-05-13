# 2D XY model: BKT vortex unbinding

Each cell of the lattice holds a continuous angle (a 2D compass). Neighbors prefer to point the same way. The 2D XY model has no ordered phase at finite T, but it has a BKT transition at T_BKT ~ 0.893 J where vortex-antivortex pairs unbind.

What to look for: at T = 0.2 the color field is smoothly varying; at T = 0.7 (default) you start to see small clusters and a few vortex dots; at T = 1.5 vortices scatter across the lattice. Red and blue dots are +/- vortices found by computing the winding around each plaquette. The total topological charge is always zero on the torus.

Controls: T (temperature), L (lattice size), speed. Cold/Hot init.

## Reference

Kosterlitz and Thouless 1973, J. Phys. C 6, 1181; Hasenbusch 2005, Phys. Rev. B 71, 094507.

## Verification

- Strong invariants: cold-init m and e exact, hot |m| small, vortex charge conservation, vortex density monotone in T.
- Visual gate: SSIM > 0.92 against committed golden frames at seed 0xC0FFEE.
- Last verified: see `.verified`.
