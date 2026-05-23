---
title: Slow-Roll Inflation
slug: inflation-slow-roll
status: superseded
superseded_by: inflation-quantum-fluctuations
audience: portfolio
created: 2026-05-13
primary_uc: AST3017
supporting_ucs: [MAA-CS]
curriculum_year: bsc-y3s2
primary_citation: mukhanov-cosmology
primary_chapter: 5
hook: "Inflation stretches quantum jitters into the seeds of every galaxy. Each model of the early universe predicts a different pair of numbers, the tilt of the primordial spectrum n_s and the gravitational-wave amount r; plot them and watch which models Planck has already ruled out."
one_paragraph: "A scalar inflaton rolling slowly down its potential V(phi) makes two slow-roll parameters, epsilon = (M_Pl^2/2)(V'/V)^2 and eta = M_Pl^2 V''/V, which fix the two observables: the scalar spectral index n_s = 1 - 6 epsilon + 2 eta and the tensor-to-scalar ratio r = 16 epsilon. For large-field power-law potentials V ~ phi^p with N e-folds before inflation ends, this collapses to closed forms, n_s = 1 - (p+2)/(2N) and r = 4p/N, so phi^2 gives (1 - 2/N, 8/N), phi^4 gives (1 - 3/N, 16/N); natural and Starobinsky R^2 inflation sit elsewhere. The playground plots each model's track on the (n_s, r) plane with the Planck 2018 box overlaid, so you see directly that phi^2 and phi^4 are excluded while Starobinsky lands comfortably inside. Vary N to slide along each track."
tags: [cosmology, animation, live-readout]
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

# Slow-roll inflation: $n_s$ vs $r$

## Explainer

### What you are looking at

The early universe is thought to have inflated, expanded exponentially,
driven by a scalar field rolling slowly down its potential. Different
potential shapes predict different patterns in the cosmic microwave
background. The playground plots each model's prediction on the
$(n_s, r)$ plane that Planck actually measured, so you see which
survive and which are ruled out.

### Slow roll

If a field $\phi$ rolls slowly down $V(\phi)$ (kinetic energy tiny
compared to potential), the expansion is nearly exponential. "Slowly"
is quantified by two dimensionless slow-roll parameters built from the
shape of the potential:

