---
title: Quantum Gas Statistics Visualizer
slug: quantum-gas-statistics-visualizer
status: verified
audience: portfolio
created: 2026-05-17
hook: 'Cool an ideal Bose gas through Tc and watch a macroscopic spike erupt at zero energy while the Fermi gas freezes into a sharp step, all at fixed particle number.'
one_paragraph: 'An ideal gas of N particles in 3D, where the density of single-particle states grows as g(eps) proportional to sqrt(eps). The mean number of particles in a state of energy eps depends on what the particles are: exp(-(eps - mu)/kT) for classical Maxwell-Boltzmann, 1/(e^((eps-mu)/kT) + 1) for fermions (Fermi-Dirac, never more than one per state), and 1/(e^((eps-mu)/kT) - 1) for bosons (Bose-Einstein), with the chemical potential mu(T) fixed by particle number N = integral g(eps) n(eps) d eps. As the gas is cooled the three statistics diverge dramatically: the Fermi gas freezes into a filled Fermi sea with a sharp step at E_F, while for bosons mu rises to zero at a critical temperature Tc and below it a macroscopic fraction 1 - (T/Tc)^(3/2) collapses into the ground state, Bose-Einstein condensation. The playground overlays the three occupation curves, marks the Fermi energy, and shows the condensate spike forming below Tc. Reference: Pathria and Beale, Statistical Mechanics, Chapters 6 to 8.'
tags: [quantum, statistical-mechanics, multi-panel, animation, live-readout]
difficulty: 4
tier: hero
hero_candidate: true
renderer: canvas2d
estimated_engagement_minutes: 6
curriculum_year: 'L:F-3Y-1S'
primary_uc: FIS3008
primary_citation: pathria
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
references:
  - "Pathria and Beale, Statistical Mechanics."

---

# Quantum Gas Statistics Visualizer

## Explainer

### What you are looking at

Three gases of identical particles at the same temperature, filling the
same energy levels three different ways. Classical particles (Maxwell-
Boltzmann), fermions that refuse to share a state (Fermi-Dirac), and
bosons that love to (Bose-Einstein). Cool them down and the differences
become dramatic: a Fermi sea, and a Bose condensate.

### The occupation rules

For a level at energy $\epsilon$, the average number of particles in it
is

$$n(\epsilon) = \begin{cases}
  e^{-(\epsilon-\mu)/\tau} & \text{Maxwell-Boltzmann},\\[4pt]
  \dfrac{1}{e^{(\epsilon-\mu)/\tau}+1} & \text{Fermi-Dirac},\\[8pt]
  \dfrac{1}{e^{(\epsilon-\mu)/\tau}-1} & \text{Bose-Einstein},
\end{cases}$$

with $\tau = k_BT$ and the chemical potential $\mu$ fixed by holding
the total number constant, $N = \int g(\epsilon)\,n(\epsilon)\,d\epsilon$,
using the 3D density of states $g(\epsilon)\propto\sqrt\epsilon$. The
only differences are the $+1$, the $-1$, or neither in the denominator,
yet they change everything.

### The two quantum surprises

- Fermi-Dirac, $-1\to+1$: at most one particle per state. At low
  temperature particles stack up to the Fermi energy
  $E_F = (3N/2C)^{2/3}$, giving the degenerate Fermi sea that holds up
  white dwarfs and sets metal electron behavior.
- Bose-Einstein, the $-1$: below a critical temperature
  $\tau_c = (N/C\,\Gamma(3/2)\zeta(3/2))^{2/3}$ a macroscopic fraction
  $1 - (\tau/\tau_c)^{3/2}$ collapses into the single ground state, the
  Bose-Einstein condensate.

At high temperature all three converge to the classical
Maxwell-Boltzmann curve (occupations small, the $\pm1$ negligible). The
playground sweeps temperature and shows the three occupation curves and
the Fermi/condensate features appear.

### Things to try

- Cool the Fermi gas and watch the occupation sharpen into a step at
  $E_F$ (the Fermi sea).
- Cool the Bose gas through $\tau_c$ and watch the ground-state
  occupation jump (condensation).
- Heat all three and watch them merge onto the classical curve.

### Where this comes from

The three occupation statistics, the Fermi energy, and Bose-Einstein
condensation follow Reif, *Fundamentals of Statistical and Thermal
Physics*, and Pathria, *Statistical Mechanics*.

## Physical setup

