# Lorenz Attractor

The Lorenz 1963 strange attractor, the canonical pictorial signature of deterministic chaos. Three coupled ODEs render a two-lobed butterfly in (x, z); a live tangent-vector estimator computes the running maximum Lyapunov exponent (analytic value 0.9056 at the classical sigma=10, rho=28, beta=8/3).

Tune sigma, rho, beta to walk through the parameter space. At rho < 1 the origin is a global attractor; for 1 < rho < 24.74 the system relaxes onto one of two nontrivial fixed points; above rho ~ 24.74 the strange attractor emerges. Adjust the speed slider to slow the integration when you want to watch the trajectory cross between wings.

Controls: four parameter sliders, pause/play, reset.

## Reference

Primary citations: Strogatz, "Nonlinear Dynamics and Chaos", 2nd ed., 2015, Sections 9.1 through 9.5; Ott, "Chaos in Dynamical Systems", 2nd ed., 2002, Section 3.2. Tangent-vector method from Benettin et al. 1980. All bib keys carry chapter_index entries with the cited subsections.

## Verification

- Strong invariants: max-Lyapunov exponent in [0.7, 1.05] over 10^4 tangent-rescale cycles; trajectory boundedness within radius 100 over 50 time units; rho < 1 contracts onto the origin; 1 < rho < rho_H lands on a fixed point; bit-identical reproducibility at fixed dt.
- Engine: shared/js/engine/ode-rk.js (classical RK4 fixed step). Engine tests cover linear-equation accuracy, 4th-order convergence, and a Lorenz max-Lyapunov sanity check.
- Visual gate: SSIM > 0.92 across all 5 frames spanning t = 0 to t = 75 dimensionless time units.
- Last verified: see `.verified`.
