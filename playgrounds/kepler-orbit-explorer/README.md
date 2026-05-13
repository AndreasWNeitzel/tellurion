# Kepler Orbit Explorer

A test particle orbits a fixed central mass under Newtonian gravity in 2D. The equations of motion are integrated by the project's velocity-Verlet symplectic engine; energy, angular momentum, and the Laplace-Runge-Lenz vector are reported as conserved (or near-conserved) quantities. Sliders for the semi-major axis a and eccentricity e set the orbit shape; the IC is placed at apastron with the matching velocity.

Look at the readouts: under Verlet the angular momentum is conserved to machine precision (the central force has zero torque, and the integrator is symplectic), while the energy oscillates within a bounded envelope at level |dE/E| < 1e-3 over thousands of periods. The LRL vector magnitude equals the eccentricity e by construction and stays bounded over the simulation; secular drift would signal an integrator failure. Push e toward 0.9 and watch the orbit elongate and perihelion shrink to a(1 - e); the live drift readout grows correspondingly because the unresolved perihelion timescale tightens.

Controls: drag the a and e sliders to change the orbit; the IC re-seeds at apastron with the new parameters. Reset returns to a = 1, e = 0.6 (the engine-test benchmark). Play/Pause toggles integration. Trails are bounded to 1500 samples after the most recent reset.

## Reference

Primary citation: Newman, "Computational Physics", 2013, Exercise 8.12 "Orbit of the Earth" (bib key `newman2013`, verified in chapter_index). Engine: `shared/js/engine/symplectic.js`, validated in `tests/engines/symplectic.test.mjs` for Kepler at e = 0.6 over 10^4 periods.

## Verification

- Strong invariants:
  - |dE/E| < 1e-3 over 10^3 periods at a = 1, e = 0.6, dt = 0.01.
  - |dL/L| < 1e-10 over 10^3 periods (central force, symplectic Verlet).
- Medium invariant: LRL magnitude bounded; |dA/A| < 5e-3 over 10^3 periods.
- Visual gate: SSIM > 0.92 against committed golden frames at five eccentricity values 0 -> 0.6.
- Last verified: see `.verified`.