$$\epsilon = \frac{M_\text{Pl}^2}{2}\left(\frac{V'}{V}\right)^2,
  \qquad
  \eta = M_\text{Pl}^2\,\frac{V''}{V},$$

with inflation requiring $\epsilon, |\eta| \ll 1$ and ending when
$\epsilon \to 1$.

### The two observables

To leading order the primordial fluctuations are characterized by the
scalar spectral tilt and the tensor-to-scalar ratio:

$$n_s = 1 - 6\epsilon + 2\eta,
  \qquad r = 16\,\epsilon.$$

$n_s$ slightly below 1 means the fluctuation spectrum is nearly but not
exactly scale-invariant; $r$ measures primordial gravitational waves.
Each potential traces a curve in the $(n_s, r)$ plane parameterized by
$N$, the number of e-folds before inflation ends (observable scales
left the horizon at $N\approx 50$ to 60):

- $\phi^2$ chaotic: $n_s = 1 - 2/N$, $r = 8/N$ (Planck excludes this
  $r$).
- $\phi^4$ chaotic: $r = 16/N$, far excluded.
- Natural inflation: $n_s = 1 - 2/N - 1/f^2$, $r = 8/N$.
- Starobinsky $R^2$: $n_s = 1 - 2/N$, $r = 12/N^2$ (tiny $r$,
  comfortably allowed).

The playground overlays these trajectories on the Planck contour so the
verdict (ruled in or out) is visual.

### Things to try

- Slide $N$ from 50 to 60 and watch each model's point move along its
  $(n_s,r)$ track.
- Compare $\phi^2/\phi^4$ (high $r$, outside the data) with Starobinsky
  ($r\sim 1/N^2$, well inside).
- Note all viable models predict $n_s$ slightly less than 1, exactly
  what is observed.

### Where this comes from

The slow-roll parameters, the $n_s = 1-6\epsilon+2\eta$ and
$r = 16\epsilon$ relations, and the model trajectories follow Liddle,
*An Introduction to Modern Cosmology*, Chapter 13, and Baumann,
*Cosmology*.

## Physical setup

A scalar inflaton field $\phi$ with potential $V(\phi)$ in slow-roll regime ($\epsilon, |\eta| \ll 1$). The slow-roll parameters are $\epsilon = (M_\text{Pl}^2 / 2)(V'/V)^2$ and $\eta = M_\text{Pl}^2 V''/V$. Observables to leading order:

$$n_s = 1 - 6\epsilon + 2\eta, \qquad r = 16\epsilon.$$

Four models tracked, each yielding $(n_s, r)$ trajectories parameterized by the number of e-folds $N$ before the end of inflation:

- $\phi^2$ chaotic: $n_s = 1 - 2/N$, $r = 8/N$ (from $n_s = 1 - (p+2)/(2N)$, $r = 4p/N$ with $p=2$). Excluded by Planck on $r$.
- $\phi^4$ chaotic: $n_s = 1 - 3/N$, $r = 16/N$ ($p=4$). Far excluded.
- Natural inflation (for $f = 2 M_\text{Pl}$): $n_s = 1 - 2/N - 1/f^2$, $r = 8/N$.
- Starobinsky $R^2$ inflation: $n_s = 1 - 2/N$, $r = 12/N^2$. Comfortably within Planck.

## Numerical method

Closed-form. Plot $(n_s, r)$ on the standard $\le 0.3$ tensor-ratio plane with the Planck 2018 $2\sigma$ box ($n_s = 0.9649 \pm 0.0042$, $r < 0.064$) overlaid.

## Controls

- Number of e-folds $N$ (40 to 80).
- Model selector (4 options).

## Expected qualitative features

1. Starobinsky trajectory hugs $n_s \approx 0.96$, $r \to 0$; lands inside Planck box.
2. $\phi^4$ trajectory at $r \approx 0.2$-$0.3$; firmly excluded.
3. $\phi^2$ at $r \approx 0.13$, marginal.
4. All trajectories converge toward $n_s \to 1$ as $N$ grows.

## Invariants and acceptance thresholds

| invariant | threshold | location |
| Starobinsky at $N = 60$ within Planck box | strict | invariants test |
| $\phi^4$ at $N = 60$ excluded by Planck | strict | invariants test |
| $\phi^2$ at $N = 60$: $r \in (0.10, 0.15)$ | strict | invariants test |
| $r \propto 1/N$ for $\phi^2$ | within $10^{-12}$ | invariants test |
| $n_s \to 1$ as $N \to \infty$ for all models | strict | invariants test |
| Starobinsky $r \propto 1/N^2$ | within $10^{-12}$ | invariants test |
| Planck $n_s$ central value 0.9649 | within $10^{-4}$ | invariants test |
| MODELS list contains 4 entries | exact | invariants test |

All confirmed in `invariants.test.mjs` (8 tests passing).

## Limiting cases for verification

- $N \to \infty$: every model gives $n_s \to 1$, $r \to 0$ (de Sitter limit).
- $\phi^p$ models with $p$ small enough: still slow-roll, but excluded.
- Starobinsky $R^2$: original 1980 inflation model, now in favor.

## Visual fallback

If KaTeX or Canvas2D is unavailable, sliders still operate.

## Citations

- Mukhanov, *Physical Foundations of Cosmology*, Ch. 5.
- Planck 2018 results VI: Cosmological parameters (A&A 641, A6).
- Starobinsky 1980; Linde 1982 chaotic inflation; Freese, Frieman, Olinto 1990 natural inflation.

## Stretch goals

- Plot $\phi^n$ trajectories for general $n$ (slider).
- Hill-top inflation models.
- Add running of $n_s$ (running spectral index).

## Risk register

- The natural-inflation formula here is a simplified large-$f$ limit; small-$f$ is more complex but qualitatively similar.
