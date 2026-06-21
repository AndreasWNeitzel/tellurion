---
title: The Divergence Theorem
slug: divergence-theorem-gauss
status: verified
audience: portfolio
created: 2026-06-21
primary_uc: M1015
curriculum_year: bsc-y1s2
primary_citation: stewart2016
primary_chapter: 16
hook: "The outward flux through a closed loop equals the divergence enclosed. Drag the loop and the two numbers stay locked: the mathematics behind Gauss's law."
one_paragraph: "The divergence theorem in the plane says the outward flux of a field through a closed curve equals the integral of its divergence over the enclosed area, the closed integral of F.n ds = the area integral of div F. The playground shows a vector field, the divergence as a red-source / blue-sink heatmap, and a draggable, resizable circle whose boundary is coloured by the outflow F.n; the flux and the area integral of the divergence are computed live and agree wherever the loop is placed. A radial source gives flux equal to twice the area, a rotation gives zero flux (no divergence), and a point source makes the Gauss analogy exact: its flux jumps to a fixed value the moment the source is enclosed and is zero otherwise, exactly as Gauss's law counts the charge inside a surface."
tags: [calculus, vector-calculus, divergence, flux, interactive, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 4
share_state_keys: [field, R]
invariants:
  - key: divthm
    label: the outward flux equals the area integral of div F (smooth fields)
    tolerance: 2e-2
  - key: source
    label: the radial source flux equals two times the enclosed area
    tolerance: 1e-2
  - key: gauss
    label: the point-source flux is 2 pi when the source is enclosed and 0 otherwise
    tolerance: 5e-2
what_to_try:
  - Drag the circle around the field; the outward flux and the area integral of the divergence stay equal everywhere.
  - On the rotation field the boundary is half red and half blue and the flux is zero; on the radial source it is all red and the flux is twice the area.
  - Switch to the point source and move the circle in and out of enclosing the source; the flux jumps between a fixed value and zero, as in Gauss's law.
references:
  - "Stewart, Calculus, Eighth ed., Sec. 16.9 (the divergence theorem) and 16.5 (divergence)."
  - "Griffiths, Introduction to Electrodynamics, Fifth ed., Sec. 1.3.4 and 2.2 (the divergence theorem and Gauss's law)."
---

# The divergence theorem

## Physical setup

A two-dimensional vector field $\mathbf{F}(x,y)$ and a closed curve (a circle) the
user can move and resize. The region inside the curve is the area; the curve is
the boundary.

## Equations

The divergence theorem in the plane equates the outward flux through the boundary
to the area integral of the divergence,

$$ \oint_C \mathbf{F}\cdot\mathbf{n}\,ds = \iint_A (\nabla\cdot\mathbf{F})\,dA, \qquad \nabla\cdot\mathbf{F} = \frac{\partial F_x}{\partial x} + \frac{\partial F_y}{\partial y}. $$

The fields are the radial source $\mathbf{F}=(x,y)$ ($\nabla\cdot\mathbf{F}=2$), a
varying-divergence field $\mathbf{F}=(x^2/2, y^2/2)$ ($\nabla\cdot\mathbf{F}=x+y$),
the rotation $\mathbf{F}=(-y,x)$ ($\nabla\cdot\mathbf{F}=0$), the source-sink
$\mathbf{F}=(x,-y)$ ($\nabla\cdot\mathbf{F}=0$), and the point source
$\mathbf{F}=(x,y)/r^2$, whose divergence is zero away from the origin but whose
flux is $2\pi$ around any loop enclosing it (the Gauss analogy).

## Numerical method

No engine. The flux is a midpoint sum of $\mathbf{F}\cdot\mathbf{n}$ around the
boundary; the area integral of the divergence is a midpoint sum over the interior
grid cells. For the point source the enclosed source is detected geometrically.

## Controls

- Cycle the field; the circle radius slider; drag the circle to move it. Reset.

## Expected qualitative features

1. The divergence heatmap is red where the field spreads out and blue where it
   converges; the boundary is red where the field flows out and blue where in.
2. The flux equals the area integral of the divergence for any circle.
3. The point-source flux jumps to $2\pi$ when the source is enclosed.

## Invariants and acceptance thresholds

- Flux $=$ area integral of $\nabla\cdot\mathbf{F}$ for smooth fields.
- Radial source flux $= 2\times$ area.
- Point-source flux $= 2\pi$ enclosed, $0$ outside.

## Citations

Stewart, Calculus, 8th ed., Sec. 16.9. Griffiths, Introduction to
Electrodynamics, 5th ed., Sec. 1.3.4 and 2.2.
