---
title: Lyapunov Spectrum via Benettin QR
slug: lyapunov-spectrum
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: FIS2021
supporting_ucs: []
curriculum_year: bsc-y2s2
hook: 'Track how a tiny error grows along a strange attractor and you measure chaos as a number; the two exponents must sum to ln|b| exactly, which proves the method.'
one_paragraph: 'Lyapunov exponents quantify chaos: the rates at which nearby trajectories separate (positive) or contract (negative). The playground computes the full spectrum for the Henon map with the Benettin QR algorithm, evolving the orbit together with an orthonormal frame and re-orthonormalizing each step to accumulate the log stretch in each direction. The live readout shows both exponents and their sum, which must equal ln|b|, the log Jacobian determinant, an exact invariant that validates the computation. The left panel shows the banana-shaped strange attractor; dragging (a, b) morphs it. Reference: Benettin et al. 1980; Strogatz, Nonlinear Dynamics and Chaos, Ch. 10.'
tags: [mechanics, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
---

# Lyapunov Spectrum of the Henon Map

## Physical setup

The playground visualizes the full spectrum of Lyapunov exponents for the canonical Henon map, a 2D quadratic recurrence that is the archetypal discrete-time chaotic system. The map exhibits a strange attractor with complex mixing and sensitive dependence on initial conditions. Two panels display complementary views: the left panel shows the scatter of attractor points in phase space (x, y), revealing the classic banana-shaped structure at the canonical parameter values; the right panel is a small parameter (a, b) grid where the user drags a handle to control the map coefficients and watch the attractor morph in real time. The playground computes the full Lyapunov spectrum using the Benettin QR algorithm: simultaneously tracking the orbit and a 2x2 orthonormal frame tangent to the manifold, re-orthonormalizing at each step via Gram-Schmidt, and accumulating the log-magnitudes of the frame columns. The live readout displays both exponents, their sum (which must equal ln|b|, an exact dynamical invariant), and the iteration count; this sum-equals-determinant relationship is a strong invariant and validates the algorithm's correctness.

## Governing equations

The Henon map is a 2D nonlinear recurrence:

$$x_{n+1} = 1 - a x_n^2 + y_n$$
$$y_{n+1} = b x_n$$

where $a \in [1.0, 1.5]$ and $b \in [0.1, 0.4]$ are bifurcation parameters and $(x_n, y_n) \in \mathbb{R}^2$ is the state. The determinant of the Jacobian is:

$$\det J = \begin{vmatrix} -2 a x_n & 1 \\ b & 0 \end{vmatrix} = -b$$

The Jacobian matrix at $(x_n, y_n)$ is:

$$J(x_n) = \begin{pmatrix} -2 a x_n & 1 \\ b & 0 \end{pmatrix}$$

## Numerical method

- **Discretization**: pure 2D iteration. No differential equation integrator. Each iteration applies the Henon map once in IEEE 754 double precision.
- **Lyapunov algorithm (Benettin QR)**: maintain an orthonormal 2x2 frame $Q$ tangent to the stable manifold. At each step:
  1. Apply the Jacobian to the frame: $Q' = J(x_n) Q$.
  2. Gram-Schmidt re-orthonormalization: compute $r_1 = \|Q'_{:,1}\|$, set $q_1 = Q'_{:,1} / r_1$. Then $r_{12} = q_1^T Q'_{:,2}$, set $q_2 = (Q'_{:,2} - r_{12} q_1) / r_2$ where $r_2 = \|Q'_{:,2} - r_{12} q_1\|$.
  3. Accumulate exponents: increment $\Lambda_1 \mathrel{+}= \ln r_1$ and $\Lambda_2 \mathrel{+}= \ln r_2$.
  4. Update frame: set $Q = [q_1, q_2]$.
  5. Execute one Henon map step: $(x_{n+1}, y_{n+1})$ via the defining equations.
- **Burn-in and accumulation**: discard the first $10^3$ iterations to allow transients to decay and the orbit to settle on the attractor. Then accumulate Lyapunov terms for the next $10^5$ iterations. Final exponents are $\lambda_i = \Lambda_i / 10^5$.
- **Overflow guard**: after every iteration step, check $|x_n| > 10$ or $|y_n| > 10$; on first such event, mark the parameter region as unbounded, halt iteration for that (a, b) point, and render a visual indicator on the parameter panel. The check runs inside the inner loop so a single diverging step is caught before the next squaring.
- **Singular frame handling**: if any diagonal $r_i < 10^{-15}$, skip the corresponding term and decrement the accumulation counter N (analogous to the zero-handling in logistic-cobweb). This prevents numerical collapse in near-singular regimes. Maintain a running count of skipped events; when the skip count exceeds 1 percent of N, raise a "low-confidence" flag in the readout, suppressing the individual $\lambda_1, \lambda_2$ displays and showing only the sum and $\ln|b|$.
- **Accumulation strategy**: $\Lambda_1$ and $\Lambda_2$ are plain double-precision running sums updated in a fixed order (1 then 2) per step. No Kahan summation; the log magnitudes are O(1) and 10^5 iterations leave the cumulative round-off below $10^{-13}$, well inside the $10^{-10}$ trace gate.
- **Rendering stride**: the attractor scatter is capped at the most recent $10^4$ points (or stride-down from $10^5$) to keep render time bounded on every animation frame.
- **Spatial domain**: $(x, y)$ iterates into the attracting region; typical bounds for the canonical (a=1.4, b=0.3) are $x \in [-2, 2]$, $y \in [-1, 1]$.
- **Boundary conditions**: none (map is globally defined on $\mathbb{R}^2$).
- **RNG**: not used for the main simulation. Deterministic iteration only.

