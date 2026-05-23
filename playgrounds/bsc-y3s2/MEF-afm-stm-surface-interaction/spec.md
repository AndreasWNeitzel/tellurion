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
one_paragraph: 'An interactive scanning-probe-microscopy model. A tip scans an atomically corrugated surface. In AFM the tip-sample interaction is a Lennard-Jones potential V(d) = 4 eps [(sig/d)^12 - (sig/d)^6] (force zero at d = 2^{1/6} sigma, repulsive inside, attractive outside). In STM the tunnelling current decays exponentially with the gap, I proportional to V exp(-2 kappa d) with kappa = sqrt(2 m phi)/hbar; for a metallic work function (~5 eV) that is about a decade of current per angstrom, the origin of STM atomic resolution. Modes: an AFM force curve and scan, an STM constant-height current map (atomic contrast straight from the exponential gap dependence), and an STM constant-current topograph that traces the surface corrugation. The point is why these microscopes reach atomic resolution: the tunnelling current changes by roughly a factor of ten for every angstrom the tip moves, so a single surface atom stands out sharply. Reference: Chen, Introduction to Scanning Tunneling Microscopy; Sakurai and Napolitano, Modern Quantum Mechanics, Chapter 2 (tunnelling).'
tags: [nanotech, spm, lennard-jones, tunnelling, live-readout]
difficulty: 4
tier: medium
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 5
share_state_keys: [spm_mode, gap, work_function]
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

# AFM and STM: Tip-Surface Interaction

## Explainer

### What you are looking at

Drag a needle-sharp tip a few atoms above a surface and you can map
individual atoms, because two signals (the tip-sample force, and the
quantum tunneling current) change enormously over an angstrom. That
ferocious distance sensitivity is what gives scanning-probe microscopes
their atomic resolution. The playground shows both contrast mechanisms
versus tip height.

### STM: exponential tunnelling current

A bias voltage $V$ drives electrons to tunnel across the vacuum gap
of width $d$. The vacuum is a classically forbidden barrier of
height $\phi$ (the sample work function); inside it the
wavefunction decays as $\psi(z) \propto e^{-\kappa z}$ with

$$\kappa = \frac{\sqrt{2 m_e \phi}}{\hbar}.$$

The transmission probability through a barrier of width $d$ is then
$T \propto e^{-2\kappa d}$, so the tunnelling current is

$$\boxed{\;I(d) \;\propto\; V\,e^{-2\kappa d}.\;}$$

For a typical metal work function $\phi \approx 4.5\,\mathrm{eV}$,
$2\kappa \approx 2.2\,\mathrm{\AA^{-1}}$, so the current changes
by about a factor of $e^{2.2} \approx 9$ per angstrom of height.
That single exponential is why STM resolves single atoms: a one-
atom bump under the tip multiplies the current by roughly 10, which
swamps every other contrast mechanism.

A more detailed treatment due to Tersoff and Hamann (1985) gives

$$I \propto V\,\rho_s(E_F, \vec r_{\rm tip})\,e^{-2\kappa d},$$

where $\rho_s(E_F, \vec r_{\rm tip})$ is the sample's local density
of states at the Fermi level at the tip position. So the STM image
is the contour of constant LDOS, not literally of the topography.

### AFM: the tip-sample force

When tunnelling is not available (insulators) the atomic-force
microscope measures the mechanical interaction directly. A common
model is the Lennard-Jones (1924) pair potential between tip and
sample atoms,

$$\boxed{\;U_{\rm LJ}(d) = 4\,\epsilon\,\left[\left(\frac{\sigma}{d}\right)^{12}
       - \left(\frac{\sigma}{d}\right)^{6}\right],\;}$$

with force $F(d) = -dU_{\rm LJ}/dd$:

$$F(d) = \frac{24\,\epsilon}{\sigma}\,\left[2\,\left(\frac{\sigma}{d}\right)^{13}
        - \left(\frac{\sigma}{d}\right)^{7}\right].$$

The $r^{-6}$ term is the long-range van der Waals (London dispersion)
attraction; the $r^{-12}$ term is the hard Pauli repulsion on contact.
The force passes through zero at $d = \sigma\,2^{1/6}$ and has its
minimum (deepest attraction) at $d = \sigma\,2^{1/6}$ as well.

In tapping or non-contact AFM the cantilever oscillates at its
mechanical resonance $\omega_0$; the resonance frequency shifts with
the LOCAL force gradient $k_{\rm ts} = -dF/dd$,

$$\Delta\omega \approx -\frac{\omega_0}{2 k}\,k_{\rm ts},$$

where $k$ is the cantilever stiffness. So AFM measures $dF/dd$ at
sub-angstrom resolution.

### Symbols, at a glance

- $V$, tip-sample bias voltage (V).
- $d$, tip-sample gap (m or angstroms).
- $\phi$, sample work function (eV).
- $m_e$, electron mass; $\hbar$, reduced Planck constant.
- $\kappa = \sqrt{2 m_e \phi}/\hbar$, the decay length inside the
  vacuum barrier (about $1.1\,\mathrm{\AA^{-1}}$ for typical $\phi$).
- $\epsilon$, $\sigma$, the Lennard-Jones depth and length scale
  (set by the chemistry of the tip and sample atoms).
- $F$, tip-sample force; $k_{\rm ts} = -dF/dd$ the force gradient.
- $\omega_0$, $k$, cantilever resonance frequency and stiffness.

### Things to try

- Lower the tip and watch the STM current rise exponentially (a
  decade per angstrom): the basis of constant-current imaging.
- Approach in AFM mode and watch attraction switch to steep repulsion
  through the LJ minimum.
- Compare the two: STM needs a conductor; AFM works on anything but
  reads force, not current.

### Bibliographic origin

STM was invented at IBM Zurich: Binnig and Rohrer, *Helv. Phys. Acta*
**55** (1982) 726, with the first atomic-resolution image of Si(111)
in Binnig, Rohrer, Gerber and Weibel, *Phys. Rev. Lett.* **50** (1983)
120 (1986 Nobel Prize). The LDOS interpretation: Tersoff and Hamann,
*Phys. Rev. B* **31** (1985) 805. AFM: Binnig, Quate and Gerber,
*Phys. Rev. Lett.* **56** (1986) 930. Lennard-Jones potential:
Lennard-Jones, *Proc. R. Soc. A* **106** (1924) 463. Modern textbook
treatments: Wiesendanger, *Scanning Probe Microscopy and
Spectroscopy* (Cambridge 1994), Ch. 1, 2; Sarid, *Scanning Force
Microscopy* (Oxford 1991).

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
  2008, the tunnelling current and the decay constant.
- Binnig, Quate and Gerber, Phys. Rev. Lett. 56 (1986) 930
 , the atomic force microscope and the tip-sample
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
