# Single-Particle Motion: Drifts in E and B

A single charged particle moving under the Lorentz force
`m dv/dt = q(E + v x B)` in static fields, integrated with the Boris
pusher, the standard time-reversible plasma integrator that conserves
the particle speed exactly when the field is purely magnetic. In a
uniform `B` the orbit is a helix at the cyclotron frequency. Add a
perpendicular `E` and the guiding centre slides at `E x B / B^2`, the
same drift for every charge and mass. Gradients and curvature of `B`
give the grad-B and curvature drifts; a converging field is a magnetic
mirror that reflects the particle while conserving the adiabatic
invariant `mu = m v_perp^2 / 2B`. The 3D orbit is drawn as an
orthographic Canvas2D projection (a deterministic, gate-robust
renderer; the motion really is 3D, this is honestly a projection of
it). Physics is the gate-tested `sim.js`.

What to look for: the cyclotron preset is a clean helix and `|v|`
stays fixed to nine digits (the Boris property); switch to E x B and
the helix's centre drifts sideways, and the drift is identical whether
you pick `q = +1` or `q = -1` (only the gyration sense flips); grad-B
and curvature give slow cross-field drifts; the magnetic mirror preset
sends the particle into the strong-field region where it slows along
the field and turns around, with the `mu` readout staying put. The
B-strength slider sets the field, the speed slider the steps per
frame.

Controls: the preset selector, the B-strength slider, the charge sign,
the speed slider, Reset and Pause. Copy URL shares the current state.

## Reference

Primary citations: Chen, *Introduction to Plasma Physics and
Controlled Fusion*, 2nd ed., Plenum 1984, ch. 2 (`chen1984`), for the
guiding-centre drifts and the mirror invariant; Boris, *Relativistic
Plasma Simulation*, Proc. 4th Conf. Num. Sim. Plasmas (1970)
(`boris1970`), for the integrator; Northrop, *The Adiabatic Motion of
Charged Particles*, Interscience 1963 (`northrop1963`); Jackson,
*Classical Electrodynamics*, 3rd ed. (`jackson1998`).

## Verification

- Strong invariants (offline, `sim.js`): the Boris pusher conserves
  `|v|` to `< 1e-9` in pure B; the cyclotron period matches
  `2 pi m/|q|B`; the E x B drift equals `E x B / B^2` to `< 2%` and
  is charge-independent; the magnetic mirror reflects the particle
  with the gyro-averaged `mu` conserved to `< 10%`.
- Visual gate: SSIM > 0.92 against committed golden frames of the
  deterministic cyclotron sweep.
- Last verified: see `.verified`.