## Controls

| name | type | units | range | default | sets |
|------|------|-------|-------|---------|------|
| (a, b) | drag handle on parameter panel | dimensionless | a in [1.0, 1.5], b in [0.1, 0.4] | a=1.4, b=0.3 | bifurcation parameters; direct manipulation via click-drag on the parameter grid |
| reset | button | N/A | N/A | N/A | reinitialize the orbit from (x_0, y_0) = (0.1, 0.1) and clear the attractor scatter |
| play/pause | button | N/A | N/A | play | toggle live iteration; when paused, the attractor freezes but readouts persist |
| (x_0, y_0) | not user-adjustable in v1 | dimensionless | (0.1, 0.1) | (0.1, 0.1) | initial condition; fixed at (0.1, 0.1) for reproducibility |

## Expected qualitative features

- The attractor shape morphs from a single disconnected banana curve at (a=1.4, b=0.3) to increasingly fragmented or elongated structures as a or b vary away from the canonical point. No structure should collapse to a point or a thin line at any parameter within the valid range.
- The largest Lyapunov exponent lambda_1 is positive across the entire valid parameter range, reflecting chaotic mixing. It increases as a increases (stronger nonlinearity) and is independent of the sign of b (which controls only contraction, not expansion in the x direction).
- The second exponent lambda_2 is negative and becomes more negative (stronger contraction) as |b| decreases. At b=0.3, lambda_2 approximately -1.62.
- The sum lambda_1 + lambda_2 equals ln|b| to machine precision, confirming that the Benettin algorithm is properly orthonormalizing and accumulating the trace of the logarithmic Jacobian. At (a=1.4, b=0.3), this sum should equal ln(0.3) approximately -1.204 exactly.
- The live readout updates smoothly (at least 1 Hz, ideally 10+ Hz while dragging slowly) and shows a, b, lambda_1, lambda_2, lambda_1+lambda_2, ln|b|, and iteration count, all in monospace font with sufficient precision.
- At the canonical (a=1.4, b=0.3), the attractor is the classic Henon strange attractor, visually recognizable from chaos textbooks. The estimated lambda_1 approximately 0.42 plus or minus 0.01 (2 percent tolerance).

## Invariants and acceptance thresholds

| invariant | strong/medium/weak | threshold | notes |
|-----------|-------------------|-----------|-------|
| Trace conservation: lambda_1 + lambda_2 = ln\|b\| | strong | \|lambda_1 + lambda_2 - ln\|b\|\| < 1e-10 (machine precision modulo accumulated round-off over 10^5 iterations) | exact identity from det J = -b; any deviation signals a breach in re-orthonormalization or frame update logic |
| Largest exponent at canonical (a=1.4, b=0.3) | strong | \|lambda_1 - 0.42\| / 0.42 < 0.02 (2 percent relative error) over 10^5 iterations after 10^3 burn-in | benchmark value from chaos literature; 2 percent gate is tolerant due to natural finite-N fluctuation; tighter tolerance would flake |
| Exponent sign (second exponent negative) | medium | lambda_2 < 0 at all (a, b) pairs in the valid parameter space | contraction in the y direction is necessary for a 1D attractor; failure indicates a Gram-Schmidt implementation error |

A visual SSIM fallback of > 0.92 against committed golden frames at (a=1.4, b=0.3) and fixed seed (no randomness) is used if numerical precision becomes ambiguous (e.g., very large N or extreme parameter corners).

## Limiting cases for verification

| limit | expected | source |
|-------|----------|--------|
| b approaches 0 | ln\|b\| approaches negative infinity; attractor collapses to the x-axis; lambda_2 must diverge toward negative infinity | elementary analysis of the map as b approaches 0; valid only as a mathematical limit (b < 0.1 is outside the valid range) |
| a = 1.0 | map reduces to x_{n+1} = 1 - x_n^2 + y_n, y_{n+1} = b x_n; still chaotic but with smaller Lyapunov exponent than a = 1.4 | Henon parameter space; Strogatz Section 12.2 Henon Map |
| a = 1.4, b = 0.3 (canonical) | well-studied benchmark; lambda_1 approximately 0.4203, lambda_2 approximately -1.6237, sum approximately -1.2034; strange attractor is the classic banana shape | Strogatz Section 12.2 Henon Map; many numerical studies confirm these values |
| Small \|b\| regime (b < 0.2) | orbit escapes or becomes unbounded for large initial conditions; boundary of the valid parameter region becomes ill-defined; attractor may fragment into a horseshoe structure | nonlinear dynamics near the edge of chaotic regime |

