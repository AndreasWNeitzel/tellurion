# REVIEW - polytrope-lane-emden (pre-computed; maintainer actions later)

## Verdict
CLEAN (DEVNOTES only)

## Defects (severity-ranked)
None identified. Spec has complete physical setup (Lane-Emden equation, polytropic indices, boundary conditions), equations, numerical method (ODE shooting), controls (n selector), expected features (density-shaded sphere, isodensity contours, 1D profile strip), and invariants (theta(0)=1, theta'(xi_1)=0 at surface, radius scales as xi_1/sqrt(Omega)). README is substantive prose. invariants.test.mjs has proper tests. Readout shows xi_1 and mass proxy live. Frames show distinct structures for different n.

## Text / approachability
spec is exemplary. README clearly explains polytropes (pressure P ~ rho^(n+1)/n), Lane-Emden solution, and relevance to stellar models. index.html has user-facing description and KaTeX math. Figures show density-shaded sphere, cutaway, isodensity contours, and 1D profile.

## Source-material & equation fidelity
Lane-Emden equation d^2(theta)/dxi^2 + (2/xi) dtheta/dxi + theta^n = 0 is correct. Boundary conditions (theta(0)=1, dtheta/dxi|_0=0) are standard. Polytropic indices (n=0 uniform, n=1.5 degenerate, n=3 Chandrasekhar limit, n=5 diffuse) have correct physical interpretations. Reference: Hansen & Kawaler Ch. 7 (stellar structure).

## Golden-frame observations
Frames show n=0 (compact uniform), n=1.5 (concentrated core), n=3 (highly concentrated), n=5 (huge diffuse envelope). Density shading, cutaway wedge, and isodensity contours accurately represent the theta(xi) solution mapped to 3D structure. Smooth transitions between frames. No visual defects.

## Hero-candidate
NO. Stellar structure pedagogy, well-executed but not research-novel or visually supreme. Tier: medium engagement.

## Maintainer notes
This playground is exemplary in specification quality and completeness. No actionable issues. Reference model for the batch.
