# Kronig-Penney band structure

Stick a 1D electron inside a comb of delta-function spikes and the free-particle parabola turns into a stack of allowed bands separated by forbidden gaps. The transcendental equation cos(ka) = cos(qa) + (P/qa) sin(qa) determines which energies are allowed (right-hand side in [-1, 1]) and which are forbidden.

What to look for: at P = 0.5 the gaps are barely visible; at P = 4 they are clearly resolved; at P = 12 the bands have flattened toward tight-binding levels. The left plot is the transcendental function with the +/-1 envelope (gap regions are where the curve escapes the envelope). The right plot is the same information replotted as eps(ka) in the reduced zone.

Controls: P sets the lattice strength; eps max sets how high in energy the plot goes.

## Reference

Shankar 1994, Principles of Quantum Mechanics, 2e, Section 19.3; Ashcroft and Mermin 1976, Solid State Physics, Chapter 8.

## Verification

- Strong invariants: f(0, P) = 1 + P, f(pi, P) = -1, total band length at P = 0 covers > 95 percent of range, band edges satisfy |f| = 1.
- Visual gate: SSIM > 0.92 against committed golden frames at seed 0xC0FFEE.
- Last verified: see `.verified`.
