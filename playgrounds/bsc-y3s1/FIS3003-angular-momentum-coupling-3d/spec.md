---
title: Adding Angular Momenta - The Vector Model
slug: angular-momentum-coupling-3d
status: verified
audience: portfolio
created: 2026-05-17
hook: 'Two spins on precessing cones add to a total that can only take the values the triangle rule permits, and the Clebsch-Gordan table is exactly the unitary matrix that rotates between the two pictures.'
one_paragraph: 'Two angular momenta j1 and j2 combine into a total J restricted to |j1-j2| <= J <= j1+j2. The primary scene is the 3D vector model: J1 and J2 precess on cones about the resultant J, their lengths sqrt(j(j+1)) and their tips circling so the sum stays fixed. The side panel is the Clebsch-Gordan coefficient table for the chosen total, computed by the Racah closed form, with the allowed-J ladder. The CG matrix is unitary: its columns and rows are orthonormal. The headless sim.js is gate-tested for the triangle inequality and dimension count, CG row/column orthonormality, the M = m1+m2 selection rule, tabulated Condon-Shortley values, the exchange symmetry and the vector-model geometry.'
tags: [quantum, angular-momentum, 3d, multi-panel, live-readout]
difficulty: 4
tier: advanced
hero_candidate: true
renderer: canvas2d
estimated_engagement_minutes: 5
curriculum_year: 'L:F-3Y-1S'
primary_uc: FIS3003
share_state_keys: []
---

# Adding Angular Momenta - The Vector Model

## Physical setup

Two angular momenta of magnitudes j1 and j2 are added; the total J is
observed in the vector model and the basis change is read off the
Clebsch-Gordan table.

## Governing equations

`|j1 - j2| <= J <= j1 + j2` in unit steps (the triangle rule). Vector
lengths `sqrt(j(j+1))`; the angle of J1 to the resultant from the law
of cosines `J . J1 = (1/2)[J(J+1) + j1(j1+1) - j2(j2+1)]`. The
Clebsch-Gordan coefficients `<j1 m1 j2 m2 | J M>` (Racah formula,
Condon-Shortley phase) are nonzero only for `M = m1 + m2` and a valid
triangle, and form a unitary transformation between the uncoupled and
coupled bases.

## Numerical method

The Racah closed-form sum with a memoised factorial, evaluated on the
doubled-integer (2j) scale so half-integers are exact. The vector
model fixes J along the axis and places J1 on its cone with J2
closing the triangle. Reference: Sakurai and Napolitano, *Modern
Quantum Mechanics* (2nd ed.), Sec. 3.8 (`sakurai-qm`).

## Controls

- j1, j2: each from 1/2 to 3 in half-integer steps.
- total J: cycles the allowed values.
- Reset, Pause.

## Expected qualitative features

- J1 and J2 precess on cones about J; the stretched state
  `J = j1+j2` leans them together, `J = |j1-j2|` opposes them.
- The allowed-J ladder and the CG table change with j1, j2.
- The CG table colour shows |coefficient|; each column sums (in
  squares) to 1.

## Invariants and acceptance thresholds

- Allowed J spans `|j1-j2|..j1+j2`, count `2 min(j1,j2)+1`; the
  uncoupled and coupled dimensions both equal `(2j1+1)(2j2+1)`.
- CG columns orthonormal and CG rows orthonormal (to 1e-9).
- CG vanishes unless `M = m1+m2` and the triangle holds.
- Tabulated values reproduced: stretched `= +1`; spin-1/2 pair
  `1/sqrt2`; the full `1 (x) 1` table.
- Exchange symmetry `CG(1<->2) = (-1)^(j1+j2-J) CG`.
- `|J| = sqrt(J(J+1))`; the vector-model cosines lie in `[-1, 1]`.

## Limiting cases for verification

- Stretched `J = j1+j2`: the single top state, CG `= 1`.
- `j1 = j2 = 1/2`: the singlet and triplet with `1/sqrt2`
  coefficients.

Source: Sakurai and Napolitano, *Modern Quantum Mechanics* (2nd ed.),
Sec. 3.8 (`sakurai-qm`).
