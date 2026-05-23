---
title: Aharonov-Bohm Effect
slug: aharonov-bohm-flux-line
status: verified
audience: portfolio
created: 2026-05-14
primary_uc: FIS3029
supporting_ucs: []
curriculum_year: bsc-y3s2
primary_citation: sakurai-qm
primary_chapter: 2
hook: 'Thread magnetic flux through a region the electrons never enter and the interference pattern still shifts: the potential, not just the field, is physical.'
one_paragraph: 'The Aharonov-Bohm effect: electrons passing on either side of a long solenoid pick up a relative quantum phase set by the enclosed magnetic flux, even though the magnetic field is zero everywhere the electrons actually travel. The double-slit fringe pattern shifts by Phi/Phi_0 cycles, where Phi_0 = h/e is the flux quantum. The playground sweeps the flux and shows the fringes sliding. It is the cleanest evidence that the electromagnetic potential is physically meaningful in quantum mechanics. Reference: Sakurai, Modern Quantum Mechanics, Ch. 2.'
tags: [quantum, atomic-molecular, animation, live-readout]
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
# Aharonov-Bohm flux line
Solenoid behind a double slit shifts the fringe pattern by $\Phi/\Phi_0$ cycles. Source: Sakurai Ch. 2.

## Explainer

### What you are looking at

Run electrons through a double slit with a tiny solenoid hidden behind
the barrier. The magnetic field is zero everywhere the electrons can
go, yet turning the solenoid on shifts the interference fringes
sideways. The electrons "felt" something they never touched. That is
the Aharonov-Bohm effect, and it forced physics to take the
electromagnetic potential seriously as a real thing.

### The phase from the potential

In quantum mechanics a charged particle picks up a phase from the
vector potential $\mathbf A$, not just the field $\mathbf B$. An
electron going through slit 1 versus slit 2 accumulates a relative
phase equal to the loop integral of $\mathbf A$ around the two paths,
which by Stokes's theorem is the enclosed magnetic flux:

$$\Delta\varphi = \frac{q}{\hbar}\oint \mathbf A\cdot d\boldsymbol\ell
  = \frac{q\,\Phi}{\hbar} = 2\pi\,\frac{\Phi}{\Phi_0},
  \qquad \Phi_0 = \frac{h}{q}.$$

The flux $\Phi$ is entirely inside the solenoid; outside, $\mathbf B =
0$ but $\mathbf A \ne 0$. So the fringe pattern shifts by exactly
$\Phi/\Phi_0$ whole fringes as you wind up the flux, even though no
force ever acts on the electrons.

### Why it matters

Classically only fields exert forces, so a potential with no field
should be undetectable. The AB effect proves otherwise: in quantum
mechanics the potential is physically meaningful (gauge-invariant only
up to the enclosed flux). It is the conceptual ancestor of gauge
theories and of geometric (Berry) phase, and it is measured to high
precision. The playground sweeps the flux and slides the fringes
through exactly $\Phi/\Phi_0$ cycles.

### Things to try

- Increase the flux by one flux quantum $\Phi_0$ and watch the fringe
  pattern shift by exactly one whole fringe.
- Note the electron beam path never enters the field region: the
  shift is from $\mathbf A$ alone.
- Set $\Phi = \tfrac12\Phi_0$ and see bright and dark swap (a
  half-fringe shift).

### Where this comes from

The vector-potential phase, the flux-quantum fringe shift, and the
gauge-invariance argument follow Sakurai, *Modern Quantum Mechanics*,
Chapter 2 (after Aharonov and Bohm 1959).
