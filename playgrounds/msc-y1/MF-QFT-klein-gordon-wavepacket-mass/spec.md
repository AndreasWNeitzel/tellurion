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
one_paragraph: 'An interactive Klein-Gordon wave packet (natural units c = hbar = 1; Peskin and Schroeder; Greiner, Relativistic Quantum Mechanics). A Gaussian packet psi(x,0) = exp(-x^2/2 sigma0^2) e^{i k0 x} is Fourier-synthesised with the relativistic dispersion omega(k) = sqrt(k^2 + m^2): the phase velocity omega/k exceeds c (no signal), the group velocity v_g = k/omega = p/E is strictly sub-luminal for m > 0 and exactly c for m = 0, and v_g v_p = 1. A massive packet disperses (its width grows because omega is nonlinear in k) while its centroid moves at v_g inside the light cone; a massless packet is dispersion-free (omega = |k|, constant width) and rides x = t. The packet panel shows |psi|^2 against the light cone with the initial packet for comparison; the dispersion panel shows omega(k), the light line and the v_g tangent; the track panel shows the centroid against the light cone and the RMS width. The numerics are the gate-tested sim.js: Fourier synthesis, deterministic, no RNG. The invariants check the dispersion and v_g v_p = 1, v_g < c (massive) / = c (massless), the dispersion-free massless limit, mass-induced spreading with a sub-luminal centroid, norm conservation, the heavier-is-slower ordering, and monotone forward propagation.'
tags: [quantum-field-theory, relativistic, wave-packet, dispersion, live-readout]
difficulty: 4
tier: hero
hero_candidate: true
renderer: canvas2d
estimated_engagement_minutes: 5
share_state_keys: [m, k0, w]
---

# Klein-Gordon Wave Packet: Mass, Dispersion and the Light Cone

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
