# Portfolio gap analysis: missing playgrounds

Goal: a curriculum-complete set of hero-quality playgrounds spanning the
Physics and Engineering Physics degree (FCUP, U. Porto) plus the MSc
astrophysics / data-methods track. This document inventories what exists,
identifies the gaps, and proposes concrete new playgrounds to fill them. Every
proposed playground is built to the same hero bar as the current revamps
(Layout v2, faithful physics, a live invariant readout, a quantitative
diagnostic panel, real what-to-try, verified at both folds).

References for the curriculum structure: FCUP Licenciatura em Física
(sigarra.up.pt/fcup, curso 888) and Licenciatura em Engenharia Física
(curso 23141). The sigarra syllabus pages are behind an access wall, so the
per-course scope below is mapped to the standard topic set for each named
course; refine against the official ficha where it differs.

## Inventory (count per semester)

| Semester | Courses (code -> scope) | Playgrounds |
|---|---|---|
| bsc-y1s1 | CC1017 computing, FIS1013 classical mechanics, M1017 real analysis, M1038 linear algebra | 36 |
| bsc-y1s2 | FIS1014 electromagnetism I, M1015 multivariable calculus | 13 |
| bsc-y2s1 | AST2004 intro astrophysics, FIS2002 waves in media, FIS2013 electrodynamics/plasma, FIS2014 statistical mechanics, FIS2016 waves/optics, M2037 vector calculus | 42 |
| bsc-y2s2 | FIS2003 modern physics, FIS2006 EM waves/optics, FIS2017 quantum intro, FIS2018 numerical methods, FIS2021 nonlinear dynamics | 36 |
| bsc-y3s1 | AST3014 astrophysical fluids/plasma, AST3015 computational astro, FIS3003 quantum mechanics, FIS3008 statistical/computational, FIS3019 optics, M3012 math methods | 34 |
| bsc-y3s2 | AST3016 radiative processes, AST3017 GR/cosmology, FIS3005/3020 condensed matter, FIS3025 fluids, FIS3028 special relativity, FIS3029 advanced QM, FIS3030 nuclear/particle, FIS4026 devices, FIS4035 photonics, M3007 differential geometry, MEF materials | 57 |
| msc-y1 | MAA astrophysics + data methods, MF master physics, MFM medical physics | 67 |

The distribution is badly uneven. bsc-y1s2 (13) is the clear outlier: less
than a third of its peers. Within the thin semesters the imbalance is even
sharper at the course level (below).

## Priority 1: bsc-y1s2 (13 -> target ~36)

This is the worst-covered semester. Two courses, both under-served.

### FIS1014 Electromagnetism I (11 existing, strong on electro/magnetostatics)

