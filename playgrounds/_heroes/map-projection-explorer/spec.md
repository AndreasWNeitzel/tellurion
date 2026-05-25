---
title: Map Projection Explorer
slug: map-projection-explorer
status: verified
audience: portfolio
created: 2026-05-21
primary_uc: M3007
supporting_ucs: [M2037]
curriculum_year: hero
primary_citation: snyder1987
primary_chapter: 1
hero_candidate: true
tier: hero
hook: 'No flat map of a round Earth can keep area, angle, and distance all true at once: Gauss''s Theorema Egregium forbids it, and every projection picks which property to sacrifice.'
one_paragraph: 'A sphere has intrinsic Gaussian curvature and a plane does not, so by Gauss''s Theorema Egregium no map projection can be an isometry: something must be distorted. This playground projects the globe through twelve classic projections (equirectangular, Mercator, sinusoidal, Mollweide, Hammer, Aitoff, Winkel tripel, Robinson, orthographic, stereographic, gnomonic, azimuthal equidistant) and overlays Tissot''s indicatrix, the image of an infinitesimal circle on the sphere. A conformal projection keeps every indicatrix a circle (angles preserved, area not); an equal-area projection keeps every indicatrix the same area (area preserved, shape not); a compromise projection holds neither exactly but lets neither run away. The indicatrix is built from the numerical Jacobian of the forward map expressed in an orthonormal basis on the sphere, so the distortion measure is general. Reference: Snyder, Map Projections: A Working Manual, USGS Professional Paper 1395, 1987.'
caption: 'Figure 1. The graticule, the Blue Marble Earth texture, and Tissot indicatrices of the selected projection. Method: forward projection of geographic coordinates with the indicatrix from the numerical Jacobian in an orthonormal sphere basis. Source: Snyder, USGS Professional Paper 1395, 1987.'
tags: [numerics, relativity, interactive, three-d, live-readout]
difficulty: 3
renderer: canvas2d
estimated_engagement_minutes: 6
share_state_keys: []
invariants:
  - key: rotation-isometry
    label: recentring the globe adds no distortion
    tolerance: 1
  - key: conformal-circular
    label: conformal projections keep a circular indicatrix
    tolerance: 0.01
  - key: equal-area-constant
    label: equal-area projections conserve the indicatrix area
    tolerance: 0.03
what_to_try:
  - Switch to Mercator and watch the Tissot ellipses stay circular but inflate toward the poles.
  - Switch to Mollweide or Hammer: every indicatrix has the same area but shapes squash.
  - Compare Winkel tripel and Robinson, where neither distortion is zero nor runaway.
  - Drag the globe to recentre the azimuthal projections on a different hemisphere.
references:
  - "Snyder, Map Projections: A Working Manual, Ch. 1."
---

# Map Projection Explorer

Twelve forward map projections with the Tissot indicatrix made visible.
Source: Snyder, Map Projections: A Working Manual, USGS Professional
Paper 1395, 1987.

## Explainer

### What you are looking at

The Earth is very nearly a sphere, and a sphere cannot be flattened
onto a plane without stretching. This is not an engineering
limitation: it is a theorem. Gauss's Theorema Egregium says that
Gaussian curvature is intrinsic, so a surface with curvature (the
sphere) and a surface without it (the plane) cannot be related by an
isometry. Every world map you have ever seen is therefore wrong in
some specific, measurable way.

A map projection is a rule that turns a longitude and latitude into a
point on the plane. This playground draws three things through that
rule: the graticule (the mesh of meridians and parallels), the Blue
Marble Earth texture draped as a forward-projected mesh, and a grid of
Tissot indicatrices.

### Tissot's indicatrix

Take an infinitesimally small circle painted on the globe. Push it
through the projection and it comes out as a small ellipse. That
ellipse is Tissot's indicatrix, and its shape is the complete local
distortion report:

- If the ellipse is a circle everywhere, the projection is conformal:
  angles and shapes are correct, but area is not. Mercator is the
  famous example, which is why Greenland looks larger than Africa.
- If every ellipse has the same area, the projection is equal-area:
  area is correct, but shapes are sheared. Mollweide and Hammer do
  this.
- Compromise projections (Winkel tripel, Robinson) keep both kinds of
  distortion finite without eliminating either.

The indicatrix here is computed from the numerical Jacobian of the
forward map, written in an orthonormal basis on the sphere. The two
singular values of that Jacobian are the semi-axes of the ellipse.

### Controls

Pick a projection, toggle the graticule, the Earth texture, and the
indicatrices, and drag the canvas to recentre the globe. The
diagnostic panel tracks
the area scale and the angular distortion along the central meridian.
