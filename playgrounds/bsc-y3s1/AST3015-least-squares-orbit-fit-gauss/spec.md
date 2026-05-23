---
title: Least-Squares Orbit Fit (Gauss Heritage)
slug: least-squares-orbit-fit-gauss
status: verified
audience: portfolio
created: 2026-05-14
primary_uc: AST3015
supporting_ucs: []
curriculum_year: bsc-y3s1
primary_citation: bmw
primary_chapter: 5
hook: 'Fit a circle to noisy orbit points and you get a clean answer that is quietly wrong: any real eccentricity biases the radius and centre.'
one_paragraph: 'Gauss made his name recovering the lost asteroid Ceres from a short, noisy arc by least squares. The playground shows the simplest version: scatter noisy positions along a true Kepler ellipse and fit a circle by linear least squares. The fit is well posed and converges, but when the orbit''s eccentricity is nonzero the circular model is wrong, so the recovered centre and radius are systematically biased. It is a concrete lesson that a tight fit to the wrong model is still wrong. Reference: Bate, Mueller and White, Fundamentals of Astrodynamics, Ch. 5.'
tags: [exoplanets, numerics, animation, live-readout]
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
# Toy least-squares orbit fit
Noisy positions along a Kepler orbit; fit a circle by least squares. The fit is biased when $e > 0$. Source: Bate-Mueller-White Ch. 5.

## Explainer

### What you are looking at

In 1801 Gauss recovered the lost asteroid Ceres from a short, noisy arc
by inventing least squares. This is the cautionary toy version: scatter
noisy points along a true Kepler ellipse and fit a circle to them. The
fit converges cleanly and looks confident, yet it is systematically
wrong, because the model is wrong.

### Least squares

Fitting a circle of center $(a, b)$ and radius $R$ to points
$(x_i, y_i)$ minimizes the squared residuals. Conveniently this is
linear if you expand $(x-a)^2 + (y-b)^2 = R^2$ into

$$x^2 + y^2 = 2a\,x + 2b\,y + (R^2 - a^2 - b^2),$$

so $z_i = x_i^2 + y_i^2$ is a linear function of $(x_i, y_i, 1)$ and
the best $(a, b, R)$ come from one normal-equations solve. With
Gaussian measurement noise this is the maximum-likelihood estimate, and
it converges as $1/\sqrt N$ in the number of points.

### Why the answer is biased

The estimator is statistically sound; the trouble is the model. A real
Kepler orbit is an ellipse with eccentricity $e$. A circle is the
$e = 0$ special case. Fit a circle to data from an $e > 0$ ellipse and
no amount of data fixes the mismatch: the recovered center and radius
are biased by an amount that grows with $e$, not with noise. Adding
points shrinks the variance but not this bias. The lesson Gauss's
method teaches here is the one every fitter must learn: a tight,
well-converged fit to the wrong model is still wrong, and only a
residual structure (not the fit quality) reveals it.

### Things to try

- Set $e = 0$ (true circle) and watch the fit nail the parameters as
  points are added.
- Raise $e$ and watch the recovered center/radius drift off
  systematically even with many low-noise points.
- Note the residuals are not random when $e > 0$: they have a
  pattern, the tell-tale of model misspecification.

### Where this comes from

The linear least-squares circle fit and the eccentricity bias follow
Bate, Mueller and White, *Fundamentals of Astrodynamics*, Chapter 5
(after Gauss's 1809 least-squares orbit determination).
