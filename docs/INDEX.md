# Playgrounds index

Auto-generated from spec.md frontmatter. Do not edit by hand. Run `npm run build:index`.

- **[Cyclotron Motion in a Uniform Magnetic Field](../playgrounds/cyclotron-uniform-b/index.html)** &nbsp; (verified, verified 2026-05-13T18:28:30Z)
  A charged particle (q = m = 1) in a uniform, out-of-page magnetic field B = B z-hat. Initial state: (x, y) = (0, 0), (vx, vy) = (0, v).

- **[Electric Field Lines from Point Charges](../playgrounds/electric-field-lines-charges/index.html)** &nbsp; (verified, verified 2026-05-13T18:24:10Z)
  A small set of point charges in the plane. The electric field is E(r) = sum_i q_i (r - r_i) / |r - r_i|^3 (units chosen so that the Coulomb constant is 1).

- **[Standing Waves on a String](../playgrounds/standing-waves-string-modes/index.html)** &nbsp; (verified, verified 2026-05-13T18:20:30Z)
  A uniform string of length L is fixed at both ends. The normal modes of small transverse oscillation are y_n(x, t) = sin(n pi x / L) cos(2 pi f_n t),  f_n = n c / (2 L).

- **[Catenary: Shape of a Hanging Chain](../playgrounds/catenary-hanging-chain/index.html)** &nbsp; (verified, verified 2026-05-13T18:15:10Z)
  A perfectly flexible, uniform chain hangs under gravity between two pegs at (plus minus 1, 0). The hanging shape is the catenary y(x) = a cosh(x / a) - a

- **[Brachistochrone: Why the Cycloid Wins](../playgrounds/brachistochrone-cycloid/index.html)** &nbsp; (verified, verified 2026-05-13T18:11:40Z)
  Three frictionless beads of equal mass slide from A = (0, 0) to B = (4, -2) under uniform gravity g = 9.81. The paths are: - Cycloid: x = R (theta - sin theta), y = -R (1 - cos theta), with R fixed by the endpoint. - Straight line. - Circular arc through A, tangent to the horizontal at A, passing through B.

- **[Doppler Effect from a Moving Source](../playgrounds/doppler-effect/index.html)** &nbsp; (verified, verified 2026-05-13T18:06:30Z)
  A point source moves with constant velocity v in the +x direction. In its own rest frame it emits a sinusoidal signal of frequency f, so it emits a discrete wavefront every period T = 1 / f. Each wavefront propagates isotropically at speed c. A stationary observer detects compressed wavefronts in front of the source and stretched ones behind it.

- **[Lissajous Figures](../playgrounds/lissajous-figures/index.html)** &nbsp; (verified, verified 2026-05-13T18:03:00Z)
  A point traces out the parametric curve x(t) = A sin(a t + delta) y(t) = B sin(b t) on a 2D plane. The shape depends only on the frequency ratio a / b and the phase delta. Such curves arise whenever two perpendicular harmonic oscillations are observed simultaneously, as in oscilloscope traces or optical interference of two-mode beams.

- **[Beats from Superposition of Close Frequencies](../playgrounds/beats-superposition/index.html)** &nbsp; (verified, verified 2026-05-13T17:59:50Z)
  Two harmonic signals of nearby frequencies, summed: y(t) = cos(2 pi f_1 t) + cos(2 pi f_2 t)

- **[Coupled Springs and Normal Modes](../playgrounds/coupled-springs-normal-modes/index.html)** &nbsp; (verified, verified 2026-05-13T17:56:30Z)
  Two equal masses on a frictionless track, connected by three identical springs to two fixed walls: wall - (k) - m - (k) - m - (k) - wall. This is the textbook small-oscillation system; everything follows from diagonalizing the 2 x 2 stiffness matrix.

- **[SPH 1D Sod Shock Tube](../playgrounds/sph-sod-shock-tube/index.html)** &nbsp; (verified, verified 2026-05-13T17:47:53Z)
  The Sod shock tube is the canonical compressible-fluid benchmark. A membrane at x = 0.5 separates two states of an ideal gas with gamma = 1.4:

- **[Particle-Mesh Self-Gravitating 2D Disk](../playgrounds/particle-mesh-2d-disk/index.html)** &nbsp; (verified, verified 2026-05-13T17:40:41Z)
  A flat 2D disc of 1500 self-gravitating particles in an exponential surface-density profile. Gravity solved via particle-mesh on a 32 x 32 periodic grid using cloud-in-cell (CIC) deposit and interpolation.

