---
title: "Root Finding: Bisection, Newton, Secant"
slug: root-finding-bisect-newton-secant
status: verified
audience: portfolio
created: 2026-05-14
primary_uc: FIS2018
supporting_ucs: []
curriculum_year: bsc-y2s2
primary_citation: villate-vpython
primary_chapter: 4
hook: 'Three ways to hunt a root: bisection never fails but crawls, Newton races when it has the derivative, the secant splits the difference.'
one_paragraph: 'Root-finding trades robustness against speed. Bisection only needs a sign change and halves the bracket every step, guaranteed but linear. Newton-Raphson uses the derivative and converges quadratically near a root, but can diverge from a bad start. The secant method replaces the derivative with a finite difference, converging superlinearly without needing f-prime. The playground runs all three on a selectable function and plots the error per iteration, so the convergence orders and the failure modes (Newton overshooting, bisection''s slow crawl) sit side by side. Reference: Villate, Numerical Methods (VPython), Ch. 4.'
tags: [numerics, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
---
# Root-finding shootout
Bisection, Newton-Raphson, and the secant method on a selectable test function. Source: Villate VPython Numerical Methods Ch. 4 (`villate-vpython`).

## Explainer

### What you are looking at

Three classic ways to solve $f(x) = 0$ numerically, racing on the same
function. They trade safety against speed: one is slow but cannot fail,
one is fast but can fly off, one splits the difference. Watching them
converge side by side shows exactly what "order of convergence" means.

### Bisection: safe and steady

Start with a bracket $[a, b]$ where $f$ changes sign. Halve it,
keep the half that still brackets the root, repeat. The error is cut
exactly in two every step:

$$|e_{n+1}| = \tfrac12\,|e_n|,$$

linear convergence. It is guaranteed to converge (you can never lose
the root) but needs about 3.3 iterations per decimal digit. The
workhorse when you need certainty.

### Newton-Raphson: fast but fragile

Follow the tangent line to where it hits zero:

$$x_{n+1} = x_n - \frac{f(x_n)}{f'(x_n)}.$$

Near a simple root the error squares each step (quadratic
convergence): the number of correct digits roughly doubles per
iteration. The catch: it needs the derivative, and a bad start or a
near-zero $f'$ can throw the iterate far away. Fast when it works,
divergent when it does not.

### Secant: derivative-free compromise

Replace the tangent with the line through the last two points (a
finite-difference derivative):

$$x_{n+1} = x_n - f(x_n)\,\frac{x_n - x_{n-1}}{f(x_n) - f(x_{n-1})}.$$

No derivative needed, and the convergence order is the golden ratio
$\varphi \approx 1.618$, slower than Newton but faster than bisection,
the usual practical choice.

### Things to try

- Pick a well-behaved function and watch Newton crush it in 3-4 steps
  while bisection grinds on.
- Pick a function with a bad starting slope and watch Newton diverge
  while bisection still converges, the safety-versus-speed trade.
- Compare digit counts per iteration: linear (bisection), golden
  (secant), quadratic (Newton).

### Where this comes from

Bisection, Newton-Raphson, and the secant method with their
convergence orders follow Villate, *Numerical Methods* (VPython),
Chapter 4, and Press et al., *Numerical Recipes*, Chapter 9.
