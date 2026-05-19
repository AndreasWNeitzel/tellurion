---
title: Optical Fiber: LP Modes, Dispersion and Pulse Broadening
slug: optical-fiber-modes-dispersion
status: verified
audience: portfolio
created: 2026-05-18
primary_uc: FIS4035
supporting_ucs: []
curriculum_year: bsc-y3s2
primary_citation: gloge1971
hook: 'A step-index fibre carries only the fundamental LP01 mode until the normalised frequency V crosses 2.405, the first zero of J0, after which higher LP modes switch on one by one. The LP11 single-mode cutoff is reproduced to better than 0.1% and a Gaussian pulse broadens exactly as sqrt(1 + (z/L_D)^2).'
one_paragraph: 'An interactive view of the weakly guiding step-index optical fibre (Gloge, Appl. Opt. 10, 2252, 1971; Snyder and Love, Optical Waveguide Theory, 1983). The LP_lm modes solve U J_{l-1}(U)/J_l(U) = -W K_{l-1}(W)/K_l(W) with V^2 = U^2 + W^2 and normalised index b = 1 - U^2/V^2 in (0,1); LP01 has no cutoff while LP11 (the single-mode limit) cuts off at the first zero of J0, V = 2.40483, and LP21/LP02 near the first nonzero zero of J1. The dispersion panel draws the universal b-V curves with the single-mode region shaded and the operating point marked; the cross-section panel shows the |E|^2 pattern of the selected mode (the cos(l phi) azimuthal lobes and the J_l radial structure inside the core, K_l evanescent tail outside); the pulse panel shows a chirp-free Gaussian broadening as T(z) = T0 sqrt(1 + (z/L_D)^2), L_D = T0^2/|beta_2|, with the energy conserved (Agrawal, Nonlinear Fiber Optics, 2019). The single-mode condition V < 2.40483 (the first zero of J0), the universal b-V dispersion curves, and the dispersion-limited Gaussian pulse broadening are the physical content. Reference: Snyder and Love, Optical Waveguide Theory (1983); Agrawal, Nonlinear Fiber Optics (2019).'
tags: [photonics, optical-fiber, waveguide-modes, dispersion, live-readout]
difficulty: 4
tier: hero
hero_candidate: true
renderer: canvas2d
estimated_engagement_minutes: 5
share_state_keys: [mode, V, ld]
---

# Optical Fiber: LP Modes, Dispersion and Pulse Broadening

## Explainer

### What you are looking at

An optical fiber guides light by total internal reflection in a glass
core. Only certain transverse field patterns (modes) propagate, and a
single number decides how many. Make the fiber thin enough and only one
survives, single-mode telecom fiber. A pulse still spreads in time
because different frequencies travel at slightly different speeds. The
playground shows the LP modes and the pulse broadening.

### The mode count: the V number

A weakly-guiding step-index fiber (core index $n_1$ barely above
cladding $n_2$) supports linearly-polarized $\mathrm{LP}_{\ell m}$
modes. Whether a mode is guided is set by the normalized frequency

$$V = a\,k_0\sqrt{n_1^2 - n_2^2},$$

with $a$ the core radius and $k_0 = 2\pi/\lambda$. The fundamental
$\mathrm{LP}_{01}$ has no cutoff; the next mode turns on at
$V = 2.405$ (the first zero of $J_0$). So

$$V < 2.405 \;\Longrightarrow\; \text{single-mode},$$

which is exactly the regime of telecom fiber (small core, near 1.5 um).
Above that, the number of modes grows roughly as $V^2/2$.

### Why pulses spread: dispersion

Even a single mode broadens a pulse because the propagation constant
$\beta(\omega)$ is not linear in frequency. The group velocity
$v_g = (d\beta/d\omega)^{-1}$ varies across the pulse spectrum, so the
pulse width grows with distance $L$ as

$$\Delta t \approx |D|\,L\,\Delta\lambda,$$

with $D$ the group-velocity-dispersion parameter. This pulse spreading
is what limits the bit rate of a fiber link, and why dispersion-shifted
fibers and compensation exist. The playground sweeps $V$ to add/remove
modes and shows an input pulse broadening as it propagates.

### Things to try

- Lower $V$ below 2.405 and confirm only $\mathrm{LP}_{01}$ survives
  (single-mode).
- Raise $V$ and watch higher $\mathrm{LP}_{\ell m}$ modes switch on at
  their cutoffs.
- Send a pulse down a long fiber and watch it broaden by $|D|L\Delta
  \lambda$ (the bandwidth limit).

### Where this comes from

The LP-mode weak-guidance approximation, the $V<2.405$ single-mode
condition, and group-velocity dispersion follow Hecht, *Optics*, 5th
ed., and Saleh and Teich, *Fundamentals of Photonics*, Chapter 8.

## Physical setup

A step-index fibre has a core of index n1 and radius a inside a
cladding of index n2 (n1 only slightly above n2: weakly guiding). The
guided fields are the linearly polarised LP_lm modes. The normalised
frequency V = a k0 sqrt(n1^2 - n2^2) decides how many modes the fibre
supports; below V = 2.405 only the fundamental LP01 propagates
(single-mode operation), which is the regime of telecom fibre. A pulse
in the fibre also spreads in time because the propagation constant
depends on frequency (group-velocity dispersion).

## Governing equations

Weakly guiding LP_lm eigenvalue equation (Gloge 1971; Snyder and
Love 1983):

```math
\frac{U J_{l-1}(U)}{J_l(U)} = -\,\frac{W K_{l-1}(W)}{K_l(W)},
\qquad V^2 = U^2 + W^2, \qquad b = 1 - \frac{U^2}{V^2}\in(0,1).
```