## Visual fallback

Primary validation is via the two strong invariants (trace conservation and canonical lambda_1). If accumulated numerical error or extreme parameter regimes produce noisy estimates, a visual SSIM > 0.92 against two committed golden frames (one at the canonical (a=1.4, b=0.3) showing the banana attractor, one at (a=1.2, b=0.2) showing a more complex structure) is the secondary gate. Reference frames are stored in playgrounds/lyapunov-spectrum/references/golden-frames/.

## Citations

1. **Strogatz, Steven H.** "Nonlinear Dynamics and Chaos." 2nd ed., Westview/CRC Press, 2015. Bib key strogatz2015. Sections cited:
   - Section 12.1 The Simplest Examples: introduction to 2D maps and fixed points.
   - Section 12.2 Henon Map: definition, the canonical parameter set (a=1.4, b=0.3), and the strange attractor structure.
   - Section 10.5 Liapunov Exponent: definition of Lyapunov exponents for discrete maps; extension to multiple exponents via tangent-space dynamics.

2. **Benettin, G., Galgani, L., Giorgilli, A., and Strelcyn, J.-M.** "Lyapunov Characteristic Exponents for Smooth Dynamical Systems and for Hamiltonian Systems; A Method for Computing All of Them. Part 1: Theory." Meccanica 15, 9-20 (1980), doi:10.1007/BF02128236. Bib key `benettin1980`. The canonical method for computing Lyapunov spectra via continuous re-orthonormalization of tangent vectors. The algorithm description in the Numerical method section follows the modified Gram-Schmidt form; the trace identity $\lambda_1 + \lambda_2 = \ln|\det J|$ is an immediate consequence of the QR decomposition (the diagonal of $R$ has determinant $|r_1 r_2| = |\det(JQ)| = |\det J|$ since Q is orthonormal).

## Stretch goals

- **Parameter heatmap**: replace the simple parameter grid with a 2D heatmap showing lambda_1 (or lambda_1 + lambda_2) as a function of (a, b), with isocontours marking chaotic vs. periodic regions. Requires computing the spectrum at a 50 x 50 or 100 x 100 grid of (a, b) pairs at startup, with fast lookup on drag.
- **Bifurcation tracking**: detect and label period-doubling bifurcations and chaotic boundaries in the (a, b) plane, analogous to the logistic-cobweb bifurcation diagram. This requires period detection (fold counting) in addition to Lyapunov computation.
- **Initial condition sweep**: allow the user to set (x_0, y_0) via a drag handle on the phase-portrait panel, showing how the attractor shape depends on initial conditions (though it should be independent for a true strange attractor, basin structure will vary).
- **High-precision arithmetic toggle**: option to use arbitrary-precision arithmetic (e.g., via a BigDecimal library) to push the burn-in and accumulation counts to 10^6 or 10^7 and test convergence at extreme N.
- **Tangent-vector visualization**: overlay the 2x2 orthonormal frame Q as small arrows or ellipses at selected points on the attractor, showing the local tangent-space geometry and the directions of expansion and contraction.

## Risk register

1. **Boundary of the parameter region with bounded orbits.** The Henon map does not have a simple closed-form boundary; orbits escape to infinity for sufficiently large |a| or sufficiently small |b|. If the user drags into a divergent region, the iteration overflows and the Lyapunov computation becomes undefined. Mitigation: clamp orbit magnitude (|x| < 10, |y| < 10) and mark the region as unbounded with a visual flag (e.g., a red cross or "UNBOUNDED" label). Cease Lyapunov accumulation and freeze the readout at the last valid estimate.

2. **Numerical precision loss near singular Jacobians.** At extreme parameters (e.g., a near 1.0 or b near 0.1), the Jacobian becomes nearly singular and Gram-Schmidt produces ill-conditioned q vectors with very small r values. Accumulated round-off error in the re-orthonormalization can corrupt the exponent estimates. Mitigation: guard against r_i < 1e-15 and skip the corresponding term, decrementing N. Additionally, log a warning if the number of skipped terms exceeds 1 percent of N; this signals a regime where the estimates are unreliable.

3. **Slow convergence at low-expansion parameters.** When lambda_1 is small (close to chaotic-to-periodic bifurcations), the 10^5-iteration accumulation window may be insufficient to distinguish true chaos from long-duration transients or to achieve 2 percent precision. Mitigation: use the trace invariant lambda_1 + lambda_2 = ln|b| as a secondary check; if this sum deviates by more than 1e-10 from the analytic value, report the regime as ill-conditioned and suppress the individual exponent readouts in favor of a "low-confidence" flag. For the canonical (a=1.4, b=0.3), the strong invariant ensures correctness regardless of the individual estimates.
