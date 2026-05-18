---
title: Casimir Effect: Zero-Point Modes and the d^-4 Pressure
slug: casimir-effect-zero-point-energy
status: verified
audience: portfolio
created: 2026-05-18
primary_uc: MF-QFT
supporting_ucs: []
curriculum_year: msc-y1
primary_citation: casimir1948
hook: 'Two uncharged metal plates in vacuum attract because the gap forbids the long-wavelength quantum modes that still push from outside. The leftover zero-point pressure is pi^2 hbar c / 240 d^4, about 1.3 mPa at one micron, and it steepens as the fourth power of the gap.'
one_paragraph: 'An interactive Casimir effect between two perfect parallel plates (Casimir 1948; Milonni, The Quantum Vacuum; Lamoreaux 1997). Between the plates only the standing modes with k_n = n pi / d survive; the long-wavelength modes that do not fit (lambda > 2 d) are excluded, and the regularised difference from the free-space continuum is the attractive Casimir energy E/A = -pi^2 hbar c / (720 d^3) with pressure P = -dE/dd / A = pi^2 hbar c / (240 d^4) ~ 1.30 mPa at d = 1 um. The plate panel draws the allowed standing modes (cyan), the excluded long modes (red) and the inward vacuum pressure, intensifying as the plates close; the law panel is the d^-4 pressure on log-log (slope -4); the energy panel contrasts P ~ d^-4 and |E/A| ~ d^-3. The numerics are the gate-tested sim.js: closed-form zeta-regularised energy and pressure plus mode counting; deterministic, no RNG. The invariants check P = 1.3 mPa at 1 um to 1%, the d^-4 scaling to 0.1% (log-log slope -4), the negative d^-3 energy, the attractive force equal to -dE/dd, the allowed/excluded mode rule, and the steep rise on squeezing.'
tags: [quantum-field-theory, vacuum-energy, casimir, zero-point, live-readout]
difficulty: 4
tier: hero
hero_candidate: true
renderer: canvas2d
estimated_engagement_minutes: 5
share_state_keys: [d, nm]
---

# Casimir Effect: Zero-Point Modes and the d^-4 Pressure

## Explainer

### What you are looking at

Empty space is not empty: the quantum vacuum hums with zero-point
field fluctuations. Put two metal plates close together and they
exclude some of those fluctuations from the gap, so the vacuum
outside pushes harder than the vacuum inside and the plates attract.
That is the Casimir force, a measurable consequence of the vacuum
energy. The playground shows the allowed modes and the resulting
pressure.

### Zero-point energy and the boundary

Every electromagnetic mode of frequency $\omega$ has a ground-state
energy $\tfrac12\hbar\omega$. Conducting plates a distance $d$ apart
force the field to vanish on them, so only modes with a perpendicular
wavenumber $k_\perp = n\pi/d$ survive between the plates, while
outside the spectrum is continuous. Both the confined sum and the
free continuum are individually infinite, but their regularized
difference is finite, the renormalized vacuum energy per unit area:

$$\frac{E(d)}{A} = -\,\frac{\pi^2\hbar c}{720\,d^3}.$$

### The d^-4 pressure

Differentiating the energy with respect to the plate separation gives
an attractive pressure

$$P(d) = -\frac{\partial}{\partial d}\frac{E}{A}
  = -\,\frac{\pi^2\hbar c}{240\,d^4}.$$

The headline is the steep $d^{-4}$ scaling: halving the gap multiplies
the force sixteenfold, which is why the effect is negligible at
microns but dominant at nanometers (it is a real nuisance in MEMS
devices). The force depends only on $\hbar$, $c$, and geometry, with
no material constants, which is what makes it such a clean signature
of vacuum energy; it was confirmed to a few percent by Lamoreaux
(1997). The playground sweeps the plate separation and the number of
retained modes and shows the mode comb and the $d^{-4}$ pressure.

### Things to try

- Halve the separation and watch the pressure jump by $\sim16\times$
  (the $d^{-4}$ law).
- Increase the number of modes and watch the regularized energy
  converge to the finite Casimir value (the cancellation of
  infinities).
- Note the force is always attractive and independent of plate
  material (pure vacuum geometry).

### Where this comes from

The zero-point mode sum, the regularized vacuum energy, and the
$d^{-4}$ Casimir pressure follow Milonni, *The Quantum Vacuum*, and
Casimir, Proc. K. Ned. Akad. Wet. 51, 793 (1948).

