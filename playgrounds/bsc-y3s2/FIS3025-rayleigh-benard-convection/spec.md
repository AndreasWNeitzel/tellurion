---
title: Rayleigh-Benard Convection: Onset of Instability
slug: rayleigh-benard-convection
status: verified
audience: portfolio
created: 2026-05-17
primary_uc: FIS3025
supporting_ucs: []
curriculum_year: bsc-y3s2
primary_citation: chandrasekhar1961
hook: 'Heat a fluid layer from below: nothing moves until the Rayleigh number crosses a sharp threshold, then the layer breaks into counter-rotating rolls. The threshold for stress-free plates is the exact closed form Ra_c = 27 pi^4 / 4 ~= 657.51, and the engine reproduces it to better than 0.2%.'
one_paragraph: 'A fluid layer heated from below convects only once buoyancy overcomes the damping of viscosity and thermal diffusion. The control parameter is the Rayleigh number Ra; for stress-free, perfectly conducting plates the linear stability problem is solved exactly. A normal mode proportional to sin(pi y) exp(i k x) is neutrally stable along the curve Ra(k) = (k^2 + pi^2)^3 / k^2, whose minimum at k_c = pi/sqrt(2) gives the closed-form critical value Ra_c = 27 pi^4 / 4 ~= 657.5. Below it any perturbation decays and heat crosses by conduction alone (Nusselt number 1); above it the critical roll grows exponentially and overturning convection sets in, and the onset is independent of the Prandtl number. The playground shows the roll eigenmode growing or decaying alongside the neutral curve with the exact critical point and the live operating point. Reference: Chandrasekhar, Hydrodynamic and Hydromagnetic Stability, Chapter 2; Drazin and Reid, Hydrodynamic Stability.'
tags: [fluids, convection, instability, linear-stability, live-readout]
difficulty: 5
tier: hero
hero_candidate: true
renderer: canvas2d
estimated_engagement_minutes: 6
share_state_keys: [rayleigh, wavenumber, prandtl]
invariants:
  - key: runs
    label: simulation advances each frame
    tolerance: 1
  - key: bounded
    label: state stays finite
    tolerance: 1
  - key: deterministic
    label: fixed seed reproduces the run
    tolerance: 1
what_to_try:
  - Vary each control and watch the rail readouts respond.
  - Compare the diagnostic plot against the live scene.
---

# Rayleigh-Benard Convection: Onset of Instability

## Explainer

### What you are looking at

Heat a fluid layer from below. At first nothing moves and heat just
conducts up. Past a sharp threshold the still layer becomes unstable
and breaks into orderly counter-rotating rolls, the patterned
convection you see in a heated pan or in the Sun. This playground sits
right at that onset.

### The competition, in one number

Warm fluid at the bottom is lighter and wants to rise (buoyancy);
viscosity and thermal diffusion fight that. Their ratio is the
Rayleigh number,

$$\mathrm{Ra} = \frac{g\,\alpha\,\Delta T\,d^3}{\nu\,\kappa},$$

with $g$ gravity, $\alpha$ thermal expansion, $\Delta T$ the
top-bottom temperature difference, $d$ the depth, $\nu$ viscosity,
$\kappa$ thermal diffusivity. Large Ra means buoyancy wins.

### The instability threshold

Linearizing the Boussinesq equations about the motionless conducting
state and asking when an infinitesimal perturbation stops decaying
gives a marginal-stability condition. For stress-free, perfectly
conducting plates it has a closed form, and the minimum over horizontal
wavenumber is exact:

$$\mathrm{Ra}_c = \frac{27\pi^4}{4} \approx 657.5,$$

at critical wavenumber $k_c = \pi/\sqrt2$ (so the rolls are about as
wide as the layer is deep). Below $\mathrm{Ra}_c$ every mode decays:
pure conduction, no motion. Above it, the mode at $k_c$ grows and sets
the roll wavelength. The threshold is an exact number set by the
stability analysis, not a quoted constant. The playground sweeps Ra
through $\mathrm{Ra}_c$ and shows the still layer give way to rolls.

### Things to try

- Hold Ra just below $\mathrm{Ra}_c$: the layer stays motionless,
  straight conduction temperature profile.
- Push Ra past $\approx 657.5$ and watch counter-rotating rolls switch
  on at the predicted wavelength.
- Note the roll width: comparable to the layer depth (set by $k_c$),
  not arbitrary.

### Where this comes from

The Boussinesq linear-stability analysis, the Rayleigh number, and the
$\mathrm{Ra}_c = 27\pi^4/4$ free-slip threshold follow Chandrasekhar,
*Hydrodynamic and Hydromagnetic Stability*, and Drazin and Reid,
*Hydrodynamic Stability*.

## Physical setup

