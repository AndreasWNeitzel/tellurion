---
title: Crystal Structure Explorer
slug: crystal-structure-3d-explorer
status: verified
audience: portfolio
created: 2026-05-17
hook: 'Spin SC, BCC and FCC cells and read off why their powder X-ray patterns follow 1,2,3.., 2,4,6.. and 3,4,8,11: the structure factor erases the forbidden reflections.'
one_paragraph: 'The three cubic Bravais lattices shown in a rotating 3D view: the conventional cell with its atoms, a chosen Miller plane, the reciprocal lattice, and the powder X-ray diffraction pattern. The reciprocal basis satisfies b_i . a_j = 2 pi delta_ij, the cubic interplanar spacing is d = a / sqrt(h^2 + k^2 + l^2), and the geometric structure factor produces systematic absences (body-centred: h+k+l even; face-centred: h,k,l all even or all odd) so the Bragg lines fall in the distinct simple-, body- and face-centred sequences that let X-ray diffraction identify a crystal. The first Brillouin zones are the cube, the rhombic dodecahedron and the truncated octahedron. Reference: Ashcroft and Mermin, Solid State Physics, Chapters 4 to 6; Kittel, Introduction to Solid State Physics, Chapter 2.'
tags: [condensed-matter, crystallography, 3d, multi-panel, live-readout]
difficulty: 4
tier: hero
hero_candidate: true
renderer: canvas2d
estimated_engagement_minutes: 6
curriculum_year: 'L:F-3Y-2S'
primary_uc: FIS3005
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
---

# Crystal Structure Explorer

## Explainer

### What you are looking at

A crystal is a lattice plus a basis. The playground builds the cubic
lattices (simple, body-centered, face-centered), lets you slice them
with any Miller plane, and shows which X-ray reflections are allowed.
This is how the atomic arrangement of a solid is actually determined.

### Lattice planes and reciprocal space

A family of parallel atomic planes is labeled by Miller indices
$(hkl)$; for a cubic lattice their spacing is

$$d_{hkl} = \frac{a}{\sqrt{h^2 + k^2 + l^2}}.$$

The natural space for diffraction is the reciprocal lattice, with
basis vectors

$$\mathbf b_i = 2\pi\,
  \frac{\mathbf a_j\times\mathbf a_k}{\mathbf a_1\cdot
  (\mathbf a_2\times\mathbf a_3)},
  \qquad \mathbf b_i\cdot\mathbf a_j = 2\pi\,\delta_{ij}.$$

Its Wigner-Seitz cell is the first Brillouin zone, the stage for all
band-structure physics.

### Bragg and the structure factor

X-rays reflect strongly only when Bragg's law is met:

$$2\,d_{hkl}\sin\theta = \lambda.$$

But not every $(hkl)$ that satisfies Bragg actually appears. The basis
atoms interfere through the structure factor

$$F_{hkl} = \sum_\text{basis} e^{2\pi i (h x + k y + l z)},$$

and $|F_{hkl}| = 0$ gives systematic absences: BCC kills reflections
with $h+k+l$ odd; FCC kills those with mixed-parity $h,k,l$. Reading
which reflections are present versus absent is exactly how
crystallographers distinguish SC, BCC, and FCC. The playground shows
the lattice, a chosen Miller plane, and the allowed/forbidden
reflections.

### Things to try

- Switch SC -> BCC -> FCC and watch the systematic absences change
  (the structure-factor extinction rules).
- Pick different $(hkl)$ and see the plane spacing follow
  $a/\sqrt{h^2+k^2+l^2}$.
- Note the reciprocal lattice of FCC is BCC and vice versa (the
  Brillouin-zone shapes swap).

### Where this comes from

Miller indices, the reciprocal lattice, Bragg's law, and the
structure-factor absences follow Kittel, *Introduction to Solid State
Physics*, Chapter 2, and Ashcroft and Mermin, *Solid State Physics*,
Chapter 6.

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
- Miller (hkl): the highlighted plane, the gold on-plane atoms, the
  reported spacing, and (in the reciprocal view) the G vector and its
  Bragg plane.
- supercell: 1-3 repeats; the view rescales so it always fits.
- Reset.

## Expected qualitative features

- A ball-and-stick model: atoms with nearest-neighbour bonds (SC
  along the axes, BCC body-centre to corner, FCC face-centre to
  corner), so each lattice is recognizable as a structure.
- The atoms lying on the chosen (hkl) plane are highlighted gold and
  the translucent plane tilts with (hkl); the d-spacing is labelled.
- The view auto-fits its content by the rotation-invariant bounding
  radius, so no supercell (1-3), lattice, or rotation pushes the
  structure out of the frame or into the XRD strip below it.
- The reciprocal view shows the lattice, the G(hkl) vector, and its
  Bragg plane (the Brillouin-zone face from the perpendicular
  bisector of G); it labels the BZ polyhedron (6/12/14 faces).
- The XRD sticks march out in the lattice's allowed sequence; BCC
  and FCC are missing the SC lines; the selected (hkl) is tagged
  allowed or forbidden.

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
