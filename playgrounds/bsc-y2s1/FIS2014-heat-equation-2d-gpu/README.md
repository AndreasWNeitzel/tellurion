# Interactive 2D Heat Equation

This playground solves the variable-conductivity heat equation
`dT/dt = div(kappa grad T) + S` on a 96x96 grid with explicit finite
differences. The primary scene is the physical temperature field
(viridis) with live conductive-flux streamlines `q = -kappa grad T`;
the side panel is the mid-row cross-section `T(x)`. The default
composite-wall preset is a high-conductivity metal half joined to a
low-conductivity insulator half between a hot and a cold face.

Watch the composite wall: heat sweeps across the metal almost without
a temperature drop, then piles up against the insulator and falls off
a cliff. The flux is continuous through the interface, so the gradient
is steeper in the poorer conductor by the conductivity ratio, which is
the kink you see in the `T(x)` panel. Switch presets for a linear rod,
a radiator plume, fin-channelled heat-sink flow, or an insulated
quench that spreads at constant total heat.

The preset selector loads a scenario; `kappa contrast` sets the
conductor/insulator ratio; `source T` is the absolute driving
temperature on a fixed colour scale; `sim rate` is the number of
finite-difference steps per displayed frame; the paint brush adds
metal, insulator, heat or cold by click and drag on the field; Reset
restores the default composite wall and Pause freezes the integration.
The CFL time step is shown live and is re-checked whenever
conductivity changes.

## Reference

Primary citation: Press et al., *Numerical Recipes* (3rd ed.),
Sec. 20.2 (`press2007`).

## Verification

- Strong invariant: total heat conserved in an insulated source-free
  box (threshold 0.1%); uniform-`kappa` steady state is the linear
  Laplace profile within 1%.
- Visual gate: SSIM > 0.92 against committed golden frames at seed
  0xC0FFEE.
- Last verified: see `.verified`.
