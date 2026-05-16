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
---
# Cooper pair binding energy

Two electrons added to a filled Fermi sea form a bound pair via an attractive phonon-mediated interaction. The binding energy is exponentially small in the weak-coupling regime,

$$ E_b = 2\hbar\omega_D \exp(-2/N(0)V), $$

where $V > 0$ is the attractive coupling strength, $N(0)$ is the density of states at the Fermi level, and $\hbar\omega_D$ is the phonon Debye cutoff energy. The pair wavefunction is peaked within a thin shell of width $\sim \hbar\omega_D$ above and below the Fermi surface.

**Numerical method:** Direct evaluation of the BCS formula with live parameter updates from three sliders (V, N(0), $\hbar\omega_D$). The pair wavefunction is plotted as $|g(\xi)| = 1/(2|\xi + E_b|)$, where $\xi$ is the single-particle energy relative to the Fermi level.

**Expected qualitative features:** The left panel shows the characteristic exponential suppression of $E_b$ as $N(0)V$ decreases from weak to ultraviolet coupling. The right panel reveals the sharp peak at $\xi = 0$ with width set by $\omega_D$, illustrating the localization of the pair near the Fermi surface.

**Invariants:** $E_b > 0$ for all $V, N(0) > 0$; $E_b$ monotonically increases with $N(0)V$; $E_b$ scales linearly with $\hbar\omega_D$.

**Reference:** Ashcroft-Mermin Ch. 34.