A non-interacting gas of N indistinguishable particles in a 3D box,
density of states `g(eps) = C sqrt(eps)`. Temperature `tau = kT` is
the control; the chemical potential `mu(tau)` is whatever keeps the
particle number fixed.

## Governing equations

Mean occupation `n(eps)`: `exp(-(eps-mu)/tau)` (MB),
`1/(exp((eps-mu)/tau)+1)` (FD), `1/(exp((eps-mu)/tau)-1)` (BE, with
`mu < 0`). Closure: `N = integral_0^inf g(eps) n(eps) d eps`.
Fermi energy `E_F = (3N/2C)^{2/3}`. Bose condensation at
`tau_c = (N/(C Gamma(3/2) zeta(3/2)))^{2/3}`; for `tau < tau_c`,
`mu = 0` and the condensate fraction is `1 - (tau/tau_c)^{3/2}`.

## Numerical method

The number and energy integrals use the substitution
`eps = tau u^2`, which removes the `sqrt` singularity so composite
Simpson (4000 intervals) converges fast even as `mu -> 0` for the
Bose gas. `mu(tau)` is the closed form for MB and a 200-step
bisection on the monotone `N(mu)` for FD and BE; BEC is detected when
`N(mu=0)` cannot hold all particles. Reference: Pathria and Beale,
Statistical Mechanics (3rd ed.), Ch. 7-8; Reif,
Fundamentals of Statistical and Thermal Physics, Ch. 9.

## Controls

- temperature tau: the single thermodynamic knob (= kT).
- statistics: all three overlaid, or one isolated.
- occupied g n: toggle the occupied spectral density vs occupation.
- Cool through Tc: animate a cooling sweep across the transition.
- Reset.

## Expected qualitative features

- The occupation cells (right) draw one column per shown statistic
  (all three when `all` is selected, not just one): each row is an
  energy level `eps_k`, each dot a particle, the dot count
  proportional to `g(eps_k) n(eps_k)` on a scale shared across the
  columns so the Fermi sea, the dilute Boltzmann gas and the Bose
  pile-up are directly comparable. The same `eps_k` are ticked on the
  curve's energy axis, tying the discrete picture to the continuous
  one. The FD column carries the `E_F` level; the BE column carries
  the condensate (`N0/N`) bar below `Tc`.
- High tau: the three curves coincide (classical, non-degenerate).
- Low tau, FD: a near-step filled up to `E_F`, `n(E_F) = 1/2`.
- BE approaching tau_c: `mu -> 0`, the low-energy occupation diverges.
- tau < tau_c: a bold condensate spike at `eps = 0`, growing as
  `1 - (tau/tau_c)^{3/2}` while the live `N` readout holds at 1.0000.

## Invariants and acceptance thresholds

- FD `n(mu) = 1/2` exactly for any T (1e-12).
- FD `T -> 0`: `mu -> E_F` (5e-3), occupation step (1e-6 each side).
- FD Sommerfeld `mu(tau)` at low T (6e-3 relative).
- BE: `mu -> 0` at `tau_c` (2e-3), `mu < 0` above, `mu = 0` below;
  condensate fraction exact.
- BE number conservation including the condensate below `tau_c` (1%).
- Quantum -> MB in the non-degenerate limit (2% relative).
- MB `mu` matches the closed form (1e-9); mean energy `= 3 tau/2`
  (1e-3); `N` conserved (1e-6).
- N conserved for MB, FD, hot BE at the solved mu (1%).
- Occupation ordering `BE > MB > FD` for `(eps-mu)/tau > 0`.

## Limiting cases for verification

- `tau >> tau_c`: all three statistics collapse to MB.
- `tau -> 0` (FD): `mu -> E_F`, occupation is a step at `E_F`.
- `tau -> tau_c^-` (BE): `mu -> 0`, condensate fraction `-> 0^+`.

## Visual fallback

Static frame: the occupation curves at the captured temperature with
the condensate spike and the occupation-cells cartoon.

## Citations

- Pathria and Beale, Statistical Mechanics (3rd ed.), Ch. 7-8
 .
- Reif, Fundamentals of Statistical and Thermal Physics, Ch. 9
 .

## Stretch goals

- 2D gas (no BEC at finite T) as a contrast case.
- Heat capacity `C_V(T)` with the Bose lambda cusp.

## Risk register

- Bose integrand is singular at `eps = 0` when `mu = 0`; the
  `eps = tau u^2` substitution makes it smooth and Simpson-safe.
- Truncating the upper limit: `U^2 = max(60, 60+eta)` keeps the
  neglected tail below 1e-26 of the integral.
