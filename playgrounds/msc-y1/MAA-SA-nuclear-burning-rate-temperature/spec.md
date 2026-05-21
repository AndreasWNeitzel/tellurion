---
title: Nuclear Burning Rates vs Temperature
slug: nuclear-burning-rate-temperature
status: verified
audience: portfolio
created: 2026-05-14
primary_uc: MAA-SA
supporting_ucs: []
curriculum_year: msc-y1
primary_citation: hansen-kawaler
primary_chapter: 6
hook: 'Stellar nuclear reactions are violently temperature-sensitive: a few percent more core heat can change the energy output by orders of magnitude, which is exactly what makes stars stable.'
one_paragraph: 'Near the Gamow peak each thermonuclear rate behaves as a steep power law, epsilon(T) proportional to rho X_i X_j T^nu, with an effective exponent nu that is large and itself temperature-dependent: nu about 4 for the proton-proton chain, about 16 to 18 for the CNO cycle, and about 40 for the triple-alpha process. This steepness is the thermostat of a star: a small contraction raises T, the rate jumps, the extra pressure halts the contraction, so burning self-regulates; it also dictates which fuel dominates in which star (p-p in the Sun, CNO in massive stars, triple-alpha in red-giant cores). The playground plots the three rates against temperature on a log scale so the differing slopes are unmistakable. Reference: Hansen and Kawaler, Stellar Interiors, Chapter 6.'
tags: [stellar, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
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
# Nuclear burning rates
pp $\propto T^4$, CNO $\propto T^{18}$, 3-α $\propto T^{40}$. Source: Hansen-Kawaler Ch. 6 (`hansen-kawaler`).

## Explainer

### What you are looking at

Stellar nuclear reactions are not gently temperature-sensitive, they
are violently so. Bumping the core temperature by a few percent can
change the energy output by orders of magnitude, and this extreme
sensitivity is what makes stars stable and decides which fuel burns
in which star. The playground plots the three main burning rates
against temperature on a log scale so the steepness is unmistakable.

### Why the rates are so steep

Two charged nuclei must tunnel through their mutual Coulomb barrier
to fuse. Folding the Maxwell-Boltzmann tail of fast particles against
the quantum tunneling probability gives the Gamow peak, and the
thermally averaged rate near a temperature $T_0$ behaves like a steep
power law

$$\varepsilon(T) \;\propto\; \rho\,X_i X_j\,
  T^{\nu},
  \qquad
  \nu = \frac{d\ln\varepsilon}{d\ln T}.$$

The exponent $\nu$ is large because the Gamow tunneling factor is a
near-exponential function of temperature. The higher the charges of
the fusing nuclei (the taller the Coulomb barrier), the larger $\nu$.

### The three main channels

- pp chain (H to He, low barrier): $\nu\approx4$. Powers the Sun and
  lower-mass stars; gentle temperature dependence, so a large slowly
  varying core.
- CNO cycle (H to He, catalysed by C/N/O, higher barrier):
  $\nu\approx16$ to $18$. Dominates in stars more massive than
  $\sim1.3\,M_\odot$; the steep slope forces a small convective core
  and switches the dominant channel sharply with mass.
- Triple-alpha (He to C, very high barrier): $\nu\approx40$.
  Ignites only at $\sim10^8$ K; the ferocious slope makes the helium
  flash and the thermal pulses of AGB stars.

The crossing points of these curves explain the main-sequence/giant
divide: which reaction wins is decided by the core temperature. The
playground sweeps $T$ and shows the three rates and which dominates.

### Things to try

- Sweep the temperature and watch the pp, CNO, and triple-alpha
  curves cross: which fuel dominates depends entirely on $T$.
- Note the slopes: pp is gentle ($T^4$), CNO steep ($T^{17}$),
  triple-alpha almost a wall ($T^{40}$).
- See that a few-percent temperature rise multiplies the CNO or
  triple-alpha rate enormously (the thermostat that stabilizes
  stars).

### Where this comes from

The Gamow-peak temperature sensitivity and the pp/CNO/triple-alpha
exponents follow Hansen, Kawaler and Trimble, *Stellar Interiors*,
Chapter 6, and Clayton, *Principles of Stellar Evolution and
Nucleosynthesis*.