- **[Two-Stream Instability (1D PIC)](../playgrounds/two-stream-pic-plasma/index.html)** &nbsp; (verified, verified 2026-05-13T17:35:12Z)
  Two counter-streaming electron beams at +/- v_0 against a uniform neutralizing ion background. Small density perturbations grow exponentially at the linear rate omega_p / (2 sqrt 2). The beams eventually form phase-space vortices and saturate.

- **[Mean-Field VI on a Banana](../playgrounds/mean-field-vi-on-banana/index.html)** &nbsp; (verified, verified 2026-05-13T17:30:41Z)
  Fit a mean-field Gaussian q(x, y) = N(mu_x, sigma_x^2) * N(mu_y, sigma_y^2) to a Rosenbrock-style banana target. The banana is a long curved valley; the mean-field Gaussian is axis-aligned; this gap is the canonical failure mode of variational inference.

- **[GP Kernel Zoo](../playgrounds/gp-kernel-zoo/index.html)** &nbsp; (verified, verified 2026-05-13T17:25:58Z)
  A 1D Gaussian Process: a probability distribution over functions. Five kernels (RBF, Matern 3/2, Matern 5/2, periodic, linear) parameterized by length scale and amplitude. Top panel: prior samples (no data). Bottom panel: posterior conditioned on observations with noise sigma_n.

- **[Backprop on a Tiny MLP](../playgrounds/backprop-tiny-net/index.html)** &nbsp; (verified, verified 2026-05-13T17:21:43Z)
  A small fully-connected neural network with 2 input units, H tanh hidden units, and a single sigmoid output unit. Trained by full-batch gradient descent on the binary cross-entropy loss for a 2D binary classification problem (moons, XOR, or spiral).

- **[Advection Scheme Shootout](../playgrounds/advection-scheme-shootout/index.html)** &nbsp; (verified, verified 2026-05-13T17:17:52Z)
  1D linear advection u_t + c u_x = 0 on a periodic domain [0, 1] with a square pulse initial condition. Four numerical schemes solve the same problem side-by-side; the dashed green line is the analytic solution (pure translation of the pulse).

- **[WKB Bohr-Sommerfeld vs Exact](../playgrounds/wkb-vs-shooting/index.html)** &nbsp; (verified, verified 2026-05-13T17:14:14Z)
  Bound-state energies for a 1D particle in a power-law well V(x) = |x|^p / p, hbar = m = 1. Compare the Bohr-Sommerfeld (WKB) approximation to the "exact" reference levels for the harmonic oscillator (p = 2; closed form E_n = n + 1/2) and quartic anharmonic oscillator (p = 4; Bender-Wu 1969 numerical levels).

- **[1D TDSE Wavepacket Scattering](../playgrounds/1d-tdse-scattering-comparator/index.html)** &nbsp; (verified, verified 2026-05-13T17:07:26Z)
  A 1D Gaussian wavepacket initially at x_0 = -15 with momentum k_0 moves to the right and scatters off a potential (rectangular barrier, step, or square well). Computed with Crank-Nicolson on a uniform grid; norm-preserving by construction.

- **[Billiards - Circle, Stadium, Sinai](../playgrounds/billiards-circle-stadium-sinai/index.html)** &nbsp; (verified, verified 2026-05-13T17:02:26Z)
  A free particle of unit speed bouncing elastically off the walls of a 2D shape. Three classical geometries: circle (integrable), Bunimovich stadium (chaotic), Sinai billiard (chaotic with convex scatterer). Used to study quantum-classical correspondence and the onset of chaos under purely geometric constraints.

- **[2D Site Percolation](../playgrounds/percolation-2d/index.html)** &nbsp; (verified, verified 2026-05-13T16:07:02Z)
  Each site of an L x L square lattice is independently occupied with probability p (the "site occupation probability"). We label all connected clusters of occupied sites (4-neighbor connectivity) and highlight the largest cluster. As p crosses the critical value p_c = 0.59274621, a giant spanning cluster appears (Newman-Ziff 2000).

