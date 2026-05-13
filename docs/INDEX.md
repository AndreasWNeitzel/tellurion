# Playgrounds index

Auto-generated from spec.md frontmatter. Do not edit by hand. Run `npm run build:index`.

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

- **[Double Pendulum Phase Portrait and Energy Conservation](../playgrounds/double-pendulum/index.html)** &nbsp; (in-progress)
  A planar double pendulum consists of two rigid massless rods of lengths l1 and l2, joined at a pivot, with point masses m1 and m2 hanging from the free end of each rod. The system is suspended from a fixed support and evolves under gravity in two dimensions (the plane of the page). The state is described by two generalized coordinates: theta1, the angle of t

- **[Liouvillian Flow on the Pendulum Phase Space](../playgrounds/liouvillian-flow/index.html)** &nbsp; (in-progress)
  A 1D pendulum is the simplest non-trivial Hamiltonian system: one degree of freedom, two-dimensional phase space (theta, p). Under Hamiltonian flow, phase-space volumes are preserved (Liouville's theorem), so an initial cloud of tracer particles traces out an evolving region whose area is invariant in time. The playground integrates N independent tracers und

- **[Logistic Map Cobweb and Bifurcation Diagram](../playgrounds/logistic-cobweb/index.html)** &nbsp; (in-progress)
  The playground visualizes the iterated logistic map on x in [0, 1] with parameter r in (0, 4]. The map is the archetypal discrete-time dynamical system exhibiting period-doubling bifurcations, the Feigenbaum cascade, and chaos. Two panels display complementary views: a cobweb diagram traces iterates from an initial condition x_0 via the graphical constructio

- **[Lyapunov Spectrum via Benettin QR](../playgrounds/lyapunov-spectrum/index.html)** &nbsp; (in-progress)
  The playground visualizes the full spectrum of Lyapunov exponents for the canonical Henon map, a 2D quadratic recurrence that is the archetypal discrete-time chaotic system. The map exhibits a strange attractor with complex mixing and sensitive dependence on initial conditions. Two panels display complementary views: the left panel shows the scatter of attra

- **[Three-Body Figure-Eight Choreography](../playgrounds/three-body-orbit/index.html)** &nbsp; (in-progress)
  Three equal masses $m_1 = m_2 = m_3 = 1$ interact under Newtonian gravity in 2D with $G = 1$. At the Chenciner-Montgomery initial condition (2000) the three masses chase one another on a single closed figure-eight curve, with period $T \approx 6.3259$. This is the most famous "choreography" solution of the planar three-body problem. The playground integrates