A fluid layer of depth `d` heated from below (hot plate `T = 1` at the
bottom) and cooled from above (cold plate `T = 0` at the top). Buoyancy
drives motion; viscosity and thermal diffusion damp it. The competition
is the Rayleigh number `Ra = g alpha Delta T d^3 / (nu kappa)`. Below a
critical `Ra_c` the layer is motionless and heat crosses by conduction;
above it the motionless state is linearly unstable and the layer
organises into steady counter-rotating convection rolls. With
stress-free, perfectly conducting plates the marginal-stability problem
has a closed-form solution, so the threshold is an exact number set
by the analysis, not a quoted constant.

## Governing equations

Boussinesq equations (length `d`, time `d^2/kappa`, velocity
`kappa/d`, temperature `Delta T`), perturbation `theta` about the
linear conduction profile:

```math
\frac{\partial \mathbf{u}}{\partial t}
  = -\nabla p + \mathrm{Pr}\,\nabla^2\mathbf{u} + \mathrm{Ra}\,\mathrm{Pr}\,\theta\,\hat{\mathbf{y}},
  \quad \nabla\cdot\mathbf{u}=0, \quad
\frac{\partial \theta}{\partial t} = \nabla^2\theta + w .
```

Linearising about `u = 0, theta = 0` and taking a normal mode
`exp(sigma t) exp(i k x) sin(pi y)` (the gravest stress-free,
conducting mode) reduces the system to a quadratic for the growth
rate `sigma`. The marginal curve `sigma = 0` (Rayleigh 1916;
Chandrasekhar 1961, Ch. II; Drazin and Reid 2004, sec. 2) is

```math
\mathrm{Ra}(k) = \frac{(k^2 + \pi^2)^3}{k^2},
```

minimised at `k_c^2 = pi^2/2`, i.e. `k_c = pi/sqrt(2) ~= 2.2214`,
giving the exact critical value

```math
\mathrm{Ra}_c = \frac{(\tfrac32\pi^2)^3}{\pi^2/2} = \frac{27\,\pi^4}{4} \approx 657.5113 .
```

The corresponding roll wavelength is `lambda_c = 2 pi / k_c
= 2 sqrt(2) ~= 2.83` depths. The reduced growth rate solves
`sigma^2 + M(Pr+1) sigma + Pr (M^2 - a^2 Ra / M) = 0` with
`M = a^2 - lambda_1` and `lambda_1` the discrete vertical-Laplacian
eigenvalue at resolution `NY`; the marginal `Ra = M^3/a^2` is
`Pr`-independent (principle of exchange of stabilities).

## Numerical method

The playground renders the closed-form linear theory, which is robust
and deterministic (no nonlinear pressure-Poisson DNS, whose iterative
elliptic solve is fragile at interactive cost). The shared engine
`shared/js/engine/boussinesq-2d-cpu.js` provides `discreteRaC(NY, k)`
(the discrete neutral `Ra` from `M^3/a^2` with the engine's discrete
vertical-Laplacian eigenvalue) and `linearSigma(NY, Ra, Pr, k)` (the
dominant root of the reduced quadratic). The top canvas panel paints
the eigenmode `theta = A sin(pi y) cos(k x)` with `A` evolving as
`exp(sigma t)` (tanh-clamped for display so the rolls stay visible;
the physics is the sign and magnitude of `sigma`). The bottom panel
plots `Ra(k)` on a log axis with the exact critical point and the
live operating point. The engine also carries the full nonlinear
Boussinesq stepper (MAC, periodic-x, stress-free, gauge-fixed) and an
exact conduction-equilibrium check, used for the equilibrium invariant;
a converged nonlinear DNS is a documented stretch goal.

## Controls

- Ra: slider in units of `Ra_c` (`0.2` to `8 Ra_c`), default `2 Ra_c`.
- wavenumber `k`: slider `0.6` to `7`, default `k_c ~= 2.22`.
- Prandtl `Pr`: slider `0.1` to `10`, default `1`; the neutral curve
  does not move with `Pr` (onset is `Pr`-independent), which the
  control demonstrates.
- reset, pause: buttons.
- Live monospace readouts: `Ra_c` measured vs exact (`discreteRaC`
  against `27 pi^4 / 4`, the headline), `sigma`, `Ra / Ra_c`, and the
  stable/unstable state.
- Share-state keys: `rayleigh`, `wavenumber`, `prandtl` (parseUrlState
  restore plus a Copy-URL button).

## Expected qualitative features

- `Ra < Ra_c` (below the curve): `sigma < 0`, the seeded roll mode
  decays, the field fades to the motionless conduction state; readout
  state `stable`.
- `Ra > Ra_c` (above the curve): `sigma > 0`, the roll mode grows
  into visible counter-rotating cells of wavelength `~2.83` depths;
  readout state `unstable`.
- Moving `k` away from `k_c` along a fixed `Ra` raises the `Ra`
  needed to be unstable (the operating point moves relative to the
  U-shaped curve); `k_c` is the least stable mode.
- Changing `Pr` does not move the neutral curve or the critical
  point (Chandrasekhar): the stability boundary is `Pr`-independent.
