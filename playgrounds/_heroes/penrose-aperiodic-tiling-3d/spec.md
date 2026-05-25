---
title: Penrose Aperiodic Tiling
slug: penrose-aperiodic-tiling-3d
status: verified
audience: portfolio
created: 2026-05-20
primary_uc: FIS3010
supporting_ucs: [M1015]
curriculum_year: hero
primary_citation: senechal-quasicrystals
primary_chapter: 6
hero_candidate: true
hook: 'A tiling with 5-fold symmetry that never repeats. Penrose proved in 1974 that only two rhombus shapes are needed, and Shechtman saw the atomic-scale version in 1982 (Nobel 2011).'
one_paragraph: 'A Penrose tiling covers the plane with two prototiles (a "thick" 72/108 rhombus and a "thin" 36/144 rhombus) following matching rules that forbid any periodic arrangement. The result has 10-fold local rotational symmetry around special points but no translational symmetry: no two-vector lattice generates the tiling. The ratio of thick to thin tiles is the golden ratio phi = (1 + sqrt 5) / 2. Penrose tilings are the 2D model of physical quasicrystals (Shechtman 1982; Nobel 2011), and they are constructed by deflation: take an initial seed, then recursively split each Robinson triangle (A acute and B obtuse) into smaller Robinson triangles. The playground starts from a "Sun" patch (10 A triangles), shows each deflation step, and reports the running tile count and A/B ratio converging to phi. Reference: Senechal, Quasicrystals and Geometry, Ch. 6.'
caption: 'Figure 1. Penrose P3 rhombus tiling, drawn as Robinson triangles after N deflation steps from a 10-fold "Sun" seed. Thick rhombi (cyan) and thin rhombi (orange); ratio A/B converges to the golden ratio phi = (1 + sqrt 5) / 2 = 1.618. Method: Conway-Penrose deflation in 2D. Source: Senechal, Quasicrystals and Geometry, Ch. 6.'
tags: [crystallography, mathematics, animation, live-readout]
difficulty: 3
tier: single
renderer: canvas2d
estimated_engagement_minutes: 4
share_state_keys: [steps]
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
  - "Senechal, Quasicrystals and Geometry, Ch. 6."
---

# Penrose aperiodic tiling
P3 rhombi by Conway-Penrose deflation. Source: Senechal, *Quasicrystals and Geometry*, CUP 1995, Ch. 6; originals: Penrose, *Bull. Inst. Math. Appl.* 10 (1974) 266; Shechtman et al., *Phys. Rev. Lett.* 53 (1984) 1951.

## Explainer

### What you are looking at

A patch of plane tiled by two rhombic shapes: a "thick" rhombus
(72 deg, 108 deg) and a "thin" one (36 deg, 144 deg). Look closely
and you will see local five-fold rotation symmetry but no periodic
repeat: the matching rules forbid any unit cell. This is a Penrose
tiling, the canonical mathematical model of physical quasicrystals.

### Robinson triangles and the deflation rule

We work with the two Robinson triangles that pair into the Penrose
rhombi:

- **A** (acute, $36, 72, 72$): half of a thick rhombus.
- **B** (obtuse, $108, 36, 36$): half of a thin rhombus.

Each deflation step splits each triangle into smaller ones using the
golden ratio $\phi = (1+\sqrt 5)/2$:

$$\text{A} \;\to\; \text{A} + \text{B} + \text{A},
  \qquad
  \text{B} \;\to\; \text{A} + \text{B}.$$

Iterate from a 10-fold "Sun" seed (10 A triangles) and you get a
patch of arbitrary size. There is no periodic pattern in this
patch, no matter how big you make it.

### Why the ratio is golden

If $a_n$ counts the A triangles and $b_n$ the B triangles after $n$
deflations, the recursion is

$$a_{n+1} \;=\; 2 a_n + b_n,
  \qquad b_{n+1} \;=\; a_n + b_n.$$

The dominant eigenvalue of the matrix $\begin{pmatrix} 2 & 1 \\ 1 & 1 \end{pmatrix}$
is $\phi^2 = \phi + 1$, and the ratio $a_n / b_n$ converges to
$\phi$. The same eigenvalue analysis explains why the side-length
ratio of an A to a B triangle is also $\phi$.

### Why quasiperiodic, not random

Penrose proved that *any* finite patch of his tiling can be extended
to a complete tiling of the plane, but only in uncountably many
distinct ways; none of those tilings is periodic. The diffraction
pattern (sharp Bragg peaks of 5- or 10-fold symmetry rather than the
fuzzy halo of a glass) is the smoking gun: the tiling has long-range
order without translational symmetry. Shechtman et al. (1982,
published 1984) saw exactly that diffraction pattern in rapidly
quenched Al-Mn alloys, kicking off the field of physical
quasicrystals and earning the 2011 Nobel Prize.

### Symbols

- $\phi = (1 + \sqrt 5)/2$: golden ratio.
- A, B: Robinson triangles (acute, obtuse).
- $n$: deflation step.
- $a_n, b_n$: counts after $n$ deflations.

### Things to try

- Move the deflation slider from 0 to 6 and watch the tile count
  grow exponentially (each level multiplies counts by $\phi^2$).
- The thick-to-thin ratio readout converges to $1.618$ as the
  patch grows.
- Notice the 10-fold rotational symmetry around the center is
  preserved at every deflation level (the "Sun" patch is one of the
  finitely many vertex stars in Penrose tilings).

### Where this comes from

Penrose's original construction is in *Bull. Inst. Math. Appl.* 10
(1974) 266. The deflation/inflation arithmetic and the golden-ratio
limit are derived in Senechal, *Quasicrystals and Geometry*, CUP
1995, Chapter 6. The physical-quasicrystal discovery is Shechtman
et al., *Phys. Rev. Lett.* 53 (1984) 1951.
