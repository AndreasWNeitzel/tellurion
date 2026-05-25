---
title: "Green's Function: Building a Solution from Tent Responses"
slug: green-function-propagator
status: verified
audience: portfolio
created: 2026-05-18
primary_uc: M2009
supporting_ucs: []
curriculum_year: msc-y1
primary_citation: arfken-weber
hook: 'Solve -u'''' = f the smart way: first solve it for a single spike, which gives a tent-shaped Green''s function that is zero at both walls with a kink where the spike sits. Any source is a pile of spikes, so the answer is the same pile of tents, each scaled by the source strength: u(x) = integral G(x, x'') f(x'') dx''.'
one_paragraph: 'A Green''s-function playground for the 1D problem -u'''' = f on [0, 1] with the ends pinned at zero. The response to a single point spike is the tent G(x, x''): zero at both walls, peaked at the spike, with a unit downward kink there. Because the equation is linear, the response to any source is the superposition of tents weighted by the source value, u = integral G f. Panel A shows the source and the solution it produces (each on its own scale, since the solution is usually far smaller); Panel B is the draggable tent and the faint stack of weighted tents that build u; Panel C shows that the recovered u really does satisfy -u'''' = f and lists the defining facts. The Green function is symmetric, vanishes at both pinned ends, has a unit downward slope kink at the source point, and the weighted superposition of tents reproduces the exact solution and the analytic sine series. Reference: Arfken, Weber and Harris, Mathematical Methods for Physicists, Chapter 10; Stakgold, Green's Functions and Boundary Value Problems.'
tags: [math-methods, greens-function, bvp, superposition, live-readout]
difficulty: 4
tier: standard
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 4
share_state_keys: [src, p, xp]
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
references:
  - "Arfken, Weber, Harris, Mathematical Methods for Physicists: A Comprehensive Guide, Seventh ed."
---

# Green's Function: Building a Solution from Tent Responses

## Explainer

### What you are looking at

A Green's function is the answer to one simple question: how does the
system respond to a single pinprick? Once you know the response to a
spike at every location, you can build the response to any load at all
by adding up scaled copies. The playground shows the tent-shaped spike
response and how a general source is assembled from those tents.

### The defining problem

Take the steady-state equation with fixed ends:

$$-u''(x) = f(x), \qquad u(0) = u(L) = 0.$$

The Green's function $G(x,x')$ is the solution when the source is a
unit impulse at one point $x'$:

$$-\frac{\partial^2 G}{\partial x^2} = \delta(x - x'),
  \qquad G(0,x') = G(L,x') = 0.$$

Solving gives a tent: two straight lines that are zero at both walls
and meet at a kink at $x'$,

$$G(x,x') = \begin{cases}
  \dfrac{x\,(L - x')}{L}, & x \le x',\\[2mm]
  \dfrac{x'\,(L - x)}{L}, & x \ge x'.
\end{cases}$$

The unit-slope jump in $\partial G/\partial x$ across $x'$ is exactly
the delta source; the function is symmetric, $G(x,x') = G(x',x)$
(reciprocity, the same physics whether you push at A and measure at B
or vice versa).

### Superposition: the whole point

Because the operator is linear, an arbitrary source is just a
continuous pile of impulses, so the solution is the same pile of
tents weighted by the local source strength:

$$u(x) = \int_0^L G(x,x')\,f(x')\,dx'.$$

This is the universal trick behind propagators in field theory,
impulse responses in signals, and inverse problems: solve once for a
point source, integrate for everything else. The playground lets you
move the source point and shape $f$, and watch the solution rebuild
itself as the superposition integral.

### Things to try

- Move the impulse location $x'$ and watch the kink in the tent track
  it while the ends stay pinned at zero.
- Swap a localized $f$ for a broad one and watch the solution become
  the weighted sum of tents.
- Note the symmetry $G(x,x') = G(x',x)$: source and observation point
  are interchangeable.

### Where this comes from

The Green's function for the boundary-value problem, its reciprocity,
and the superposition integral follow Arfken and Weber, *Mathematical
Methods for Physicists*, Chapter 10, and Morse and Feshbach, *Methods
of Theoretical Physics*.

## Physical setup

The boundary-value problem -u'' = f on [0, L] with u(0) = u(L) = 0. The Green's function G(x, x') is the solution when the source is a single unit spike at x'. It is the tent that is zero at both walls and has a kink at x'. Because the operator is linear, the solution for any source is the superposition of these tents weighted by the source value at each point, u(x) = integral G(x, x') f(x') dx'.

## Governing equations

G(x, x') = x (L - x') / L for x <= x', and x' (L - x) / L for x >= x'. It is symmetric, vanishes at x = 0 and x = L, peaks at G(x', x') = x'(L - x')/L, and its x-slope jumps by -1 across x = x' (because -G'' = delta). The solution is u(x) = integral_0^L G(x, x') f(x') dx'. For f = sin(m pi x / L) the exact solution is sin(m pi x / L) / (m pi / L)^2.

## Numerical method

The tent is closed form. The solution is the composite-trapezoid superposition of weighted tents. The reference is a direct tridiagonal solve of -u'' = f via the shared complex Thomas solver (imaginary parts zero). Deterministic; no RNG.

## Controls

- `src`: source profile (sine mode / box pulse / point-like bump / two bumps).
- `p`: a source parameter (mode number, width or position depending on the profile).
- `xp`: the tent source position x'; dragging it pauses the sweep so you can place it.
- Reset, Pause/Play. Pause freezes the x' sweep.

## Expected qualitative features

- The tent is zero at both walls and kinked at x'; dragging x' slides the kink.
- The solution has the boundary values zero and is smoother than the source (the Green operator integrates twice, suppressing high-frequency detail).
- The recovered u satisfies -u'' = f to machine precision; it matches the direct solve.
- A sine source gives a sine solution; two bumps give a smooth single arch.

## Invariants and acceptance thresholds

`invariants.test.mjs` (vitest, offline):

1. G is symmetric to 1e-12.
2. G(0, x') = G(L, x') = 0 exactly; the apex equals x'(L - x')/L.
3. The slope of G jumps by -1 at x = x' and G is continuous there.
4. u = integral G f satisfies -u'' = f (residual < 1e-4) with u(0) = u(L) = 0.
5. The Green solution matches the direct tridiagonal solve (1e-9) and the analytic sine (1e-4).
6. The Green operator is linear; a zero source gives a zero solution.
7. Determinism.

Visual gate: SSIM > 0.92 against committed golden frames at 60 fps.

## Limiting cases for verification

- Source at one point: u is exactly the tent.
- Sine source mode m: u = sin / (m pi / L)^2 (amplitude falls as 1/m^2).
- Zero source: zero solution.
- High-frequency source: strongly smoothed (the operator is a double integral).

## Visual fallback

All panels are static reads; only the tent-position sweep animates and it loops.

## Citations

- Arfken, Weber and Harris, Mathematical Methods for Physicists: Green's functions for the Sturm-Liouville BVP.

## Stretch goals

- Add Neumann and mixed boundary conditions and show how the tent changes.
- Add the time-dependent propagator (heat or Schrodinger kernel).

## Risk register

- A real defect was found and fixed in review: the solution was plotted on the same scale as the much larger source and rendered as a flat invisible line; the panels now use independent per-curve scales with the peak magnitudes labelled, which is the load-bearing pedagogical point.
