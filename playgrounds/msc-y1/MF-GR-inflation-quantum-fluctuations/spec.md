---
title: Inflation: Slow Roll, Superhorizon Fluctuations, n_s
slug: inflation-quantum-fluctuations
status: verified
audience: portfolio
created: 2026-05-18
primary_uc: MF-GR
supporting_ucs: []
curriculum_year: msc-y1
primary_citation: baumann-cosmology
hook: 'An inflaton rolling down a flat potential blows up the universe by e^60 in a heartbeat, and quantum fluctuations are stretched past the horizon and frozen as the seeds of every galaxy. The spectrum is nearly scale invariant with a slight red tilt, n_s ~ 0.965, exactly what Planck measures.'
one_paragraph: 'An interactive single-field slow-roll inflation model (reduced Planck mass M_pl = 1; Mukhanov; Baumann, Cosmology; Starobinsky 1980; Planck 2018). The slow-roll parameters epsilon = (1/2)(V''/V)^2 and eta = V''''/V give the scalar spectral index n_s = 1 - 6 epsilon + 2 eta, the tensor-to-scalar ratio r = 16 epsilon and the tensor tilt n_t = -2 epsilon, with the e-fold count N = integral V/V'' dphi and inflation ending at epsilon = 1. Two potentials are offered: the quadratic m^2 phi^2 (n_s ~ 0.965 but a large r ~ 0.14, now disfavoured) and the Starobinsky plateau V ~ (1 - e^{-sqrt(2/3) phi})^2 (n_s ~ 0.965, a tiny r = 12/N^2, favoured by Planck). The potential panel shows the inflaton rolling toward phi_end; the mode panel shows comoving fluctuations stretched as lambda_phys = lambda e^{Ne} past the nearly constant Hubble horizon and freezing superhorizon; the spectrum panel shows P_s(k) ~ A_s (k/k0)^{n_s-1} against the flat scale-invariant reference. The numerics are the gate-tested sim.js: closed-form slow-roll, Simpson e-fold integral, deterministic, no RNG. The invariants check inflation ends at epsilon = 1 (quadratic phi_end = sqrt(2)), n_s ~ 0.965 to 1% at N ~ 57, near scale invariance |n_s - 1| < 0.05, the Starobinsky r far below the quadratic r, the single-field consistency relation r = -8 n_t exactly, e-fold consistency with slow roll, and exponential superhorizon stretching with freezing.'
tags: [cosmology, inflation, perturbations, slow-roll, live-readout]
difficulty: 5
tier: hero
hero_candidate: true
renderer: canvas2d
estimated_engagement_minutes: 6
share_state_keys: [pot, n, lam]
---

# Inflation: Slow Roll, Superhorizon Fluctuations, n_s

## Physical setup

A scalar inflaton field slowly rolls down a nearly flat potential,
driving an exponential expansion (about 60 e-folds). Quantum
fluctuations of the field are stretched by the expansion: once a mode
is larger than the Hubble horizon it freezes, becoming a classical
perturbation that later seeds the cosmic microwave background and
galaxies. The statistics of those perturbations are nearly scale
invariant.

## Governing equations

Slow-roll inflation (M_pl = 1; Baumann; Mukhanov):

```math
\epsilon = \tfrac12\Big(\frac{V'}{V}\Big)^2,\quad
\eta = \frac{V''}{V},\quad
n_s = 1 - 6\epsilon + 2\eta,\quad r = 16\epsilon,\quad
n_t = -2\epsilon,
```

with `N = \int_{\phi_{end}}^{\phi} (V/V')\,d\phi` and inflation
ending at `\epsilon = 1`. `P_s(k) \sim V/(24\pi^2\epsilon)` at
horizon crossing, `P_s(k) \propto k^{n_s-1}`. Quadratic:
`V = \tfrac12 m^2\phi^2`, `\phi_{end} = \sqrt2`. Starobinsky:
`V \propto (1 - e^{-\sqrt{2/3}\,\phi})^2`,
`n_s = 1 - 2/N`, `r = 12/N^2`.

## Numerical method

`epsilon`, `eta`, `n_s`, `r` are closed form from `V, V', V''`;
`phi_end` and `phi(N)` by bisection; the e-fold integral by Simpson;
the mode history is `lambda e^{Ne}` against `1/H` with
`H \approx \sqrt{V/3}`. A sweep rolls the field and reveals the
stretching; the capture path maps capture fraction directly to the
elapsed e-folds, so reference frames are reproducible and frame-rate
independent. Deterministic, no RNG.

## Controls

- `potential` (share key `pot`): the Starobinsky plateau or the
  quadratic `m^2 phi^2`.
- `e-folds N` (share key `n`): observable e-folds before the end
  (45-65); sets `n_s` and `r`.
- `mode wavelength` (share key `lam`): the comoving scale of the
  tracked fluctuation.
- Reset (Starobinsky, `N = 57`), Pause/Play (the rolling sweep), Copy
  URL.

## Expected qualitative features

- The inflaton rolls slowly on the plateau, then quickly to
  `phi_end`.
- Modes stretch as straight rising lines (exponential) past the
  nearly flat horizon and stay above it (frozen).
- `P_s(k)` is a gentle red slope against the flat `n_s = 1`
  reference; `n_s ~ 0.965`.
- Starobinsky gives a far smaller `r` than the quadratic potential.

## Invariants and acceptance thresholds

Checked offline in `invariants.test.mjs` (8 tests):

1. Inflation ends at `epsilon = 1`; quadratic `phi_end = sqrt(2)`.
2. `n_s ~ 0.965` (Planck) to 1% at `N ~ 57` (red tilt).
3. Near scale invariant: `|n_s - 1| < 0.05` over `N = 50-60`;
   `P_s(k) ~ k^{n_s-1}`.
4. Starobinsky `r << ` quadratic `r` (plateau vs `m^2 phi^2`).
5. The consistency relation `r = -8 n_t` holds exactly.
6. The e-fold count round-trips and slow roll holds well before the
   end.
7. A fluctuation is stretched `~ e^N` past the `~`constant horizon
   and stays superhorizon.
8. Determinism.

## Limiting cases for verification

- `epsilon -> 1`: end of inflation (`phi_end`) (test 1).
- `N` large: `n_s -> 1` (more scale invariant) (test 3).
- Plateau vs power-law: `r` orders of magnitude apart (test 4).
- Single field: `r = -8 n_t` (test 5).

## Visual fallback

Static three-panel Canvas2D: the potential, the mode-stretching plot
and the spectrum are fully informative without animation; only the
rolling inflaton and the mode reveal sweep.

## Citations

- Baumann, D., *Cosmology*, CUP 2022. `baumann-cosmology`.
- Mukhanov, V., *Physical Foundations of Cosmology*.
  `mukhanov-cosmology`.
- Starobinsky, A. A., Phys. Lett. B 91, 99 (1980).
  `starobinsky1980`.
- Aghanim, N. et al. (Planck), A&A 641, A6 (2020). `planck2018-vi`.

## Stretch goals

- The full mode-function evolution (Mukhanov-Sasaki) across horizon
  crossing.
- Running of the spectral index and the tensor B-mode spectrum.
- Hilltop / natural / alpha-attractor potentials.

## Risk register

- The spectrum-panel tilt is gently magnified so the red slope reads
  against the flat reference; the true `n_s` is the readout, not the
  drawn slope (a labelled visualization choice).
- `phi(N)` uses nested bisection over a Simpson e-fold integral;
  computed once per parameter set (not per frame) to stay within the
  capture budget; the e-fold round-trip invariant guards accuracy.
- Leading-order slow roll only (no higher-order or running):
  appropriate for the n_s/r predictions tested.
