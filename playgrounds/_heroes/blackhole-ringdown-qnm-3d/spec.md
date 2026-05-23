---
title: Black-Hole Ringdown (Hero)
slug: blackhole-ringdown-qnm-3d
status: superseded
superseded_by: blackhole-legend-3d
audience: portfolio
created: 2026-05-20
primary_uc: AST3014
supporting_ucs: [FIS3007]
curriculum_year: hero
primary_citation: berti-cardoso-will-qnm
primary_chapter: 4
hero_candidate: true
hook: 'When two black holes merge, the remnant rings like a bell: a damped sinusoid at one specific frequency set entirely by mass and spin. That signal is the "no-hair theorem" sung out loud.'
one_paragraph: 'After a binary black-hole merger, the remnant settles to a Kerr black hole by radiating a sum of quasinormal modes (QNMs). The dominant (l, m, n) = (2, 2, 0) mode is a damped sinusoid h(t) = h_0 exp(-t/tau) cos(2 pi f t + phi) whose frequency f and decay time tau depend only on the remnant mass M and dimensionless spin chi = a/M. Schwarzschild (chi = 0) gives M omega = 0.374 - 0.089 i; an extremal Kerr (chi -> 1) has M omega_R -> 1 and M omega_I -> 0 so the mode rings forever. Detection of the ringdown phase of GW150914 already constrained the remnant to chi ~ 0.69, in agreement with numerical-relativity predictions (Abbott et al., PRL 116 (2016) 061102). The playground draws the remnant horizon oscillating in shape, the strain waveform h(t), and the live f, tau and Q-factor as M and chi are swept. Reference: Berti, Cardoso, Will, PRD 73 (2006) 064030.'
caption: 'Figure 1. Ringdown of a Kerr black hole. The horizon (oblate spheroid) oscillates with a damped sinusoid whose complex frequency M omega depends on dimensionless spin chi = a/M; only the m = 2 mode is excited by an axisymmetric merger. The strain panel shows h(t) and a no-hair-theorem readout (f, tau, Q). Method: closed-form QNM lookup (Berti et al. 2006) interpolated in chi; physical scaling by f = M omega_R / (2 pi M GMsun/c^3). Source: Berti, Cardoso, Will, Phys. Rev. D 73 (2006) 064030.'
tags: [black-hole, gravitational-wave, animation, three-d, live-readout]
difficulty: 4
tier: single
renderer: canvas2d
estimated_engagement_minutes: 5
share_state_keys: [mass_solar, spin]
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

# Black-hole ringdown (quasinormal mode)
Damped sinusoid set by mass + spin. Source: Berti, Cardoso, Will, Phys. Rev. D 73 (2006) 064030; first BH ringdown: Vishveshwara, Nature 227 (1970) 936.

## Explainer

### What you are looking at

After a binary-black-hole merger, the remnant is a perturbed Kerr
black hole. It settles to its final equilibrium by radiating a
discrete spectrum of damped sinusoids called quasinormal modes
(QNMs). The dominant mode for a merger is the (l, m, n) = (2, 2, 0)
fundamental, which dominates the late-time gravitational-wave signal.
The playground shows the remnant horizon (a slightly oblate spheroid)
oscillating in shape at the QNM frequency, and the strain $h(t)$
panel underneath shows the damped sinusoid that LIGO and Virgo
actually detect.

### The QNM spectrum

A Kerr BH has a discrete set of QNM frequencies $\omega_{\ell m n}$
with negative imaginary part (so the mode decays). The complex
frequency in geometric units is

$$M \omega_{\ell m n} \;=\; M \omega_R \;+\; i\, M \omega_I,$$

with $M \omega_I < 0$. Berti, Cardoso and Will (2006) tabulated
$M\omega_{220}$ for spins $\chi = a/M \in [0, 1)$:

- $\chi = 0$ (Schwarzschild): $M\omega = 0.374 - 0.089\, i$.
- $\chi = 0.5$: $M\omega = 0.460 - 0.088\, i$.
- $\chi = 0.7$: $M\omega = 0.517 - 0.084\, i$.
- $\chi = 0.9$: $M\omega = 0.616 - 0.074\, i$.
- $\chi \to 1$: $M\omega_R \to 1$, $M\omega_I \to 0$ (rings forever).

To convert to physical units, multiply by $M G/c^3 = 4.925 \times
10^{-6}\,\mathrm{s} \times (M/M_\odot)$. So for the 62 $M_\odot$
remnant of GW150914 with $\chi \approx 0.69$:

$$f \;=\; \frac{M\omega_R}{2\pi (M G/c^3)} \;\approx\; 265\,\mathrm{Hz},
  \qquad \tau \;=\; -\frac{M G/c^3}{M\omega_I} \;\approx\; 4\,\mathrm{ms}.$$

These are exactly the numbers that came out of the LIGO O1 ringdown
analysis.

### Quality factor and the no-hair theorem

The Q-factor of the ringdown is

$$Q \;\equiv\; \frac{\omega_R}{2 |\omega_I|},$$

which grows from $\sim 2$ at $\chi = 0$ to $\gg 10$ as $\chi$ approaches
unity. Two independent measurements of $(f, \tau)$ from the same
event would over-determine $(M, \chi)$; consistency tests the no-hair
theorem: that a Kerr BH is fully described by mass and spin alone.

### Symbols

- $M$: remnant black-hole mass (units of $M_\odot$).
- $\chi = a/M$: dimensionless spin parameter, $[0, 1)$.
- $\omega_{\ell m n}$: QNM angular frequency (complex).
- $f = \omega_R / (2\pi)$: ringdown frequency.
- $\tau = -1/\omega_I$: damping time.
- $Q$: quality factor.

### Things to try

- Set $M = 62\, M_\odot$, $\chi = 0.69$: the GW150914 ringdown
  parameters ($f \sim 265$ Hz, $\tau \sim 4$ ms).
- Set $\chi = 0.99$ (near-extremal): the mode rings for a very long
  time before decaying away. $Q \sim 7$ at chi = 0.9, growing to
  larger values toward extremality.
- Sweep $\chi$ at fixed $M$: notice $f$ rises monotonically while
  $\tau$ also grows; both vary smoothly toward extremality.

### Where this comes from

Quasinormal-mode tabulation is from Berti, Cardoso and Will, *Phys.
Rev. D* 73 (2006) 064030; see also the QNM
data on https://centra.tecnico.ulisboa.pt/network/grit/files/ringdown/.
The first identification of a BH ringdown in a gravitational-wave
signal was GW150914, Abbott et al., *Phys. Rev. Lett.* 116 (2016)
061102. The classical formulation is in
Chandrasekhar, *The Mathematical Theory of Black Holes*, Oxford 1983.
