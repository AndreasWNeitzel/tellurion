---
title: "Method of Images: Charge Above a Grounded Plane"
slug: method-of-images-2d
status: verified
audience: portfolio
created: 2026-05-14
primary_uc: FIS1014
supporting_ucs: []
curriculum_year: bsc-y1s2
primary_citation: griffiths-em
primary_chapter: 3
hook: 'A charge above a grounded metal sheet feels a pull, exactly as if a mirror-image charge of opposite sign sat the same distance below the surface.'
one_paragraph: 'Finding the field of a charge near a grounded conductor looks hard: the induced surface charge rearranges itself until the metal is an equipotential. The method of images replaces that entire induced distribution with one fictitious charge, equal and opposite, mirrored below the plane. The two-charge field is trivial to write down and, above the plane, is identical to the real one. The playground draws the field lines and equipotentials, marks the dashed image charge, and integrates the induced surface charge along the conductor; it always sums to exactly minus the real charge, the check that the trick is exact rather than an approximation. Drag the charge and watch the image track it while the attractive force grows like q^2 / (2d)^2 as it nears the plane.'
tags: [electromagnetism, animation, live-readout]
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
---
# Method of images, 2D
A point charge above a grounded conducting plane: the field is built by adding the image charge below the plane. The induced surface charge on the conductor integrates to negative the real charge. Source: Griffiths E&M Ch. 3.2 (`griffiths-em`).

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
