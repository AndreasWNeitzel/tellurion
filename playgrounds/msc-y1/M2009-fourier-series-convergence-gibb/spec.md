---
title: "Fourier Series: Convergence, Epicycles and the Gibbs Overshoot"
slug: fourier-series-convergence-gibb
status: verified
audience: portfolio
created: 2026-05-18
primary_uc: M2009
supporting_ucs: []
curriculum_year: msc-y1
primary_citation: arfken-weber
hook: 'Build a square, sawtooth or triangle wave out of sines and cosines. Add more terms and the sum gets closer, except right at a jump, where it always overshoots by about 8.9 percent of the jump no matter how many terms you use (the Gibbs phenomenon, the overshoot only narrows). The same sum is the tip of a chain of rotating vectors, and Parseval says the coefficient energy equals the function energy.'
one_paragraph: 'A Fourier-series playground. Pick a target wave and watch its N-term partial sum converge to it, while a chain of rotating vectors (epicycles) draws exactly the same curve at its tip. Near a jump the partial sum always overshoots by the Wilbraham-Gibbs fraction (about 8.95 percent of the jump); raising N only makes the overshoot narrower, never smaller, which the convergence panel shows as a flat line. The smooth triangle has no jump and no overshoot. Parseval energy in the coefficients climbs to the function mean square. Away from a jump the partial sum converges, at a jump it sits at the average of the two sides, Parseval's energy is recovered, and the Wilbraham-Gibbs overshoot stays at about 8.95 percent of the jump no matter how many terms are added. Reference: Arfken, Weber and Harris, Mathematical Methods for Physicists, Chapter 19; Korner, Fourier Analysis.'
tags: [math-methods, fourier-series, gibbs, epicycles, live-readout]
difficulty: 3
tier: standard
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 4
share_state_keys: [tgt, n]
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

# Fourier Series: Convergence, Epicycles and the Gibbs Overshoot

## Explainer

### What you are looking at

Any repeating signal, no matter how jagged, can be built by stacking
pure sine waves. The playground takes a square, sawtooth or triangle
wave and rebuilds it from $N$ sines, three ways at once: the
reconstructed curve against the true wave, a chain of spinning vectors
whose tip draws it, and the leftover error as you add terms. It also
exposes the famous Gibbs overshoot at the jumps.

### The Fourier series

A $2\pi$-periodic function is written as a sum of harmonics:

$$f(x) = \frac{a_0}{2}
  + \sum_{n=1}^{\infty}\big[a_n\cos nx + b_n\sin nx\big],$$

with the coefficients picked out by orthogonality (project $f$ onto
each harmonic):

$$a_n = \frac1\pi\int_{-\pi}^{\pi} f(x)\cos nx\,dx,\qquad
  b_n = \frac1\pi\int_{-\pi}^{\pi} f(x)\sin nx\,dx.$$

Truncating at $N$ terms gives the partial sum $S_N(x)$. Each pair
$(a_n,b_n)$ is one rotating vector of frequency $n$; summing the
vectors tip-to-tail and tracing the tip is exactly the epicycle
picture (the same math as a Fourier "drawing machine").

### Parseval and the Gibbs overshoot

Energy is conserved between the signal and its spectrum (Parseval):

$$\frac1\pi\int_{-\pi}^{\pi} f^2\,dx
  = \frac{a_0^2}{2} + \sum_{n=1}^{\infty}(a_n^2 + b_n^2),$$

so the partial-sum energy climbs monotonically toward the total as
$N$ grows, and the missing energy is the truncation error. But near a
jump discontinuity the partial sum always overshoots by about 9% of
the jump no matter how large $N$ is (the Gibbs phenomenon): the
overshoot does not shrink, it only narrows. That is why a square wave
reconstructed from many sines still has a stubborn ringing at its
edges, the central lesson for any truncated spectral method.

### Things to try

- Raise $N$ and watch $S_N$ hug the target everywhere except at the
  jumps, where the ~9% overshoot refuses to die.
- Watch the epicycle chain: low harmonics set the shape, high
  harmonics sharpen the corners.
- Read the Parseval bar climbing toward 100% as the error falls.

### Where this comes from

