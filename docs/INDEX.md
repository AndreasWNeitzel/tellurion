# Shipped playgrounds

This file is the public catalog. `/ship` appends a new row after every successful ship. Do not edit by hand except to fix typos.

| date | slug | title | primary citation | invariant | url |
|------|------|-------|------------------|-----------|-----|
| 2026-05-13 | logistic-cobweb | Logistic Map Cobweb and Bifurcation | Strogatz, Nonlinear Dynamics and Chaos, 2e, Ch. 10 | Feigenbaum delta within 0.1 percent at n=5; Lyapunov at r=4 within 1 percent of ln 2 | playgrounds/logistic-cobweb/ |
| 2026-05-13 | double-pendulum | Double Pendulum: Energy and Chaos | Newman, Computational Physics, 2013, Exercise 8.15 | |dE/E| < 1e-3 over 10^4 steps; small-amplitude eigenfrequencies omega_+/- = sqrt(g(2 +/- sqrt(2))) within 1 percent | playgrounds/double-pendulum/ |
| 2026-05-13 | lyapunov-spectrum | Lyapunov Spectrum of the Henon Map | Strogatz, Nonlinear Dynamics and Chaos, 2e, Section 12.2; Benettin et al., Meccanica 15 (1980) | trace identity lambda_1 + lambda_2 = ln\|b\| within 1e-10; lambda_1 within 2 percent of 0.42 at canonical params | playgrounds/lyapunov-spectrum/ |
| 2026-05-13 | liouvillian-flow | Liouvillian Flow on the Pendulum Phase Space | Strogatz, Nonlinear Dynamics and Chaos, 2e, Sections 6.5 and 6.7; engine shared/js/engine/symplectic.js | per-tracer \|dE/E\| < 1e-3 over 10^4 dt; covariance-area conserved to 5 percent over 10^3 dt | playgrounds/liouvillian-flow/ |
| 2026-05-13 | kepler-orbit-explorer | Kepler Orbit Explorer | Newman, Computational Physics, 2013, Exercise 8.12; engine shared/js/engine/symplectic.js | \|dE/E\| < 1e-3 and \|dL/L\| < 1e-10 over 10^3 periods at a=1 e=0.6 | playgrounds/kepler-orbit-explorer/ |
