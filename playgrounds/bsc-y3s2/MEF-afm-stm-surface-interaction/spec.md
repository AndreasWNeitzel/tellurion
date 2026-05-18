---
title: AFM and STM: Tip-Surface Interaction
slug: afm-stm-surface-interaction
status: verified
audience: portfolio
created: 2026-05-18
primary_uc: MEF
supporting_ucs: []
curriculum_year: bsc-y3s2
primary_citation: chen2008
hook: 'A sharp tip over a surface: AFM feels the Lennard-Jones force (zero at 2^{1/6} sigma), STM draws a current that decays exponentially with the gap, a full decade per angstrom for a metallic work function, which is why STM resolves single atoms.'
one_paragraph: 'An interactive scanning-probe-microscopy model. A tip scans an atomically corrugated surface. In AFM the tip-sample interaction is a Lennard-Jones potential V(d) = 4 eps [(sig/d)^12 - (sig/d)^6] (force zero at d = 2^{1/6} sigma, repulsive inside, attractive outside). In STM the tunnelling current decays exponentially with the gap, I proportional to V exp(-2 kappa d) with kappa = sqrt(2 m phi)/hbar; for a metallic work function (~5 eV) that is about a decade of current per angstrom, the origin of STM atomic resolution. Modes: AFM force curve and scan, STM constant-height (atomic-contrast current map), and STM constant-current (the topograph that reproduces the surface). The Lennard-Jones minimum, the exponential law, the decade-per-angstrom sensitivity, and the constant-current topograph are gate-tested closed forms (sim.js); deterministic.'
tags: [nanotech, spm, lennard-jones, tunnelling, live-readout]
difficulty: 4
tier: medium
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 5
share_state_keys: [spm_mode, gap, work_function]
---

# AFM and STM: Tip-Surface Interaction

## Explainer

### What you are looking at

Drag a needle-sharp tip a few atoms above a surface and you can map
individual atoms, because two signals (the tip-sample force, and the
quantum tunneling current) change enormously over an angstrom. That
ferocious distance sensitivity is what gives scanning-probe microscopes
their atomic resolution. The playground shows both contrast mechanisms
versus tip height.

### STM: exponential tunneling current

A bias voltage drives electrons to tunnel across the vacuum gap of
width $d$. The barrier is classically forbidden, so the current decays
exponentially with gap:

$$I \;\propto\; V\,e^{-2\kappa d},
  \qquad \kappa = \frac{\sqrt{2m\phi}}{\hbar},$$

with $\phi$ the work function. For a typical $\phi$, the current
changes by about a factor of 10 per angstrom of height. That single
exponential is why STM resolves single atoms: a one-atom bump under the
tip swamps everything else in the current.

### AFM: the tip-sample force

When tunneling is not available (insulators), atomic-force microscopy
measures the mechanical interaction, a Lennard-Jones-like force,
long-range van der Waals attraction turning to hard Pauli repulsion on
contact:

$$F(d) \;\propto\; \left(\frac{\sigma}{d}\right)^{13}
  - \left(\frac{\sigma}{d}\right)^{7}.$$

A cantilever senses this; in tapping/non-contact mode the resonance
frequency shifts with the force gradient $dF/dd$, again steeply
distance-dependent. The playground sweeps the tip height and shows the
tunneling current and the force/force-gradient, so the exponential and
the LJ well are explicit.

### Things to try

- Lower the tip and watch the STM current rise exponentially (a
  decade per angstrom): the basis of constant-current imaging.
- Approach in AFM mode and watch attraction switch to steep repulsion
  through the LJ minimum.
- Compare the two: STM needs a conductor; AFM works on anything but
  reads force, not current.

### Where this comes from

The exponential tunneling current and the Lennard-Jones tip-sample
force follow the scanning-probe treatment in Binnig and Rohrer's STM
work (1982) and Sarid, *Scanning Force Microscopy*.

## Physical setup

A sharp probe tip is brought within angstroms of a surface and
scanned across it. Two contrast mechanisms: the mechanical
tip-sample force (atomic force microscopy) and the quantum-mechanical
tunnelling current across the vacuum gap (scanning tunnelling
microscopy). Both are extraordinarily sensitive to the tip-sample
separation, which is what lets a scanning probe resolve individual
atoms.

## Governing equations

```math
V(d) = 4\varepsilon\!\left[\left(\tfrac{\sigma}{d}\right)^{12}
  - \left(\tfrac{\sigma}{d}\right)^{6}\right], \qquad
F(d) = -\frac{dV}{dd}, \qquad
I \propto V\,e^{-2\kappa d}, \quad \kappa = \frac{\sqrt{2 m \phi}}{\hbar}.
```

The LJ force vanishes at `d = 2^{1/6} sigma` (the potential minimum,
`V = -eps`); it is repulsive for smaller `d`, attractive for larger.
With `hbar^2 / 2m = 3.81 eV A^2`, `kappa = sqrt(phi / 3.81)` per
angstrom, so `I(d)/I(d+1 A) = exp(2 kappa)`; a metallic work function
`phi ~ 5 eV` gives `kappa ~ 1.15 A^-1` and a factor `~10` per
angstrom (Chen 2008; Binnig, Quate and Gerber 1986).