The Fourier series, the orthogonality coefficients, Parseval's
theorem and the Gibbs phenomenon follow Boas, *Mathematical Methods
in the Physical Sciences*, Chapter 7, and Arfken and Weber,
*Mathematical Methods for Physicists*.

## Physical setup

Any periodic function is a sum of sines and cosines. This playground takes a square, sawtooth or triangle wave on [-pi, pi], builds its N-term Fourier partial sum, and shows the same sum three ways: as a curve compared to the target, as a chain of rotating vectors whose tip traces it, and through its convergence behaviour (the Parseval energy and the Gibbs overshoot versus N).

## Governing equations

f ~ a0/2 + sum a_n cos(n x) + b_n sin(n x). Square: b_n = 4/(n pi) for odd n. Sawtooth (x/pi): b_n = 2(-1)^{n+1}/(n pi). Triangle (1 - 2|x|/pi): a_n = 8/(pi^2 n^2) for odd n. Parseval: a0^2/4 + (1/2) sum (a_n^2 + b_n^2) = mean square of f (1 for the square, 1/3 for sawtooth and triangle). At a jump the series converges to the average of the two sides; near the jump it overshoots by the Wilbraham-Gibbs fraction (2/pi) integral_0^pi sinc - 1 ~ 0.0895 of the jump, independent of N.

## Numerical method

All coefficients are the closed-form analytic values; the partial sum, the complex epicycle coefficients C_k = (a_k - i b_k)/2 and the Wilbraham-Gibbs constant are evaluated directly. The overshoot is measured at the actual jump of each target (x = 0 for the square, x = pi for the sawtooth; the triangle is continuous and has none). Deterministic; no RNG.

## Controls

- `tgt`: target wave (square / sawtooth / triangle).
- `n`: number of Fourier terms (1 to 80). More terms converge better and narrow the Gibbs spike.
- Reset, Pause/Play. Pause freezes the epicycle sweep; the curves are static.

## Expected qualitative features

- The partial sum approaches the target everywhere except at a jump, where it rings.
- The Gibbs overshoot stays at about 8.9 percent of the jump and only gets thinner with N.
- The triangle (continuous) has no overshoot; the sum reproduces the tent exactly.
- The rotating-vector chain's tip draws the same curve; Parseval energy climbs to 1.

## Invariants and acceptance thresholds

`invariants.test.mjs` (vitest, offline):

1. Coefficients equal the textbook formulas; the triangle sum reconstructs the tent (not its inverse).
2. The sum converges to the function away from the discontinuity (error shrinks with N).
3. At a jump the partial sum equals the average of the two sides (0 for the square).
4. Parseval energy is monotone in N, bounded by the mean square, and within 0.1 percent at large N.
5. The Gibbs overshoot at the actual jump is within 1 percent (square) or 3 percent (sawtooth) of 0.0895 and persists; the triangle has none.
6. The epicycle tip equals the partial sum; the chain has 2N+1 vectors.
7. Determinism.

Visual gate: SSIM > 0.92 against committed golden frames at 60 fps.

## Limiting cases for verification

- Triangle: a_n ~ 1/n^2, converges fast, no Gibbs (continuous).
- Square / sawtooth: a persistent ~8.95 percent overshoot at the jump.
- N -> infinity: Parseval energy -> the function mean square.
- At a discontinuity: the series -> the midpoint value.

## Visual fallback

Every panel is a static read; only the epicycle sweep animates and it loops over one period.

## Citations

- Arfken, Weber and Harris, Mathematical Methods for Physicists: Fourier series, Parseval, the Gibbs phenomenon.
- Gibbs, J. W., Fourier's Series, Nature 59, 606 (1899): the persistent overshoot and the Wilbraham-Gibbs constant.

## Stretch goals

- Let the user draw an arbitrary periodic target and fit its coefficients numerically.
- Add a 2D epicycle drawing of a closed curve.

## Risk register

- Two real defects were found and fixed in review: the triangle coefficient sign was inverted (the sum drew the upside-down tent), and the Gibbs marker searched x = 0 for every target so the sawtooth (whose jump is at x = pi) reported a false 0 percent. The invariants now pin the triangle reconstruction and the overshoot at each target's true jump.
