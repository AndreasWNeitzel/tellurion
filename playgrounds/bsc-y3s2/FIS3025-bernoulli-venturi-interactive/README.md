# Bernoulli and the Venturi Effect

Steady incompressible flow through a pipe with a constriction. Mass
conservation forces the volumetric flow rate `Q = A(x) v(x)` to be the
same everywhere, so the fluid speeds up where the pipe is narrow;
Bernoulli's theorem `p + 1/2 rho v^2 = const` (horizontal pipe) then
forces the static pressure down exactly where the speed is up. The
piezometer columns make that visible: tall in the wide sections, a
stub at the throat, the Venturi effect. Tracer particles accelerate
through the throat. The airfoil inset is the same principle: faster
flow over the curved top means lower pressure and net upward lift. The
physics is the gate-tested closed form in `sim.js`.

What to look for: tighten the throat-ratio slider and the throat
column collapses while the throat speed climbs (the pressure dip
deepens); raise the flow rate or the density and it deepens further;
open the pipe to ratio 1 and every column is equal (no flow change).
Throughout, the two headline readouts, the relative spread of the
Bernoulli constant and of the flux `A v` along the pipe, stay at
machine zero: these are conservation identities, not numerical
tolerances, because the model is exact algebra rather than a
simulation. At extreme constriction the throat pressure goes negative;
that is the honest inviscid idealisation (cavitation in reality), shown
in the readout rather than hidden.

Controls: the throat-ratio slider, the flow-rate slider, the
density slider, Reset and Pause (Pause freezes the tracer particles).
Copy URL shares the current state.

## Reference

Primary citations: Tritton, *Physical Fluid Dynamics*, 2nd ed., OUP
1988, ch. 5 (`tritton`), for Bernoulli's theorem and the Venturi;
Batchelor, *An Introduction to Fluid Dynamics*, CUP 1967, sec. 3.5
(`batchelor1967`), for Bernoulli's theorem in steady inviscid flow.

## Verification

- Strong invariants (offline, `sim.js`): the flux `A v` and the
  Bernoulli constant `p + 1/2 rho v^2` are constant along the pipe to
  a relative `< 1e-3` (in practice `~1e-16`); the throat is strictly
  the fastest and lowest-pressure station; `v A = Q` exactly;
  airfoil lift has the right sign and scales linearly with density.
- Visual gate: SSIM > 0.92 against committed golden frames of the
  deterministic tracer sweep.
- Last verified: see `.verified`.
