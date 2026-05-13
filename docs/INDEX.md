# Playgrounds index

Auto-generated from spec.md frontmatter. Do not edit by hand. Run `npm run build:index`.

- **[Arnold Cat Map](../playgrounds/arnold-cat-map/index.html)** &nbsp; (draft, verified 2026-05-13T12:57:00Z)
  Arnold's cat map on the unit torus: x' = (2x + y) mod 1, y' = (x + y) mod 1. The map is area-preserving and uniformly hyperbolic, with eigenvalues (3 +/- sqrt 5) / 2 giving maximum Lyapunov exponent log((3 + sqrt 5) / 2) = 0.9624. On an N x N pixel grid the dynamics is finite and exactly periodic: for N = 64 the period is 48 iterations. Start with a recogniz

- **[Attention as Soft Retrieval](../playgrounds/attention-as-soft-retrieval/index.html)** &nbsp; (draft, verified 2026-05-13T12:54:00Z)
  Single-head scaled dot-product attention over a small key-value bank: w_i = softmax(Q . k_i / sqrt(d) / tau), output = sum w_i v_i. The left panel shows six keys in 2D; the query (red) can be dragged. The right panel shows the value bars colored by attention weight; the cat-3 bar is the weighted output. As temperature tau drops, attention concentrates on the