## Physical setup

Two parallel perfectly conducting plates a distance d apart in
vacuum. The electromagnetic field still has zero-point energy in
every mode, but the plates only permit modes whose half-integer
wavelengths fit the gap. Removing the excluded long-wavelength modes
lowers the energy between the plates relative to outside, and the
imbalance is a real attractive pressure.

## Governing equations

Casimir 1948 (perfect plates, T = 0):

```math
\frac{E}{A} = -\frac{\pi^2 \hbar c}{720\, d^3}, \qquad
P = -\frac{1}{A}\frac{dE}{dd} = \frac{\pi^2 \hbar c}{240\, d^4}.
```

Allowed modes have `k_n = n\pi/d` (`n = 1,2,\dots`); a free-space
mode of wavelength `\lambda` fits only if `\lambda \le 2 d`. At
`d = 1\,\mu m`, `P \approx 1.30\times10^{-3}` Pa.

## Numerical method

The energy, pressure and force `-dE/dd` are evaluated from the
closed (zeta-regularised) forms; mode wavenumbers, the fit rule and
the mode count are exact. A sweep closes the plates from 3 d to d;
the capture path maps capture fraction directly to the separation, so
reference frames are reproducible and frame-rate independent.
Deterministic, no RNG.

## Controls

- `plate separation d` (share key `d`): the gap (nm); the pressure
  goes as `d^-4`.
- `mode cutoff index` (share key `nm`): how many allowed standing
  modes are drawn.
- Reset (`d = 1000 nm`), Pause/Play (the closing sweep), Copy URL.

## Expected qualitative features

- More allowed modes fit a wider gap; long modes are excluded
  (drawn red).
- The inward pressure arrows grow sharply as the plates close.
- `P(d)` is a straight line of slope `-4` on log-log; `|E/A|` slope
  `-3`.
- `d = 1\,\mu m` reads `1.3` mPa; halving `d` multiplies `P` by 16.

## Invariants and acceptance thresholds

Checked offline in `invariants.test.mjs` (7 tests):

1. `P = 1.3` mPa at `1\,\mu m` to 1% (and the closed form).
2. `P ~ d^-4` to 0.1% (log-log slope `-4`); `P(d1)/P(d2) =
   (d2/d1)^4`.
3. `E/A < 0` and `~ d^-3` (magnitude ratio 8 per doubling).
4. The force is attractive and `|F| = -dE/dd = P`.
5. Only `k_n = n\pi/d` modes are allowed; a mode fits iff
   `\lambda \le 2 d`; the count grows with `d`.
6. Squeezing raises `P` steeply (`10^4` over a decade in `d`).
7. Determinism.

## Limiting cases for verification

- `d \to 0`: `P \to \infty` as `d^-4` (test 6).
- `d` large: `P` and `|E/A|` vanish as `d^-4`, `d^-3` (tests 2, 3).
- `\lambda = 2 d`: the marginal mode (`n = 1`) (test 5).
- Thermodynamic consistency: `P = -dE/dd` (test 4).

## Visual fallback

Static three-panel Canvas2D: the log-log pressure law and the
energy/pressure panel are fully informative without animation; only
the plate gap and the squeeze sweep.

## Citations

- Casimir, H. B. G., Proc. K. Ned. Akad. Wet. 51, 793 (1948).
  `casimir1948`.
- Milonni, P. W., *The Quantum Vacuum*. `milonni-vacuum`.
- Lamoreaux, S. K., Phys. Rev. Lett. 78, 5 (1997). `lamoreaux1997`.

## Stretch goals

- Finite-temperature correction (the thermal Casimir crossover).
- Real-metal (Drude/plasma) reflectivity reduction factor.
- The Casimir-Polder atom-plate force.

## Risk register

- Perfect-conductor, zero-temperature idealisation: stated; real
  experiments need finite-conductivity and thermal corrections, which
  are listed as stretch goals. The gate-tested claims are the ideal
  closed forms.
- `forcePerArea` is the signed `-dE/dd` (negative = attractive);
  `casimirPressure` is its positive magnitude. The consistency
  invariant compares magnitudes and asserts attraction.
- Mode-count visualization caps at the cutoff slider; the physics
  (pressure/energy) is the closed form, independent of how many modes
  are drawn.
