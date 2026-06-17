---
title: Hydrogen in Electric and Magnetic Fields
slug: hydrogen-atom-stark-zeeman
status: verified
audience: portfolio
created: 2026-05-17
hook: 'A magnetic field fans every level into a Lorentz triplet, an electric field shears the excited shells, and the ground state alone refuses to budge: no first-order Stark.'
one_paragraph: 'Hydrogen levels n = 1..4 split under external fields. The primary scene is the physical term diagram, each Rydberg level fanning into sublevels as the magnetic (Zeeman, dE = mu_B B m_l) and electric (linear Stark for n >= 2) fields ramp, with the chosen transition drawn; beside it the synthetic spectrum shows the line splitting a spectrometer records (a normal-Zeeman triplet, a Stark multiplet), zoomed onto the multiplet. The ground state shows the textbook result: no first-order Stark shift (it has no permanent dipole), only a tiny negative quadratic one, while excited levels with degenerate l mix and split linearly in the field. Ramp B and the electric field and pick a transition to watch the normal-Zeeman triplet and the Stark multiplet form. Reference: Griffiths, Introduction to Quantum Mechanics, Chapter 6; Bransden and Joachain, Physics of Atoms and Molecules.'
tags: [quantum, atomic, spectroscopy, multi-panel, live-readout]
difficulty: 4
tier: advanced
hero_candidate: true
renderer: canvas2d
estimated_engagement_minutes: 5
curriculum_year: 'L:F-3Y-1S'
primary_uc: FIS3003
primary_citation: griffithsqm2018
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
  - "Griffiths, Introduction to Elementary Particles, Second (revised) ed."
---

# Hydrogen in Electric and Magnetic Fields

## Explainer

### What you are looking at

Put a hydrogen atom in a magnetic field and its spectral lines split
into evenly spaced components; put it in an electric field and they
shift and split differently. The playground applies both and shows the
levels splitting and the line splitting into the spectrometer. These
are the Zeeman and Stark effects, the original tools for reading atomic
structure.

### Zeeman: magnetic splitting

A magnetic field $B$ gives each orbital sublevel an energy

$$\Delta E = \mu_B\,B\,m_\ell,$$

linear in $B$ and equally spaced in the magnetic quantum number
$m_\ell$. With the dipole selection rule $\Delta m \in \{-1, 0, +1\}$ a
single spectral line becomes the normal Zeeman triplet at
$E_0$ and $E_0 \pm \mu_B B$. (Electron spin adds the richer anomalous
pattern; the normal triplet is the clean baseline shown here.)

### Stark: electric splitting

An electric field $F$ acts differently because hydrogen has degenerate
states that mix. In parabolic quantum numbers the first-order (linear)
Stark shift is

$$\Delta E = \tfrac32\,n\,(n_1 - n_2)\,e\,a_0\,F,$$

so excited levels fan out linearly in $F$. The ground state ($n = 1$)
has no such degeneracy, so its first-order shift is exactly zero and
the leading effect is a small negative quadratic shift
$-\tfrac12\alpha F^2$ (the polarizability). The contrast (linear Stark
for excited states, quadratic for the ground state) is itself the
lesson about degeneracy and perturbation theory.

### Things to try

- Turn up $B$ and watch a line split into the evenly spaced Zeeman
  triplet, the spacing growing linearly with $B$.
- Turn up $F$ on an excited level and watch the linear Stark fan;
  switch to $n=1$ and watch only a tiny quadratic shift.
- Apply both and see the combined pattern, with the dipole selection
  rules controlling which components appear.

### Where this comes from

The normal Zeeman splitting, the linear and quadratic Stark effects,
and the dipole selection rules follow Griffiths, *Introduction to
Quantum Mechanics*, Chapter 6, and Bransden and Joachain, *Physics of
Atoms and Molecules*.

## Physical setup

A hydrogen atom in a uniform magnetic field (Zeeman) and a uniform
electric field (Stark), with a chosen emission transition observed in
a synthetic spectrometer.

## Governing equations

Unperturbed `E_n = -RY/n^2`. Normal Zeeman: each level splits into
`2l+1` sublevels at `dE = mu_B B m_l` (equal spacing, linear in B); a
spectral line becomes the Lorentz triplet `E0, E0 +/- mu_B B`. Linear
Stark in parabolic quantum numbers
`dE = (3/2) n (n1 - n2) e a0 F`; for `n = 1` only `(0,0,0)` exists so
the first-order shift is exactly zero, leaving a negative quadratic
shift `-(1/2) alpha F^2`. Dipole selection rules `dl = +/-1`,
`dm in {-1,0,+1}`.

## Numerical method

Closed-form level, Stark and Zeeman expressions; parabolic states
enumerate the Stark sublevels. The term-diagram fan is auto-normalised
per level (Zeeman and Stark differ by orders of magnitude, so the fan
is schematic while the readout and the zoomed spectrum carry the true
magnitudes). Reference: Griffiths, *Introduction to Quantum
Mechanics* (3rd ed.), Ch. 6.

## Controls

- transition: Lyman-alpha 2->1, Balmer-alpha 3->2, Balmer-beta
  4->2, Paschen 4->3.
- Zeeman B (tesla); Stark field F.
- Reset, Pause.

## Expected qualitative features

- A magnetic field fans every level symmetrically; the line becomes a
  triplet whose spacing grows with B.
- An electric field shears the n >= 2 shells linearly; the n = 1 line
  stays put (only a faint quadratic dip).
- Both fields together give a dense multiplet in the spectrum.

## Invariants and acceptance thresholds

- `E_n = -RY/n^2`; Lyman-alpha ~ 10.2 eV.
- n=1: `starkLinear = 0` for all F; quadratic shift negative and
  `~ F^2`.
- n=2: extreme Stark shift `= +/- 3 e a0 F`, the m=+/-1 components
  unshifted, linear in F.
- Zeeman spacing `= mu_B B`, linear in B, m=0 unshifted, `n^2`
  sublevels.
- Lorentz triplet spacing `mu_B B`, collapsing at B=0.
- Selection rules `dl = +/-1`, `|dm| <= 1`.
- Zero field restores exact degeneracy.

## Limiting cases for verification

- `B = F = 0`: all sublevels collapse to `E_n`.
- Ground state: no linear Stark, only a quadratic pull-down.

Source: Griffiths, *Introduction to Quantum Mechanics* (3rd ed.),
Ch. 6.