- **[Harmonic Oscillator Coherent State](../playgrounds/harmonic-oscillator-coherent-state/index.html)** &nbsp; (draft, verified 2026-05-13T12:50:00Z)
  A coherent state |alpha> of the 1D quantum harmonic oscillator. The probability density |psi(x, t)|^2 is a Gaussian of fixed width 1/sqrt(2) whose mean follows the classical orbit x_0(t) = sqrt(2) Re(alpha e^{-i omega t}). Adjust alpha to set the orbit amplitude; press play to watch the wave packet oscillate without spreading (the defining property of a cohe

- **[Bloch Sphere Qubit Gates](../playgrounds/bloch-sphere-qubit-gates/index.html)** &nbsp; (draft, verified 2026-05-13T12:46:00Z)
  A single qubit on the Bloch sphere. Apply standard gates (X, Y, Z, H, S, T) or continuous rotations (R_x, R_y, R_z by the slider angle). The red arrow is the live state vector; the blue trail shows the recent path; the readout reports the live (theta, phi) angles, the Bloch components (r_x, r_y, r_z), the norm (should equal 1), the unitarity of the most rece

- **[Bayesian Coin Update](../playgrounds/bayesian-coin-update/index.html)** &nbsp; (draft, verified 2026-05-13T12:43:00Z)
  Conjugate Beta-Binomial inference for the bias theta of an unfair coin. Prior Beta(alpha0, beta0); k heads in n flips; posterior Beta(alpha0 + k, beta0 + n - k). The plot overlays prior, normalized likelihood, and posterior, with a shaded 95 percent credible interval around the posterior mean.

- **[Tunneling Rectangular Barrier](../playgrounds/tunneling-rectangular-barrier/index.html)** &nbsp; (draft, verified 2026-05-13T12:38:00Z)
  A 1D Schrodinger particle of energy E incident on a rectangular barrier of height V_0 and width a. The transmission coefficient T(E) is closed-form: for E < V_0 it decays exponentially as the wave evanesces inside the barrier; for E > V_0 it oscillates with perfect resonances at E = V_0 + n^2 pi^2 / (2 a^2). The dashed classical step function (T = 0 below V_

- **[Henon Strange Attractor](../playgrounds/henon-strange-attractor/index.html)** &nbsp; (draft, verified 2026-05-13T12:34:00Z)
  The Henon 1976 map x' = 1 - a x^2 + y, y' = b x. At the canonical (a=1.4, b=0.3) the iterates settle onto a strange attractor with maximum Lyapunov exponent ~ 0.4192 and box-counting dimension ~ 1.26. Tune a and b to walk through the period-doubling cascade and the Henon-Smale horseshoe regime.

- **[Lorenz Attractor](../playgrounds/lorenz-attractor/index.html)** &nbsp; (in-progress, verified 2026-05-13T11:36:00Z)
  The Lorenz 1963 system: a three-variable truncation of the Saltzman convection equations, written

- **[MCMC Sampler Comparator](../playgrounds/mcmc-comparator/index.html)** &nbsp; (in-progress, verified 2026-05-13T10:53:00Z)
  A 2D target density rendered as a contour map, with three Markov-chain Monte Carlo samplers running in parallel and laying down their accepted-state traces on the same plot. The user picks the target from a small bank (Gaussian, banana, Gaussian mixture, Neal's funnel) and the sampler triplet from {random-walk Metropolis, adaptive RWM, MALA, HMC}. A live rea

- **[Kepler Orbit Explorer](../playgrounds/kepler-orbit-explorer/index.html)** &nbsp; (in-progress, verified 2026-05-13T09:22:00Z)
  A test particle orbits a fixed central mass under inverse-square gravity in 2D. The system is the Newtonian Kepler problem in geometric units $GM = 1$ with the central mass at the origin and the test particle at $(x, y)$. The orbit is integrated by the velocity-Verlet branch of `shared/js/engine/symplectic.js`, which conserves total energy and angular moment

- **[Mandelbrot Rainbow Explorer](../playgrounds/mandelbrot-explorer/index.html)** &nbsp; (in-progress, verified 2026-05-13T09:01:30Z)
  The Mandelbrot set $\mathcal{M} \subset \mathbb{C}$ is

- **[Rotation Curve Explorer](../playgrounds/rotation-curve-explorer/index.html)** &nbsp; (in-progress, verified 2026-05-13T08:43:00Z)
  A face-on synthetic spiral galaxy with a Hernquist bulge ($M_b = 10^{10} M_\odot$, $a_b = 0.5$ kpc) and a Miyamoto-Nagai disk ($M_d = 6 \times 10^{10} M_\odot$, $a_d = 4$ kpc, $b_d = 0.3$ kpc), seen from above. The same visible mass is present in all three models; what changes is the assumption about unseen mass.

- **[Schwarzschild Light Bending](../playgrounds/schwarzschild-geodesics/index.html)** &nbsp; (in-progress, verified 2026-05-13T08:35:00Z)
  A horizontal plane wave of photons enters from the left and encounters a non-rotating black hole of mass $M = 1$ in the equatorial plane. Geometric units $G = c = M = 1$. Each photon is a null geodesic with two conserved quantities (Killing vectors of the Schwarzschild metric): energy $E$ and angular momentum $L$. The orbital fate is determined entirely by t

- **[1D TDSE Scattering Comparator](../playgrounds/1d-tdse-scattering-comparator/index.html)** &nbsp; (draft)
  This file is a placeholder. The `playground-architect` subagent fills it in after `/scaffold` runs. Do not edit by hand.

- **[Advection Scheme Shootout](../playgrounds/advection-scheme-shootout/index.html)** &nbsp; (draft)
  This file is a placeholder. The `playground-architect` subagent fills it in after `/scaffold` runs. Do not edit by hand.

- **[Airy Pattern Circular Aperture](../playgrounds/airy-pattern-circular-aperture/index.html)** &nbsp; (draft)
  This file is a placeholder. The `playground-architect` subagent fills it in after `/scaffold` runs. Do not edit by hand.

- **[Backprop Tiny Net](../playgrounds/backprop-tiny-net/index.html)** &nbsp; (draft)
  This file is a placeholder. The `playground-architect` subagent fills it in after `/scaffold` runs. Do not edit by hand.

- **[Billiards: Circle, Stadium, Sinai](../playgrounds/billiards-circle-stadium-sinai/index.html)** &nbsp; (draft)
  This file is a placeholder. The `playground-architect` subagent fills it in after `/scaffold` runs. Do not edit by hand.

- **[Double Pendulum Phase Portrait and Energy Conservation](../playgrounds/double-pendulum/index.html)** &nbsp; (in-progress)
  A planar double pendulum consists of two rigid massless rods of lengths l1 and l2, joined at a pivot, with point masses m1 and m2 hanging from the free end of each rod. The system is suspended from a fixed support and evolves under gravity in two dimensions (the plane of the page). The state is described by two generalized coordinates: theta1, the angle of t

- **[Duffing Oscillator](../playgrounds/duffing-oscillator/index.html)** &nbsp; (draft)
  This file is a placeholder. The `playground-architect` subagent fills it in after `/scaffold` runs. Do not edit by hand.

- **[EM on GMM 2D](../playgrounds/em-on-gmm-2d/index.html)** &nbsp; (draft)
  This file is a placeholder. The `playground-architect` subagent fills it in after `/scaffold` runs. Do not edit by hand.

- **[Frustrated Triangular Antiferromagnet](../playgrounds/frustrated-triangular-af/index.html)** &nbsp; (draft)
  This file is a placeholder. The `playground-architect` subagent fills it in after `/scaffold` runs. Do not edit by hand.

- **[Gaussian Beam Paraxial](../playgrounds/gaussian-beam-paraxial/index.html)** &nbsp; (draft)
  This file is a placeholder. The `playground-architect` subagent fills it in after `/scaffold` runs. Do not edit by hand.

- **[GP Kernel Zoo](../playgrounds/gp-kernel-zoo/index.html)** &nbsp; (draft)
  This file is a placeholder. The `playground-architect` subagent fills it in after `/scaffold` runs. Do not edit by hand.

- **[Hydrogen Orbital Cross Sections 2D](../playgrounds/hydrogen-orbital-cross-sections-2d/index.html)** &nbsp; (draft)
  This file is a placeholder. The `playground-architect` subagent fills it in after `/scaffold` runs. Do not edit by hand.

- **[Ising Triangular](../playgrounds/ising-triangular/index.html)** &nbsp; (draft)
  This file is a placeholder. The `playground-architect` subagent fills it in after `/scaffold` runs. Do not edit by hand.

- **[KL Divergence Asymmetry](../playgrounds/kl-divergence-asymmetry/index.html)** &nbsp; (draft)
  This file is a placeholder. The `playground-architect` subagent fills it in after `/scaffold` runs. Do not edit by hand.

- **[Kronig-Penney Bands](../playgrounds/kronig-penney-bands/index.html)** &nbsp; (draft)
  This file is a placeholder. The `playground-architect` subagent fills it in after `/scaffold` runs. Do not edit by hand.

- **[Lagrange Points (CR3BP)](../playgrounds/lagrange-points-cr3bp/index.html)** &nbsp; (draft)
  This file is a placeholder. The `playground-architect` subagent fills it in after `/scaffold` runs. Do not edit by hand.

- **[Liouvillian Flow on the Pendulum Phase Space](../playgrounds/liouvillian-flow/index.html)** &nbsp; (in-progress)
  A 1D pendulum is the simplest non-trivial Hamiltonian system: one degree of freedom, two-dimensional phase space (theta, p). Under Hamiltonian flow, phase-space volumes are preserved (Liouville's theorem), so an initial cloud of tracer particles traces out an evolving region whose area is invariant in time. The playground integrates N independent tracers und

- **[Logistic Map Cobweb and Bifurcation Diagram](../playgrounds/logistic-cobweb/index.html)** &nbsp; (in-progress)
  The playground visualizes the iterated logistic map on x in [0, 1] with parameter r in (0, 4]. The map is the archetypal discrete-time dynamical system exhibiting period-doubling bifurcations, the Feigenbaum cascade, and chaos. Two panels display complementary views: a cobweb diagram traces iterates from an initial condition x_0 via the graphical constructio

- **[Lyapunov Spectrum via Benettin QR](../playgrounds/lyapunov-spectrum/index.html)** &nbsp; (in-progress)
  The playground visualizes the full spectrum of Lyapunov exponents for the canonical Henon map, a 2D quadratic recurrence that is the archetypal discrete-time chaotic system. The map exhibits a strange attractor with complex mixing and sensitive dependence on initial conditions. Two panels display complementary views: the left panel shows the scatter of attra

- **[MaxEnt Distribution Zoo](../playgrounds/maxent-distribution-zoo/index.html)** &nbsp; (draft)
  This file is a placeholder. The `playground-architect` subagent fills it in after `/scaffold` runs. Do not edit by hand.

- **[Mean-Field VI on the Banana](../playgrounds/mean-field-vi-on-banana/index.html)** &nbsp; (draft)
  This file is a placeholder. The `playground-architect` subagent fills it in after `/scaffold` runs. Do not edit by hand.

- **[Mercury Precession (1PN)](../playgrounds/mercury-precession-pn/index.html)** &nbsp; (draft)
  This file is a placeholder. The `playground-architect` subagent fills it in after `/scaffold` runs. Do not edit by hand.

- **[Mutual Information 2D](../playgrounds/mutual-information-2d/index.html)** &nbsp; (draft)
  This file is a placeholder. The `playground-architect` subagent fills it in after `/scaffold` runs. Do not edit by hand.

- **[Particle in a Well Zoo](../playgrounds/particle-in-a-well-zoo/index.html)** &nbsp; (draft)
  This file is a placeholder. The `playground-architect` subagent fills it in after `/scaffold` runs. Do not edit by hand.

- **[Particle-Mesh 2D Disk](../playgrounds/particle-mesh-2d-disk/index.html)** &nbsp; (draft)
  This file is a placeholder. The `playground-architect` subagent fills it in after `/scaffold` runs. Do not edit by hand.

- **[Percolation 2D](../playgrounds/percolation-2d/index.html)** &nbsp; (draft)
  This file is a placeholder. The `playground-architect` subagent fills it in after `/scaffold` runs. Do not edit by hand.

- **[Potts q-State Transition](../playgrounds/potts-q-state-transition/index.html)** &nbsp; (draft)
  This file is a placeholder. The `playground-architect` subagent fills it in after `/scaffold` runs. Do not edit by hand.

- **[Relativistic Beaming Azimuth](../playgrounds/relativistic-beaming-azimuth/index.html)** &nbsp; (draft)
  This file is a placeholder. The `playground-architect` subagent fills it in after `/scaffold` runs. Do not edit by hand.

- **[Roche Tidal Disruption](../playgrounds/roche-tidal-disruption/index.html)** &nbsp; (draft)
  This file is a placeholder. The `playground-architect` subagent fills it in after `/scaffold` runs. Do not edit by hand.

- **[Rossler Funnel](../playgrounds/rossler-funnel/index.html)** &nbsp; (draft)
  This file is a placeholder. The `playground-architect` subagent fills it in after `/scaffold` runs. Do not edit by hand.

- **[SPH Sod Shock Tube](../playgrounds/sph-sod-shock-tube/index.html)** &nbsp; (draft)
  This file is a placeholder. The `playground-architect` subagent fills it in after `/scaffold` runs. Do not edit by hand.

- **[Standard Map and KAM](../playgrounds/standard-map-kam/index.html)** &nbsp; (draft)
  This file is a placeholder. The `playground-architect` subagent fills it in after `/scaffold` runs. Do not edit by hand.

- **[t-SNE vs UMAP vs Isomap](../playgrounds/tsne-vs-umap-vs-isomap/index.html)** &nbsp; (draft)
  This file is a placeholder. The `playground-architect` subagent fills it in after `/scaffold` runs. Do not edit by hand.

- **[Three-Body Figure-Eight Choreography](../playgrounds/three-body-orbit/index.html)** &nbsp; (in-progress)
  Three equal masses $m_1 = m_2 = m_3 = 1$ interact under Newtonian gravity in 2D with $G = 1$. At the Chenciner-Montgomery initial condition (2000) the three masses chase one another on a single closed figure-eight curve, with period $T \approx 6.3259$. This is the most famous "choreography" solution of the planar three-body problem. The playground integrates

- **[Two-Stream PIC Plasma](../playgrounds/two-stream-pic-plasma/index.html)** &nbsp; (draft)
  This file is a placeholder. The `playground-architect` subagent fills it in after `/scaffold` runs. Do not edit by hand.

- **[WKB vs Shooting](../playgrounds/wkb-vs-shooting/index.html)** &nbsp; (draft)
  This file is a placeholder. The `playground-architect` subagent fills it in after `/scaffold` runs. Do not edit by hand.

- **[XY Model and BKT Transition](../playgrounds/xy-model-bkt/index.html)** &nbsp; (draft)
  This file is a placeholder. The `playground-architect` subagent fills it in after `/scaffold` runs. Do not edit by hand.
