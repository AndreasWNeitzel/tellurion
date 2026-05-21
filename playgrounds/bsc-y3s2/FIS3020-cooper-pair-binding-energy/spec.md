---
title: Cooper Pair Binding Energy
slug: cooper-pair-binding-energy
status: verified
audience: portfolio
created: 2026-05-14
primary_uc: FIS3020
supporting_ucs: []
curriculum_year: bsc-y3s2
primary_citation: ashcroft-mermin
primary_chapter: 34
hook: 'Two electrons above a filled Fermi sea bind with arbitrarily weak phonon-mediated attraction, with exponentially small binding energy set by the BCS formula.'
one_paragraph: 'A Cooper pair forms when two electrons with equal and opposite momenta interact attractively above a filled Fermi sea, creating a bound state with binding energy $E_b = 2\\hbar\\omega_D e^{-2/N(0)V}$. The left panel shows how this energy varies logarithmically with the dimensionless coupling $N(0)V$, while the right panel displays the pair wavefunction amplitude peaking near the Fermi surface within a shell of width $\\hbar\\omega_D$. Move the sliders to see how the coupling strength $V$, density of states $N(0)$, and Debye cutoff $\\hbar\\omega_D$ determine the outcome.'
tags: [solid-state, animation, live-readout, wavefunction]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: ['V', 'N0', 'omega_D']
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
# Cooper pair binding energy

## Explainer

### What you are looking at

Two electrons normally repel. Yet add just two extra electrons above a
filled Fermi sea with the faintest attraction between them and they
*always* form a bound pair, no matter how weak the attraction. That
counterintuitive fact, Cooper's 1956 result, is the seed of
superconductivity. The playground sweeps the coupling and shows the
binding energy and the pair wavefunction.

### Why any attraction binds (the Fermi sea matters)

In free space a weak 3D attraction does not always make a bound state.
The difference here is the filled Fermi sea: the two extra electrons
can only scatter into empty states *above* the Fermi surface, which
quantum-mechanically acts like a reduced-dimensionality problem where
even an infinitesimal attraction binds. Solving Cooper's equation gives
the binding energy

$$E_b = 2\hbar\omega_D\,\exp\!\left(-\frac{2}{N(0)\,V}\right),$$

where $V > 0$ is the attractive coupling, $N(0)$ the density of states
at the Fermi level, and $\hbar\omega_D$ the phonon (Debye) cutoff that
limits which states the phonon-mediated attraction connects.

### The exponential and the pair size

The crucial feature is the non-analytic $\exp(-2/N(0)V)$: $E_b$ is
exponentially small and has an essential singularity at $V = 0$, so it
can never be reached by perturbation theory in $V$. That is why
superconductivity was missed for decades. The pair wavefunction
$|g(\xi)| = 1/(2|\xi + E_b|)$ is sharply peaked at the Fermi surface
within a shell of width $\sim\hbar\omega_D$: the paired electrons are
loosely correlated over a large coherence length, not a tight
molecule. The playground shows $E_b$ collapsing exponentially as the
coupling weakens and the wavefunction peak at $\xi = 0$.

### Things to try

- Lower $N(0)V$ and watch $E_b$ plunge exponentially (never to zero,
  but unreachable by any power series).
- Raise $\hbar\omega_D$ and watch $E_b$ scale linearly with it.
- Note the wavefunction is always peaked at the Fermi surface, width
  set by $\omega_D$.

### Where this comes from

Cooper's pair-binding result, the $E_b = 2\hbar\omega_D e^{-2/N(0)V}$
formula, and its essential singularity follow Tinkham, *Introduction to
Superconductivity*, and Ashcroft and Mermin, *Solid State Physics*,
Chapter 34 (after Cooper 1956).

Two electrons added to a filled Fermi sea form a bound pair via an attractive phonon-mediated interaction. The binding energy is exponentially small in the weak-coupling regime,

$$ E_b = 2\hbar\omega_D \exp(-2/N(0)V), $$

where $V > 0$ is the attractive coupling strength, $N(0)$ is the density of states at the Fermi level, and $\hbar\omega_D$ is the phonon Debye cutoff energy. The pair wavefunction is peaked within a thin shell of width $\sim \hbar\omega_D$ above and below the Fermi surface.

**Numerical method:** Direct evaluation of the BCS formula with live parameter updates from three sliders (V, N(0), $\hbar\omega_D$). The pair wavefunction is plotted as $|g(\xi)| = 1/(2|\xi + E_b|)$, where $\xi$ is the single-particle energy relative to the Fermi level.

**Expected qualitative features:** The left panel shows the characteristic exponential suppression of $E_b$ as $N(0)V$ decreases from weak to ultraviolet coupling. The right panel reveals the sharp peak at $\xi = 0$ with width set by $\omega_D$, illustrating the localization of the pair near the Fermi surface.

**Invariants:** $E_b > 0$ for all $V, N(0) > 0$; $E_b$ monotonically increases with $N(0)V$; $E_b$ scales linearly with $\hbar\omega_D$.

**Reference:** Ashcroft-Mermin Ch. 34.