## Numerical method

No simulation: the LJ potential/force, the tunnelling law and the
constant-current topograph are evaluated in closed form in `sim.js`,
so the invariants hold to round-off and the run is deterministic. The
Canvas2D playground draws the corrugated surface with the scanning
tip, the active interaction law (LJ force or the exponential decay on
a log axis), and the scan signal versus tip position. No engine reuse
is required (closed-form algebra).

## Controls

- mode: AFM force / STM constant-height / STM constant-current,
  default STM constant-current.
- gap / setpoint: slider `2.0` to `9.0` angstrom, default `5.0`.
- work function phi: slider `1.0` to `8.0` eV, default `5.0`.
- reset, pause: buttons (pause stops the scan sweep).
- Live monospace readouts: the gap `d`, `kappa`, the per-angstrom
  current factor, and the instantaneous signal.
- Share-state keys: `spm_mode`, `gap`, `work_function`.

## Expected qualitative features

- AFM: the force curve crosses zero at `d = 2^{1/6} sigma`,
  repulsive inside, attractive then decaying outside; the scan force
  modulates with the lattice.
- STM: the `I(d)` curve is a straight line on the log axis (pure
  exponential); the readout shows `~ x10` per angstrom at `phi = 5`.
- STM constant-height: the current swings strongly with the atomic
  corrugation (high contrast).
- STM constant-current: the tip-height topograph reproduces the
  surface corrugation.
- Lowering `phi` flattens the decay (smaller factor per angstrom);
  raising it sharpens it.

## Invariants and acceptance thresholds

Checked offline through `sim.js` in `invariants.test.mjs` (no GPU):

- Lennard-Jones minimum (strong): zero force and `V = -eps` exactly
  at `d = 2^{1/6} sigma`; repulsive inside, attractive outside;
  `V, F -> 0` as `d -> infinity`.
- exponential tunnelling (strong): `I` is exactly proportional to
  `V exp(-2 kappa d)`; the ratio is independent of the bias scale
  and the absolute gap; monotone decreasing.
- decade per angstrom (strong, the headline): at `phi = 5.05 eV`,
  `I(d)/I(d+1) ~ 10` (within 1%); at `phi = 5 eV` within 5% of 10;
  `kappa = sqrt(phi / 3.81)`.
- constant-current topograph (strong): the tip height minus the
  surface is constant (the topograph reproduces the corrugation).
- AFM scan (medium): the force is most repulsive over the surface
  maxima (smallest gap).
- determinism (medium): pure functions reproduce outputs exactly.

Visual gate: five Playwright frames (init, 25, 50, 75, terminal) of
the deterministic STM constant-current sweep, SSIM at least `0.92`
vs committed golden frames. Deterministic (no RNG; closed form).

## Limiting cases for verification

- `d -> infinity`: LJ force and potential vanish; tunnelling current
  vanishes exponentially.
- `d = 2^{1/6} sigma`: AFM force exactly zero.
- `phi -> 0`: tunnelling decay flattens (no atomic resolution).
- constant-current mode: topograph equals the surface profile.

## Visual fallback

Pure Canvas2D over closed-form algebra: no WebGL, no solver, no RNG,
so the headless capture and SSIM gate are robust. The invariants run
GPU-free in node.

## Citations

In `docs/CITATIONS.bib`:

- Chen, Introduction to Scanning Tunneling Microscopy, 2nd ed., OUP
  2008 (`chen2008`), the tunnelling current and the decay constant.
- Binnig, Quate and Gerber, Phys. Rev. Lett. 56 (1986) 930
  (`binnig1986`), the atomic force microscope and the tip-sample
  force.

## Stretch goals

- Tapping-mode AFM: a driven cantilever amplitude versus the LJ
  interaction.
- A 2D surface and a real raster topograph image.
- dI/dV spectroscopy (the local density of states).

## Risk register

- Lennard-Jones is a model interaction (real tips are more complex);
  documented as such, the gated quantity is the exact LJ form.
- HUD occlusion: the scanning tip passes briefly behind the corner
  readout panel each sweep (standard HUD behaviour, not a defect);
  all panels remain legible.
- Engagement: the mode selector and the work-function slider are the
  dramatic controls, the decade-per-angstrom sensitivity changes
  visibly.

## Implementation notes

`sim.js` is self-contained (`ljPotential`, `ljForce`,
`ljMinDistance`, `kappa`, `stmCurrent`, `decadePerAngstrom`,
`surfaceProfile`, `stmConstantHeight`, `stmTopograph`,
`afmForceScan`); `invariants.test.mjs` imports it directly.
`playground.js` is pure Canvas2D: the surface + tip, the interaction
law, the scan trace, a throttled readout, and the
`?deterministic=1&capture=NAME&captureFraction=F` capture contract.
