# Rayleigh-Benard Convection: Onset of Instability

This is the classic instability of a fluid layer heated from below,
shown through its exact linear theory. For stress-free, perfectly
conducting plates the motionless conduction state goes unstable on a
closed-form neutral curve, `Ra(k) = (k^2 + pi^2)^3 / k^2`, whose
minimum is the critical Rayleigh number `Ra_c = 27 pi^4 / 4 ~= 657.51`
at wavenumber `k_c = pi/sqrt(2)`. The top panel is the critical
convection-roll eigenmode `theta ~ sin(pi y) cos(k x)`, its amplitude
evolving as `exp(sigma t)`: it grows into counter-rotating rolls above
the curve and fades to a still layer below it. The bottom panel is the
neutral curve itself, with the exact critical point and your live
operating point marked. The numerics are the gate-tested shared
Boussinesq engine (`shared/js/engine/boussinesq-2d-cpu.js`).

What to look for: with the Reynolds-like control set above `Ra_c` the
operating point sits above the curve, the readout says `unstable`, and
the rolls grow; drop below `Ra_c` and they decay to a flat field
(`stable`). Slide the wavenumber `k` away from `k_c` and you climb the
U-shaped curve, needing a higher `Ra` to stay unstable, because `k_c`
is the least stable mode. Move the Prandtl number and the curve does
not budge: the onset is Prandtl-independent (Chandrasekhar). The
`Ra_c` readout shows the engine's discrete value against the exact
`27 pi^4 / 4`; it agrees to better than 0.2% and converges with
resolution (this is gate-tested, not asserted).

This is the rigorous linear theory, deterministic and closed-form, not
a fragile nonlinear simulation; a converged nonlinear roll-saturation
DNS is a documented stretch goal. Controls: the Ra slider (in units of
`Ra_c`), the wavenumber slider, the Prandtl slider, Reset and Pause.
Copy URL shares the current state.

## Reference

Primary citations: Rayleigh, *On Convection Currents in a Horizontal
Layer of Fluid*, Phil. Mag. 32 (1916) 529 (`rayleigh1916`);
Chandrasekhar, *Hydrodynamic and Hydromagnetic Stability*, OUP 1961,
Ch. II (`chandrasekhar1961`), for the marginal curves, the free-free
`27 pi^4 / 4`, and Prandtl independence; Drazin and Reid,
*Hydrodynamic Stability*, CUP 2004, sec. 2 (`drazin-reid`), for the
neutral curve `(k^2 + pi^2)^3 / k^2`.

## Verification

- Strong invariants (offline, the shared engine via `sim.js`):
  `discreteRaC(NY, k_c)` within 3% of `27 pi^4/4` at coarse `NY` and
  converging under 0.2% by `NY = 160`; `k_c` the neutral-curve
  minimum; `linearSigma` monotone in `Ra` with an exact sign change
  at the critical value; Prandtl independence; the conduction state
  an exact equilibrium with `Nu = 1`.
- Visual gate: SSIM > 0.92 against committed golden frames of the
  deterministic sweep.
- Last verified: see `.verified`.