Covered: Coulomb equilibrium, field lines, Gauss flux, method of images,
multipole expansion, 2D Laplace solver, RC discharge, Biot-Savart, B-H
hysteresis, Poynting wave, Brewster angle. The whole second half of a first
EM course (induction, circuits, the assembly of Maxwell's equations) is absent.

Proposed (priority order):

1. `FIS1014-faraday-induction-moving-bar` -- Faraday's law and Lenz's law: a
   bar sliding on rails through B, the induced EMF and current, the retarding
   force. Diagnostic: EMF(t) and flux(t). (Major gap, highly visual.)
2. `FIS1014-rlc-resonance-phasors` -- driven series RLC: amplitude and phase
   vs drive frequency, the resonance peak, phasor diagram. Diagnostic: the
   resonance curve with Q. (Major gap.)
3. `FIS1014-ampere-law-solenoid-toroid` -- B field from Ampere's law for a
   wire, solenoid, and toroid; the field map and the enclosed-current loop.
4. `FIS1014-magnetic-force-current-loop` -- force and torque on a current loop
   in B (the electric-motor principle); the loop rotates, torque vs angle.
5. `FIS1014-eddy-current-braking` -- a conductor falling through / past a
   magnet, eddy currents, magnetic braking; terminal velocity diagnostic.
6. `FIS1014-inductance-lr-transient` -- LR circuit switch-on/off, the
   exponential current rise, energy stored in the field.
7. `FIS1014-displacement-current-maxwell` -- the displacement current in a
   charging capacitor and how it completes Ampere's law into Maxwell's set.
8. `FIS1014-capacitor-dielectric-energy` -- parallel-plate capacitance,
   inserting a dielectric, energy and energy-density; complements the existing
   RC discharge with the capacitance concept.
9. `FIS1014-hall-effect-carriers` -- the Hall voltage, carrier sign and
   density from the transverse field.
10. `FIS1014-electric-dipole-in-field` -- torque, oscillation, and orientation
    energy of a dipole in a uniform field.

### M1015 Multivariable Calculus (2 existing -- the single thinnest course)

Covered: line integral vs path, Fubini multiple integral. Almost the entire
course (differential calculus of several variables, the integral theorems) is
absent.

Proposed (priority order):

1. `M1015-gradient-directional-derivative` -- a scalar field with its gradient
   arrows, level sets, and the directional derivative as you sweep a direction.
2. `M1015-lagrange-multipliers` -- constrained optimisation: a level-set
   tangency search, the multiplier as the tangency condition.
3. `M1015-change-of-variables-jacobian` -- a region transformed by a map, the
   Jacobian as the local area-scaling factor, and the integral that uses it.
4. `M1015-critical-points-hessian` -- a surface with its critical points,
   classified by the Hessian (min, max, saddle) with the second-derivative
   test live.
5. `M1015-tangent-plane-linearization` -- the tangent plane and linear
   approximation of a surface, with the approximation error map.
6. `M1015-green-theorem-circulation-flux` -- Green's theorem: the boundary
   line integral versus the area integral of curl / divergence.
7. `M1015-divergence-theorem-gauss` -- flux through a closed surface versus the
   volume integral of divergence (the math companion to FIS1014 Gauss).
8. `M1015-surface-integral-flux` -- parametrised surfaces and the flux integral.
9. `M1015-conservative-field-potential` -- testing a field for conservativeness
   (curl = 0), reconstructing the potential, path independence.
10. `M1015-integration-curvilinear-coordinates` -- the same integral in
    Cartesian, polar, cylindrical, spherical coordinates and the volume element.

Building Priority-1 brings bsc-y1s2 from 13 to about 33, in line with its peers.

## Priority 2: thin courses inside well-populated semesters

### M1017 Real analysis (bsc-y1s1, only 3: Cauchy, epsilon-delta, series)

Proposed: `M1017-riemann-sum-to-integral` (the Riemann sum converging to the
integral), `M1017-taylor-remainder-approximation` (Taylor polynomials and the
remainder bound), `M1017-intermediate-value-bisection` (IVT made constructive),
`M1017-uniform-vs-pointwise-convergence` (the function-sequence pathology).

### M1038 Linear algebra (bsc-y1s1, only 3: eigenvector, Gram-Schmidt, SVD)

Proposed: `M1038-determinant-as-volume` (the determinant as signed area/volume
scaling), `M1038-linear-transformation-zoo` (how 2D maps deform the plane),
`M1038-least-squares-projection` (projection onto a subspace, the normal
equations), `M1038-change-of-basis` (the same vector/operator in two bases),
`M1038-matrix-exponential-flows` (exp(At) as a linear flow, ties to ODE systems).

### FIS2003 Modern physics + FIS2017 Quantum intro (bsc-y2s2, 3 + 2)

Proposed: `FIS2003-rutherford-scattering` (the alpha-scattering cross section
and the nuclear atom), `FIS2003-blackbody-planck-vs-rayleigh` (the ultraviolet
catastrophe resolved), `FIS2003-franck-hertz-quantized-levels`,
`FIS2003-stern-gerlach-spin-split`, `FIS2017-double-slit-which-path` (quantum
interference and complementarity), `FIS2017-square-well-bound-states`,
`FIS2017-tunneling-step-barrier-intro`.

### M3012 Math methods (bsc-y3s1, only 4)

Proposed: `M3012-bessel-drumhead-modes`, `M3012-legendre-multipole-on-sphere`,
`M3012-residue-contour-integration`, `M3012-conformal-map-visualizer`.

## Priority 3: enrichment in well-covered semesters

Lower priority (these semesters already hit 34-67). Candidate fills only where
a marquee topic is missing: bsc-y1s1 `FIS1013-rocket-variable-mass` and
`FIS1013-rolling-without-slipping`; bsc-y2s1 `FIS2013-poynting-momentum-pressure`;
bsc-y3s1 `AST3014-magnetic-reconnection-toy`; Engineering-Physics applied track
`FIS4026-photodiode-vs-led-band`, `MEF-thin-film-deposition-stress`.

## Method for building each new playground

Same hero pipeline used in the current sweep:
1. Scaffold from `playgrounds/_template`, place under the right semester folder.
2. Headless `sim.js` first (faithful physics, shared engine where one fits;
   `shared/js/engine/` already has symplectic, cn-tridiag, polytrope, etc.),
   with `invariants.test.mjs` covering the conservation laws and analytic limits.
3. `playground.js` on Layout v2 (`setupCanvas` + `stack`), a scene region plus
   at least one quantitative diagnostic panel, a live invariant readout, real
   what-to-try, share-state keys.
4. `spec.md` with the equations, numerical scheme, citations, controls,
   expected features, invariants; `index.html` from the canonical template.
5. Verify at both folds (1920x1080 and 390x844) by rendering, then commit.

Each playground is one heartbeat fire. The Priority-1 list (bsc-y1s2) is the
queue to drain first; tasks are filed for the top entries.
