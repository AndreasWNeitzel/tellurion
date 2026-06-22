---
title: Change of Basis
slug: change-of-basis
status: verified
audience: portfolio
created: 2026-06-22
primary_uc: M1038
curriculum_year: bsc-y1s1
primary_citation: strang-linalg
primary_chapter: 7
hook: "A vector is one arrow, but its coordinates depend on the basis. Re-grid the plane and watch the unmoved vector's numbers change."
one_paragraph: "Coordinates describe a vector relative to a basis. With basis {b1, b2}, the change-of-basis matrix P = [b1 | b2] satisfies P c = v, so the same arrow v has coordinates c = P^{-1} v, while the standard basis returns c = v. The playground draws the standard square grid and a draggable skew-basis grid together, resolving v into c1 b1 + c2 b2 along the oblique axes; the diagnostic sweeps v around a circle and plots its coordinates in each basis, clean cosine and sine in the standard one and rescaled, phase-shifted sinusoids in the chosen one. This relabelling underlies diagonalization, where the right basis makes P^{-1} A P diagonal."
tags: [linear-algebra, change-of-basis, coordinates, interactive]
difficulty: 2
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 5
share_state_keys: []
invariants:
  - key: recon
    label: the coordinates reconstruct the vector, c1 b1 + c2 b2 = v
    tolerance: 1e-9
  - key: standard
    label: the standard basis returns the vector itself
    tolerance: 1e-12
  - key: similarity
    label: a similarity transform P^{-1} A P preserves trace and determinant
    tolerance: 1e-9
what_to_try:
  - Drag the basis vectors to re-grid the plane; the coordinates of the unmoved vector change while the arrow stays put.
  - Drag the vector; its standard and basis coordinates both update, related by P inverse.
  - Cycle to the rotated orthonormal basis; the grid stays square and the coordinate sinusoids only shift in phase.
references:
  - "Strang, Introduction to Linear Algebra, 5th ed., Sec. 7.2 (change of basis)."
  - "Axler, Linear Algebra Done Right, Ch. 3."
---

# Change of basis

## Mathematical setup

A vector v is described by coordinates relative to a basis. Two bases give two
coordinate columns for the same arrow.

## Equations

With $P = [\,b_1\ \ b_2\,]$ (the basis vectors as columns),

$$ v = c_1 b_1 + c_2 b_2 = P c \quad\Longrightarrow\quad c = P^{-1} v, $$

and the standard basis returns $c = v$. An operator changes the same way:
$A_B = P^{-1} A P$, which preserves trace and determinant and is diagonal in an
eigenbasis.

## Numerical method

No engine. Closed-form 2x2 inverse for the coordinate transform; the diagnostic
sweeps the vector direction and evaluates the coordinates in each basis.

## Controls

- Next basis (skew, rotated orthonormal, stretched, sheared); drag the basis
  vectors and the vector; Reset.

## Expected qualitative features

1. The same arrow has different coordinates in different bases.
2. The standard basis returns the vector's own components.
3. An orthonormal basis keeps lengths (square grid); a skew basis distorts the
   coordinate functions.

## Invariants and acceptance thresholds

- $c_1 b_1 + c_2 b_2 = v$.
- The standard basis returns $v$.
- $P^{-1} A P$ preserves trace and determinant.

## Citations

Strang, Introduction to Linear Algebra, 5th ed., Sec. 7.2. Axler, Linear Algebra
Done Right, Ch. 3.
