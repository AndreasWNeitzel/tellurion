---
title: The Breit-Wigner Resonance
slug: breit-wigner-resonance
status: verified
audience: portfolio
created: 2026-06-22
primary_uc: FIS3003
curriculum_year: bsc-y3s1
primary_citation: sakurai-napolitano
primary_chapter: 6
hook: "Tune the beam energy and the scattering erupts. A resonance is a Lorentzian spike in the cross-section and a phase shift sweeping through pi/2, both at once."
one_paragraph: "An isolated Breit-Wigner resonance at energy E_R with width Gamma: the cross-section is the Lorentzian (Gamma/2)^2 / ((E-E_R)^2 + (Gamma/2)^2), peaking at the unitarity limit, while the scattering phase shift delta = pi/2 + arctan(2(E-E_R)/Gamma) sweeps through pi/2 at the resonance. The Wigner time delay d delta/dE peaks there, longest for a narrow (long-lived) resonance. The playground sweeps the incident energy through a scattering rig whose intensity tracks the cross-section, and plots the phase shift and time delay aligned with the cross-section peak."
tags: [quantum-mechanics, scattering, resonance, breit-wigner, phase-shift, interactive, animation, live-readout]
difficulty: 4
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 5
share_state_keys: [ER, gamma]
invariants:
  - key: peak
    label: the cross-section peaks at 1 on resonance with full width Gamma
    tolerance: 1e-9
  - key: sin2
    label: the cross-section equals sin^2(delta)
    tolerance: 1e-9
  - key: phasepi2
    label: the phase shift passes through pi/2 at the resonance
    tolerance: 1e-9
what_to_try:
  - Sweep across E_R; the scattered intensity flares and the cross-section spikes.
  - Watch the phase shift cross pi/2 exactly at the cross-section peak.
  - Narrow Gamma; the peak sharpens and the time delay grows (longer-lived state).
  - Drag the energy on or off resonance and compare the scattered intensity.
references:
  - "Sakurai and Napolitano, Modern Quantum Mechanics, 2nd ed., Cambridge, 2017, Ch. 6."
  - "Griffiths, Introduction to Quantum Mechanics, 3rd ed., Ch. 11."
---

# The Breit-Wigner resonance

## Physical setup

Elastic scattering of a particle off a target, near an isolated resonance at energy
E_R with full width Gamma (a single dominant partial wave).

## Equations

$$ \frac{\sigma}{\sigma_\mathrm{max}} = \frac{(\Gamma/2)^2}{(E-E_R)^2+(\Gamma/2)^2}, \quad \delta(E) = \frac{\pi}{2}+\arctan\frac{2(E-E_R)}{\Gamma}, \quad \tau = 2\hbar\frac{d\delta}{dE}. $$

The cross-section equals $\sin^2\delta$; $\delta$ passes through $\pi/2$ at $E_R$, where
$\tau$ is maximal and equal to $4\hbar/\Gamma$.

## Numerical method

Closed-form Breit-Wigner cross-section, phase shift, and time delay; no integration.

## Controls

- Resonance energy E_R; width Gamma; sweep the incident energy (or drag it on the plot).

## Expected qualitative features

1. The cross-section is a Lorentzian peak of width Gamma at E_R.
2. The phase shift sweeps through pi/2 at the resonance.
3. The time delay peaks at E_R, larger for narrower Gamma.
4. The scattered intensity flares as the energy crosses the resonance.

## Invariants and acceptance thresholds

- Cross-section peaks at 1 with FWHM = Gamma.
- $\sigma = \sin^2\delta$.
- $\delta(E_R) = \pi/2$.

## Citations

Sakurai and Napolitano, Modern Quantum Mechanics, 2nd ed., Ch. 6.
Griffiths, Introduction to Quantum Mechanics, 3rd ed., Ch. 11.
