---
title: Klein-Gordon Wave Packet: Mass, Dispersion and the Light Cone
slug: klein-gordon-wavepacket-mass
status: verified
audience: portfolio
created: 2026-05-18
primary_uc: MF-QFT
supporting_ucs: []
curriculum_year: msc-y1
primary_citation: peskin-schroeder
hook: 'A relativistic wave packet obeys omega^2 = k^2 + m^2: with mass it travels at the sub-luminal group velocity v_g = pc^2/E and spreads, while massless it is dispersion-free and rides the light cone. The phase velocity is superluminal but carries no signal; the energy is causal.'
one_paragraph: 'An interactive Klein-Gordon wave packet (natural units c = hbar = 1; Peskin and Schroeder; Greiner, Relativistic Quantum Mechanics). A Gaussian packet psi(x,0) = exp(-x^2/2 sigma0^2) e^{i k0 x} is Fourier-synthesised with the relativistic dispersion omega(k) = sqrt(k^2 + m^2): the phase velocity omega/k exceeds c (no signal), the group velocity v_g = k/omega = p/E is strictly sub-luminal for m > 0 and exactly c for m = 0, and v_g v_p = 1. A massive packet disperses (its width grows because omega is nonlinear in k) while its centroid moves at v_g inside the light cone; a massless packet is dispersion-free (omega = |k|, constant width) and rides x = t. The packet panel shows |psi|^2 against the light cone with the initial packet for comparison; the dispersion panel shows omega(k), the light line and the v_g tangent; the track panel shows the centroid against the light cone and the RMS width. The group and phase velocities satisfy v_g v_p = 1 with v_g < c for a massive packet and exactly c for a massless one, the massless packet is dispersion-free, and a heavier packet moves more slowly while its centroid stays inside the light cone. Reference: Greiner, Relativistic Quantum Mechanics, Chapter 1; Peskin and Schroeder, An Introduction to Quantum Field Theory, Chapter 2.'
tags: [quantum-field-theory, relativistic, wave-packet, dispersion, live-readout]
difficulty: 4
tier: hero
hero_candidate: true
renderer: canvas2d
estimated_engagement_minutes: 5
share_state_keys: [m, k0, w]
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

# Klein-Gordon Wave Packet: Mass, Dispersion and the Light Cone

## Explainer

### What you are looking at

The Klein-Gordon equation is the relativistic wave equation for a
spinless particle, and it shows exactly what "mass" does to a quantum
wave: a massless packet travels rigidly at $c$, while a massive one
spreads and lags behind. The playground propagates a wave packet and
shows the dispersion, the group velocity below $c$, and the light
cone.

### The equation and its dispersion

A free relativistic scalar field $\phi$ obeys

$$\left(\frac{1}{c^2}\partial_t^2
  - \nabla^2 + \frac{m^2 c^2}{\hbar^2}\right)\phi = 0,$$

which is just the relativistic energy relation
$E^2 = p^2c^2 + m^2c^4$ promoted to a wave equation. Plane waves
$e^{i(kx-\omega t)}$ then must satisfy the dispersion relation

$$\omega(k) = c\sqrt{k^2 + \left(\frac{mc}{\hbar}\right)^2}.$$

The mass term is the only thing that makes $\omega$ a nonlinear
function of $k$.

### Why mass causes spreading and sub-luminal motion

Because different wavenumbers travel at different phase speeds when
$m\neq0$, a wave packet built from a spread of $k$ disperses. Its
envelope moves at the group velocity

$$v_g = \frac{d\omega}{dk}
  = \frac{c\,k}{\sqrt{k^2 + (mc/\hbar)^2}}
  = \frac{pc^2}{E} < c,$$

strictly below the speed of light for any massive particle, and
exactly $c$ for $m=0$ (a massless packet keeps its shape and rides
the light cone). The phase velocity meanwhile exceeds $c$, which is
fine because it carries no information; only $v_g$ does, and it
respects causality. The playground sweeps the mass and the central
wavenumber and shows the packet propagate, spread, and stay inside
the light cone.

### Things to try

- Set $m=0$ and watch the packet travel rigidly at $c$ along the
  light cone; turn on mass and watch it spread and slow.
- Increase $m$ and watch the group velocity drop further below $c$
  and the spreading accelerate.
- Note the phase fronts moving faster than the envelope (phase
  velocity $>c$, group velocity $<c$, causality intact).

### Where this comes from

The Klein-Gordon equation, its dispersion relation, and the
group/phase velocities follow Peskin and Schroeder, *An Introduction
to Quantum Field Theory*, Chapter 2, and Greiner, *Relativistic
Quantum Mechanics*.

