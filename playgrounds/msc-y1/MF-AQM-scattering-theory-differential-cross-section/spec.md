---
title: Scattering Theory: Differential Cross Section and Partial Waves
slug: scattering-theory-differential-cross-section
status: verified
audience: portfolio
created: 2026-05-18
primary_uc: MF-AQM
supporting_ucs: []
curriculum_year: msc-y1
primary_citation: taylor-scattering1972
hook: 'A plane wave hits a target and scatters into a spherical wave; the angular pattern is the differential cross section, shown here as a surface of revolution about the beam axis. The optical theorem ties the total cross section to the forward amplitude exactly, and the hard sphere goes from 4 pi a^2 at low energy to 2 pi a^2 at high energy.'
one_paragraph: 'An interactive quantum elastic-scattering playground. The partial-wave expansion f(theta) = (1/k) sum_l (2l+1) e^{i delta_l} sin delta_l P_l(cos theta) gives the differential cross section dsigma/dOmega = |f|^2 (drawn as a rotating-probe surface of revolution about the beam axis, with the incident plane wave and the outgoing spherical wave), the partial-wave phase shifts delta_l (hard sphere: tan delta_l = j_l(ka)/n_l(ka), on the principal branch so delta_l -> 0 as l -> infinity), and the total cross section sigma_tot = (4 pi / k^2) sum (2l+1) sin^2 delta_l = (4 pi / k) Im f(0) (the optical theorem). Yukawa and square-well targets use the Born approximation, the Fourier transform of the potential f_B(q) = -(1/q) integral r V(r) sin(qr) dr with q = 2k sin(theta/2), and the panel then shows V(r). Watching the phase shifts and the angular pattern shows the physics: a hard sphere''s cross section tends to 4 pi a^2 at low energy (four times the geometric area) and 2 pi a^2 at high energy, a pure s-wave scatters isotropically, low-energy scattering is dominated by the l = 0 term, and the optical theorem ties the forward amplitude to the total cross section through the removal of flux from the beam. Reference: Sakurai and Napolitano, Modern Quantum Mechanics, Chapter 6; Griffiths, Introduction to Quantum Mechanics, Chapter 11; Taylor, Scattering Theory.'
tags: [quantum-mechanics, scattering, partial-waves, cross-section, live-readout]
difficulty: 5
tier: hero
hero_candidate: true
renderer: canvas2d
estimated_engagement_minutes: 6
share_state_keys: [target, ka, str]
---

# Scattering Theory: Differential Cross Section and Partial Waves

## Explainer

### What you are looking at

Fire a quantum beam at a target and count where particles come out.
The angular pattern, the differential cross section, encodes the
potential. The playground shows the incident plane wave, the outgoing
scattered wave, the phase shifts each angular-momentum channel picks
up, and the polar $d\sigma/d\Omega$ pattern, with the optical theorem
as a built-in consistency check.

### The scattering amplitude

Far from the target the wavefunction is an incident plane wave plus an
outgoing spherical wave whose angular weight is the scattering
amplitude $f(\theta)$:

$$\psi \;\sim\; e^{ikz} + f(\theta)\,\frac{e^{ikr}}{r},
  \qquad
  \frac{d\sigma}{d\Omega} = |f(\theta)|^2.$$

Two complementary ways to get $f$:

- Partial waves: expand in angular momentum $\ell$; a spherically
  symmetric potential only shifts each radial wave's phase by
  $\delta_\ell$, so

$$f(\theta) = \frac1k\sum_{\ell}(2\ell+1)\,e^{i\delta_\ell}
  \sin\delta_\ell\,P_\ell(\cos\theta).$$

  A hard sphere of radius $a$ gives $\tan\delta_\ell$ from spherical
  Bessel functions; at low energy only $\ell=0$ matters and
  $\sigma\to4\pi a^2$ (four times the geometric area, a quantum
  surprise).
- Born approximation (weak potential): $f$ is essentially the Fourier
  transform of $V(r)$ in the momentum transfer
  $q = 2k\sin(\theta/2)$, which is why scattering measures structure.

### The optical theorem

Probability conservation forces a tight link between forward
scattering and the total cross section:

$$\sigma_\text{tot} = \frac{4\pi}{k}\,\mathrm{Im}\,f(0).$$

The playground computes $\sigma_\text{tot}$ both ways (sum over
$\delta_\ell$ and from $\mathrm{Im}\,f(0)$) and shows them agree, the
optical-theorem check, while the polar pattern morphs as you change
energy and target.

### Things to try

- Lower the energy on a hard sphere until only $\delta_0$ survives:
  isotropic scattering with $\sigma\to4\pi a^2$.
- Raise the energy and watch higher partial waves switch on and the
  pattern develop forward-peaked lobes.
- Confirm the partial-wave $\sigma_\text{tot}$ equals the
  optical-theorem value as you vary the potential.

### Where this comes from

The partial-wave expansion, the Born approximation, and the optical
theorem follow Sakurai, *Modern Quantum Mechanics*, Chapter 6;
Griffiths, *Introduction to Quantum Mechanics*, Chapter 11; and
Taylor, *Scattering Theory* (1972).

## Physical setup

A monoenergetic beam (plane wave `e^{ikz}`) hits a fixed central
potential and scatters into an outgoing spherical wave
`f(theta) e^{ikr}/r`. The measured quantity is the differential cross
section `dsigma/dOmega = |f(theta)|^2`, axially symmetric about the
beam. For a hard sphere it is built from the partial-wave phase
shifts; for a weak smooth potential the Born approximation gives the
amplitude as the Fourier transform of the potential.

## Governing equations

Partial-wave expansion (Taylor 1972; Sakurai and Napolitano Ch. 6):