`U` is the transverse core parameter, `W` the cladding decay
parameter, `b` the normalised propagation constant. Cutoff (`W -> 0`,
`U -> V`) occurs at the zeros of `J_{l-1}`: LP01 has none (guided for
all `V`), LP11 at the first zero of `J0`, `V = 2.40483`. A chirp-free
Gaussian pulse of width `T0` broadens as (Agrawal 2019)

```math
T(z) = T_0\sqrt{1 + (z/L_D)^2}, \qquad L_D = T_0^2/|\beta_2|,
```

with the pulse energy conserved (peak amplitude scales as `T0/T`).

## Numerical method

Bessel functions `J0, J1, K0, K1` (and `I0, I1` for the small-argument
`K`) use the Abramowitz and Stegun (1964) sections 9.4 and 9.8
polynomial approximations; `J_n, K_n` for the small orders used follow
by stable recurrence. The LP eigenvalue is found by scanning the
ratio function `F(U) = U J_{l-1}/J_l + W K_{l-1}/K_l` for sign changes,
skipping the poles at the zeros of `J_l` (mode-branch boundaries, not
roots) and bisecting each genuine branch; spurious near-axis crossings
are rejected by the true-residual check. The pulse sweep is the
propagation distance `z` to `4 L_D`; the capture path maps capture
fraction directly to `z = f (4 L_D)`, so reference frames are
reproducible and frame-rate independent. Deterministic, no RNG.

## Controls

- `mode` (share key `mode`): LP01, LP11, LP21 or LP02 (selects the
  highlighted dispersion curve and the cross-section).
- `V-number` (share key `V`): normalised frequency; moves the
  operating point across the cutoffs.
- `dispersion L_D` (share key `ld`): the dispersion length; sets how
  fast the pulse broadens with distance.
- Reset (LP01, `V = 3.8`, `L_D = 2.0`), Pause/Play (Play replays the
  pulse sweep once it reaches the fibre end), Copy URL.

## Expected qualitative features

- LP01 curve runs from `b -> 0` at `V -> 0` (no cutoff) toward `b -> 1`.
- LP11 appears exactly at `V = 2.405`; LP21/LP02 near `V = 3.83`.
- `V < 2.405`: single guided mode; the readout mode count is 1.
- LP01 cross-section is a single central lobe; LP11 has two lobes,
  LP21 four lobes with a central node (the `cos(l phi)` structure).
- The Gaussian pulse keeps its area while its width grows as
  `sqrt(1 + (z/L_D)^2)` (e.g. `sqrt(5)` at `z = 2 L_D`).

## Invariants and acceptance thresholds

Checked offline in `invariants.test.mjs` (8 tests):

1. Bessel approximations match standard values (`J0(1)`, `J1(1)`,
   `J0(5)`, `K0(1)`, `K1(1)`, `K0(3)`) to 4 digits.
2. The LP11 / single-mode cutoff is the first zero of `J0`,
   `V = 2.40483` to within 0.1%; LP11 is guided just above and not
   below it.
3. Single-mode for `V < 2.405` (mode count 1), multimode above.
4. LP01 has no cutoff; every solved mode satisfies `V^2 = U^2 + W^2`
   and `0 < b < 1`.
5. `b` rises monotonically with `V` toward 1 (well guided).
6. Mode intensity is peak-normalised, continuous at `r = a`, and
   decays in the cladding (evanescent tail).
7. Gaussian broadening follows `T(z) = T0 sqrt(1 + (z/L_D)^2)`:
   `T0` at `z = 0`, `T0 sqrt(2)` at `L_D`, `T0 sqrt(5)` at `2 L_D`,
   linear at large `z`, sign of `beta_2` irrelevant.
8. Determinism: identical inputs reproduce the solver bit-for-bit.

Visual gate: SSIM > 0.92 against the five committed golden frames.

## Limiting cases for verification

- `V -> 0`: only LP01, `b -> 0` (weakly bound). Tests 3, 4.
- `V -> infinity`: `b -> 1` (strongly guided). Test 5.
- `z -> 0`: `T = T0` (no broadening). `z >> L_D`: `T ~ T0 z/L_D`
  (linear group-delay spread). Test 7.
- At cutoff `W -> 0`, `U -> V` (mode just unbound). Test 2.

## Visual fallback

Static three-panel Canvas2D: the b-V diagram and the mode
cross-section depend only on the controls (no animation needed to read
the physics); only the pulse panel sweeps in `z`, and the input pulse
is always drawn for comparison.

## Citations

- Gloge, D., Appl. Opt. 10, 2252 (1971). `gloge1971`.
- Snyder, A. W. and Love, J. D., *Optical Waveguide Theory*, Chapman
  and Hall 1983. `snyder-love1983`.
- Agrawal, G. P., *Nonlinear Fiber Optics*, 6th ed., Academic Press
  2019. `agrawal-nfo2019`.
- Abramowitz, M. and Stegun, I. A., *Handbook of Mathematical
  Functions*, NBS 1964 (sec. 9.4, 9.8). `abramowitz-stegun1964`.

## Stretch goals

- Material + waveguide dispersion combined to show the zero-dispersion
  wavelength and the dispersion-shifted designs.
- Mode-field diameter and bend-loss estimates.
- LP mode beating / intermodal dispersion in a short multimode span.

## Risk register

- Bessel polynomial approximation error (about 1e-7): well below the
  0.1% cutoff tolerance; the value checks (test 1) pin accuracy.
- Spurious eigenvalue roots near the axis for `l >= 2`: rejected by
  the pole-skip and true-residual filter; the mode-count test (3) and
  the `V^2 = U^2 + W^2` test (4) guard against it.
- Near-cutoff root within machine epsilon of `V` (LP01 at small `V`):
  the solver uses a tight top bound and dense scan; test 4 exercises
  `V` down to 0.6.