## Physical setup

A free relativistic scalar field obeys the Klein-Gordon equation, so
a wave packet is a superposition of modes with
omega(k) = sqrt(k^2 + m^2). Mass makes the dispersion nonlinear, so
the packet both moves slower than light and spreads; a massless field
is dispersion-free and propagates exactly on the light cone. The
superluminal phase velocity transmits no information.

## Governing equations

Natural units c = hbar = 1 (Peskin and Schroeder):

```math
\omega(k) = \sqrt{k^2 + m^2},\quad
v_p = \frac{\omega}{k} > 1,\quad
v_g = \frac{d\omega}{dk} = \frac{k}{\omega} = \frac{p}{E} < 1,\quad
v_g v_p = 1.
```

The packet `psi(x,t) = \int A(k) e^{i(kx-\omega t)}dk` with
`A(k) \propto e^{-\sigma_0^2 (k-k_0)^2/2}`. For `m = 0`,
`\omega = |k|`, `v_g = 1`, dispersion-free; for `m > 0` the width
grows and the centroid moves at `v_g < 1`.

## Numerical method

Direct Fourier synthesis: the k-Gaussian is sampled and summed to
form `|psi(x,t)|^2`, from which the norm, centroid and RMS width are
computed. The time series is evaluated once per parameter set; the
packet at the current time is recomputed per frame. A sweep advances
time; the capture path maps capture fraction directly to time, so
reference frames are reproducible and frame-rate independent.
Deterministic, no RNG.

## Controls

- `mass m` (share key `m`): zero gives the dispersion-free light-cone
  packet; larger m means slower and more spreading.
- `momentum k0` (share key `k0`): the mean wavenumber; sets `v_g`.
- `packet width sigma0` (share key `w`): the initial spatial width
  (narrower spreads faster).
- Reset (`m = 1.5`, `k0 = 2`, `sigma0 = 1`), Pause/Play (the time
  sweep), Copy URL.

## Expected qualitative features

- `m = 0`: the packet keeps its shape and its centroid tracks
  `x = t` (rides the light cone).
- `m > 0`: the centroid stays inside the light cone (`< t`) and the
  packet visibly broadens.
- The dispersion curve sits above the light line and asymptotes to
  it; the `v_g` tangent has slope `< 1` (massive), `= 1` (massless).
- The centroid grows linearly at `v_g`; the width grows for `m > 0`,
  is flat for `m = 0`.

## Invariants and acceptance thresholds

Checked offline in `invariants.test.mjs` (8 tests):

1. `omega^2 = k^2 + m^2`; `v_g v_p = 1`.
2. `v_g < 1` for `m > 0`, `v_p > 1`, `v_g = 1` for `m = 0`,
   `v_g -> 1` at high `k`.
3. Massless packet is dispersion-free (constant width) and moves at
   `c`.
4. Massive packet spreads and its centroid velocity is `v_g < 1`
   (causal / sub-luminal).
5. The norm is conserved under free evolution.
6. Heavier mass means a slower packet (`v_g` decreases with `m`).
7. The centroid advances monotonically.
8. Determinism.

## Limiting cases for verification

- `m = 0`: `omega = |k|`, `v_g = 1`, no spreading (test 3).
- `k -> infinity`: `v_g -> 1` (ultrarelativistic) (test 2).
- `m -> infinity` at fixed `k`: `v_g -> 0` (test 6).
- Free evolution: unitary, norm constant (test 5).

## Visual fallback

Static three-panel Canvas2D: the dispersion curve and the
centroid/width tracks are fully informative without animation; only
the packet and the playhead sweep.

## Citations

- Peskin, M. E. and Schroeder, D. V., *An Introduction to Quantum
  Field Theory*. `peskin-schroeder`.
- Greiner, W., *Relativistic Quantum Mechanics: Wave Equations*.
  `greiner-rqm`.

## Stretch goals

- The negative-energy branch and the antiparticle interpretation.
- Zitterbewegung from positive/negative-energy interference.
- The conserved Klein-Gordon current vs the probability density.

## Risk register

- A Gaussian envelope has exponentially small acausal tails (a known
  single-particle Klein-Gordon feature; true microcausality is the
  field-commutator statement). The causal invariant is therefore the
  sub-luminal centroid velocity, not a strict support cutoff; the
  tiny tail past `x = t` is expected and stated.
- Fourier synthesis truncates the k-Gaussian: the window is several
  sigma in k; the norm-conservation invariant guards accuracy.
- The width spreads slowly for small `m`/large `k0`; the spreading
  invariant uses a clearly dispersive regime.
