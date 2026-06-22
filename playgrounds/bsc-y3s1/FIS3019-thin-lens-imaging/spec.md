---
title: Thin-Lens Imaging
slug: thin-lens-imaging
status: verified
audience: portfolio
created: 2026-06-22
primary_uc: FIS3019
curriculum_year: bsc-y3s1
primary_citation: hecht2017
primary_chapter: 5
hook: "Drag the object and watch the image flip, slide, and grow. Past the focal point a converging lens makes a real inverted image; inside it, the magnifying-glass regime."
one_paragraph: "A thin lens images an object by the Gaussian lens equation 1/d_o + 1/d_i = 1/f with magnification M = -d_i/d_o. The playground traces the three principal rays (parallel, chief, focal) from a draggable object to locate the image, with photons streaming along the physical paths to mark the direction of light. A converging lens makes a real inverted image when the object is beyond f, and a virtual upright enlarged image when inside f; a diverging lens always makes a small virtual upright image. The diagnostic plots d_i and M against d_o, the lens-equation hyperbola, with its asymptote at d_o = f where the image runs to infinity and d_i changes sign."
tags: [optics, geometrical-optics, lens, imaging, ray-tracing, interactive, live-readout]
difficulty: 2
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 5
share_state_keys: [f, do]
invariants:
  - key: lenseq
    label: the principal rays satisfy 1/d_o + 1/d_i = 1/f
    tolerance: 1e-9
  - key: magdef
    label: the magnification equals -d_i/d_o
    tolerance: 1e-9
  - key: at2f
    label: object at 2f gives a real image at 2f with M = -1
    tolerance: 1e-9
what_to_try:
  - Drag the object past 2f; the real image grows toward M = -1 at 2f.
  - Push the object inside f; the image flips to virtual, upright, enlarged.
  - Set the object at f; the image runs off to infinity (the asymptote).
  - Switch to a diverging lens (f<0); the image is always virtual and reduced.
references:
  - "Hecht, Optics, 5th ed., Pearson, 2017, Ch. 5 (Geometrical Optics), Eq. 5.17."
  - "Born and Wolf, Principles of Optics, 7th ed., Ch. 4."
---

# Thin-lens imaging

## Physical setup

A thin converging or diverging lens in air, an upright object on the optical axis at
distance $d_o$ in front of it, imaged in the paraxial (Gaussian) approximation.

## Equations

With the object at $x=-d_o$, the lens at $x=0$, and focal points at $x=\mp f$
($f>0$ converging), the image distance and magnification are

$$ \frac{1}{d_o}+\frac{1}{d_i}=\frac{1}{f}, \qquad M=-\frac{d_i}{d_o}=\frac{h_i}{h_o}. $$

A positive $d_i$ is a real image beyond the lens; a negative $d_i$ is a virtual image
on the object side. The three principal rays from the object tip cross the lens plane
at heights $h_o$ (parallel ray), $0$ (chief ray), and $h_i$ (focal ray), and all pass
through the image tip.

## Numerical method

No integration: the construction is the closed-form lens equation plus the
principal-ray geometry. The image tip is the common point of the three refracted rays
(or of their backward extensions, for a virtual image). The case $d_o=f$ (image at
infinity) is drawn with the refracted rays parallel to the chief ray.

## Controls

- Focal length f (negative for a diverging lens); object distance d_o (slider or drag
  the object along the axis).

## Expected qualitative features

1. Converging lens, $d_o>f$: real inverted image; at $d_o=2f$ it has $M=-1$.
2. Converging lens, $d_o<f$: virtual upright enlarged image (magnifier).
3. $d_o=f$: image at infinity (rays emerge parallel).
4. Diverging lens: virtual, upright, reduced image for all $d_o$.

## Invariants and acceptance thresholds

- The principal rays satisfy $1/d_o+1/d_i=1/f$ to 1e-9.
- $M=-d_i/d_o$ to 1e-9.
- Object at $2f$ images at $2f$ with $M=-1$.

## Citations

Hecht, Optics, 5th ed., Pearson, 2017, Ch. 5, Eq. 5.17.
Born and Wolf, Principles of Optics, 7th ed., Ch. 4.