```math
f(\theta) = \frac{1}{k}\sum_{l=0}^{\infty}(2l+1)\,e^{i\delta_l}
  \sin\delta_l\,P_l(\cos\theta),
\qquad \frac{d\sigma}{d\Omega} = |f|^2,
```

```math
\sigma_\mathrm{tot} = \frac{4\pi}{k^2}\sum_l (2l+1)\sin^2\delta_l
  = \frac{4\pi}{k}\,\mathrm{Im}\,f(0)\quad(\text{optical theorem}).
```

Hard sphere of radius `a`: `tan delta_l = j_l(ka)/n_l(ka)`. Born
approximation (`2m/hbar^2 = 1`):

```math
f_B(q) = -\frac{1}{q}\int_0^\infty r\,V(r)\,\sin(qr)\,dr,
\qquad q = 2k\sin(\theta/2),
```

the Fourier transform of `V`. Yukawa: `f_B = -V_0/(mu^2+q^2)`;
square well: `f_B = V_0(\sin qa - qa\cos qa)/q^3`.

## Numerical method

Legendre `P_l` and spherical Bessel `j_l, n_l` by recurrence; the
hard-sphere phase shift on the principal branch (`delta_l -> 0` for
`l >> ka`, the physical convention; observables are invariant under
`delta_l -> delta_l + pi`). The Born integral and the `|f|^2` solid
angle integral use Simpson quadrature. A polar-angle probe sweeps
`theta` from 0 to `pi`; the capture path maps capture fraction
directly to the probe angle, so reference frames are reproducible and
frame-rate independent. Deterministic, no RNG.

## Controls

- `target` (share key `target`): hard sphere (partial waves), Yukawa
  (Born), or square well (Born).
- `ka` (share key `ka`): size times energy; sets how many partial
  waves contribute (`l_max ~ ka`).
- `strength` (share key `str`): the Born potential depth.
- Reset (hard sphere, `ka = 3`, strength 2), Pause/Play (the theta
  probe sweep), Copy URL.

## Expected qualitative features

- Forward-peaked `dsigma/dOmega` that sharpens as `ka` grows.
- Phase shifts significant only for `l <~ ka`, vanishing above.
- `sigma_tot = (4 pi / k) Im f(0)` (optical theorem) equals the
  direct `|f|^2` angular integral.
- Hard sphere: `sigma_tot -> 4 pi a^2` (low energy),
  `-> 2 pi a^2` (high energy).
- Born amplitude is the Fourier transform of `V(r)`; the panel shows
  `V(r)` for the Born targets.
- A pure s-wave gives an isotropic pattern (a sphere of revolution).

## Invariants and acceptance thresholds

Checked offline in `invariants.test.mjs` (7 tests):

1. Legendre and spherical Bessel match standard values.
2. Optical theorem: `sigma_tot`, `(4 pi/k) Im f(0)`, and the
   `|f|^2` solid-angle integral agree to 0.1%.
3. Hard sphere `-> 4 pi a^2` (low `ka`) and `-> 2 pi a^2` (high
   `ka`), shrinking with energy.
4. Born amplitude equals the analytic Fourier transform: Yukawa to 4
   digits, square well within 3% (step-potential quadrature).
5. Unitarity: `sin^2 delta_l <= 1`, every partial cross section
   `<= (4 pi/k^2)(2l+1)`.
6. A pure s-wave gives a theta-independent `dsigma/dOmega`.
7. Determinism: identical inputs reproduce the amplitude and cross
   sections bit-for-bit.

Visual gate: SSIM > 0.92 against the five committed golden frames.

## Limiting cases for verification

- `ka -> 0` hard sphere: s-wave only, `sigma -> 4 pi a^2` (test 3).
- `ka >> 1` hard sphere: `sigma -> 2 pi a^2` (test 3).
- Weak potential: Born = Fourier transform (test 4).
- Single phase shift: isotropic (test 6).
- Forward direction: optical theorem (test 2).

## Visual fallback

Static three-panel Canvas2D: the surface of revolution, the
partial-wave bars / `V(r)`, and the polar pattern are all readable
without animation; only the theta probe sweeps and ties the panels.

## Stack note (Canvas2D pseudo-3D)

The surface of revolution is rendered as a depth-shaded wireframe
using a fixed oblique projection in plain Canvas2D (no WebGL, no
Three.js): meridians and latitude rings with a per-vertex depth tint.
This satisfies the project stack constraint; "3D" here means a
2D-projected wireframe, not a GPU 3D context.

## Citations

- Taylor, J. R., *Scattering Theory*, Wiley 1972.
  `taylor-scattering1972`.
- Sakurai, J. J. and Napolitano, J., *Modern Quantum Mechanics*,
  Ch. 6. `sakurai2020`.
- Griffiths, D. J., *Introduction to Quantum Mechanics*, Ch. 11.
  `griffithsqm2018`.

## Stretch goals

- Complex phase shifts / inelastic channels (sigma_inel, sigma_el).
- Resonances: a Breit-Wigner delta_l(E) sweeping through pi/2.
- Second Born approximation and its unitarity correction.

## Risk register

- High-l spherical Bessel upward recurrence is mildly unstable for
  `l >> x`; `l_max ~ ka + 8` keeps `l` near or below `x` where it is
  accurate, and those terms are negligible anyway (test 2 verifies
  the summed observables).
- The Born square-well integral converges slowly at the `r = a` step;
  the test tolerance (3%) is honest about this rather than overfit.
- Principal-branch `delta_l` differs from `atan2` by multiples of
  `pi`; all observables are invariant, and this is the standard
  textbook convention for the displayed phase shift.
