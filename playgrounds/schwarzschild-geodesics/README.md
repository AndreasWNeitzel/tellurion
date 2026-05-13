# Schwarzschild Geodesics

A massive test particle moves on a Schwarzschild background in the equatorial plane, geometric units G = c = M = 1. The radial motion is a 1D Hamiltonian system with effective potential V_eff(r; L) = -1/r + L^2/(2r^2) - L^2/r^3; the last term is the relativistic correction that distinguishes Schwarzschild from Newton and produces perihelion precession. The project's velocity-Verlet symplectic engine integrates the (r, p_r) pair; the angular coordinate phi advances as L/r^2 each step. The dashed inner circle is the event horizon r = 2; the dashed outer circle is the ISCO at r = 6.

Look at the trail: at the default (r_ap = 12, L = 3.9) the orbit precesses by about 172 degrees per radial period, producing a clean rosette. The radial energy is conserved to machine precision by the symplectic integrator. Push L down toward 3.5 and the orbit gets more eccentric, the perihelion shrinks, and the precession rate grows; eventually the perihelion crosses the ISCO and the orbit becomes unstable, plunging into the horizon (the playground halts and flags this state). Push L up and the orbit becomes more circular; very large L gives a near-circular orbit with essentially no precession (the Newtonian limit).

Controls: drag the r_ap and L sliders to set the orbit. The IC is placed at apoapsis with zero radial velocity; the angular motion is determined by L. Reset returns to the default IC. Play/Pause toggles integration.

## Reference

Primary citation: Carroll, "Spacetime and Geometry: An Introduction to General Relativity", Sections 5.1 (The Schwarzschild Metric), 5.3 (Singularities), and 5.4 (Geodesics of Schwarzschild). Bib key `carroll2019`. Newtonian limit: Newman, "Computational Physics", 2013, Exercise 8.12 (bib key `newman2013`). Engine: `shared/js/engine/symplectic.js`.

## Verification

- Strong invariants:
  - Radial Hamiltonian conservation: |dE/E| < 1e-3 over 10^4 dt at canonical (r_ap=12, L=3.9). Empirical max drift is roughly 1e-8.
  - Angular momentum L exactly conserved by construction (the integrator does not modify it).
- Medium invariant: perihelion stays above the event horizon (r > 2) at the canonical IC.
- Visual gate: SSIM > 0.92 against committed golden frames showing the precessing rosette across captureFraction.
- Last verified: see `.verified`.
