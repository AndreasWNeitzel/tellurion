---
title: "Method of Images: Grounded Conductors"
slug: method-of-images-2d
status: verified
audience: portfolio
created: 2026-05-14
primary_uc: FIS1014
supporting_ucs: []
curriculum_year: bsc-y1s2
primary_citation: griffiths-em
primary_chapter: 3
hook: 'A charge near a grounded conductor feels a pull, exactly as if a few mirror-image charges sat where the metal used to be; one image for a plane or sphere, three for a corner, five for a wedge.'
one_paragraph: 'Finding the field of a charge near a grounded conductor looks hard: the induced surface charge rearranges itself until the metal is an equipotential. The method of images replaces that entire induced distribution with a few fictitious charges, placed so the potential is zero on the surface. The superposed field is trivial to write down and, in the empty region, is identical to the real one. The playground draws the four classic geometries from Griffiths: a grounded plane (one image), a right-angle corner (three), a 60-degree wedge (five), and a grounded sphere (one image inside, at the inverse point R^2/d with charge -(R/d)q). It shows the field lines bending in to strike the conductor perpendicular, the induced charge shaded along the boundary, and (with a toggle) the image charges that reproduce the same field, while the rail confirms the potential stays zero on the conductor. Drag the charge and everything tracks it, and the static scene is cached so only the marching arrowheads redraw each frame.'
tags: [electromagnetism, animation, live-readout, interactive]
difficulty: 3
tier: hero
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
  - Switch geometry (plane, corner, wedge, sphere) and watch the image count change.
  - Drag the charge; the field always meets the metal at a right angle and V stays zero on the conductor.
  - Toggle reveal image to replace the conductor with its image charges.
references:
  - "Griffiths, Introduction to Electrodynamics, 4th ed., Ch. 3."
---
# Method of images for grounded conductors
A point charge near a grounded conductor: the field is built by adding image charges placed so the potential is zero on the surface. Four geometries: a grounded plane (one image), a right-angle corner (three images), a 60-degree wedge (five images), and a grounded sphere (one image inside, at R^2/d with charge -(R/d)q). Drag the charge; toggle "reveal image"; flip the charge sign. Source: Griffiths E&M Ch. 3.2.

## Controls

- geometry: grounded plane, right-angle corner, 60-degree wedge, grounded sphere.
- view: conductor / reveal image (show the image charges that replace the conductor).
- charge sign: + or -.
- drag the charge anywhere in the field region with the pointer.
- Reset / Pause / Play.

## Numerical method

Each geometry returns a list of point charges (real plus images). The
wedge family (plane n=1, corner n=2, wedge n=3, beta = pi/n) places, for
k = 0..n-1, +q at angle 2k*beta + phi and -q at 2k*beta - phi; the
grounded sphere places -(R/d)q at R^2/d^2 times the charge position. Field
lines are streamline-integrated (normalized arc-length steps of 0.03) in
the superposed Coulomb field; in conductor view a line is bisected onto
the boundary where it leaves the field region. The induced surface charge
is read off the normal field just outside the conductor and shaded along
the boundary. The static scene (conductor, field lines, induced charge,
charges, diagnostic) is rendered once to an offscreen canvas and blitted
each frame; only the marching arrowheads are redrawn, keeping the
animation smooth.

## Invariants and acceptance thresholds

| invariant | threshold | location |
| potential is zero on the conductor (plane, corner, wedge, sphere) | < 1e-9 | invariants test + live |
| plane has 1 image, corner 3, wedge 5 | exact | invariants test |
| sphere image is -(R/d)q at R^2/d (Griffiths) | exact | invariants test |
| net induced charge: -q (plane, corner), -(R/d)q (sphere) | exact | invariants test |
| tangential field vanishes just outside the plane | < 1e-2 | invariants test |

All confirmed in `invariants.test.mjs` (8 tests passing).

## Explainer

### What you are looking at

A point charge sits above a flat grounded metal sheet. The metal is a
mess of free charges that rearrange until the field is just right, and
solving that directly looks hard. The method of images replaces the
whole conductor with a single fictitious mirror charge and gets the
exact answer in one line. The playground shows the real charge, its
image, and the resulting field and induced surface charge.

### The trick

Put charge $+q$ a height $d$ above a grounded plane. The boundary
condition is that the potential is zero everywhere on the plane.
Notice that a charge $+q$ at height $d$ together with a charge $-q$ at
depth $-d$ (its mirror image) produces exactly zero potential on the
midplane, because every point there is equidistant from the two:

$$V(\mathbf r) = \frac{1}{4\pi\epsilon_0}
  \left[\frac{q}{r_+} - \frac{q}{r_-}\right],$$

where $r_+$ and $r_-$ are the distances to the real and image charges.
By the uniqueness theorem, a solution that satisfies the boundary
condition is *the* solution, so above the plane the real field is
exactly that of the charge plus its image. Below the plane the field
is zero (inside the conductor).

### The induced charge

The image is fictitious, but the surface charge it mimics is real. The
field just outside the conductor gives the induced surface density

$$\sigma(s) = -\,\frac{q\,d}{2\pi\,(s^2 + d^2)^{3/2}},$$

a smear of negative charge peaked right under the real charge and
trailing off with distance $s$ along the plane. Integrate it over the
whole plane and the total induced charge is exactly $-q$: the
conductor pulls up just enough opposite charge to screen the field
below. The charge is also attracted to the plane with the force it
would feel from the image alone, $F = -q^2/[4\pi\epsilon_0 (2d)^2]$.

### Other geometries

The same uniqueness argument handles more than the plane. Two grounded
planes meeting at a right angle need three images (signs $-,-,+$) at the
reflected positions; a wedge of opening angle $\pi/n$ needs $2n-1$
images arranged around the apex with alternating signs (the 60-degree
wedge, $n=3$, takes five). A grounded sphere of radius $R$ takes a single
image $q' = -(R/d)\,q$ at the inverse point $R^2/d$ inside it. In every
case the images are chosen so the potential is zero on the conductor,
which the rail verifies as $\max|V|$ on the boundary.

### Things to try

- Move the charge closer to the plane and watch the induced-charge
  peak sharpen while its integral stays $-q$.
- Note the field lines hit the conductor at right angles everywhere,
  the signature of an equipotential surface.
- See that the region below the plane is field-free, the charge is
  fully screened.

### Where this comes from

The image construction, the uniqueness argument, the induced surface
charge integrating to $-q$, and the image force follow Griffiths,
*Introduction to Electrodynamics*, 5th ed., Section 3.2.
