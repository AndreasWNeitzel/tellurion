---
title: Cauchy Sequence Convergence Monitor
slug: cauchy-sequence-convergence-monitor
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: M1017
supporting_ucs: []
curriculum_year: bsc-y1s1
primary_citation: arfken-weber
primary_chapter: 1
hook: "A sequence converges if its tail eventually fits inside any band you choose, however thin. Pick an epsilon, watch the band shrink, and see how far out you must go before every later term is trapped inside it."
one_paragraph: "A sequence is Cauchy if, for every tolerance epsilon, there is an index N beyond which all terms lie within epsilon of each other; for real numbers this is exactly convergence. The playground plots a sequence on a number line with an epsilon tube around its limit and reports the smallest N(epsilon) for which the entire tail stays inside. Convergent examples (a geometric sequence, the Leibniz partial sums for arctan) show the tube tightening and the tail captured; the harmonic sequence is shown as a counterexample whose tail no finite tube ever traps (it diverges). The readout gives the tail diameter, the current epsilon and N. The point is operational: convergence is not a vague approach but a precise promise. Name your epsilon and the monitor names the N that delivers it."
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
# Cauchy sequence convergence monitor
Partial sums of four series; Cauchy width $w(N_0) = \max |a_n - a_m|$ for $n, m \ge N_0$. Geometric, $\zeta(2)$, and Leibniz arctan converge; harmonic does not. Source: Arfken-Weber Ch. 1.

## Explainer

### What you are looking at

How do you know a sequence converges without knowing its limit? The
Cauchy criterion says: check whether the terms eventually huddle
arbitrarily close to each other. The playground tracks four series'
partial sums and measures exactly that huddle width, showing three
shrink to zero (convergent) and one that refuses (the harmonic
series).

### The Cauchy criterion

A sequence $(s_N)$ is Cauchy if its tail can be made arbitrarily
tight:

$$\forall\,\epsilon>0\ \ \exists\,N_0:\quad
  n,m \ge N_0 \;\Longrightarrow\; |s_n - s_m| < \epsilon.$$

In the real numbers (which are complete) being Cauchy is equivalent
to being convergent, so you can certify convergence using only the
sequence itself, never naming the limit. The playground plots the
Cauchy width

$$w(N_0) = \sup_{n,m\ge N_0} |s_n - s_m|,$$

the diameter of the tail past $N_0$. Convergent: $w(N_0)\to 0$.
Not convergent: $w(N_0)$ stays bounded away from 0.

### The four series

- Geometric $\sum r^n$: $w(N_0)$ decays geometrically, fast
  convergence.
- $\zeta(2)=\sum 1/n^2$: $w(N_0)\sim 1/N_0\to 0$, converges (to
  $\pi^2/6$) but slowly.
- Leibniz $\sum(-1)^n/(2n+1)$: alternating, $w(N_0)\sim 1/N_0\to 0$,
  converges (to $\pi/4$) conditionally.
- Harmonic $\sum 1/n$: the terms go to zero yet $w(N_0)$ does NOT
  ($\sum_{n=N}^{2N}1/n\ge 1/2$ always), so it is not Cauchy and
  diverges. This is the punchline: $a_n\to 0$ is necessary but not
  sufficient for $\sum a_n$ to converge.

### Things to try

- Watch the geometric width crash to zero, the $\zeta(2)$ and
  Leibniz widths shrink slowly, the harmonic width refuse to shrink.
- Increase $N_0$ and confirm the harmonic tail diameter stays
  $\gtrsim 1/2$ no matter how far out you look.
- Compare convergence speeds: geometric beats $1/n^2$ beats
  alternating.

### Where this comes from

The Cauchy criterion, completeness of the reals, and these standard
series follow Rudin, *Principles of Mathematical Analysis*, Chapter
3, and Spivak, *Calculus*, Chapter 22.
