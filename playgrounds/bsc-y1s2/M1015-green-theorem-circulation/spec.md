---
title: Green's Theorem - Circulation and Curl
slug: green-theorem-circulation
status: verified
audience: portfolio
created: 2026-06-21
primary_uc: M1015
curriculum_year: bsc-y1s2
primary_citation: stewart2016
primary_chapter: 16
hook: "The circulation of a field around a closed loop equals the curl enclosed. Drag the loop and the two numbers stay locked: the mathematics behind Ampere's law."
one_paragraph: "Green's theorem in circulation form equates the line integral of a field around a closed curve to the integral of its curl over the enclosed area, the closed integral of F.dr = the area integral of curl F, with the scalar curl dFy/dx - dFx/dy. The playground shows a vector field, the curl as a red-counterclockwise / blue-clockwise heatmap, and a draggable, resizable circle whose boundary is coloured by the tangential flow F.t; the circulation and the area integral of the curl are computed live and agree wherever the loop is placed. A rotation gives circulation equal to twice the area, an irrotational field gives zero, and a point vortex makes the Stokes analogy exact: its circulation jumps to a fixed value the moment the vortex is enclosed and is zero otherwise, exactly as Ampere's law counts the current threading a loop."
tags: [calculus, vector-calculus, curl, circulation, interactive, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 4
share_state_keys: [field, R]
invariants:
  - key: green
    label: the circulation equals the area integral of curl F (smooth fields)
    tolerance: 2e-2
  - key: rotation
    label: the rotation field circulation equals two times the enclosed area
    tolerance: 1e-2
  - key: stokes
    label: the point-vortex circulation is 2 pi when the vortex is enclosed and 0 otherwise
    tolerance: 5e-2
what_to_try:
  - Drag the circle around the field; the circulation and the area integral of the curl stay equal everywhere.
  - On the rotation field the boundary is all red and the circulation is twice the area; on the irrotational source it is half red, half blue, and zero.
  - Switch to the point vortex and move the circle in and out of enclosing it; the circulation jumps between a fixed value and zero, as in Ampere's law.
references:
  - "Stewart, Calculus, Eighth ed., Sec. 16.4 (Green's theorem) and 16.5 (curl)."
  - "Griffiths, Introduction to Electrodynamics, Fifth ed., Sec. 1.3.5 and 5.3 (Stokes's theorem and Ampere's law)."
---

# Green's theorem: circulation and curl

## Physical setup

A two-dimensional vector field $\mathbf{F}(x,y)$ and a closed curve (a circle) the
user can move and resize. The boundary is the curve; the interior is the enclosed
area.

## Equations

Green's theorem equates the circulation around the boundary to the area integral
of the curl,

$$ \oint_C \mathbf{F}\cdot d\mathbf{r} = \iint_A (\nabla\times\mathbf{F})\,dA, \qquad \nabla\times\mathbf{F} = \frac{\partial F_y}{\partial x} - \frac{\partial F_x}{\partial y}. $$

The fields are the rotation $\mathbf{F}=(-y,x)$ (curl $2$), a varying-curl field
$\mathbf{F}=(-y^2/2, x^2/2)$ (curl $x+y$), an irrotational source $\mathbf{F}=(x,y)$
(curl $0$), a shear $\mathbf{F}=(y,0)$ (curl $-1$), and the point vortex
$\mathbf{F}=(-y,x)/r^2$, whose curl is zero away from the origin but whose
circulation is $2\pi$ around any loop enclosing it (the Stokes/Ampere analogy).

## Numerical method

No engine. The circulation is a midpoint sum of $\mathbf{F}\cdot\mathbf{t}$ around
the boundary; the area integral of the curl is a midpoint sum over the interior
grid. For the point vortex the enclosed vortex is detected geometrically.

## Controls

- Cycle the field; the circle radius slider; drag the circle to move it. Reset.

## Expected qualitative features

1. The curl heatmap is red where the field swirls counterclockwise and blue where
   clockwise; the boundary is red where the flow runs counterclockwise and blue
   where clockwise.
2. The circulation equals the area integral of the curl for any circle.
3. The point-vortex circulation jumps to $2\pi$ when the vortex is enclosed.

## Invariants and acceptance thresholds

- Circulation $=$ area integral of $\nabla\times\mathbf{F}$ for smooth fields.
- Rotation field circulation $= 2\times$ area.
- Point-vortex circulation $= 2\pi$ enclosed, $0$ outside.

## Citations

Stewart, Calculus, 8th ed., Sec. 16.4. Griffiths, Introduction to
Electrodynamics, 5th ed., Sec. 1.3.5 and 5.3.
