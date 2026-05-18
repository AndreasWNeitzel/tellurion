---
title: Zeeman to Paschen-Back Crossover
slug: zeeman-paschen-back-crossover
status: verified
audience: portfolio
created: 2026-05-14
primary_uc: FIS3029
supporting_ucs: []
curriculum_year: bsc-y3s2
primary_citation: griffiths-qm
primary_chapter: 6
hook: 'Turn up a magnetic field on an atom: weak fields split lines by the Lande g-factor, strong fields reorganize them entirely as spin and orbit decouple.'
one_paragraph: 'An external magnetic field shifts atomic energy levels, but how depends on its strength relative to the internal spin-orbit coupling. In the weak-field Zeeman regime the shift is g_J m_J mu_B B with the Lande factor g_J. In the strong-field Paschen-Back regime the field overpowers spin-orbit, L and S decouple, and the shift becomes (m_L + 2 m_S) mu_B B. The playground sweeps B from weak to strong and shows the levels rearranging through the crossover between the two limits. Reference: Griffiths, Introduction to Quantum Mechanics, Ch. 6.4.'
tags: [quantum, atomic-molecular, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
---
# Zeeman to Paschen-Back
Low-$B$ Zeeman: $g_J m_J \mu_B B$. High-$B$ Paschen-Back: $(m_L + 2m_S) \mu_B B$. Source: Griffiths QM Ch. 6.4 (`griffiths-qm`).

## Explainer

### What you are looking at

Put an atom in a magnetic field and its levels split. But *how* they
split changes completely depending on whether the field is weak or
strong compared to the atom's own internal spin-orbit coupling. The
playground sweeps the field from weak to strong and shows the levels
reorganize through that crossover.

### Weak field: the Zeeman regime

When the external field is weaker than the internal spin-orbit
coupling, $\mathbf L$ and $\mathbf S$ stay locked into the total
$\mathbf J$, which precesses about the field. Each level splits by

$$\Delta E = g_J\,m_J\,\mu_B B,$$

where $g_J$ is the Lande g-factor (it depends on how $L$ and $S$
combine) and $m_J$ runs over the $2J+1$ projections. The splitting is
linear in $B$ and the spacing is $g_J\mu_B B$.

### Strong field: the Paschen-Back regime

When the external field overpowers spin-orbit coupling, $\mathbf L$ and
$\mathbf S$ decouple and precess independently about the field. The
shift becomes

$$\Delta E = (m_L + 2 m_S)\,\mu_B B,$$

(the factor 2 is the electron spin g-factor). The level pattern
regroups entirely: states reorganize by $m_L$ and $m_S$ separately
rather than by $m_J$.

### The crossover

In between, neither limit is exact and the levels follow a
nonlinear interpolation (the Breit-Rabi behavior). The playground
ramps $B$ so you watch the weak-field Zeeman fan smoothly morph into
the strong-field Paschen-Back grouping, with the crossover where
$\mu_B B$ becomes comparable to the fine-structure splitting.

### Things to try

- Low $B$: evenly spaced Zeeman sublevels with spacing $g_J\mu_B B$.
- Crank $B$ up and watch the levels bend and regroup through the
  crossover.
- High $B$: the Paschen-Back pattern organized by $m_L + 2m_S$.

### Where this comes from

The weak-field Zeeman ($g_J m_J\mu_B B$), strong-field Paschen-Back
($(m_L+2m_S)\mu_B B$), and the crossover follow Griffiths,
*Introduction to Quantum Mechanics*, Section 6.4.
