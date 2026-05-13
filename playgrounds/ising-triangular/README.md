# Triangular Ising

A grid of tiny magnets on a triangular lattice. Each one points up or down; neighbors prefer to agree (lower energy). Lower the temperature to watch them align into one giant domain; raise it to watch them flicker randomly. Right at the critical temperature $T_c = 4/\ln(3) \approx 3.641$ (Wannier 1950) the system is on the knife edge between order and disorder, with domains of every size simultaneously.

Controls: temperature $T$, lattice size $L$, simulation speed (sweeps per frame), reset (hot or cold initial state), pause/play.

## Reference

Newman and Barkema, "Monte Carlo Methods in Statistical Physics", 1999, Chapter 3 (The Ising model and the Metropolis algorithm). Wannier 1950 for the exact $T_c$ of the triangular Ising.

## Verification

- Cold start at very low T retains $|m| > 0.95$ after 50 sweeps.
- Hot start at very high T gives $|m| < 0.15$ after 200 sweeps.
- Energy per site lies in [-3, 3]; cold lattice exactly e = -3.
- Bit-identical reproducibility at fixed seed.
