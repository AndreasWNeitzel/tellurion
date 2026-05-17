---
title: Canonical Transformations
slug: canonical-transformation-visual
status: verified
audience: portfolio
created: 2026-05-17
hook: 'Stretch a phase blob with a squeeze and it goes thin but never changes area; double the momentum and it balloons: the Poisson bracket reads 1 or 2 and tells you which is canonical.'
one_paragraph: 'A change of phase-space coordinates (q,p) -> (Q,P) is canonical exactly when it preserves the symplectic structure: {Q,P} = 1, equivalently the Jacobian is unimodular, equivalently the phase-space area is preserved (Liouville). The scene shows a phase blob and its image under a chosen map: the harmonic scaling that turns the energy ellipse into a circle, a phase rotation, an area-preserving squeeze, a point + momentum transform, and a deliberately non-canonical p-doubling with {Q,P} = 2. The readouts are the analytic Poisson bracket and the shoelace area ratio. The headless sim.js is gate-tested for {Q,P} = 1 (and != 1 for the contrast map), area preservation, the ellipse-to-circle map, the symplectic condition M^T J M = J, composition/inverse closure and the canonical-but-not-symmetry distinction.'
tags: [mechanics, hamiltonian, symplectic, multi-panel, live-readout]
difficulty: 3
tier: advanced
hero_candidate: true
renderer: canvas2d
estimated_engagement_minutes: 5
curriculum_year: 'L:F-2Y-2S'
primary_uc: FIS2021
share_state_keys: []
---

# Canonical Transformations

## Physical setup

A phase blob (the harmonic energy ellipse plus an interior lattice)
mapped by a chosen transformation; energy `E` sets the blob size, a
parameter drives the map.

## Governing equations

Canonical iff `{Q,P} = dQ/dq dP/dp - dQ/dp dP/dq = 1` (det of the
Jacobian), iff `M^T J M = J` for linear maps, iff phase area is
conserved. Maps: identity; `hoScale = (sqrt(w) q, p/sqrt(w))`
(ellipse -> circle of radius `sqrt(2E/w)`); rotation; squeeze
`(lam q, p/lam)`; a point + momentum transform; and the
non-canonical `(q, 2p)` with `{Q,P} = 2`.

## Numerical method

The Poisson bracket is the exact analytic Jacobian determinant; the
area is the shoelace polygon area of the mapped boundary.
Deterministic, no RNG. Reference: Goldstein, Poole and Safko,
Classical Mechanics (3rd ed.), Ch. 9 (`goldstein-mech`); Landau and
Lifshitz, Mechanics (3rd ed.), Sec. 45 (`landau-mechanics`).

## Controls

- map: which transformation.
- parameter: the map's free parameter (w, angle, lambda).
- morph t: continuously deform from the identity (t=0) to the full
  map (t=1); for the linear canonical maps every intermediate is
  itself canonical, so the area holds the whole way.
- Play: animate the morph back and forth.
- energy E: the blob size.
- Reset.

## Expected qualitative features

- Both panels carry a Cartesian grid as well as the blob, so the
  deformation of all of phase space is visible, not just one
  ellipse; the image panel underlays the undeformed shape faintly
  for comparison and shows the map equation and a colour-coded
  canonical / not-canonical status.
- Scrubbing morph t (or Play) deforms the grid and blob smoothly;
  for the canonical maps the area readout stays put across the whole
  morph, for p-doubling it grows continuously 1 -> 2.
- hoScale: the ellipse becomes a circle, same area, `{Q,P} = 1`.
- rotation: the blob spins rigidly, area fixed.
- squeeze: the blob stretches thin yet the area readout holds.
- p-doubling: the blob doubles in area, `{Q,P} = 2`, ratio 2.

## Invariants and acceptance thresholds

- `{Q,P} = 1` for the canonical maps (1e-10), `= 2` for p-doubling.
- Canonical maps preserve the phase area (within 2e-3); p-doubling
  doubles it.
- The HO ellipse maps to a circle of radius `sqrt(2E/w)`, same area.
- Linear canonical maps satisfy `M^T J M = J` (1e-12).
- Composition and inverse of canonical maps stay canonical.
- Rotation is a symmetry of the isotropic `H`; the squeeze is
  canonical yet changes `H`.
- The shoelace area matches the analytic ellipse area (1e-4).

## Limiting cases for verification

- Identity: image equals the blob, `{Q,P} = 1`.
- `w = 1` hoScale: identity (ellipse already a circle).
- `lam -> 1` squeeze / `a -> 0` rotation: the identity.

## Visual fallback

Static frame: the blob and its image at the captured parameter.

## Citations

- Goldstein, Poole and Safko, Classical Mechanics (3rd ed.), Ch. 9
  (`goldstein-mech`).
- Landau and Lifshitz, Mechanics (3rd ed.), Sec. 45
  (`landau-mechanics`).

## Stretch goals

- A type-2 generating function `F2(q,P)` builder.
- Liouville's theorem under a full Hamiltonian flow (the blob
  shearing while keeping area).

## Risk register

- The Poisson bracket is evaluated analytically (exact Jacobian),
  not by finite differences, so it is robust at any sample point.
- The interior lattice is illustrative; the area test uses the
  boundary polygon, not the dot count.
