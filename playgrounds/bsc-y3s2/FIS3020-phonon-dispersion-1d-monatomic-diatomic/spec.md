---
title: 1D Phonon Dispersion (Monatomic and Diatomic)
slug: phonon-dispersion-1d-monatomic-diatomic
status: verified
audience: portfolio
created: 2026-05-14
primary_uc: FIS3020
supporting_ucs: []
curriculum_year: bsc-y3s2
primary_citation: ashcroft-mermin
primary_chapter: 22
hook: 'A chain of identical masses carries only sound-like waves; alternate two masses and a second, high-frequency optical branch appears with a forbidden gap between them.'
one_paragraph: 'Lattice vibrations of a 1D spring-mass chain have a dispersion relation set by the unit cell. A monatomic chain gives a single acoustic branch: long waves are ordinary sound, and the frequency saturates at the zone boundary. A diatomic chain of two alternating masses splits this into an acoustic branch and a higher optical branch, with a frequency gap at the zone edge where no traveling waves exist. The playground draws both dispersions and animates the chosen normal mode atom by atom, so you see acoustic motion (atoms moving together) versus optical (neighbours moving against each other). Reference: Ashcroft and Mermin, Solid State Physics, Ch. 22.'
tags: [solid-state, animation, live-readout]
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
  - "Ashcroft, Mermin, Solid State Physics, Ch. 22."
---
# 1D phonon dispersion
Monatomic acoustic vs diatomic acoustic + optical; gap at zone boundary. Source: Ashcroft-Mermin Ch. 22.

## Explainer

### What you are looking at

A crystal's atoms are masses on springs. The waves they can carry,
phonons, have allowed frequencies that depend on wavelength: the
dispersion relation. A chain of identical atoms carries only
sound-like waves; alternate two atoms and a second, high-frequency
optical branch appears with a forbidden gap between them. That gap is
why ionic crystals have a reststrahlen band.

### Monatomic chain

Equal masses $m$, spring constant $K$, spacing $a$. Newton's law for a
small displacement gives

$$\omega(k) = 2\sqrt{\frac{K}{m}}\,
  \left|\sin\!\frac{ka}{2}\right|.$$

A single acoustic branch: at long wavelength ($k\to0$) it is linear,
$\omega \approx \sqrt{K/m}\,a\,|k|$, ordinary sound with speed
$v = a\sqrt{K/m}$. At the zone boundary $k=\pi/a$ the frequency
saturates at $2\sqrt{K/m}$; the lattice cannot vibrate faster.

### Diatomic chain: a gap opens

Put two different masses $m_1, m_2$ in the cell and the single branch
splits into two:

$$\omega_\pm^2 = K\!\left(\frac1{m_1}+\frac1{m_2}\right)
  \pm K\sqrt{\left(\frac1{m_1}+\frac1{m_2}\right)^2
  - \frac{4\sin^2(ka/2)}{m_1 m_2}}.$$

The lower (acoustic) branch is neighbors moving in phase, ordinary
sound; the upper (optical) branch is the two sublattices moving against
each other (in an ionic crystal this is what infrared light drives).
Between the top of the acoustic branch and the bottom of the optical
branch lies a frequency gap, no propagating waves, which closes only
when $m_1 = m_2$ (back to the monatomic chain). The playground draws
both branches and animates the chosen mode atom by atom.

### Things to try

- Watch the monatomic branch: linear sound at small $k$, flattening at
  the zone edge.
- Switch to the diatomic chain and see the gap open between acoustic
  and optical branches.
- Set the two masses equal and watch the gap close (the optical branch
  folds back into the acoustic one).

### Where this comes from

The monatomic and diatomic phonon dispersions, the acoustic and optical
branches, and the zone-boundary gap follow Ashcroft and Mermin, *Solid
State Physics*, Chapter 22.

## Planned upgrade (Phase 13 / Upgrade A)

Add an animated 2D lattice strip beneath the dispersion-curve panel: 20 atom
circles (monatomic) or 10 atom pairs (diatomic). Clicking any point on the
dispersion curve animates that normal mode with each atom oscillating at the
right $(k, \omega)$. Acoustic: atoms move in phase. Optical (diatomic): the
two atom types move opposite. Status: planned, not yet implemented.
