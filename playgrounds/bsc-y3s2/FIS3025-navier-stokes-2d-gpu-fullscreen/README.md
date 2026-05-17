# Incompressible Wake and the Projection Method

This is Chorin's projection method made visible: a real incompressible
Navier-Stokes solver for flow past a bluff body, on a MAC staggered
grid (semi-Lagrangian advection, implicit diffusion, an iterated
pressure-Poisson projection). The colour is the speed |u|: a uniform
stream comes in from the left, accelerates around the obstacle (bright)
and leaves a low-speed wake behind it (dark). The headline is the
`max|div u|` readout: every step the pressure solve drives the
discrete divergence small, which is what "incompressible" means
numerically. The numerics are the shared engine
`shared/js/engine/chorin-2d-cpu.js`, gate-tested in
`tests/engines/chorin-2d-cpu.test.mjs`.

What to look for: pick the Stokes regime and the flow is a glassy,
near-symmetric creep that hugs the body. Steady wake gives a fixed,
closed, symmetric recirculating bubble. von Karman is the payoff: the
wake goes unstable and sheds a periodic street of alternating
vortices that detach from each side and convect downstream, the near
wake visibly asymmetric and time-dependent, unmistakably different
from the steady bubble. Broadband is a wider, more agitated wake.
Throughout, `max|div u|` stays small: the projection is enforcing
incompressibility in real time. How it sheds at an interactive grid:
the live path switches on the engine's BFECC low-dissipation
advection and Steinhoff vorticity confinement (both default-off, so
the offline invariants run the unmodified first-order scheme), which
cut the semi-Lagrangian numerical viscosity so the effective Reynolds
tracks the nominal one. The shed period gives an approximate Strouhal
number; the precise `St(Re)` stays a documented finer-grid quantity,
not asserted at this resolution.

Controls: the regime selector jumps between creeping, steady and
unsteady presets; the Reynolds slider tunes `nu = 1/Re`; the obstacle
selector picks a cylinder (a real circular disk, not a mislabelled
rectangle), a square or none (the body is offset slightly to seed the
asymmetry a deterministic solver needs); the speed slider sets physics
steps per frame so you can run it faster or slower; the tracer-dye
toggle adds passive streaks; Reset and Pause behave as labelled. Copy URL shares the current state. Motion is the evolving
flow; Pause freezes it.

## Reference

Primary citation: Chorin, *Numerical Solution of the Navier-Stokes
Equations*, Math. Comput. 22 (1968) 745 (`chorin1968`); the MAC
staggered grid is Harlow and Welch, Phys. Fluids 8 (1965) 2182
(`harlow-welch1965`); semi-Lagrangian advection is Stam, SIGGRAPH 99
(1999) 121 (`stam1999`); the BFECC low-dissipation advection is
Selle, Fedkiw, Kim, Liu and Rossignac, J. Sci. Comput. 35 (2008) 350
(`selle2008-bfecc`); vorticity confinement is Steinhoff and Underhill,
Phys. Fluids 6 (1994) 2738 (`steinhoff1994`).

## Verification

- Strong invariants (offline, the shared MAC engine via `sim.js`):
  a converged projection drives `max|div u| < 1e-3`; projecting an
  exactly divergence-free field is the identity (`< 1e-6`); finite
  and bounded at `Re = 1000` over 2000 steps; Stokes (`Re = 1`)
  top-bottom symmetry `< 5%` RMS; determinism `< 1e-12`.
- Visual gate: SSIM > 0.92 against committed golden frames of the
  deterministic time sweep (no RNG; bitwise-stable render).
- Last verified: see `.verified`.
