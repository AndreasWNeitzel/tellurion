---
title: Change of Variables and the Jacobian
slug: change-of-variables-jacobian
status: verified
audience: portfolio
created: 2026-06-21
primary_uc: M1015
supporting_ucs: []
curriculum_year: bsc-y1s2
primary_citation: stewart2016
primary_chapter: 15
hook: "Switch coordinates in a double integral and areas do not carry over: a cell du dv becomes a parallelogram of area |J| du dv. That stretch factor is the Jacobian, and it is the r in r dr d-theta."
one_paragraph: "Changing variables in a double integral rescales the area element by the Jacobian determinant |J| = |d(x,y)/d(u,v)|, so dx dy = |J| du dv and the integral becomes the integral of f(T) |J| over the source region. The playground pushes a real grid through a real map (polar, a linear shear, the complex square, a sinusoidal warp), colours each mapped cell by its local |J|, and draws the infinitesimal Jacobian parallelogram at a draggable probe. It then accumulates the mapped area three ways: the true area (shoelace of the deformed cells), the change-of-variables integral (sum of |J| du dv, which converges to it), and the naive sum with no Jacobian (which stays at the wrong source-area value). Polar coordinates make the point concrete: |J| = r is the area stretch that grows with radius, the geometric origin of r dr d-theta."
tags: [calculus, multivariable, integration, interactive, live-readout]
difficulty: 2
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 4
share_state_keys: [map, N]
invariants:
  - key: jac
    label: the analytic Jacobian equals the central-difference Jacobian
    tolerance: 1e-3
  - key: area
    label: the integral of |J| over the source equals the true mapped area
    tolerance: 5e-3
  - key: polar
    label: the polar mapped area equals half (r1^2 - r0^2)(t1 - t0)
    tolerance: 1e-2
what_to_try:
  - Drag the probe and watch the Jacobian parallelogram in the mapped plane; its area is |J| times the source cell.
  - On the polar map the cells far from the origin are bright and large because |J| = r grows with radius.
  - Raise the grid resolution and watch the area with |J| converge to the true area while the naive area stays wrong.
references:
  - "Stewart, Calculus, Eighth ed., Sec. 15.10 (change of variables in multiple integrals)."
  - "Marsden and Tromba, Vector Calculus, Sixth ed., Sec. 6.2."
---

# Change of variables and the Jacobian

## Physical setup

A map $T:(u,v)\mapsto(x,y)$ carries a source region $S$ in the $(u,v)$ plane to a
target region $R$ in the $(x,y)$ plane. A regular grid on $S$ becomes a deformed
grid on $R$.

## Equations

The Jacobian matrix and its determinant are

$$ \frac{\partial(x,y)}{\partial(u,v)} = \begin{pmatrix} x_u & x_v \\ y_u & y_v \end{pmatrix}, \qquad J = x_u y_v - x_v y_u. $$

A cell $du\,dv$ maps to the parallelogram spanned by the columns
$(x_u,y_u)\,du$ and $(x_v,y_v)\,dv$, whose area is $|J|\,du\,dv$. Hence

$$ \iint_R f(x,y)\,dx\,dy = \iint_S f\big(T(u,v)\big)\,|J|\,du\,dv. $$

With $f=1$ the mapped area equals $\iint_S |J|\,du\,dv$. The four maps are polar
($|J|=r$), a linear shear ($|J|=|ad-bc|$, constant), the complex square
$z\mapsto z^2$ ($|J|=4|z|^2$), and a sinusoidal warp.

## Numerical method

No engine. The analytic $|J|$ for each map is checked against a central-difference
Jacobian. The mapped area is summed three ways over an $N\times N$ grid: the
shoelace area of each deformed quad (the true area), the midpoint sum of
$|J|\,du\,dv$ (the change-of-variables integral), and the unweighted sum of
$du\,dv$ (the naive, wrong area). Refining $N$ shows the $|J|$-weighted sum
converge to the true area.

## Controls

- Next map (cycle polar, linear shear, complex square, sinusoidal warp).
- Grid resolution $N$.
- Drag the probe in the source panel to read the local Jacobian. Reset.

## Expected qualitative features

1. Each mapped cell is coloured by its $|J|$; bright where the map stretches,
   dark where it squeezes.
2. The Jacobian parallelogram at the probe has area $|J|\,du\,dv$.
3. The area with $|J|$ converges to the true mapped area; the area without $|J|$
   stays at the source-area value.

## Invariants and acceptance thresholds

- Analytic $|J|$ equals the central-difference Jacobian (rel. error $<10^{-3}$).
- $\iint_S |J|\,du\,dv$ equals the shoelace mapped area (rel. error $<5\times10^{-3}$).
- The polar mapped area equals $\tfrac12(r_1^2-r_0^2)(\theta_1-\theta_0)$.

## Citations

Stewart, Calculus, 8th ed., Sec. 15.10. Marsden and Tromba, Vector Calculus,
6th ed., Sec. 6.2.