- **[2D XY Model and the BKT Vortex Transition](../playgrounds/xy-model-bkt/index.html)** &nbsp; (verified, verified 2026-05-13T16:07:02Z)
  Classical XY model: each site of an L x L periodic square lattice holds a continuous angle theta in [0, 2 pi). Bond energy -J cos(theta_i - theta_j); J = 1. The 2D XY model has no spontaneous symmetry breaking at finite T (Mermin-Wagner), but it does have a finite-temperature Berezinskii-Kosterlitz-Thouless (BKT) transition at T_BKT ~ 0.893 J (Hasenbusch 200

- **[Airy Diffraction Pattern from a Circular Aperture](../playgrounds/airy-pattern-circular-aperture/index.html)** &nbsp; (verified, verified 2026-05-13T16:07:02Z)
  The Fraunhofer far-field intensity from a uniformly illuminated circular aperture of radius a. This is the classical resolution-limiting pattern for any optical instrument with a round pupil: telescopes, microscopes, eyes.

- **[Chirikov Standard Map - KAM Tori](../playgrounds/standard-map-kam/index.html)** &nbsp; (verified, verified 2026-05-13T16:07:02Z)
  The standard map is the discrete-time area-preserving map p_{n+1} = p_n + K sin(theta_n) (mod 2 pi) theta_{n+1} = theta_n + p_{n+1} (mod 2 pi) on the torus (theta, p) in [0, 2 pi)^2. It is the Poincare section of a periodically kicked rotator. At K = 0 the dynamics is integrable; at finite K the KAM theorem guarantees that sufficiently irrational tori surviv

- **[Driven Damped Duffing Oscillator](../playgrounds/duffing-oscillator/index.html)** &nbsp; (verified, verified 2026-05-13T16:07:02Z)
  A particle in a symmetric double-well potential V(x) = -x^2/2 + x^4/4, subject to linear damping and a periodic external drive. The Duffing equation is the textbook system that exhibits a complete period-doubling cascade to chaos under a single control parameter (the drive amplitude gamma). It is also one of the cleanest examples for visualizing a Poincare s

- **[EM on a 2D Gaussian Mixture](../playgrounds/em-on-gmm-2d/index.html)** &nbsp; (verified, verified 2026-05-13T16:07:02Z)
  A 2D scatter of N = 600 points drawn from a 3-component Gaussian mixture with known means, covariances, and mixing weights. The EM algorithm tries to recover those parameters using only the data, alternating soft cluster assignment (E-step) and parameter refit (M-step).

- **[Frustrated Triangular Antiferromagnet](../playgrounds/frustrated-triangular-af/index.html)** &nbsp; (verified, verified 2026-05-13T16:07:02Z)
  Antiferromagnetic Ising spins on a 2D triangular lattice with periodic boundaries. Each spin prefers to be opposite to its 6 neighbors. Geometric frustration: on every 3-spin plaquette, you cannot satisfy all three anti-alignments at once. Wannier 1950 showed there is no finite-T phase transition; the T = 0 ground state has extensive residual entropy.

- **[Hydrogen Orbital Cross Sections in the (x, z) Plane](../playgrounds/hydrogen-orbital-cross-sections-2d/index.html)** &nbsp; (verified, verified 2026-05-13T16:07:02Z)
  The bound stationary states of the hydrogen atom, parameterized by three quantum numbers (n, l, m). Probability density |psi_nlm|^2 plotted in the plane through the nucleus that contains the z axis (i.e., y = 0). This is the standard textbook visualization for orbital shapes.

- **[KL Divergence Asymmetry (Mass-Covering vs Mode-Seeking)](../playgrounds/kl-divergence-asymmetry/index.html)** &nbsp; (verified, verified 2026-05-13T16:07:02Z)
  Two probability densities on a 1D axis. Target P is a bimodal mixture of two Gaussians at +/- sep; approximation Q is a single Gaussian with controllable (mu_q, sigma_q). The playground computes the two directions of KL divergence and shows how their argmins differ qualitatively.

- **[Kronig-Penney Band Structure](../playgrounds/kronig-penney-bands/index.html)** &nbsp; (verified, verified 2026-05-13T16:07:02Z)
  A 1D crystal with delta-function spikes on a periodic lattice (period a, dimensionless strength P). The energy spectrum splits into allowed bands and forbidden gaps. The simplest textbook model in solid-state physics that produces a band structure.

- **[Lagrange Points of the Circular Restricted Three-Body Problem](../playgrounds/lagrange-points-cr3bp/index.html)** &nbsp; (verified, verified 2026-05-13T16:07:02Z)
  Two heavy bodies of mass m1 and m2 orbit their common center of mass in a circular orbit. A test particle (mass negligible) moves under their combined gravity, computed in the rotating frame where the two primaries stand still. Non-dimensional units: total mass = 1, separation = 1, angular velocity = 1.

- **[Maximum-Entropy Distributions Zoo](../playgrounds/maxent-distribution-zoo/index.html)** &nbsp; (verified, verified 2026-05-13T16:07:02Z)
  A 1D probability density on a continuous support. The maximum-entropy principle (Jaynes 1957) selects the density that maximizes differential entropy h(p) = -integral p ln p dx subject to fixed moments (or other linear functionals of p). The result depends entirely on the choice of constraints; this playground enumerates four canonical cases.

- **[Mutual Information of a Bivariate Gaussian](../playgrounds/mutual-information-2d/index.html)** &nbsp; (verified, verified 2026-05-13T16:07:02Z)
  A static, exact, no-integration example: two correlated Gaussian random variables (X, Y) with covariance Sigma. The joint density p(x, y) is rendered as a heatmap; the marginals p(x) and p(y) are drawn above and beside it. Mutual information I(X; Y) is the area you can carve out of the joint by knowing the marginals; for a Gaussian it admits a closed form -0

- **[Paraxial Gaussian Beam (TEM_00)](../playgrounds/gaussian-beam-paraxial/index.html)** &nbsp; (verified, verified 2026-05-13T16:07:02Z)
  The fundamental TEM_00 mode of a laser cavity, modeled in the paraxial (slowly varying envelope) limit. The beam is narrowest at z = 0 with 1/e^2 intensity radius w_0; it expands hyperbolically along z as it propagates.

- **[Particle in a Well - A Quantum Zoo](../playgrounds/particle-in-a-well-zoo/index.html)** &nbsp; (verified, verified 2026-05-13T16:07:02Z)
  Three canonical 1D quantum bound-state problems plotted on the same axes for comparison: infinite square well, finite square well, and harmonic oscillator. In each, V(x) is fixed and we solve the time-independent Schrodinger equation for energy eigenstates.

- **[Perihelion Precession in a Schwarzschild Effective Potential](../playgrounds/mercury-precession-pn/index.html)** &nbsp; (verified, verified 2026-05-13T16:07:02Z)
  In pure Newtonian gravity, Bertrand's theorem says that the only closed bound orbits in central potentials are those of V(r) ~ 1/r and V(r) ~ r^2. Any departure from these forms causes the orbit to fail to close: the perihelion moves around with each revolution. The 1PN correction in the orbit-averaged Schwarzschild metric introduces an effective extra 1/r^3

- **[q-state Potts Model on a 2D Square Lattice](../playgrounds/potts-q-state-transition/index.html)** &nbsp; (verified, verified 2026-05-13T16:07:02Z)
  Each site of an L x L periodic square lattice holds a discrete spin s in {0, 1, ..., q - 1}. Energy: E = -J sum_{<i, j>} delta(s_i, s_j) with J = 1.

- **[Relativistic Beaming Pattern](../playgrounds/relativistic-beaming-azimuth/index.html)** &nbsp; (verified, verified 2026-05-13T16:07:02Z)
  A monochromatic source that emits isotropically in its rest frame. When the source moves at relativistic speed, the lab-frame emission is concentrated into a forward cone of half-angle ~ 1/gamma. The textbook beaming effect; it explains blazar variability and the brightness of AGN jets pointed near our line of sight.

- **[Rossler Funnel Attractor](../playgrounds/rossler-funnel/index.html)** &nbsp; (verified, verified 2026-05-13T16:07:02Z)
  Otto Rossler's 1976 minimal continuous-time chaotic system. Three coupled first-order ODEs in (x, y, z) with one quadratic nonlinearity (z times x). Compared to Lorenz, the geometry is simpler: a near-planar spiral on the (x, y) plane with a single fold that lifts trajectories in z and drops them back near the origin. As the control parameter c increases, th

- **[Tidal Disruption Near a Massive Primary](../playgrounds/roche-tidal-disruption/index.html)** &nbsp; (verified, verified 2026-05-13T16:07:02Z)
  A cloud of 80 self-gravitating test particles ("a fluid satellite") on an eccentric orbit around a heavy point-mass primary. When the orbit takes the cloud inside the Roche radius, the tidal force from the primary overwhelms the satellite's self-gravity and stretches it into a stream. Outside the Roche radius the cloud holds together.

- **[t-SNE vs UMAP vs Isomap](../playgrounds/tsne-vs-umap-vs-isomap/index.html)** &nbsp; (draft, verified 2026-05-13T13:50:00Z)
  A 3D dataset shown alongside three 2D embeddings of it. The Swiss roll is the classic "is your DR method nonlinear?" test: PCA squashes it because PCA only knows linear projections, Isomap unrolls it because it measures distances along the manifold, t-SNE clusters local neighborhoods but loses the global ordering. The two-blob dataset is easier and all three

- **[Ising Triangular](../playgrounds/ising-triangular/index.html)** &nbsp; (draft, verified 2026-05-13T13:45:00Z)
  A grid of tiny magnets on a triangular lattice. Each one points up or down; neighbors prefer to agree (lower energy). Lower the temperature to watch them align into one giant domain; raise it to watch them flicker randomly. Right at the critical temperature $T_c = 4/\ln(3) \approx 3.641$ (Wannier 1950) the system is on the knife edge between order and disord

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

- **[Damped Driven Oscillator](../playgrounds/damped-driven-oscillator/index.html)** &nbsp; (draft)
  This file is a placeholder. The `playground-architect` subagent fills it in after `/scaffold` runs. Do not edit by hand.

- **[Double Pendulum Phase Portrait and Energy Conservation](../playgrounds/double-pendulum/index.html)** &nbsp; (in-progress)
  A planar double pendulum consists of two rigid massless rods of lengths l1 and l2, joined at a pivot, with point masses m1 and m2 hanging from the free end of each rod. The system is suspended from a fixed support and evolves under gravity in two dimensions (the plane of the page). The state is described by two generalized coordinates: theta1, the angle of t

- **[Exb Drift Cycloid](../playgrounds/exb-drift-cycloid/index.html)** &nbsp; (draft)
  This file is a placeholder. The `playground-architect` subagent fills it in after `/scaffold` runs. Do not edit by hand.

- **[Liouvillian Flow on the Pendulum Phase Space](../playgrounds/liouvillian-flow/index.html)** &nbsp; (in-progress)
  A 1D pendulum is the simplest non-trivial Hamiltonian system: one degree of freedom, two-dimensional phase space (theta, p). Under Hamiltonian flow, phase-space volumes are preserved (Liouville's theorem), so an initial cloud of tracer particles traces out an evolving region whose area is invariant in time. The playground integrates N independent tracers und

- **[Logistic Map Cobweb and Bifurcation Diagram](../playgrounds/logistic-cobweb/index.html)** &nbsp; (in-progress)
  The playground visualizes the iterated logistic map on x in [0, 1] with parameter r in (0, 4]. The map is the archetypal discrete-time dynamical system exhibiting period-doubling bifurcations, the Feigenbaum cascade, and chaos. Two panels display complementary views: a cobweb diagram traces iterates from an initial condition x_0 via the graphical constructio

- **[Lyapunov Spectrum via Benettin QR](../playgrounds/lyapunov-spectrum/index.html)** &nbsp; (in-progress)
  The playground visualizes the full spectrum of Lyapunov exponents for the canonical Henon map, a 2D quadratic recurrence that is the archetypal discrete-time chaotic system. The map exhibits a strange attractor with complex mixing and sensitive dependence on initial conditions. Two panels display complementary views: the left panel shows the scatter of attra

- **[Tautochrone Isochronism](../playgrounds/tautochrone-isochronism/index.html)** &nbsp; (draft)
  This file is a placeholder. The `playground-architect` subagent fills it in after `/scaffold` runs. Do not edit by hand.

- **[Three-Body Figure-Eight Choreography](../playgrounds/three-body-orbit/index.html)** &nbsp; (in-progress)
  Three equal masses $m_1 = m_2 = m_3 = 1$ interact under Newtonian gravity in 2D with $G = 1$. At the Chenciner-Montgomery initial condition (2000) the three masses chase one another on a single closed figure-eight curve, with period $T \approx 6.3259$. This is the most famous "choreography" solution of the planar three-body problem. The playground integrates