- The measured `Ra_c` readout sits at `~657.4` (NY = 96), within
  0.2% of the exact `657.5113`.

## Invariants and acceptance thresholds

Checked offline by the shared engine through `sim.js` in
`invariants.test.mjs`, and at the engine level in
`tests/engines/boussinesq-2d-cpu.test.mjs` (no GPU):

- exact critical value and convergence (strong, headline):
  `discreteRaC(NY, k_c)` is within `3%` of `27 pi^4/4` at `NY = 32`
  and converges monotonically, under `0.2%` by `NY = 160`.
- neutral-curve minimum (strong): `discreteRaC(NY, k)` for any
  `k != k_c` exceeds the value at `k_c` (`k_c` is the least stable
  mode).
- sign change and monotonicity (strong): `linearSigma` is monotone
  increasing in `Ra`, negative below `Ra_c`, positive above, and
  exactly zero at the critical value (`< 1e-6`).
- Prandtl independence (strong): the marginal `Ra` is the same for
  `Pr in {0.3, 1, 7}` (sign flips at the same critical value).
- conduction equilibrium (strong): `theta = 0, u = 0` is an exact
  discrete equilibrium (`||u||_inf < 1e-8` over 300 steps) with
  `Nu = 1` to `1e-6`.
- determinism (medium): the linear functions are pure and reproduce
  their outputs exactly.

Visual gate: five Playwright frames (init, 25, 50, 75, terminal) of
the deterministic sweep (`Ra = 2 Ra_c`, `k = k_c`, `Pr = 1`; the
eigenmode amplitude evolving as `exp(sigma t)`), SSIM at least `0.92`
vs committed golden frames. Deterministic (no RNG; closed-form).

## Limiting cases for verification

- `Ra -> 0`: `sigma < 0` for all `k`, motionless conduction.
- `Ra -> Ra_c^-`: the slowest-decaying mode is `k_c`; `sigma -> 0`.
- `Ra -> Ra_c^+`: the `k_c` mode is the first to grow; rolls of
  wavelength `2 sqrt(2)` depths.
- `Pr` independence: the neutral curve is unchanged for any `Pr`.

## Visual fallback

Pure Canvas2D over the closed-form linear theory: no WebGL, no
iterative solver, so the headless capture and the SSIM gate are
robust and the run is bitwise deterministic. The engine invariants,
including the exact critical value and its convergence, run GPU-free
in node.

## Citations

In `docs/CITATIONS.bib`:

- Rayleigh, Phil. Mag. (6) 32 (1916) 529 (`rayleigh1916`), the
  original linear theory and the free-free critical value.
- Chandrasekhar, Hydrodynamic and Hydromagnetic Stability, OUP 1961,
  Ch. II (`chandrasekhar1961`), the marginal curves, the free-free
  `27 pi^4/4`, and the principle of exchange of stabilities.
- Drazin and Reid, Hydrodynamic Stability, CUP 2004, sec. 2
  (`drazin-reid`), the neutral curve `(k^2+pi^2)^3/k^2`.
- Chorin, Math. Comput. 22 (1968) 745 (`chorin1968`), the projection
  method (the engine's nonlinear-DNS stretch path).

## Stretch goals

- A converged nonlinear DNS mode that saturates the rolls and traces
  `Nu(Ra)` against the weakly-nonlinear `~ (Ra - Ra_c)` law.
- A rigid-rigid (no-slip) mode whose measured `Ra_c` is checked
  against the transcendental `1707.76` (Chandrasekhar).
- An overlay of the measured neutral points on the analytic curve.

## Risk register

- Over-claiming a nonlinear DNS: avoided. The shipped path is the
  closed-form linear theory, gate-tested against the exact value; the
  fragile nonlinear pressure-Poisson DNS is explicitly a stretch, not
  the gated artifact.
- Wrong `Ra_c`: mitigated by gating against the exact free-free
  `27 pi^4/4` (not the rigid-rigid `1707`), with a stated
  grid-convergence check.
- Engagement: the growing/decaying roll mode plus the live neutral
  curve and the `Ra_c` readout make the threshold visible and
  interactive.

## Implementation notes

`shared/js/engine/boussinesq-2d-cpu.js` exports `RA_C`, `K_C`,
`LAMBDA_C`, `discreteRaC`, `linearSigma` (the gated linear theory)
plus `createState`, `step`, `project`, `divergenceMax`, `nusselt`
(the nonlinear stretch path and the equilibrium check).
`tests/engines/boussinesq-2d-cpu.test.mjs` asserts the linear-onset
invariants and the conduction equilibrium. `sim.js` re-exports the
engine so `invariants.test.mjs` validates the exact code the renderer
uses. `playground.js` is pure Canvas2D: the eigenmode panel and the
neutral-curve panel, a throttled readout, and the
`?deterministic=1&capture=NAME&captureFraction=F` capture contract.
