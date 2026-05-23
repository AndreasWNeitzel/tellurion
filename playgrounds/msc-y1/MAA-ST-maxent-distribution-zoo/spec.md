---
title: Maximum-Entropy Distributions Zoo
slug: maxent-distribution-zoo
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: MAA-ST
supporting_ucs: []
curriculum_year: msc-y1
hook: 'Tell the playground only a few facts about a quantity (its range, its mean, its variance) and it draws the single least-committal distribution consistent with them. The same rule produces the uniform, the exponential, the Gaussian and the Laplace, one per constraint set.'
one_paragraph: 'The maximum-entropy principle (Jaynes 1957) picks, among all densities consistent with given constraints, the one that maximises the differential entropy h[p] = -integral p ln p dx, which forces the exponential-family form p(x) proportional to exp(sum_k lambda_k f_k(x)). Fixing only the support [a, b] gives the uniform; a mean on [0, infinity) gives the exponential e^{-x/mu}/mu; a mean and variance on the whole line give the Gaussian; a mean and a fixed E|X - mu| give the Laplace. The playground lets you choose which moments are fixed and shows the maximum-entropy density snap to the matching member of the zoo, with its closed-form and numerically integrated entropy side by side, making concrete that choosing a distribution is the same as choosing which constraints you assume. Reference: Cover and Thomas, Elements of Information Theory, 2nd ed., Chapter 12; Jaynes, Physical Review 106, 620 (1957).'
tags: [numerics, animation, live-readout]
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

# Maximum-entropy distributions: a small zoo

## Explainer

### What you are looking at

If all you know about a quantity is a few facts (its range, its mean,
its variance), which probability distribution should you assume? The
maximum-entropy principle says: the one that is maximally
noncommittal, that adds no information you do not have. Strikingly,
the familiar textbook distributions all fall out of this single rule
depending on the constraint. The playground shows the zoo.

### The principle

Among all densities $p(x)$ consistent with the known constraints,
pick the one that maximizes the differential entropy

$$h[p] = -\int p(x)\,\ln p(x)\,dx,$$

subject to normalization and the given expectation constraints
$\int p\,f_k\,dx = \mu_k$. Solving this constrained optimization with
Lagrange multipliers gives the universal exponential-family form

$$p(x) \;\propto\; \exp\!\Big[\textstyle\sum_k \lambda_k f_k(x)\Big].$$

The constraints choose the functions $f_k$; everything else is forced.

### The zoo

- Known support only ($[a,b]$): the uniform distribution (no
  feature is preferred).
- Known mean on $[0,\infty)$: the exponential distribution
  $p\propto e^{-\lambda x}$.
- Known mean and variance on $(-\infty,\infty)$: the Gaussian
  $p\propto e^{-(x-\mu)^2/2\sigma^2}$ (which is why the Gaussian is
  the "least-assuming" distribution for a given spread, the deep
  reason it is everywhere).
- Known mean on the non-negative integers: the geometric/Boltzmann
  form, the same algebra that gives statistical mechanics its
  partition function.

The lesson is that distributional assumptions are equivalent to
constraint assumptions: choosing "Gaussian noise" is exactly the
statement "I only know the mean and variance". The playground lets
you set which moments are fixed and shows the maximum-entropy density
snap to the corresponding member of the zoo.

### Things to try

- Fix only the support and get the flat uniform; add a mean
  constraint and watch it tilt into an exponential.
- Add a variance constraint on the whole line and watch the Gaussian
  emerge as the maximum-entropy answer.
- Note that adding a constraint always lowers the entropy (more
  knowledge, less uncertainty).

### Where this comes from

The maximum-entropy principle and the resulting exponential family
follow Jaynes, Phys. Rev. 106, 620 (1957), and Cover and Thomas,
*Elements of Information Theory*, Chapter 12.

## Physical setup

A 1D probability density on a continuous support. The maximum-entropy principle (Jaynes 1957) selects the density that maximizes differential entropy h(p) = -integral p ln p dx subject to fixed moments (or other linear functionals of p). The result depends entirely on the choice of constraints; this playground enumerates four canonical cases.

## Governing equations

- Support [a, b], no moments fixed: p(x) = 1/(b - a) on [a, b]; h = ln(b - a).
- Support [0, infinity), mean mu fixed: p(x) = (1/mu) e^{-x/mu}; h = 1 + ln mu.
- Support R, mean mu and variance sigma^2 fixed: p(x) = N(mu, sigma); h = 0.5 ln(2 pi e sigma^2).
- Support R, mean mu and E[|X - mu|] = b fixed: p(x) = (1/(2 b)) e^{-|x - mu|/b} (Laplace); h = 1 + ln(2 b).

## Numerical method

Closed-form pdfs evaluated on a 500-point grid sized to the active family. Numerical entropy by trapezoidal sum. Both reported live.

## Controls

- family: dropdown (gaussian, uniform, exponential, laplace)
- mu: location parameter (gaussian, laplace), -2 to 2
- sigma / b / mean: scale parameter (gaussian: sigma; laplace: b; exponential: mean), 0.3 to 3.0
- support: uniform half-width, 0.5 to 3.0

## Expected qualitative features

1. Selecting "uniform" with mean 0 collapses to a flat box; entropy ~ ln(2 supp).
2. Selecting "gaussian" gives a bell-shaped pdf; entropy scales with ln(sigma).
3. Selecting "exponential" gives the standard right-skewed pdf on [0, infinity).
4. Selecting "laplace" gives the double-exponential cusp at mu.

## Invariants and acceptance thresholds

- Closed-form entropies match A&S references to 12 sig figs.
- Numerical entropy matches analytic within:
  - 1 percent (gaussian, uniform)
  - 5 percent absolute (exponential, due to long-tail truncation at the grid edge)
  - 2 percent (laplace, due to cusp at mu)
- All pdfs integrate to 1 within 2 percent on their grid.

All confirmed in `invariants.test.mjs`.

## Limiting cases for verification

- Gaussian sigma -> infinity: entropy diverges; numerical diverges with grid as expected.
- Uniform b -> a (zero support): h -> -infinity; numerical does not crash because we only render finite p.
- Exponential mean -> 0: h -> -infinity (analytic); numerical bounded by grid resolution.

## Visual fallback

Canvas2D only.

## Citations

- MacKay 2003, Information Theory, Inference, and Learning Algorithms, Section 22.2.
- Cover and Thomas 2006, Elements of Information Theory, 2e, Section 12.1.
- Jaynes 1957, "Information Theory and Statistical Mechanics", Phys. Rev. 106 (the original maxent principle).

## Stretch goals

- Add a "constraints as Lagrange multipliers" derivation panel.
- Add the q-state discrete maxent (= uniform on q states).
- Add the log-normal: maxent on (0, infty) with fixed E[ln X], E[(ln X)^2].

## Risk register

- Long-tail truncation for the exponential family at the right edge of the grid causes the trapezoidal entropy to underestimate the analytic value by a few percent. Acceptable for visualization.
- The uniform pdf has discontinuities at the support endpoints; the trapezoidal sum picks up O(dx) error there, which is invisible at 500 grid points.
