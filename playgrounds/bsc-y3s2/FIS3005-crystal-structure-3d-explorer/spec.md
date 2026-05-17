---
title: Crystal Structure Explorer
slug: crystal-structure-3d-explorer
status: verified
audience: portfolio
created: 2026-05-17
hook: 'Spin SC, BCC and FCC cells and read off why their powder X-ray patterns follow 1,2,3.., 2,4,6.. and 3,4,8,11: the structure factor erases the forbidden reflections.'
one_paragraph: 'The three cubic Bravais lattices rendered in a hand-rolled Canvas2D 3D view (no WebGL): a rotating conventional cell with shaded atom spheres, a chosen Miller plane, the reciprocal lattice, and the powder X-ray diffraction pattern. The reciprocal basis satisfies b_i.a_j = 2 pi delta_ij; the cubic interplanar spacing is a/sqrt(h^2+k^2+l^2); the geometric structure factor produces the systematic absences (BCC h+k+l even, FCC h,k,l same parity) so the Bragg lines follow the SC/BCC/FCC sequences; and the first Brillouin zones are the cube, the rhombic dodecahedron and the truncated octahedron. The headless sim.js is gate-tested for reciprocal orthonormality and the volume relation, the d-spacings, the SC/BCC/FCC absences and powder sequences, atoms per cell, Bragg consistency and the Brillouin-zone face counts.'
tags: [condensed-matter, crystallography, 3d, multi-panel, live-readout]
difficulty: 4
tier: hero
hero_candidate: true
renderer: canvas2d
estimated_engagement_minutes: 6
curriculum_year: 'L:F-3Y-2S'
primary_uc: FIS3005
share_state_keys: []
---

# Crystal Structure Explorer

## Physical setup

Cubic crystals of conventional side `a`: SC (1 atom/cell), BCC
(2, body centre), FCC (4, face centres), with a selectable Miller
plane and an optional supercell.

## Governing equations

Reciprocal basis `b_i = 2 pi (a_j x a_k)/(a1.(a2 x a3))`, so
`b_i.a_j = 2 pi delta_ij` and `V_rec = (2 pi)^3/V_dir`. Cubic
spacing `d_hkl = a/sqrt(h^2+k^2+l^2)`. Structure factor
`F = sum_basis exp(2 pi i (h x + k y + l z))`; `|F| = 0` gives the
absences. Bragg `2 d sin(theta) = lambda`. The first Brillouin zone
is the Wigner-Seitz cell of the reciprocal lattice.

## Numerical method

Closed-form vector algebra; an orthographic 3D projection with a
fixed tilt and a yaw that is a pure function of the capture
fraction. Painter-sorted spheres with a radial-gradient shade.
Reference: Kittel, Introduction to Solid State Physics (8th ed.),
Ch. 1-2 (`kittel-cm`); Ashcroft and Mermin, Solid State Physics,
Ch. 4-6 (`ashcroft-mermin`).

## Controls

- lattice: SC, BCC, FCC.
- view: crystal + Miller plane, or the reciprocal lattice.
- Miller (hkl): the highlighted plane and reported spacing.
- supercell: 1-3 repeats.
- Reset.

## Expected qualitative features

- The cell fills with the correct atom count; the Miller plane tilts
  with (hkl).
- The XRD sticks march out in the lattice's allowed sequence; BCC
  and FCC are missing the SC lines.
- The reciprocal view labels the BZ polyhedron (6/12/14 faces).
- Rotating shows the 3D arrangement and the plane orientation.

## Invariants and acceptance thresholds

- `b_i.a_j = 2 pi delta_ij` (1e-10); `V_rec = (2 pi)^3/V_dir`.
- `d100 = a`, `d110 = a/sqrt2`, `d111 = a/sqrt3`.
- SC: no absences; BCC `h+k+l` even; FCC same parity;
  `|F_fcc(111)| = 4`, `|F_bcc(100)| = 0`.
- First powder lines SC `1,2,3,4,5`, BCC `2,4,6,8`,
  FCC `3,4,8,11`.
- Atoms/cell SC 1, BCC 2, FCC 4.
- Bragg `2 d sin theta = lambda` for every line; angle increases
  with `s`.
- BZ faces SC 6, BCC 12, FCC 14.

## Limiting cases for verification

- SC reciprocal of SC is SC with spacing `2 pi/a`.
- `(000)` is not a diffraction line; `d(000) = infinity`.
- High `s` reflections beyond `lambda/2d > 1` do not appear.

## Visual fallback

Static frame: the cell (or reciprocal lattice) at the captured
orientation plus the XRD strip.

## Citations

- Kittel, Introduction to Solid State Physics (8th ed.), Ch. 1-2
  (`kittel-cm`).
- Ashcroft and Mermin, Solid State Physics, Ch. 4-6
  (`ashcroft-mermin`).

## Stretch goals

- The full BZ polyhedron wireframe with high-symmetry points.
- A two-atom basis (diamond/zincblende) and its extra absences.

## Risk register

- The Miller plane is drawn as a centred patch oriented by (hkl),
  not clipped to the cell; the orientation is exact, the extent is
  illustrative.
- The BZ shape is named and face-counted (gate-tested) rather than
  meshed, to avoid fragile hardcoded polyhedra.
