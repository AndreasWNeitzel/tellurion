---
title: Hydrogen Fine Structure
slug: fine-structure-hydrogen
status: verified
audience: portfolio
created: 2026-05-14
primary_uc: FIS3029
supporting_ucs: []
curriculum_year: bsc-y3s2
primary_citation: griffiths-qm
primary_chapter: 6
hook: 'The Bohr energy levels are not quite single lines; relativity and spin-orbit coupling split them by a factor alpha-squared into the hydrogen fine structure.'
one_paragraph: 'The Bohr model gives hydrogen levels that depend only on n. Adding the leading relativistic kinetic correction and spin-orbit coupling, both of order alpha^2 times the Bohr energy (alpha around 1/137), splits each level into a fine structure that depends on the total angular momentum j, not l separately. The playground shows the Bohr levels, their alpha^2 splitting, and the j-labeled sublevels. This is what high-resolution spectroscopy actually measures and what the Dirac equation explains exactly. Reference: Griffiths, Introduction to Quantum Mechanics, Ch. 6.'
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
references:
  - "Griffiths, Introduction to Quantum Mechanics, 3rd ed., Ch. 6."
---
# Hydrogen fine structure
Bohr levels split by $\alpha^2$ corrections; degeneracy is $j$-labeled. Source: Griffiths QM Ch. 6.

## Explainer

### What you are looking at

The Bohr model says hydrogen's energy depends only on $n$. Look closely
(or do relativity properly) and each level splits by a tiny amount of
order $\alpha^2$, the fine structure. The playground shows the Bohr
ladder and its fine splitting, relabeled by the total angular momentum
$j$.

### Three small corrections, all of order alpha squared

On top of the Bohr energy $E_n = -13.6\,\mathrm{eV}/n^2$ there are
three relativistic corrections, each suppressed by the fine-structure
constant squared, $\alpha^2 \approx (1/137)^2$:

- Relativistic kinetic correction (the electron is slightly
  relativistic): $\propto -\alpha^2/n^3$.
- Spin-orbit coupling (the electron's spin in the proton's apparent
  magnetic field, with the Thomas factor): depends on
  $\mathbf L\cdot\mathbf S$.
- The Darwin term (a contact correction for $\ell=0$ states).

Summed, they collapse into a strikingly simple result that depends only
on $n$ and the total angular momentum $j = \ell\pm\tfrac12$:

$$E_{nj} = E_n\left[1 + \frac{\alpha^2}{n^2}
  \left(\frac{n}{j+\tfrac12} - \frac34\right)\right].$$

### Why j, not l

Individually the three terms depend on $\ell$, but their sum depends
only on $j$. So states of the same $n$ and $j$ but different $\ell$
(e.g., $2s_{1/2}$ and $2p_{1/2}$) remain degenerate at this order, a
nontrivial cancellation that the Dirac equation explains exactly (the
tiny remaining $2s_{1/2}$-$2p_{1/2}$ splitting is the Lamb shift, a QED
effect beyond fine structure). The playground shows each Bohr level
fanning into its $j$-labeled fine-structure sublevels scaled by
$\alpha^2$.

### Things to try

- Watch each $n$ level split into a small $j$-labeled multiplet
  (spacing $\sim\alpha^2 E_n$).
- Note states with the same $n,j$ but different $\ell$ sit exactly on
  top of each other (the $j$-only dependence).
- Compare the splitting size to the gross Bohr spacing: it is
  $\sim10^{-4}$ of it (hence "fine").

### Where this comes from

The relativistic kinetic, spin-orbit, and Darwin corrections and the
$j$-only fine-structure formula follow Griffiths, *Introduction to
Quantum Mechanics*, Chapter 6.
