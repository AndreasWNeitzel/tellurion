---
title: Ampere's Law: Wire, Solenoid, Toroid
slug: ampere-law-solenoid-toroid
status: verified
audience: portfolio
created: 2026-06-21
primary_uc: FIS1014
supporting_ucs: []
curriculum_year: bsc-y1s2
primary_citation: griffithsem2017
primary_chapter: 5
hook: "When the symmetry is high enough, the closed line integral of B collapses to B times the loop length, so Ampere's law hands you the field for free: 1/r around a wire, uniform in a solenoid, 1/r in a toroid."
one_paragraph: "Ampere's law states that the closed line integral of B around any loop equals mu0 times the current it encircles. In a symmetric case where B is constant and parallel to a well-chosen Amperian loop, the integral becomes B times the loop length and the field pops out: a circular loop around a straight wire gives B = mu0 I / 2 pi r; a rectangular loop straddling a solenoid wall gives the uniform interior B = mu0 n I; a circular loop inside a toroid gives B = mu0 N I / 2 pi r. The playground draws the geometry, the field and the draggable Amperian loop, plots B versus distance (1/r for wire and toroid, a step for the solenoid), and reads out the circulation alongside the enclosed current so you can watch them stay equal as you move the loop."
tags: [electromagnetism, magnetostatics, interactive, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 4
share_state_keys: []
invariants:
  - key: ampere
    label: the closed line integral of B equals mu0 times the enclosed current
    tolerance: 1e-6
  - key: wire-law
    label: the straight-wire field falls as 1/r
    tolerance: 1e-9
  - key: toroid-zero
    label: a loop in the toroid hole or outside encloses no current
    tolerance: 0
what_to_try:
  - Wire: drag the loop in and out; B falls as 1/r but the loop length grows as r, so the circulation stays equal to the enclosed current.
  - Solenoid: stretch the rectangular loop; only the inside leg is in the field and B = mu0 n I is uniform.
  - Toroid: move the loop across the windings; it always encircles all N turns, so B falls as 1/r and is zero in the hole and outside.
references:
  - "Griffiths, Introduction to Electrodynamics, Fifth ed., Sec. 5.3."
  - "Young and Freedman, University Physics, 14e, Ch. 28."
---

# Ampere's law: wire, solenoid, toroid

## Physical setup

Three high-symmetry current arrangements: an infinite straight wire carrying $I$,
an ideal solenoid with $n$ turns per unit length, and a toroid of $N$ turns with
inner radius $a$ and outer radius $b$. Each has an Amperian loop on which $B$ is
constant and parallel.

## Equations

Ampere's law is $\oint \mathbf{B}\cdot d\boldsymbol{\ell} = \mu_0 I_{\text{enc}}$.
For the symmetric loops it reduces to $B \times (\text{loop length}) = \mu_0
I_{\text{enc}}$:

$$B_{\text{wire}} = \frac{\mu_0 I}{2\pi r}, \quad
  B_{\text{sol}} = \mu_0 n I \ (\text{inside}), \quad
  B_{\text{tor}} = \frac{\mu_0 N I}{2\pi r}\ (a < r < b).$$

The wire field is azimuthal; the solenoid field is uniform inside and zero
outside; the toroid field circulates inside the windings and is zero in the hole
and outside.

## Numerical method

Closed form; no engine. The field laws and the circulation / enclosed-current
pair are evaluated directly for the chosen geometry and loop size.

## Controls

- Geometry (wire, solenoid, toroid), current $I$, and a draggable Amperian loop
  (circle radius for wire and toroid, rectangular length for the solenoid).
  Reset.

## Expected qualitative features

1. The circulation $B \times \text{length}$ always equals $\mu_0 I_{\text{enc}}$,
   independent of the loop size.
2. The wire and toroid fields fall as $1/r$; the solenoid field is a uniform
   plateau inside and zero outside.
3. A toroid loop in the central hole or outside the windings encloses no current
   and reads zero.

## Invariants and acceptance thresholds

- $\oint \mathbf{B}\cdot d\boldsymbol{\ell} = \mu_0 I_{\text{enc}}$ exactly, all
  cases and loop sizes.
- $B_{\text{wire}}(2r) = \tfrac12 B_{\text{wire}}(r)$.
- $I_{\text{enc}} = 0$ for a toroid loop with $r < a$ or $r > b$.

## Citations

Griffiths, Introduction to Electrodynamics, 5th ed., Sec. 5.3. Young and
Freedman, University Physics, 14th ed., Ch. 28.
