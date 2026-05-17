# Playgrounds index

Auto-generated from spec.md frontmatter. Do not edit by hand. Run `npm run build:index`.

- **[Single-Particle Motion: Drifts in E and B](../playgrounds/bsc-y3s1/AST3014-single-particle-em-drift-3d/index.html)** &nbsp; (verified, verified 2026-05-17T23:25:23Z)
  One non-relativistic charged particle (charge `q`, mass `m`) moving under the Lorentz force in prescribed static `E` and `B` fields. In a uniform `B` the motion is a helix: circular gyration at the cyclotron frequency superposed on free streaming along `B`. Adding a force or a field gradient makes the guiding centre drift across `B`: a uniform `E` perpendicu

- **[2D Point-Vortex Dynamics](../playgrounds/bsc-y3s2/FIS3025-vortex-dynamics-2d/index.html)** &nbsp; (verified, verified 2026-05-17T23:15:10Z)
  `N` ideal point vortices in an unbounded 2D inviscid fluid. Vortex `a` has a fixed circulation `Gamma_a` and position `r_a(t)`. Each vortex is passively advected by the velocity field induced by all the others (a vortex does not advect itself). The induced velocity at a point `p` is the 2D Biot-Savart sum. The resulting motion is Hamiltonian: for `N <= 3` it

- **[Bernoulli and the Venturi Effect](../playgrounds/bsc-y3s2/FIS3025-bernoulli-venturi-interactive/index.html)** &nbsp; (verified, verified 2026-05-17T23:06:06Z)
  Steady, incompressible, inviscid flow along a horizontal pipe whose cross-sectional area `A(x)` varies (a smooth constriction, the Venturi). Two conservation laws fix everything. Mass conservation (continuity): the volumetric flow rate `Q = A(x) v(x)` is the same at every station, so the fluid speeds up where the pipe narrows. Bernoulli's theorem along a str

- **[Rayleigh-Benard Convection: Onset of Instability](../playgrounds/bsc-y3s2/FIS3025-rayleigh-benard-convection/index.html)** &nbsp; (verified, verified 2026-05-17T22:55:43Z)
  A fluid layer of depth `d` heated from below (hot plate `T = 1` at the bottom) and cooled from above (cold plate `T = 0` at the top). Buoyancy drives motion; viscosity and thermal diffusion damp it. The competition is the Rayleigh number `Ra = g alpha Delta T d^3 / (nu kappa)`. Below a critical `Ra_c` the layer is motionless and heat crosses by conduction; a

- **[Incompressible Wake and the Projection Method](../playgrounds/bsc-y3s2/FIS3025-navier-stokes-2d-gpu-fullscreen/index.html)** &nbsp; (verified, verified 2026-05-17T22:20:36Z)
  A 2D incompressible flow (120 x 76 live grid, normalized channel) past a bluff obstacle. A uniform stream enters at the left, free-slip walls top and bottom, zero-gradient outflow on the right, no-slip on the obstacle. The Reynolds number `Re = U D / nu` (reference speed `U = 1`, obstacle size `D = 1`, so `nu = 1/Re`) is user-tunable. The live path runs the 

- **[Fabry-Perot Etalon Spectrometer](../playgrounds/bsc-y3s1/FIS3019-fabry-perot-spectrometer/index.html)** &nbsp; (verified, verified 2026-05-17T13:22:44Z)
  Two plane mirrors of reflectance `R`, spacing `d`, illuminated by the sodium doublet. Normal incidence, `n = 1`.

- **[Gaussian Beam - ABCD Propagation](../playgrounds/bsc-y3s1/FIS3019-laser-gaussian-beam-propagation/index.html)** &nbsp; (verified, verified 2026-05-17T13:15:03Z)
  A Gaussian beam launched from a waist `w0` propagates along an optical bench and passes through a thin lens of focal length `f` at an adjustable position.

- **[1D Ising Renormalization-Group Flow](../playgrounds/bsc-y3s1/FIS3008-renormalization-group-flow-1d/index.html)** &nbsp; (verified, verified 2026-05-17T13:05:02Z)
  The 1D Ising chain `H = -J sum s_i s_{i+1} - H sum s_i`, reduced couplings `K = beta J`, `h = beta H`. Coarse-grain by summing out every other spin (decimation, rescale factor `b = 2`).

- **[Canonical Transformations](../playgrounds/bsc-y2s2/FIS2021-canonical-transformation-visual/index.html)** &nbsp; (verified, verified 2026-05-17T12:59:05Z)
  A phase blob (the harmonic energy ellipse plus an interior lattice) mapped by a chosen transformation; energy `E` sets the blob size, a parameter drives the map.

- **[The 4f Fourier-Optics Processor](../playgrounds/bsc-y3s1/FIS3019-fourier-optics-4f-system/index.html)** &nbsp; (verified, verified 2026-05-17T12:52:42Z)
  An object transmittance `t(x,y)` (grating, circular aperture, double slit, checker) in the front focal plane of lens 1. Its Fourier transform appears in the common focal plane, where a mask is placed; lens 2 inverse-transforms to the image plane.

- **[Lennard-Jones Molecular Dynamics](../playgrounds/bsc-y3s1/FIS3008-md-lennard-jones-thermodynamics/index.html)** &nbsp; (verified, verified 2026-05-17T12:47:22Z)
  `N = 300` particles in a periodic `L x L` box (`rho = N/L^2`), pairwise `U(r) = 4[(1/r)^12 - (1/r)^6]`, cutoff `rc = 2.5` with the shifted-force construction so `F` and `U` vanish continuously at `rc`.

- **[Action-Angle Variables](../playgrounds/bsc-y2s2/FIS2021-hamilton-jacobi-action-angle/index.html)** &nbsp; (verified, verified 2026-05-17T12:41:03Z)
  A 1-DOF bound system: harmonic `V = 1/2 w0^2 q^2`, pendulum `w0^2 (1 - cos q)`, or quartic `1/4 w0^2 q^4`, at energy `E`.

- **[Quantum Gas Statistics Visualizer](../playgrounds/bsc-y3s1/FIS3008-quantum-gas-statistics-visualizer/index.html)** &nbsp; (verified, verified 2026-05-17T12:30:44Z)
  A non-interacting gas of N indistinguishable particles in a 3D box, density of states `g(eps) = C sqrt(eps)`. Temperature `tau = kT` is the control; the chemical potential `mu(tau)` is whatever keeps the particle number fixed.

- **[Jones Calculus - Polarization Through Elements](../playgrounds/bsc-y3s1/FIS3019-polarization-jones-calculus/index.html)** &nbsp; (verified, verified 2026-05-17T12:23:29Z)
  A monochromatic Jones vector `(Ex, Ey)` passes through up to two optical elements (polarizer, quarter-wave plate, half-wave plate) each at a chosen axis angle.

- **[Spin on the Bloch Sphere](../playgrounds/bsc-y3s1/FIS3003-spin-bloch-sphere-dynamics/index.html)** &nbsp; (verified, verified 2026-05-17T12:15:45Z)
  A two-level system (spin-1/2, qubit) in a static magnetic field `B0 z-hat` and a circularly polarized transverse RF field of amplitude `B1` rotating at `w_rf`. The pure state is the unit Bloch vector `S = (sin th cos ph, sin th sin ph, cos th)`, with the north pole `|0>` and the south pole `|1>`.

- **[The p-n Junction](../playgrounds/bsc-y3s2/FIS3005-semiconductor-pn-junction/index.html)** &nbsp; (verified, verified 2026-05-17T12:09:42Z)
  A step junction with acceptor density `NA` (p side) and donor density `ND` (n side), applied bias `V` (forward positive), in silicon at 300 K.

- **[Crystal Structure Explorer](../playgrounds/bsc-y3s2/FIS3005-crystal-structure-3d-explorer/index.html)** &nbsp; (verified, verified 2026-05-17T12:01:10Z)
  Cubic crystals of conventional side `a`: SC (1 atom/cell), BCC (2, body centre), FCC (4, face centres), with a selectable Miller plane and an optional supercell.

- **[Tight-Binding Band Structure](../playgrounds/bsc-y3s2/FIS3005-band-structure-tight-binding/index.html)** &nbsp; (verified, verified 2026-05-17T11:50:22Z)
  A single s-band: 1D chain (uniform t), the dimerized SSH chain (alternating t1, t2), or the 2D square lattice. Units a = hbar = 1.

- **[Lagrangian Sandbox](../playgrounds/bsc-y2s2/FIS2021-lagrangian-field-sandbox/index.html)** &nbsp; (verified, verified 2026-05-17T11:46:21Z)
  One of: simple pendulum `[th, thd]`; double pendulum `[t1, t2, w1, w2]`; elastic pendulum `[r, th, rd, thd]`; planar Kepler `[x, y, vx, vy]`. Parameters: gravity `g`, initial amplitude.

- **[2D Waves in a Drawable Geometry](../playgrounds/bsc-y2s1/FIS2002-wave-2d-complex-geometry/index.html)** &nbsp; (verified, verified 2026-05-17T11:33:26Z)
  A vibrating membrane (or shallow water) in a 2D box with rigid obstacles. A monochromatic point source on the left radiates toward a wall with slits or an obstacle; the far side shows diffraction and interference. The domain edges are an absorbing sponge so the pattern is not contaminated by box reflections.

- **[Fourier Epicycle Drawing](../playgrounds/bsc-y3s1/M3012-fourier-epicycle-drawing/index.html)** &nbsp; (verified, verified 2026-05-17T11:33:26Z)
  A chain of rotating circles (epicycles) traces a target shape. Each circle rotates at a harmonic frequency with radius equal to the DFT coefficient magnitude; the tip of the last arm draws the curve. Sliding the epicycle count from 1 to N/2 visibly improves the fit; the RMS error vs the original path shrinks monotonically.

- **[Slow-Roll Inflation: Ball on the Potential](../playgrounds/msc-y1/MAA-CO-slow-roll-inflation/index.html)** &nbsp; (verified, verified 2026-05-17T11:33:26Z)
  A golden ball rolls down an inflaton potential V(phi) under Hubble friction. Slow-roll parameters epsilon(phi) and eta(phi) computed live; n_s and r plotted on a Planck-style n_s-r plane.

- **[The Meissner Effect](../playgrounds/bsc-y3s2/FIS3005-superconductivity-meissner-3d/index.html)** &nbsp; (verified, verified 2026-05-17T11:33:26Z)
  A superconducting sphere of radius R in a uniform applied field B0, at reduced temperature T/Tc, type I or II, zero-temperature critical field Bc0.

- **[KAM Theory - The Standard Map](../playgrounds/bsc-y2s2/FIS2021-kam-theory-poincare-section/index.html)** &nbsp; (verified, verified 2026-05-17T11:21:55Z)
  The standard map on the (theta, p) torus, stochasticity parameter `K`, seeded from a grid of orbits plus the golden-mean torus.

- **[The 2D Ising Phase Transition](../playgrounds/bsc-y3s1/FIS3008-ising-2d-gpu-phase-transition/index.html)** &nbsp; (verified, verified 2026-05-17T08:28:50Z)
  An L x L periodic square lattice of spins `s_i = +-1`, energy `H = -J sum_<ij> s_i s_j` (J = 1, zero field). The control is the temperature `T = kT/J`.

- **[Schwarzschild-Kerr Black Hole 3D (Hero)](../playgrounds/_heroes/schwarzschild-kerr-blackhole-3d/index.html)** &nbsp; (verified, verified 2026-05-14T04:06:29Z)
  Schematic of event horizon + photon sphere + ergosphere + ISCO with disk emission (Planck blackbody mapped from $T(r) \propto r^{-3/4}$). Full per-pixel null geodesic ray-march in Kerr is queued for WebGL2. Source: Shapiro-Teukolsky Ch. 12 (`shapiro-teukolsky`).

- **[Earth Axial Precession + Nutation 3D (Hero)](../playgrounds/_heroes/earth-axial-precession-nutation-3d/index.html)** &nbsp; (verified, verified 2026-05-14T03:56:05Z)
  Lunisolar precession 50.29 arcsec/yr; 18.6-yr nutation with amplitudes 17.2"/9.2" in Δψ/Δε. Source: Smart, Celestial Mechanics.

- **[Tokamak Plasma Confinement 3D (Hero)](../playgrounds/_heroes/tokamak-plasma-confinement-3d/index.html)** &nbsp; (verified, verified 2026-05-14T03:54:59Z)
  Torus with helical field lines; safety factor $q_a$ from ITER-like parameters. Source: Goedbloed-Poedts Ch. 5 (`goedbloed-plasma`).

- **[Hydrogen Orbitals 3D (Hero)](../playgrounds/_heroes/hydrogen-orbitals-3d/index.html)** &nbsp; (verified, verified 2026-05-14T03:48:06Z)
  WebGL2 volume ray-march of $|\psi_{n,\ell,m}|^2$ on a $40^3$ R16F 3D texture, with an isosurface mode that shades the level set via central-difference gradient normals and Blinn-Phong. Associated Laguerre and Legendre polynomials evaluated on the CPU mirror at `shared/js/engine/hydrogen-orbital-cpu.js`, then uploaded to the GL engine at `shared/js/engine-gl/

- **[Wave Heightfield (Clickable Hero)](../playgrounds/_heroes/wave-heightfield-clickable-3d/index.html)** &nbsp; (verified, verified 2026-05-14T03:38:47Z)
  2D wave equation $\partial_t^2 u = c^2 \nabla^2 u - \gamma \partial_t u$ on a 96x96 grid with Dirichlet boundaries. Click seeds Gaussian impulses. Source: French Waves Ch. 6 (`french-waves`).

- **[Lorenz Attractor Ensemble (Hero)](../playgrounds/_heroes/lorenz-attractor-3d-ensemble/index.html)** &nbsp; (verified, verified 2026-05-14T03:35:10Z)
  $1024$ trajectories integrated in a fragment shader (RK4, $dt = 0.005$, $\sigma = 10$, $\beta = 8/3$, $\rho$ slider-controlled) starting from a $10^{-3}$ ball around $(1, 1, 1)$. Each frame the WebGL2 engine at `shared/js/engine-gl/lorenz-ensemble.js` advances every particle one RK4 step, then splats its image-space position into an HDR accumulator with geom

- **[Secular Perturbations (Laplace-Lagrange)](../playgrounds/msc-y1/MAA-SS-secular-perturbation-laplace-lagrange/index.html)** &nbsp; (verified, verified 2026-05-14T02:28:54Z)
  Two-planet eccentricity exchange via mode beating. Source: Murray-Dermott Ch. 7 (`murray-dermott`).

- **[Mean-Motion Resonance and Kirkwood Gaps](../playgrounds/msc-y1/MAA-SS-resonance-mean-motion-toy/index.html)** &nbsp; (verified, verified 2026-05-14T02:27:49Z)
  Kirkwood gaps in the asteroid belt at 2:1, 3:1, 5:2, 7:3 with Jupiter. Source: Murray-Dermott Ch. 8 (`murray-dermott`).

- **[Voigt Profile Decomposition](../playgrounds/msc-y1/MAA-SP-voigt-profile-decomposition/index.html)** &nbsp; (verified, verified 2026-05-14T02:26:45Z)
  Gaussian core × Lorentzian wings. Source: Mihalas Stellar Atmospheres Ch. 9 (`mihalas-atm`).

- **[Mixing-Length Convection](../playgrounds/msc-y1/MAA-SA-convection-mixing-length/index.html)** &nbsp; (verified, verified 2026-05-14T02:25:38Z)
  Schwarzschild criterion + MLT parameter $\alpha = l_m / H_P$. Source: Hansen-Kawaler Ch. 5 (`hansen-kawaler`).

- **[Nuclear Burning Rates vs Temperature](../playgrounds/msc-y1/MAA-SA-nuclear-burning-rate-temperature/index.html)** &nbsp; (verified, verified 2026-05-14T02:24:38Z)
  pp $\propto T^4$, CNO $\propto T^{18}$, 3-α $\propto T^{40}$. Source: Hansen-Kawaler Ch. 6 (`hansen-kawaler`).

- **[Main-Sequence Mass-Luminosity Relation](../playgrounds/msc-y1/MAA-SA-main-sequence-mass-luminosity/index.html)** &nbsp; (verified, verified 2026-05-14T02:23:37Z)
  Piecewise power laws spanning M-dwarfs to O-stars. Source: Carroll-Ostlie Ch. 7 (`carroll-ostlie`).

- **[Atmospheric Speckle Statistics](../playgrounds/msc-y1/MAA-OT-speckle-pattern-statistics/index.html)** &nbsp; (verified, verified 2026-05-14T02:22:38Z)
  $N \sim (D/r_0)^2$ speckles per realization. Source: Roddier (`hardy-ao`); Goodman (`goodman-speckle`).

- **[PSF and Strehl Ratio](../playgrounds/msc-y1/MAA-OT-point-spread-function-strehl/index.html)** &nbsp; (verified, verified 2026-05-14T02:21:34Z)
  Airy PSF + Maréchal $S = e^{-(2\pi\sigma)^2}$. Source: Born-Wolf Ch. 8 (`born-wolf`).

- **[Pulsar Wind Nebula Magnetization](../playgrounds/msc-y1/MAA-HE-pulsar-wind-nebula-magnetization/index.html)** &nbsp; (verified, verified 2026-05-14T02:20:24Z)
  Crab-like nebula: termination shock + magnetization. Source: Kennel-Coroniti 1984; Rybicki-Lightman Ch. 6 (`rybickilightman1979`).

- **[Spiral Density-Wave Dispersion](../playgrounds/msc-y1/MAA-GD-spiral-density-wave-dispersion/index.html)** &nbsp; (verified, verified 2026-05-14T02:19:12Z)
  $\nu^2(k)$ for tightly-wound spiral waves; Toomre $Q$ boundary. Source: Binney-Tremaine Ch. 6 (`binney-tremaine`).

- **[Orbits in an Axisymmetric Potential](../playgrounds/msc-y1/MAA-GD-orbits-in-axisymmetric-potential/index.html)** &nbsp; (verified, verified 2026-05-14T02:18:05Z)
  Miyamoto-Nagai potential; generic orbits are rosettes. Source: Binney-Tremaine Ch. 3 (`binney-tremaine`).

- **[Jeans Isothermal Sphere](../playgrounds/msc-y1/MAA-GD-jeans-isothermal-sphere/index.html)** &nbsp; (verified, verified 2026-05-14T02:16:58Z)
  $\rho \propto r^{-2}$ gives a flat rotation curve $v_c = \sqrt 2 \sigma$. Source: Binney-Tremaine Ch. 4 (`binney-tremaine`).

- **[Chandrasekhar Dynamical Friction](../playgrounds/msc-y1/MAA-GD-dynamical-friction-chandrasekhar/index.html)** &nbsp; (verified, verified 2026-05-14T02:16:00Z)
  Friction on a massive perturber in a Maxwellian background; peaks near $v \sim \sigma$. Source: Binney-Tremaine Ch. 8 (`binney-tremaine`).

- **[Linear Perturbation Growth in LCDM](../playgrounds/msc-y1/MAA-CS-linear-perturbation-growth/index.html)** &nbsp; (verified, verified 2026-05-14T02:14:54Z)
  $\delta \propto a$ in matter era; Lambda saturates growth. Source: Liddle Ch. 12 (`liddle-cosmology`).

- **[CMB Power Spectrum (Toy)](../playgrounds/msc-y1/MAA-CS-cmb-power-spectrum-toy/index.html)** &nbsp; (verified, verified 2026-05-14T02:13:43Z)
  Three free parameters: first-peak position, damping scale, amplitude. Source: Liddle Ch. 12 (`liddle-cosmology`).

- **[Baryon Acoustic Oscillation (Toy)](../playgrounds/msc-y1/MAA-CS-baryon-acoustic-oscillation-toy/index.html)** &nbsp; (verified, verified 2026-05-14T02:12:40Z)
  Sound wave + baryon shell freeze at $r_s \approx 150$ Mpc. Source: Liddle Ch. 11 (`liddle-cosmology`).

- **[Rotational Splitting of Multiplets](../playgrounds/msc-y1/MAA-AS-rotational-splitting-multiplets/index.html)** &nbsp; (verified, verified 2026-05-14T02:11:32Z)
  Rigid rotation splits a $(2\ell+1)$-fold multiplet by $m(1-C)\Omega$. Source: Aerts et al. Ch. 3.8 (`aerts-asteroseism`).

- **[p- and g-Mode Cavities (Propagation Diagram)](../playgrounds/msc-y1/MAA-AS-p-g-mode-cavities/index.html)** &nbsp; (verified, verified 2026-05-14T02:10:29Z)
  A stellar oscillation of angular frequency $\omega$ and degree $\ell$ propagates only where it is above the Lamb frequency $S_\ell$ and the buoyancy frequency $N$ is on the appropriate side: the acoustic (p) cavity requires $\omega > \max(N, S_\ell)$, the gravity (g) cavity requires $\omega < \min(N, S_\ell)$. A low-$\omega$ mode is trapped in the radiative 

- **[Mode Trapping in Evolved Stars](../playgrounds/msc-y1/MAA-AS-mode-trapping-evolved-stars/index.html)** &nbsp; (verified, verified 2026-05-14T02:09:19Z)
  Periodic ΔP modulation from a buoyancy-frequency glitch. Source: Mosser et al. 2018 (`mosser2018-trap`); Aerts et al. Ch. 3 (`aerts-asteroseism`).

- **[Asymptotic Period Spacing in Red Giants](../playgrounds/msc-y1/MAA-AS-asymptotic-period-spacing/index.html)** &nbsp; (verified, verified 2026-05-14T02:08:00Z)
  $\Pi_1$ distinguishes RGB (~80 s) from RC (~250 s). Source: Aerts et al. Ch. 3 (`aerts-asteroseism`).

- **[Geodesic Deviation on a Sphere](../playgrounds/bsc-y3s2/M3007-geodesic-deviation-equation/index.html)** &nbsp; (verified, verified 2026-05-14T02:06:44Z)
  Two parallel-starting geodesics on a sphere converge at the pole. Source: Carroll Spacetime and Geometry Ch. 3 (`carroll-spacetime`).

- **[Gaussian Curvature of 2D Surfaces](../playgrounds/bsc-y3s2/M3007-curvature-tensor-2d-surfaces/index.html)** &nbsp; (verified, verified 2026-05-14T02:05:33Z)
  Sphere, cylinder, hyperbolic plane, and torus. Source: Riley-Hobson Ch. 26 (`riley-hobson`).

- **[Toy Parton Distribution Functions](../playgrounds/bsc-y3s2/FIS3030-parton-distribution-toy/index.html)** &nbsp; (verified, verified 2026-05-14T02:04:29Z)
  $x f(x)$ for $u_v$, $d_v$, gluon, sea quarks. Source: Griffiths-Particles Ch. 9 (`griffiths-particles`).

- **[Beta Decay - Fermi vs Gamow-Teller](../playgrounds/bsc-y3s2/FIS3030-nuclear-beta-decay-fermi-vs-gt/index.html)** &nbsp; (verified, verified 2026-05-14T02:03:19Z)
  Selection rules and Kurie plot. Source: Krane Nuclear Physics Ch. 9 (`krane-nuclear`).

- **[CKM Mixing Unitarity Triangle](../playgrounds/bsc-y3s2/FIS3030-ckm-mixing-unitarity-triangle/index.html)** &nbsp; (verified, verified 2026-05-14T02:02:09Z)
  Wolfenstein parameterization; triangle area is Jarlskog (CP violation). Source: Griffiths-Particles Ch. 10 (`griffiths-particles`).

- **[Alpha Decay via Gamow Tunneling](../playgrounds/bsc-y3s2/FIS3030-alpha-decay-gamow-tunneling/index.html)** &nbsp; (verified, verified 2026-05-14T02:00:47Z)
  A preformed alpha particle is bound in the nuclear well and must tunnel the Coulomb barrier $V(r) = 1.44 Z'/r$ (MeV, fm) to escape with energy $Q$. The semiclassical penetration factor gives $\log_{10} T_{1/2} = a + b\,Z/\sqrt{Q}$, the Geiger-Nuttall law (textbook $a = -46.83$, $b = 1.61$ with $Z$ the daughter charge and $Q$ in MeV). Source: Krane Nuclear Ph

- **[Zeeman to Paschen-Back Crossover](../playgrounds/bsc-y3s2/FIS3029-zeeman-paschen-back-crossover/index.html)** &nbsp; (verified, verified 2026-05-14T01:59:30Z)
  Low-$B$ Zeeman: $g_J m_J \mu_B B$. High-$B$ Paschen-Back: $(m_L + 2m_S) \mu_B B$. Source: Griffiths QM Ch. 6.4 (`griffiths-qm`).

- **[Hydrogen Fine Structure](../playgrounds/bsc-y3s2/FIS3029-fine-structure-hydrogen/index.html)** &nbsp; (verified, verified 2026-05-14T01:58:13Z)
  Bohr levels split by $\alpha^2$ corrections; degeneracy is $j$-labeled. Source: Griffiths QM Ch. 6 (`griffiths-qm`).

- **[Aharonov-Bohm Effect](../playgrounds/bsc-y3s2/FIS3029-aharonov-bohm-flux-line/index.html)** &nbsp; (verified, verified 2026-05-14T01:56:27Z)
  Solenoid behind a double slit shifts the fringe pattern by $\Phi/\Phi_0$ cycles. Source: Sakurai Ch. 2 (`sakurai-qm`).

- **[Addition of Two Angular Momenta](../playgrounds/bsc-y3s2/FIS3029-addition-of-angular-momenta/index.html)** &nbsp; (verified, verified 2026-05-14T01:55:19Z)
  $j_1 \otimes j_2 = |j_1-j_2| \oplus \dots \oplus j_1+j_2$. Source: Sakurai QM Ch. 3 (`sakurai-qm`).

- **[Thomas Precession](../playgrounds/bsc-y3s2/FIS3028-thomas-precession/index.html)** &nbsp; (verified, verified 2026-05-14T01:54:11Z)
  A gyroscope on a circular orbit picks up $(\gamma - 1)$ rad of extra rotation per revolution. Source: Jackson 3e Ch. 11.8 (`jackson3e`).

- **[Relativistic Collisions and Mandelstam s](../playgrounds/bsc-y3s2/FIS3028-relativistic-collision-mandelstam/index.html)** &nbsp; (verified, verified 2026-05-14T01:53:08Z)
  $\sqrt s \propto \sqrt{E_{lab}}$ for fixed targets, but $\propto E_{lab}$ for symmetric colliders. Source: Griffiths Particles Ch. 3 (`griffiths-particles`).

- **[Cooper Pair Binding Energy](../playgrounds/bsc-y3s2/FIS3020-cooper-pair-binding-energy/index.html)** &nbsp; (verified, verified 2026-05-14T01:51:56Z)
  Two electrons added to a filled Fermi sea form a bound pair via an attractive phonon-mediated interaction. The binding energy is exponentially small in the weak-coupling regime,

- **[BCS Gap, Self-Consistent](../playgrounds/bsc-y3s2/FIS3020-bcs-gap-self-consistent/index.html)** &nbsp; (verified, verified 2026-05-14T01:50:54Z)
  $\Delta(T)$ from the BCS gap equation; universal ratio $2\Delta_0 / k_B T_c \approx 3.53$. Source: Ashcroft-Mermin Ch. 34 (`ashcroft-mermin`).

- **[Bloch Oscillations](../playgrounds/bsc-y3s2/FIS3020-bloch-oscillations/index.html)** &nbsp; (verified, verified 2026-05-14T01:49:44Z)
  Particle in a tilted cosine band; quasi-momentum slides through the BZ and Bragg-reflects. Source: Ashcroft-Mermin Ch. 12 (`ashcroft-mermin`).

- **[1D Phonon Dispersion (Monatomic and Diatomic)](../playgrounds/bsc-y3s2/FIS3020-phonon-dispersion-1d-monatomic-diatomic/index.html)** &nbsp; (verified, verified 2026-05-14T01:48:31Z)
  Monatomic acoustic vs diatomic acoustic + optical; gap at zone boundary. Source: Ashcroft-Mermin Ch. 22 (`ashcroft-mermin`).

- **[Cosmic Distance Ladder](../playgrounds/bsc-y3s2/AST3017-distance-ladder-toy/index.html)** &nbsp; (verified, verified 2026-05-14T01:47:15Z)
  Four-rung overlap and error propagation. Source: Carroll-Ostlie Ch. 24 (`carroll-ostlie`).

- **[BBN Light-Element Abundances](../playgrounds/bsc-y3s2/AST3017-bbn-light-element-toy/index.html)** &nbsp; (verified, verified 2026-05-14T01:46:07Z)
  Empirical fits of $Y_p$, $D/H$, $^7$Li$/H$ vs $\eta_{10}$. Source: Liddle Ch. 11 (`liddle-cosmology`).

- **[Synchrotron Spectrum](../playgrounds/bsc-y3s2/AST3016-synchrotron-spectrum/index.html)** &nbsp; (verified, verified 2026-05-14T01:44:57Z)
  Hump for one electron; power-law for an ensemble. Source: Rybicki-Lightman Ch. 6 (`rybickilightman1979`).

- **[1D Radiative Transfer (Uniform Slab)](../playgrounds/bsc-y3s2/AST3016-radiative-transfer-1d-slab/index.html)** &nbsp; (verified, verified 2026-05-14T01:43:46Z)
  Slab with constant $S$ and finite $\tau$; closed-form $I(\tau) = I_{in} e^{-\tau} + S(1-e^{-\tau})$. Source: Rybicki-Lightman Ch. 1 (`rybickilightman1979`).

- **[Thermal Bremsstrahlung Spectrum](../playgrounds/bsc-y3s2/AST3016-bremsstrahlung-spectrum/index.html)** &nbsp; (verified, verified 2026-05-14T01:42:40Z)
  Flat below $h\nu = kT$, exponential cutoff above. Source: Rybicki-Lightman Ch. 5 (`rybickilightman1979`).

- **[Least-Squares Orbit Fit (Gauss Heritage)](../playgrounds/bsc-y3s1/AST3015-least-squares-orbit-fit-gauss/index.html)** &nbsp; (verified, verified 2026-05-14T01:41:22Z)
  Noisy positions along a Kepler orbit; fit a circle by least squares. The fit is biased when $e > 0$. Source: Bate-Mueller-White Ch. 5 (`bmw`).

- **[Aperture Photometry](../playgrounds/bsc-y3s1/AST3015-aperture-photometry-toy/index.html)** &nbsp; (verified, verified 2026-05-14T01:39:59Z)
  Synthetic Moffat PSF on a CCD; aperture + sky annulus recovers true flux. Source: Howell CCD Handbook (`howell-ccd`).

- **[Sedov-Taylor Blast Wave](../playgrounds/bsc-y3s1/AST3014-sedov-taylor-blastwave/index.html)** &nbsp; (verified, verified 2026-05-14T01:38:42Z)
  Self-similar point-explosion blast: $R \propto (E t^2/\rho)^{1/5}$. Source: Shu Vol II Ch. 17 (`shu-vol2`).

- **[Parker Solar Wind](../playgrounds/bsc-y3s1/AST3014-parker-solar-wind/index.html)** &nbsp; (verified, verified 2026-05-14T01:37:33Z)
  Parker (1958) isothermal solar wind. The velocity satisfies $(u^2/c_s^2 - 1)\,u^{-1}\,du/dr = (2/r)(1 - r_c/r)$ with sonic crossing at $r_c = GM/(2 c_s^2)$; the unique transonic branch passes through $u = c_s$ at $r = r_c$ and is supersonic beyond. Source: Shu Vol II Ch. 17 (`shu-vol2`); Frank-King-Raine Ch. 2 (`frank-king-raine`).

- **[Bondi Spherical Accretion](../playgrounds/bsc-y3s1/AST3014-bondi-accretion-spherical/index.html)** &nbsp; (verified, verified 2026-05-14T01:36:26Z)
  Bondi radius and accretion rate for a steady spherically symmetric inflow; sonic point at $r_B/2$. Source: Frank-King-Raine Ch. 2 (`frank-king-raine`).

- **[1D Alfvén Wave in MHD](../playgrounds/bsc-y3s1/AST3014-alfven-wave-mhd-1d/index.html)** &nbsp; (verified, verified 2026-05-14T01:35:07Z)
  Transverse magnetic perturbation travels at $v_A = B_0/\sqrt{\mu_0 \rho}$; magnetic-tension restoring force. Source: Goedbloed-Poedts Ch. 5 (`goedbloed-plasma`).

- **[1D Green's Function for the Laplacian](../playgrounds/bsc-y3s1/M3012-green-function-1d-laplacian/index.html)** &nbsp; (verified, verified 2026-05-14T01:33:50Z)
  Tent-shaped $G(x, x_0)$ with Dirichlet BC; convolution gives $u(x) = \int G f dx'$. Source: Arfken-Weber Ch. 9 (`arfken-weber`).

- **[Fourier vs Laplace Transform Pairs](../playgrounds/bsc-y3s1/M3012-fourier-vs-laplace-transform-pair/index.html)** &nbsp; (verified, verified 2026-05-14T01:32:40Z)
  Side-by-side time-domain, $|F(\omega)|^2$ and $F(s)$ with pole map. Source: Arfken-Weber Ch. 15 (`arfken-weber`).

- **[Grating Resolving Power](../playgrounds/bsc-y3s1/FIS3019-grating-resolving-power/index.html)** &nbsp; (verified, verified 2026-05-14T01:31:09Z)
  $N$-slit grating; principal maxima at $d \sin\theta = m\lambda$, resolving power $R = mN$. Source: Hecht Ch. 10 (`hecht2017`).

- **[Noether's Theorem: Symmetry to Conservation](../playgrounds/bsc-y2s2/FIS2021-noether-symmetry-to-conservation/index.html)** &nbsp; (verified, verified 2026-05-14T01:29:39Z)
  Rotation symmetry of a central potential preserves $L_z$; breaking the symmetry makes $L_z$ drift. Source: Lemos Ch. 4 (`lemos-mech`).

- **[Lagrangian vs Newtonian](../playgrounds/bsc-y2s2/FIS2021-lagrangian-vs-newtonian/index.html)** &nbsp; (verified, verified 2026-05-14T01:26:43Z)
  Same planar-pendulum dynamics shown three ways. Source: Lemos Ch. 2-3 (`lemos-mech`).

- **[Hamiltonian Phase-Space Flow](../playgrounds/bsc-y2s2/FIS2021-hamiltonian-phase-space-flow/index.html)** &nbsp; (verified, verified 2026-05-14T01:25:11Z)
  Click to seed tracers; each one traces an orbit at constant energy. Source: Lemos Ch. 6 (`lemos-mech`).

- **[Linear System: Direct vs Iterative](../playgrounds/bsc-y2s2/FIS2018-linear-system-direct-vs-iterative/index.html)** &nbsp; (verified, verified 2026-05-14T01:23:52Z)
  Poisson 1D problem; Thomas tridiagonal direct solver vs Jacobi, Gauss-Seidel, CG. Source: Villate Ch. 6 (`villate-vpython`).

- **[ODE Solvers: Euler vs RK4 vs RK45](../playgrounds/bsc-y2s2/FIS2018-ode-solver-euler-rk4-rk45/index.html)** &nbsp; (verified, verified 2026-05-14T01:22:21Z)
  Three integrators on the simple harmonic oscillator; Euler drifts energy upward, RK4 is accurate, RK45 estimates its own error. Source: Villate VPython Numerical Methods (`villate-vpython`).

- **[Root Finding: Bisection, Newton, Secant](../playgrounds/bsc-y2s2/FIS2018-root-finding-bisect-newton-secant/index.html)** &nbsp; (verified, verified 2026-05-14T01:20:51Z)
  Bisection, Newton-Raphson, and the secant method on a selectable test function. Source: Villate VPython Numerical Methods Ch. 4 (`villate-vpython`).

- **[Mandel-Agol Analytic Transit](../playgrounds/bsc-y2s1/AST2004-transit-mandel-agol-analytic/index.html)** &nbsp; (verified, verified 2026-05-14T01:19:15Z)
  Analytic transit light curve; uniform-source closed form plus quadratic limb darkening via ring decomposition. Source: Mandel & Agol 2002 (`mandelagol2002`).

- **[Stellar Blackbody + Absorption Lines](../playgrounds/bsc-y2s1/AST2004-stellar-blackbody-vs-line/index.html)** &nbsp; (verified, verified 2026-05-14T01:17:47Z)
  Planck continuum plus Balmer / Ca II / Na D absorption lines. Source: Carroll-Ostlie Ch. 3 (`carroll-ostlie`).

- **[Radial Velocity Curve from Orbital Elements](../playgrounds/bsc-y2s1/AST2004-radial-velocity-orbital-trace/index.html)** &nbsp; (verified, verified 2026-05-14T01:16:23Z)
  Orbit and corresponding RV curve, side by side. Source: Carroll-Ostlie Ch. 7 (`carroll-ostlie`).

- **[Keplerian Orbit Elements](../playgrounds/bsc-y2s1/AST2004-kepler-orbit-elements/index.html)** &nbsp; (verified, verified 2026-05-14T01:15:02Z)
  Vary the six classical elements (a, e, i, Ω, ω, ν) and watch a 3D orbit redraw. Source: Carroll-Ostlie Ch. 2 (`carroll-ostlie`).

- **[Wavepacket Dispersion in 1D](../playgrounds/bsc-y2s1/FIS2016-wavepacket-dispersion-1d/index.html)** &nbsp; (verified, verified 2026-05-14T01:13:45Z)
  The packet center drifts at $\hbar k_0 / m$; the width broadens as $\sigma(t) = \sigma_0\sqrt{1 + (\hbar t/2m\sigma_0^2)^2}$. Source: Eisberg-Resnick Ch. 5 (`eisberg-resnick`).

- **[Transverse vs Longitudinal Modes on a 1D Chain](../playgrounds/bsc-y2s1/FIS2016-transverse-vs-longitudinal-mode/index.html)** &nbsp; (verified, verified 2026-05-14T01:12:35Z)
  Same dispersion, different polarization. Source: Crawford Ch. 5 (`crawford-waves`).

- **[Group vs Phase Velocity in a Dispersive Medium](../playgrounds/bsc-y2s1/FIS2016-group-vs-phase-velocity/index.html)** &nbsp; (verified, verified 2026-05-14T01:11:17Z)
  Two-component superposition; envelope and carrier move at different speeds in dispersive media. Source: Crawford Ch. 6 (`crawford-waves`).

- **[Equipartition from Microscopic Collisions](../playgrounds/bsc-y2s1/FIS2014-equipartition-from-collisions/index.html)** &nbsp; (deprecated, verified 2026-05-14T01:09:53Z)
  2D hard-disk gas; the mean translational kinetic energy converges to $kT$. Source: Reif Ch. 7 (`reif`).

- **[Engine Cycle Explorer](../playgrounds/bsc-y2s1/FIS2014-engine-cycle-explorer/index.html)** &nbsp; (verified, verified 2026-05-14T01:08:34Z)
  Four idealized cycles on the PV plane: Otto, Diesel, Carnot, Stirling. Source: Callen Ch. 4-5 (`callen`).

- **[Adiabatic vs Isothermal Processes on a PV Diagram](../playgrounds/bsc-y2s1/FIS2014-adiabatic-vs-isothermal-pv/index.html)** &nbsp; (verified, verified 2026-05-14T01:07:07Z)
  Same initial state, two reversible processes; the adiabatic is steeper. Source: Callen Ch. 4 (`callen`).

- **[Skin Effect in a Conductor](../playgrounds/bsc-y2s1/FIS2013-skin-effect-1d-conductor/index.html)** &nbsp; (verified, verified 2026-05-14T01:05:49Z)
  Exponential decay of the AC electric field inside a conductor; skin depth $\delta = \sqrt{2/(\omega \mu \sigma)}$. Source: Griffiths E&M Ch. 9 (`griffiths-em`).

- **[Lienard-Wiechert Beaming and Synchrotron Lobe](../playgrounds/bsc-y2s1/FIS2013-lienard-wiechert-synchrotron/index.html)** &nbsp; (verified, verified 2026-05-14T01:04:34Z)
  Relativistic radiation collimates into a forward cone of opening angle $\sim 1/\gamma$. Two limits (a parallel and a perpendicular to v) are shown. Source: Jackson 3e Ch. 14 (`jackson3e`).

- **[Larmor Radiation Pattern](../playgrounds/bsc-y2s1/FIS2013-larmor-radiation-pattern/index.html)** &nbsp; (verified, verified 2026-05-14T01:03:07Z)
  Non-relativistic accelerating charge radiates with the $\sin^2\theta$ angular distribution; total power follows the Larmor formula. Source: Griffiths E&M Ch. 11 (`griffiths-em`).

- **[Michelson Fringe Counter](../playgrounds/bsc-y1s2/FIS1015-michelson-fringe-counter/index.html)** &nbsp; (deprecated, verified 2026-05-14T01:01:49Z)
  Moving one arm of a Michelson interferometer by $\lambda/2$ produces one full fringe at the center. The rendered pattern is the ring system for a divergent source. Source: Hecht Optics Ch. 9.4 (`hecht2017`).

- **[Method of Images: Charge Above a Grounded Plane](../playgrounds/bsc-y1s2/FIS1014-method-of-images-2d/index.html)** &nbsp; (verified, verified 2026-05-14T00:59:47Z)
  A point charge above a grounded conducting plane: the field is built by adding the image charge below the plane. The induced surface charge on the conductor integrates to negative the real charge. Source: Griffiths E&M Ch. 3.2 (`griffiths-em`).

- **[Coulomb Equilibrium of Charges](../playgrounds/bsc-y1s2/FIS1014-coulomb-equilibrium-charges/index.html)** &nbsp; (verified, verified 2026-05-14T00:57:36Z)
  Four fixed point charges generate a 2D field; the test charge can be dragged or released to flow under the Coulomb force. Equilibria are visible as zero-field locations. Source: Griffiths E&M Ch. 2 (`griffiths-em`).

- **[Elastic and Inelastic Collisions in 1D](../playgrounds/bsc-y1s1/FIS1013-elastic-inelastic-collisions-2d/index.html)** &nbsp; (verified, verified 2026-05-14T00:52:02Z)
  Two balls collide head-on with closed-form post-collision velocities parameterized by restitution $e$. Momentum is conserved for any $e$; KE is lost for $e < 1$. Source: Marion-Thornton Ch. 9 (`marion-thornton`).

- **[Multiple Integral Fubini](../playgrounds/bsc-y1s2/M1015-multiple-integral-fubini/index.html)** &nbsp; (verified, verified 2026-05-14T00:50:39Z)
  Iterated integrals over a rectangle in two orders match numerically. Demonstrated on $f(x, y) = \sin x \cos y$. Source: Riley-Hobson Ch. 10 (`riley-hobson`).

- **[Stokes Theorem 2D Circulation](../playgrounds/bsc-y2s1/M2037-stokes-theorem-2d-circulation/index.html)** &nbsp; (verified, verified 2026-05-14T00:49:25Z)
  Three vector fields (unit-curl, shear, conservative) and a draggable rectangle. Circulation = $\iint$ curl $dA$ closed-form for these uniform-curl fields. Source: Riley-Hobson Ch. 10 (`riley-hobson`).

- **[Series Convergence Tests](../playgrounds/bsc-y1s1/M1017-series-convergence-tests/index.html)** &nbsp; (verified, verified 2026-05-14T00:48:14Z)
  Four series (geometric, p-series 2, harmonic, alternating Leibniz) with partial sums plotted and the limit as a dashed line where finite. Source: Arfken-Weber Ch. 1 (`arfken-weber`).

- **[Cauchy Sequence Convergence Monitor](../playgrounds/bsc-y1s1/M1017-cauchy-sequence-convergence-monitor/index.html)** &nbsp; (verified, verified 2026-05-14T00:46:47Z)
  Partial sums of four series; Cauchy width $w(N_0) = \max |a_n - a_m|$ for $n, m \ge N_0$. Geometric, $\zeta(2)$, and Leibniz arctan converge; harmonic does not. Source: Arfken-Weber Ch. 1 (`arfken-weber`).

- **[Epsilon-Delta Continuity Visualizer](../playgrounds/bsc-y1s1/M1017-epsilon-delta-continuity-visualizer/index.html)** &nbsp; (verified, verified 2026-05-14T00:45:27Z)
  Slider for $x_0$ and $\epsilon$. The accent-yellow box shows the maximum $\delta_{\max}(\epsilon)$ such that $|x - x_0| < \delta$ implies $|f(x) - f(x_0)| < \epsilon$ for $f = \sin$. Demonstrates continuity at every point. Source: Arfken-Weber Ch. 1 (`arfken-weber`).

- **[Big-O Empirical Scaling](../playgrounds/bsc-y1s1/CC1017-big-o-empirical/index.html)** &nbsp; (verified, verified 2026-05-14T00:43:57Z)
  The same seeded shuffle of $[1..N]$ is sorted twice at once: an $O(N^2)$ comparison sort (bubble or insertion) on the left, merge sort $O(N\log_2 N)$ on the right. Both are replayed from a recorded event stream (compare / swap / write), so replay speed is independent of the algorithm. The lower panel accumulates one measured point per finished race on top of

- **[Slow-Roll Inflation](../playgrounds/bsc-y3s2/AST3017-inflation-slow-roll/index.html)** &nbsp; (verified, verified 2026-05-14T00:40:46Z)
  A scalar inflaton field $\phi$ with potential $V(\phi)$ in slow-roll regime ($\epsilon, |\eta| \ll 1$). The slow-roll parameters are $\epsilon = (M_\text{Pl}^2 / 2)(V'/V)^2$ and $\eta = M_\text{Pl}^2 V''/V$. Observables to leading order:

- **[Inverse-Compton Cooling](../playgrounds/msc-y1/MAA-HE-inverse-compton-scattering-cooling/index.html)** &nbsp; (verified, verified 2026-05-14T00:37:25Z)
  Relativistic electrons (Lorentz factor $\gamma$) immersed in a soft-photon bath (energy density $U_\text{ph}$) lose energy by inverse-Compton up-scattering of the photons. In the Thomson limit the cooling time is $$t_\text{IC} = \frac{3 m_e c}{4 \sigma_T \gamma U_\text{ph}}.$$

- **[Sturm-Liouville Eigenfunctions](../playgrounds/bsc-y3s1/M3012-sturm-liouville-eigenfunctions/index.html)** &nbsp; (verified, verified 2026-05-14T00:33:26Z)
  The simplest regular Sturm-Liouville problem: $-y'' = \lambda y$ on $[0, \pi]$ with $y(0) = y(\pi) = 0$. The eigenvalues are $\lambda_n = n^2$ and the eigenfunctions are $\phi_n(x) = \sqrt{2/\pi} \sin(n x)$, orthonormal under $\langle f, g \rangle = \int_0^\pi f g\,dx$.

- **[Parallel Transport on a Sphere](../playgrounds/bsc-y3s2/M3007-parallel-transport-on-sphere/index.html)** &nbsp; (verified, verified 2026-05-14T00:30:14Z)
  A spherical triangle on the unit sphere with one vertex at the north pole and the other two at colatitude $\alpha$ separated by longitude $\beta$. Parallel-transporting a vector around the triangle rotates it by the enclosed solid angle $$\Omega = (1 - \cos\alpha) \beta.$$

- **[Nuclear Shell Model Magic Numbers](../playgrounds/bsc-y3s2/FIS3030-nuclear-shell-model-magic-numbers/index.html)** &nbsp; (verified, verified 2026-05-14T00:27:04Z)
  Nucleons (protons and neutrons separately) fill single-particle levels of an average nuclear potential. The harmonic-oscillator-with-strong-spin-orbit model of Mayer and Jensen (1949) gives shell closures at $2, 8, 20, 28, 50, 82, 126$ that match the observed extra binding (Hartree-Fock confirmation came decades later).

- **[Semi-Empirical Mass Formula](../playgrounds/bsc-y3s2/FIS3030-semi-empirical-mass-formula/index.html)** &nbsp; (verified, verified 2026-05-14T00:24:21Z)
  The nuclear binding energy is the sum of five terms:

- **[Fermi Surface 2D Square Lattice](../playgrounds/bsc-y3s2/FIS3020-fermi-surface-2d-square/index.html)** &nbsp; (verified, verified 2026-05-14T00:20:40Z)
  Tight-binding electrons on a square lattice with nearest-neighbor hopping. Dispersion $E(k_x, k_y) = -2t (\cos k_x + \cos k_y)$ over the Brillouin zone $(k_x, k_y) \in [-\pi, \pi]^2$. The bandwidth is $8t$ from $-4t$ (Gamma point) to $+4t$ (M point).

- **[Lane-Emden Polytrope](../playgrounds/msc-y1/MAA-SA-polytrope-lane-emden/index.html)** &nbsp; (verified, verified 2026-05-14T00:17:38Z)
  A self-gravitating sphere with equation of state $P = K \rho^{1 + 1/n}$. The dimensionless density profile $\theta(\xi) = (\rho/\rho_c)^{1/n}$ satisfies the Lane-Emden equation

- **[Eddington Grey Atmosphere](../playgrounds/msc-y1/MAA-SP-eddington-grey-atmosphere/index.html)** &nbsp; (verified, verified 2026-05-14T00:13:47Z)
  A grey (frequency-independent opacity) stellar atmosphere in radiative equilibrium. The temperature profile follows $$T(\tau) = T_\text{eff} \left[\tfrac{3}{4} (\tau + \tfrac{2}{3})\right]^{1/4}.$$

- **[Friedmann Cosmography](../playgrounds/bsc-y3s2/AST3017-friedmann-cosmography/index.html)** &nbsp; (verified, verified 2026-05-14T00:11:04Z)
  A flat Friedmann-Lemaitre-Robertson-Walker universe with matter density parameter $\Omega_m$, cosmological constant $\Omega_\Lambda = 1 - \Omega_m$, and Hubble constant $H_0$. The dimensionless Hubble function and cosmic age follow from the Friedmann equation.

- **[Michelson Interferometer](../playgrounds/bsc-y3s1/FIS3019-michelson-interferometer/index.html)** &nbsp; (verified, verified 2026-05-14T00:06:59Z)
  A Michelson interferometer with one moving mirror produces a path difference $L = 2d$ between the two arms. The detector intensity is

- **[Fabry-Perot Finesse](../playgrounds/bsc-y3s1/FIS3019-fabry-perot-finesse/index.html)** &nbsp; (verified, verified 2026-05-14T00:04:16Z)
  Two parallel partial mirrors of intensity reflectance $R$ at spacing $L$ form a Fabry-Perot etalon. Light incident at angle $\theta$ inside the cavity (refractive index $n$) accumulates round-trip phase $\phi = 4 \pi n L \cos\theta / \lambda$. Multiple-beam interference gives the Airy transmission

- **[Kepler Equation Newton Iteration](../playgrounds/bsc-y3s1/AST3015-kepler-equation-newton-iteration/index.html)** &nbsp; (verified, verified 2026-05-14T00:01:25Z)
  The Kepler equation $M = E - e \sin E$ relates the mean anomaly $M$ (the linear angular coordinate that ticks at $2\pi$ per orbital period) to the eccentric anomaly $E$ (the angle of the planet on the auxiliary circle of the ellipse). Position on the orbit follows from $(a(\cos E - e), \, a\sqrt{1-e^2} \sin E)$. The equation is transcendental, so we solve it

- **[Drake Equation Explorer](../playgrounds/msc-y1/MAA-AB-drake-equation-explorer/index.html)** &nbsp; (verified, verified 2026-05-13T23:58:18Z)
  The Drake equation $$N = R_\star \cdot f_p \cdot n_e \cdot f_l \cdot f_i \cdot f_c \cdot L$$ estimates the number of currently detectable civilizations in our galaxy. Each factor is a probability or rate. Sliders set the most uncertain factors; a 2000-trial Monte Carlo draws each factor log-uniformly within $\pm 0.5$ dex of the slider center and computes the

- **[Stellar Habitable Zone](../playgrounds/msc-y1/MAA-AB-habitable-zone-stellar-flux/index.html)** &nbsp; (verified, verified 2026-05-13T23:54:24Z)
  A central star characterized by effective temperature $T_\text{eff}$ and radius $R_\star$ (in solar units). The luminosity is the Stefan-Boltzmann integral

- **[Transmission Line Impedance Matching](../playgrounds/bsc-y2s1/FIS2013-transmission-line-impedance-matching/index.html)** &nbsp; (verified, verified 2026-05-13T23:51:39Z)
  A coaxial transmission line of characteristic impedance $Z_0 = 50\,\Omega$ terminated by a resistive load $Z_L$. The forward and reflected voltage waves superpose into a standing pattern whose amplitude envelope depends on the mismatch.

- **[Compton vs Inverse Compton](../playgrounds/bsc-y3s2/AST3016-compton-vs-inverse-compton/index.html)** &nbsp; (verified, verified 2026-05-13T23:48:40Z)
  Two photon-electron scattering channels on the same energy axis.

- **[Stellar Aberration of Light](../playgrounds/bsc-y3s2/FIS3028-aberration-of-light-stellar/index.html)** &nbsp; (verified, verified 2026-05-13T23:44:45Z)
  Stars at uniform angular positions in their rest frame; the observer moves at velocity $\beta c$ along $+x$. Lorentz aberration

- **[Relativistic Doppler Effect](../playgrounds/bsc-y3s2/FIS3028-relativistic-doppler/index.html)** &nbsp; (verified, verified 2026-05-13T23:42:05Z)
  A monochromatic source at rest in frame $K'$ emits frequency $f_s$ and moves at velocity $\beta c$ along the $+x$ axis relative to the observer in frame $K$. The observer sees the photon arriving at angle $\theta$ from the $+x$ axis. The relativistic Doppler factor is

- **[Gauss Law in 2D](../playgrounds/bsc-y1s2/FIS1014-gauss-law-flux-through-surface/index.html)** &nbsp; (verified, verified 2026-05-13T23:26:29Z)
  A 2D point charge $q$ at user-set position generates the planar Coulomb field $\mathbf{E} = q / (2 \pi \epsilon_0 r) \hat r$. A user-controlled closed curve (ellipse or perturbed-ellipse blob) is drawn around the charge, and the flux $\oint \mathbf{E} \cdot \hat n\,ds$ is computed numerically via Simpson quadrature.

- **[Matter-Radiation Equality](../playgrounds/msc-y1/MAA-CS-matter-radiation-equality/index.html)** &nbsp; (verified, verified 2026-05-13T23:23:33Z)
  A flat Friedmann universe with three energy components: matter ($\rho_m \propto a^{-3}$), radiation ($\rho_r \propto a^{-4}$), and a cosmological constant ($\rho_\Lambda$ = const). The playground plots all three on a log-log scale against the scale factor $a$ (today $a = 1$) and marks the matter-radiation equality at $a_\text{eq} = \Omega_r / \Omega_m$.

- **[Divergence and Curl Visualizer](../playgrounds/bsc-y2s1/M2037-vector-field-div-curl-visualizer/index.html)** &nbsp; (verified, verified 2026-05-13T23:20:45Z)
  A parameterized 2D vector field $\mathbf{F}(x, y; a)$ visualized as a grid of arrows on a $\pm 3 \times \pm 2$ region. Four families:

- **[Line Integral vs Path](../playgrounds/bsc-y1s2/M1015-line-integral-vs-path/index.html)** &nbsp; (verified, verified 2026-05-13T23:18:16Z)
  A 2D vector field $\mathbf{F} = (P, Q)$ in the plane, with two paths from $A = (-1, 0)$ to $B = (1, 0)$: the straight chord and the upper semicircular arc. Simpson quadrature evaluates $\int_A^B \mathbf{F} \cdot d\mathbf{r}$ along each path; the closed-loop integral (straight forward, arc reversed) measures the failure of path-independence.

- **[Coupled Pendulums and Normal Modes](../playgrounds/bsc-y1s1/FIS1013-coupled-pendulums-normal-modes/index.html)** &nbsp; (verified, verified 2026-05-13T23:15:34Z)
  Two identical pendulums of length $L$ and mass $m$, coupled by a spring of constant $k$ attached at distance $d$ from each pivot. Small-angle linearized EOM:

- **[Capacitor Discharge through a Resistor](../playgrounds/bsc-y1s2/FIS1014-capacitor-discharge-rc/index.html)** &nbsp; (verified, verified 2026-05-13T23:11:07Z)
  A capacitor of capacitance $C$ charged to $V_0$ is suddenly connected across a resistor of resistance $R$. Kirchhoff's voltage law gives the first-order linear ODE $$R \dot Q + Q/C = 0,$$ whose closed-form solution is $$V_C(t) = V_0 \exp(-t / \tau), \qquad \tau = R C.$$

- **[Saha-Boltzmann Hydrogen Ionization](../playgrounds/bsc-y2s1/AST2004-saha-boltzmann-ionization/index.html)** &nbsp; (verified, verified 2026-05-13T23:05:56Z)
  Pure-hydrogen plasma in local thermodynamic equilibrium. Charge balance ($n_e = n_+$) and total nucleon conservation ($n_\text{tot} = n_+ + n_0$) plus the Saha equation give a closed-form quadratic for the ionization fraction $x = n_+ / n_\text{tot}$:

- **[Jeans Instability](../playgrounds/bsc-y2s1/AST2004-jeans-instability/index.html)** &nbsp; (verified, verified 2026-05-13T23:03:23Z)
  A uniform, self-gravitating, isothermal hydrogen medium with mass density $\rho$ and sound speed $c_s = \sqrt{k_B T / m_p}$. Linear perturbations $\propto \exp(i k x - i \omega t)$ satisfy the dispersion relation

- **[Floating-Point Precision Pitfalls](../playgrounds/bsc-y1s1/CC1017-floating-point-precision-pitfalls/index.html)** &nbsp; (verified, verified 2026-05-13T22:59:45Z)
  Dhahran, 25 February 1991. A Patriot battery's fire-control computer keeps system time as an integer count of 0.1 s ticks, converted to seconds by multiplying by a 24-bit fixed-point constant for 0.1. Because 0.1 has no finite binary representation, the stored constant is $209715/2097152 = 0.0999999046\ldots$, short of 0.1 by $\varepsilon \approx 9.5\times10

- **[Free Fall Stokes vs Quadratic Drag](../playgrounds/bsc-y1s1/FIS1013-free-fall-stokes-vs-quadratic-drag/index.html)** &nbsp; (verified, verified 2026-05-13T22:56:41Z)
  Three unit-mass balls dropped from the same height $y_0$ at $t = 0$, falling under three different drag laws: vacuum, Stokes (linear in velocity), and quadratic (Newtonian). Gravity acts downward; $g = 9.81$ m/s$^2$.

- **[SVD as Rotate-Scale-Rotate](../playgrounds/bsc-y1s1/M1038-svd-singular-values-2d-shape/index.html)** &nbsp; (verified, verified 2026-05-13T22:52:57Z)
  A real 2x2 matrix $M$ acting on the unit circle in $\mathbb{R}^2$. The singular value decomposition writes $M = U S V^T$ with $U, V$ rotations (orthogonal, determinant $+1$) and $S = \mathrm{diag}(s_1, s_2)$ with $s_1 \ge s_2 \ge 0$. The four-panel display shows the unit circle stretched step by step: rotate by $V^T$, scale by $S$, rotate by $U$.

- **[Gram-Schmidt Orthogonalization](../playgrounds/bsc-y1s1/M1038-gram-schmidt-orthogonalization/index.html)** &nbsp; (verified, verified 2026-05-13T22:50:16Z)
  Two input vectors $v_1, v_2$ in the plane, set by polar (angle, length) sliders. The playground displays the inputs (faded), the projection of $v_2$ onto $u_1 = v_1 / |v_1|$ (dashed), the residual $v_2 - \langle v_2, u_1 \rangle u_1$ (orange dashed), and the resulting orthonormal pair $u_1, u_2$ (bold accent and red).

- **[Eigenvector Rotation in 2x2](../playgrounds/bsc-y1s1/M1038-eigenvector-rotation-2x2/index.html)** &nbsp; (verified, verified 2026-05-13T22:47:28Z)
  Real 2x2 matrix $M = \begin{pmatrix}a & b \\ c & d\end{pmatrix}$ visualized as a linear transformation of the unit circle in $\mathbb{R}^2$. Sliders set each of the four matrix entries. The image of the unit circle is generally an ellipse; the eigenvectors (when real) point along directions that $M$ leaves invariant up to scaling by an eigenvalue.

- **[Davisson-Germer Electron Diffraction](../playgrounds/bsc-y2s2/FIS2017-davisson-germer-diffraction/index.html)** &nbsp; (verified, verified 2026-05-13T22:43:53Z)
  Electrons accelerated through a voltage $V$ are scattered off the (111) face of a nickel crystal. The atomic row spacing on that surface is $D = 0.215$ nm. Constructive interference appears at angle $\theta$ from the normal satisfying

- **[de Broglie Wavelength](../playgrounds/bsc-y2s2/FIS2017-de-broglie-wavelength/index.html)** &nbsp; (verified, verified 2026-05-13T22:39:39Z)
  A particle of rest mass $m$ and kinetic energy $T$ has a quantum wavelength

- **[Photoelectric Effect Threshold](../playgrounds/bsc-y2s2/FIS2017-photoelectric-effect-threshold/index.html)** &nbsp; (verified, verified 2026-05-13T22:20:23Z)
  Monochromatic light of frequency $\nu$ illuminates a clean metal cathode with work function $\phi$. Einstein 1905: each photon delivers exactly $h\nu$ of energy to a bound electron. Electrons appear only if $h\nu \ge \phi$. The maximum kinetic energy of the ejected electron is $$KE_{max} = h\nu - \phi, \qquad \nu > \nu_0 \equiv \phi / h.$$ Below threshold, n

- **[Bohr Hydrogen Spectrum](../playgrounds/bsc-y2s1/AST2004-bohr-hydrogen-spectrum/index.html)** &nbsp; (verified, verified 2026-05-13T22:16:16Z)
  A single electron orbits a proton in a Coulomb potential. The Bohr quantization condition $L = n \hbar$ pins discrete orbits indexed by integer $n \ge 1$ with energies $E_n = -E_R / n^2$, where $E_R = 13.605693$ eV is the (infinite-mass) Rydberg energy. Transitions between levels emit photons of wavelength $$\frac{1}{\lambda} = R_H \left( \frac{1}{n_\ell^2} 

- **[Compton Scattering Kinematics](../playgrounds/bsc-y2s2/FIS2017-compton-scattering-kinematics/index.html)** &nbsp; (verified, verified 2026-05-13T22:11:23Z)
  A monochromatic photon of wavelength $\lambda$ (typically 0.5 to 10 pm, the X-ray regime where Compton scattering is significant) is incident along the $+x$ axis on a free electron at rest. The photon scatters at angle $\theta$ measured from its original direction. The recoiling electron flies off at angle $\phi$ on the opposite side of the scattering plane.

- **[Inclined Plane Friction](../playgrounds/bsc-y1s1/FIS1013-inclined-plane-friction/index.html)** &nbsp; (verified, verified 2026-05-13T22:07:35Z)
  A unit-mass block sits at the top of a slope of length 5 m inclined at angle $\theta$. The block is in contact with the slope through Coulomb friction characterized by a static coefficient $\mu_s$ and a kinetic coefficient $\mu_k$. Gravity $g = 9.81$ m/s$^2$ points downward. The block is released from rest and the simulation tracks position $x$ along the slo

- **[Wave on a String: Fixed vs Free End Reflection](../playgrounds/bsc-y2s1/FIS2016-wave-on-string-reflection/index.html)** &nbsp; (verified, verified 2026-05-13T20:23:00Z)
  Two parallel 1D strings of length L = 4 with c = 1, each with a Gaussian pulse launched moving rightward. Top string: fixed ends (y = 0 at both boundaries). Bottom string: free ends (y_x = 0 boundary, i.e. the neighbor mirrors at the boundary). Pulse reflects when it reaches each boundary.

- **[Kapitza Inverted Pendulum](../playgrounds/bsc-y1s1/FIS1013-inverted-pendulum-kapitza/index.html)** &nbsp; (verified, verified 2026-05-13T20:18:30Z)
  Rigid pendulum of length l = 1 with pivot driven vertically at y_p(t) = a cos(omega t). In the inertial frame the equation of motion about the upside-down equilibrium (theta = 0 = up) is theta'' = ((g - a omega^2 cos(omega t)) / l) sin(theta)

- **[Magnus Effect on a Spinning Ball](../playgrounds/bsc-y1s1/FIS1013-magnus-effect-spinning-ball/index.html)** &nbsp; (verified, verified 2026-05-13T20:13:25Z)
  A baseball-like ball (m = 0.15 kg) launched with initial speed v_0 and angle, subject to gravity, quadratic drag, and Magnus lift due to spin. Convention: positive spin = top-spin (ball rotates in direction of flight; Magnus force pushes down). Negative spin = back-spin (Magnus force pushes up).

- **[Gyroscope Precession](../playgrounds/bsc-y1s1/FIS1013-gyroscope-precession/index.html)** &nbsp; (verified, verified 2026-05-13T20:09:00Z)
  Heavy symmetric top of mass M = 1, with pivot fixed at one end and center of mass at distance r = 0.5 along the body axis. Spin moment of inertia I_s = 0.1. Gravity g = 9.81 along -z.

- **[BTW Sandpile and Self-Organized Criticality](../playgrounds/bsc-y2s1/FIS2014-abelian-sandpile-btw/index.html)** &nbsp; (verified, verified 2026-05-13T20:03:30Z)
  32 x 32 lattice of integer heights. Drop a grain at a random site; topple when height >= 4. Boundary sites lose grains to the outside. After enough drops the system settles into a critical state where avalanche-size distribution is a power law P(s) ~ s^(-tau), tau ~ 1.21 in 2D.

- **[Monte Carlo Integration Convergence](../playgrounds/bsc-y2s2/FIS2018-mc-integration-convergence/index.html)** &nbsp; (verified, verified 2026-05-13T19:59:45Z)
  Estimate integral_{0}^{1} f(x) dx with f(x) = 1 + 10 (x - 1/2)^4. Exact value: 1.125. Two estimators: - Plain: I_hat = (1/N) sum f(U_i), U_i ~ U(0, 1). - Importance: I_hat = (1/N) sum f(X_i) / q(X_i), X_i ~ Beta(2, 2).

- **[FitzHugh-Nagumo Excitable Neuron](../playgrounds/bsc-y2s2/FIS2021-fitzhugh-nagumo-excitable/index.html)** &nbsp; (verified, verified 2026-05-13T19:55:30Z)
  Two-variable reduction of the Hodgkin-Huxley model: v' = v - v^3 / 3 - w + I w' = epsilon (v + a - b w) with a = 0.7, b = 0.8, epsilon = 0.08. v is fast (voltage); w is slow (recovery). External input I tunes the system from excitable rest to sustained limit-cycle firing through a Hopf bifurcation.

- **[Pendulum on a Moving Cart](../playgrounds/bsc-y1s1/FIS1013-pendulum-on-moving-cart/index.html)** &nbsp; (verified, verified 2026-05-13T19:51:50Z)
  Frictionless cart of mass M = 2 on a horizontal rail, with a rigid pendulum of length L = 1 and bob mass m = 0.5 hanging from a pivot on top. Gravity g = 9.81. Two-degree-of-freedom system, no external horizontal forces.

- **[Shakura-Sunyaev Accretion Disc Temperature](../playgrounds/msc-y1/MAA-HE-accretion-disk-temperature-profile/index.html)** &nbsp; (verified, verified 2026-05-13T19:45:30Z)
  Steady, optically thick, geometrically thin accretion disc around a non-rotating compact object. Shakura-Sunyaev (1973) temperature profile:

- **[Gauss-Legendre vs Trapezoid Quadrature](../playgrounds/bsc-y2s2/FIS2018-gauss-quadrature-vs-trapezoid/index.html)** &nbsp; (verified, verified 2026-05-13T19:41:10Z)
  Numerical evaluation of integral_{-1}^1 f(x) dx by: - Trapezoidal rule: n + 1 equispaced points. - Gauss-Legendre: n optimized nodes from roots of P_n.

- **[Runge Phenomenon and Chebyshev Cure](../playgrounds/bsc-y2s2/FIS2018-runge-vs-chebyshev/index.html)** &nbsp; (verified, verified 2026-05-13T19:37:00Z)
  Polynomial interpolation of the Runge function f(x) = 1 / (1 + 25 x^2) on [-1, 1] at n + 1 nodes: - Equispaced: x_i = -1 + 2 i / n. - Chebyshev (second kind, including endpoints): x_i = cos(i pi / n).

- **[Shapiro Time Delay](../playgrounds/bsc-y3s2/AST3017-shapiro-time-delay/index.html)** &nbsp; (verified, verified 2026-05-13T19:33:15Z)
  A light signal travels past a massive body (Schwarzschild M = 1 in geometric units) at impact parameter b. The leading-order PPN time delay relative to flat-space is

- **[Schwarzschild Effective Potential and the ISCO](../playgrounds/bsc-y2s1/AST2004-schwarzschild-effective-potential/index.html)** &nbsp; (verified, verified 2026-05-13T19:28:30Z)
  Effective radial potential for geodesics outside a Schwarzschild black hole of mass M (geometric units G = c = 1): - Massive: V_eff = 0.5 (1 - 2M/r)(1 + L^2 / r^2) - 0.5. - Photon:  V_eff = 0.5 (L^2 / r^2)(1 - 2M/r).

- **[Gravitational Redshift in Schwarzschild](../playgrounds/bsc-y3s2/AST3017-gravitational-redshift/index.html)** &nbsp; (verified, verified 2026-05-13T19:23:25Z)
  A photon emitted at radius r_em outside a Schwarzschild black hole of mass M (geometric units G = c = 1) is observed at infinity with frequency f_obs = f_em sqrt(1 - 2M / r_em). At the horizon r = 2M the redshift factor vanishes, corresponding to infinite redshift.

- **[Binary Symmetric Channel and the Repetition Code](../playgrounds/msc-y1/MAA-ST-channel-capacity-bsc/index.html)** &nbsp; (verified, verified 2026-05-13T19:19:30Z)
  A BSC flips each transmitted bit with probability p. Shannon's capacity C(p) = 1 - H(p), with H(p) = -p log2 p - (1 - p) log2 (1 - p). At p = 0.5 the channel is useless; at p = 0 or 1 the channel is noiseless.

- **[Single, Double, and Multi-Slit Diffraction](../playgrounds/bsc-y2s1/FIS2016-single-double-multi-slit/index.html)** &nbsp; (verified, verified 2026-05-13T19:16:00Z)
  N identical slits of width a and center-to-center separation d, illuminated by collimated coherent light of wavelength lambda at normal incidence. Far-field intensity at angle theta:

- **[Brewster Angle and Fresnel Equations](../playgrounds/bsc-y1s2/FIS1014-brewster-angle-fresnel/index.html)** &nbsp; (verified, verified 2026-05-13T19:11:48Z)
  Plane wave from medium 1 (index n_1) incident on the planar interface with medium 2 (index n_2) at angle theta_i. Default: n_1 = 1.0 (air), n_2 = 1.5 (glass). Refracted angle theta_t from Snell's law.

- **[Thin-Film Interference and Iridescent Colors](../playgrounds/bsc-y3s1/FIS3019-thin-film-interference/index.html)** &nbsp; (verified, verified 2026-05-13T19:08:10Z)
  A thin layer of refractive index n_film and thickness d sits on a substrate. Default values: n_top = 1.0 (air), n_film = 1.33 (water/oil), n_sub = 1.5 (glass). White light at normal incidence reflects from both interfaces; the two reflected beams interfere, with the interference pattern depending on d / lambda.

- **[Kuramoto Oscillators and Synchronization](../playgrounds/bsc-y2s2/FIS2021-coupled-kuramoto-oscillators/index.html)** &nbsp; (verified, verified 2026-05-13T19:04:40Z)
  N = 128 phase oscillators with intrinsic frequencies omega_i drawn from a Lorentzian distribution with half-width-at-half-maximum gamma. Each oscillator couples globally to the mean phase with strength K: theta_i' = omega_i + (K / N) sum_j sin(theta_j - theta_i)

- **[Predator-Prey and the Hopf Bifurcation](../playgrounds/bsc-y2s2/FIS2021-predator-prey-hopf/index.html)** &nbsp; (verified, verified 2026-05-13T19:01:25Z)
  Rosenzweig-MacArthur predator-prey model with Holling Type II response: x' = r x (1 - x / K) - a x y / (b + x) y' = e a x y / (b + x) - d y

- **[Maxwell-Boltzmann Emergence from Hard-Disk Collisions](../playgrounds/bsc-y2s1/FIS2014-maxwell-boltzmann-emergence/index.html)** &nbsp; (verified, verified 2026-05-13T18:56:30Z)
  A 2D box of side L = 8 containing N = 80 hard disks (radius 0.15) initially moving with identical speed v_0 = 1 but random orientations. Walls are reflecting; disk-disk collisions are elastic with equal masses (which exchanges only the velocity components along the contact normal).

- **[Projectile Motion with Air Drag](../playgrounds/bsc-y1s1/FIS1013-projectile-with-air-drag/index.html)** &nbsp; (verified, verified 2026-05-13T18:52:40Z)
  Three projectiles of equal mass m = 1 kg fired simultaneously at the same speed v_0 and angle theta. Drag laws: 1. None (vacuum). 2. Stokes (linear): F_drag = -b v, b = 0.20. 3. Quadratic (Newton): F_drag = -c |v| v, c = 0.012.

- **[Foucault Pendulum and Coriolis Precession](../playgrounds/bsc-y1s1/FIS1013-foucault-pendulum/index.html)** &nbsp; (verified, verified 2026-05-13T18:49:28Z)
  A small-amplitude pendulum suspended over a point on a rotating Earth at latitude phi. In the horizontal (x, y) frame at that point, the Coriolis acceleration has a vertical component omega_z = Omega sin(phi). The linearized equations of motion are x'' = -omega_0^2 x + 2 omega_z y' y'' = -omega_0^2 y - 2 omega_z x'.

- **[Van der Pol: Limit Cycle to Relaxation Oscillator](../playgrounds/bsc-y2s2/FIS2021-van-der-pol-relaxation/index.html)** &nbsp; (verified, verified 2026-05-13T18:46:08Z)
  The Van der Pol equation: x'' - mu (1 - x^2) x' + x = 0

- **[Damped, Driven Oscillator and Resonance](../playgrounds/bsc-y1s1/FIS1013-damped-driven-oscillator/index.html)** &nbsp; (verified, verified 2026-05-13T18:42:00Z)
  A single mass on a spring with linear damping, driven sinusoidally: x'' + 2 gamma x' + omega_0^2 x = F_0 cos(omega t)

- **[Tautochrone: Cycloid Isochronism](../playgrounds/bsc-y1s1/FIS1013-tautochrone-isochronism/index.html)** &nbsp; (verified, verified 2026-05-13T18:36:55Z)
  Five frictionless beads on a single inverted cycloid bowl, released from five different starting amplitudes. The bowl is the curve x(theta) = R (theta - sin theta) y(theta) = R (1 + cos theta) with bottom at (R pi, 0) (theta = pi).

- **[E x B Drift and the Cycloid](../playgrounds/bsc-y2s1/FIS2013-exb-drift-cycloid/index.html)** &nbsp; (verified, verified 2026-05-13T18:33:40Z)
  A charged particle (q = m = 1) in crossed uniform fields B = B z-hat (out of page) and E = E x-hat. Starting from rest at the origin, the particle follows a cycloid: it accelerates in +x under E until v x B curves it back. The net motion is a uniform drift in (E x B) / B^2 = -E / B in y.

- **[Cyclotron Motion in a Uniform Magnetic Field](../playgrounds/bsc-y2s1/FIS2013-cyclotron-uniform-b/index.html)** &nbsp; (verified, verified 2026-05-13T18:28:30Z)
  A charged particle (q = m = 1) in a uniform, out-of-page magnetic field B = B z-hat. Initial state: (x, y) = (0, 0), (vx, vy) = (0, v).

- **[Electric Field Lines from Point Charges](../playgrounds/bsc-y1s2/FIS1014-electric-field-lines-charges/index.html)** &nbsp; (verified, verified 2026-05-13T18:24:10Z)
  A small set of point charges in the plane. The electric field is E(r) = sum_i q_i (r - r_i) / |r - r_i|^3 (units chosen so that the Coulomb constant is 1).

- **[Standing Waves on a String](../playgrounds/bsc-y2s1/FIS2016-standing-waves-string-modes/index.html)** &nbsp; (verified, verified 2026-05-13T18:20:30Z)
  A uniform string of length L is fixed at both ends. The normal modes of small transverse oscillation are y_n(x, t) = sin(n pi x / L) cos(2 pi f_n t),  f_n = n c / (2 L).

- **[Catenary: Shape of a Hanging Chain](../playgrounds/bsc-y1s1/FIS1013-catenary-hanging-chain/index.html)** &nbsp; (verified, verified 2026-05-13T18:15:10Z)
  A perfectly flexible, uniform chain hangs under gravity between two pegs at (plus minus 1, 0). The hanging shape is the catenary y(x) = a cosh(x / a) - a

- **[Brachistochrone: Why the Cycloid Wins](../playgrounds/bsc-y1s1/FIS1013-brachistochrone-cycloid/index.html)** &nbsp; (verified, verified 2026-05-13T18:11:40Z)
  Three frictionless beads of equal mass slide from A = (0, 0) to B = (4, -2) under uniform gravity g = 9.81. The paths are: - Cycloid: x = R (theta - sin theta), y = -R (1 - cos theta), with R fixed by the endpoint. - Straight line. - Circular arc through A, tangent to the horizontal at A, passing through B.

- **[Doppler Effect from a Moving Source](../playgrounds/bsc-y2s1/FIS2016-doppler-effect/index.html)** &nbsp; (verified, verified 2026-05-13T18:06:30Z)
  A point source moves with constant velocity v in the +x direction. In its own rest frame it emits a sinusoidal signal of frequency f, so it emits a discrete wavefront every period T = 1 / f. Each wavefront propagates isotropically at speed c. A stationary observer detects compressed wavefronts in front of the source and stretched ones behind it.

- **[Lissajous Figures](../playgrounds/bsc-y1s1/FIS1013-lissajous-figures/index.html)** &nbsp; (verified, verified 2026-05-13T18:03:00Z)
  A point traces out the parametric curve x(t) = A sin(a t + delta) y(t) = B sin(b t) on a 2D plane. The shape depends only on the frequency ratio a / b and the phase delta. Such curves arise whenever two perpendicular harmonic oscillations are observed simultaneously, as in oscilloscope traces or optical interference of two-mode beams.

- **[Beats from Superposition of Close Frequencies](../playgrounds/bsc-y1s1/FIS1013-beats-superposition/index.html)** &nbsp; (verified, verified 2026-05-13T17:59:50Z)
  Two harmonic signals of nearby frequencies, summed: y(t) = cos(2 pi f_1 t) + cos(2 pi f_2 t)

- **[Coupled Springs and Normal Modes](../playgrounds/bsc-y1s1/FIS1013-coupled-springs-normal-modes/index.html)** &nbsp; (verified, verified 2026-05-13T17:56:30Z)
  Two equal masses on a frictionless track, connected by three identical springs to two fixed walls: wall - (k) - m - (k) - m - (k) - wall. This is the textbook small-oscillation system; everything follows from diagonalizing the 2 x 2 stiffness matrix.

- **[SPH 1D Sod Shock Tube](../playgrounds/bsc-y3s1/AST3014-sph-sod-shock-tube/index.html)** &nbsp; (verified, verified 2026-05-13T17:47:53Z)
  The Sod shock tube is the canonical compressible-fluid benchmark. A membrane at x = 0.5 separates two states of an ideal gas with gamma = 1.4:

- **[Particle-Mesh Self-Gravitating 2D Disk](../playgrounds/bsc-y3s1/AST3015-particle-mesh-2d-disk/index.html)** &nbsp; (verified, verified 2026-05-13T17:40:41Z)
  A flat 2D disc of 1500 self-gravitating particles in an exponential surface-density profile. Gravity solved via particle-mesh on a 32 x 32 periodic grid using cloud-in-cell (CIC) deposit and interpolation.

- **[Two-Stream Instability (1D PIC)](../playgrounds/bsc-y3s1/AST3014-two-stream-pic-plasma/index.html)** &nbsp; (verified, verified 2026-05-13T17:35:12Z)
  Two counter-streaming electron beams at +/- v_0 against a uniform neutralizing ion background. Small density perturbations grow exponentially at the linear rate omega_p / (2 sqrt 2). The beams eventually form phase-space vortices and saturate.

- **[Mean-Field VI on a Banana](../playgrounds/msc-y1/MAA-DM-mean-field-vi-on-banana/index.html)** &nbsp; (verified, verified 2026-05-13T17:30:41Z)
  Fit a mean-field Gaussian q(x, y) = N(mu_x, sigma_x^2) * N(mu_y, sigma_y^2) to a Rosenbrock-style banana target. The banana is a long curved valley; the mean-field Gaussian is axis-aligned; this gap is the canonical failure mode of variational inference.

- **[GP Kernel Zoo](../playgrounds/msc-y1/MAA-DM-gp-kernel-zoo/index.html)** &nbsp; (verified, verified 2026-05-13T17:25:58Z)
  A 1D Gaussian Process: a probability distribution over functions. Five kernels (RBF, Matern 3/2, Matern 5/2, periodic, linear) parameterized by length scale and amplitude. Top panel: prior samples (no data). Bottom panel: posterior conditioned on observations with noise sigma_n.

- **[Backprop on a Tiny MLP](../playgrounds/msc-y1/MAA-DM-backprop-tiny-net/index.html)** &nbsp; (verified, verified 2026-05-13T17:21:43Z)
  A small fully-connected neural network with 2 input units, 1 to 3 stacked tanh hidden layers of up to 8 units each, and a single sigmoid output unit. Trained by full-batch gradient descent on the binary cross-entropy loss for a 2D binary classification problem (moons, XOR, spiral, circles, or gaussians). The decision surface, the network graph (edge width pr

- **[Advection Scheme Shootout](../playgrounds/bsc-y2s2/FIS2018-advection-scheme-shootout/index.html)** &nbsp; (verified, verified 2026-05-13T17:17:52Z)
  1D linear advection u_t + c u_x = 0 on a periodic domain [0, 1] with a square pulse initial condition. Four numerical schemes solve the same problem side-by-side; the dashed green line is the analytic solution (pure translation of the pulse).

- **[WKB Bohr-Sommerfeld vs Exact](../playgrounds/bsc-y3s2/FIS3029-wkb-vs-shooting/index.html)** &nbsp; (verified, verified 2026-05-13T17:14:14Z)
  Bound-state energies for a 1D particle in a power-law well V(x) = |x|^p / p, hbar = m = 1. Compare the Bohr-Sommerfeld (WKB) approximation to the "exact" reference levels for the harmonic oscillator (p = 2; closed form E_n = n + 1/2) and quartic anharmonic oscillator (p = 4; Bender-Wu 1969 numerical levels).

- **[1D TDSE Wavepacket Scattering](../playgrounds/bsc-y3s2/FIS3029-1d-tdse-scattering-comparator/index.html)** &nbsp; (verified, verified 2026-05-13T17:07:26Z)
  A 1D Gaussian wavepacket initially at x_0 = -15 with momentum k_0 moves to the right and scatters off a potential (rectangular barrier, step, or square well). Computed with Crank-Nicolson on a uniform grid; norm-preserving by construction.

- **[Billiards - Circle, Stadium, Sinai](../playgrounds/bsc-y2s2/FIS2021-billiards-circle-stadium-sinai/index.html)** &nbsp; (verified, verified 2026-05-13T17:02:26Z)
  A free particle of unit speed bouncing elastically off the walls of a 2D shape. Three classical geometries: circle (integrable), Bunimovich stadium (chaotic), Sinai billiard (chaotic with convex scatterer). Used to study quantum-classical correspondence and the onset of chaos under purely geometric constraints.

- **[2D Site Percolation](../playgrounds/bsc-y2s1/FIS2014-percolation-2d/index.html)** &nbsp; (verified, verified 2026-05-13T16:07:02Z)
  Each site of an L x L square lattice is independently occupied with probability p (the "site occupation probability"). We label all connected clusters of occupied sites (4-neighbor connectivity) and highlight the largest cluster. As p crosses the critical value p_c = 0.59274621, a giant spanning cluster appears (Newman-Ziff 2000).

- **[2D XY Model and the BKT Vortex Transition](../playgrounds/bsc-y2s1/FIS2014-xy-model-bkt/index.html)** &nbsp; (verified, verified 2026-05-13T16:07:02Z)
  Classical XY model: each site of an L x L periodic square lattice holds a continuous angle theta in [0, 2 pi). Bond energy -J cos(theta_i - theta_j); J = 1. The 2D XY model has no spontaneous symmetry breaking at finite T (Mermin-Wagner), but it does have a finite-temperature Berezinskii-Kosterlitz-Thouless (BKT) transition at T_BKT ~ 0.893 J (Hasenbusch 200

- **[Airy Diffraction Pattern from a Circular Aperture](../playgrounds/bsc-y2s1/FIS2016-airy-pattern-circular-aperture/index.html)** &nbsp; (verified, verified 2026-05-13T16:07:02Z)
  The Fraunhofer far-field intensity from a uniformly illuminated circular aperture of radius a. This is the classical resolution-limiting pattern for any optical instrument with a round pupil: telescopes, microscopes, eyes.

- **[Chirikov Standard Map - KAM Tori](../playgrounds/bsc-y2s2/FIS2021-standard-map-kam/index.html)** &nbsp; (verified, verified 2026-05-13T16:07:02Z)
  The standard map is the discrete-time area-preserving map p_{n+1} = p_n + K sin(theta_n) (mod 2 pi) theta_{n+1} = theta_n + p_{n+1} (mod 2 pi) on the torus (theta, p) in [0, 2 pi)^2. It is the Poincare section of a periodically kicked rotator. At K = 0 the dynamics is integrable; at finite K the KAM theorem guarantees that sufficiently irrational tori surviv

- **[Driven Damped Duffing Oscillator](../playgrounds/bsc-y2s2/FIS2021-duffing-oscillator/index.html)** &nbsp; (verified, verified 2026-05-13T16:07:02Z)
  A particle in a symmetric double-well potential V(x) = -x^2/2 + x^4/4, subject to linear damping and a periodic external drive. The Duffing equation is the textbook system that exhibits a complete period-doubling cascade to chaos under a single control parameter (the drive amplitude gamma). It is also one of the cleanest examples for visualizing a Poincare s

- **[EM on a 2D Gaussian Mixture](../playgrounds/msc-y1/MAA-DM-em-on-gmm-2d/index.html)** &nbsp; (verified, verified 2026-05-13T16:07:02Z)
  A 2D scatter of N = 600 points drawn from a 3-component Gaussian mixture with known means, covariances, and mixing weights. The EM algorithm tries to recover those parameters using only the data, alternating soft cluster assignment (E-step) and parameter refit (M-step).

- **[Frustrated Triangular Antiferromagnet](../playgrounds/bsc-y2s1/FIS2014-frustrated-triangular-af/index.html)** &nbsp; (verified, verified 2026-05-13T16:07:02Z)
  Antiferromagnetic Ising spins on a 2D triangular lattice with periodic boundaries. Each spin prefers to be opposite to its 6 neighbors. Geometric frustration: on every 3-spin plaquette, you cannot satisfy all three anti-alignments at once. Wannier 1950 showed there is no finite-T phase transition; the T = 0 ground state has extensive residual entropy.

- **[Hydrogen Orbital Cross Sections in the (x, z) Plane](../playgrounds/bsc-y3s2/FIS3029-hydrogen-orbital-cross-sections-2d/index.html)** &nbsp; (deprecated, verified 2026-05-13T16:07:02Z)
  The bound stationary states of the hydrogen atom, parameterized by three quantum numbers (n, l, m). Probability density |psi_nlm|^2 plotted in the plane through the nucleus that contains the z axis (i.e., y = 0). This is the standard textbook visualization for orbital shapes.

- **[KL Divergence Asymmetry (Mass-Covering vs Mode-Seeking)](../playgrounds/msc-y1/MAA-ST-kl-divergence-asymmetry/index.html)** &nbsp; (verified, verified 2026-05-13T16:07:02Z)
  Two probability densities on a 1D axis. Target P is a bimodal mixture of two Gaussians at +/- sep; approximation Q is a single Gaussian with controllable (mu_q, sigma_q). The playground computes the two directions of KL divergence and shows how their argmins differ qualitatively.

- **[Kronig-Penney Band Structure](../playgrounds/bsc-y3s2/FIS3029-kronig-penney-bands/index.html)** &nbsp; (verified, verified 2026-05-13T16:07:02Z)
  A 1D crystal with delta-function spikes on a periodic lattice (period a, dimensionless strength P). The energy spectrum splits into allowed bands and forbidden gaps. The simplest textbook model in solid-state physics that produces a band structure.

- **[Lagrange Points of the Circular Restricted Three-Body Problem](../playgrounds/bsc-y2s1/AST2004-lagrange-points-cr3bp/index.html)** &nbsp; (verified, verified 2026-05-13T16:07:02Z)
  Two heavy bodies of mass m1 and m2 orbit their common center of mass in a circular orbit. A test particle (mass negligible) moves under their combined gravity, computed in the rotating frame where the two primaries stand still. Non-dimensional units: total mass = 1, separation = 1, angular velocity = 1.

- **[Maximum-Entropy Distributions Zoo](../playgrounds/msc-y1/MAA-ST-maxent-distribution-zoo/index.html)** &nbsp; (verified, verified 2026-05-13T16:07:02Z)
  A 1D probability density on a continuous support. The maximum-entropy principle (Jaynes 1957) selects the density that maximizes differential entropy h(p) = -integral p ln p dx subject to fixed moments (or other linear functionals of p). The result depends entirely on the choice of constraints; this playground enumerates four canonical cases.

- **[Mutual Information of a Bivariate Gaussian](../playgrounds/msc-y1/MAA-ST-mutual-information-2d/index.html)** &nbsp; (verified, verified 2026-05-13T16:07:02Z)
  A static, exact, no-integration example: two correlated Gaussian random variables (X, Y) with covariance Sigma. The joint density p(x, y) is rendered as a heatmap; the marginals p(x) and p(y) are drawn above and beside it. Mutual information I(X; Y) is the area you can carve out of the joint by knowing the marginals; for a Gaussian it admits a closed form -0

- **[Paraxial Gaussian Beam (TEM_00)](../playgrounds/bsc-y3s1/FIS3019-gaussian-beam-paraxial/index.html)** &nbsp; (verified, verified 2026-05-13T16:07:02Z)
  The fundamental TEM_00 mode of a laser cavity, modeled in the paraxial (slowly varying envelope) limit. The beam is narrowest at z = 0 with 1/e^2 intensity radius w_0; it expands hyperbolically along z as it propagates.

- **[Particle in a Well - A Quantum Zoo](../playgrounds/bsc-y3s2/FIS3029-particle-in-a-well-zoo/index.html)** &nbsp; (verified, verified 2026-05-13T16:07:02Z)
  Three canonical 1D quantum bound-state problems plotted on the same axes for comparison: infinite square well, finite square well, and harmonic oscillator. In each, V(x) is fixed and we solve the time-independent Schrodinger equation for energy eigenstates.

- **[Perihelion Precession in a Schwarzschild Effective Potential](../playgrounds/bsc-y2s1/AST2004-mercury-precession-pn/index.html)** &nbsp; (verified, verified 2026-05-13T16:07:02Z)
  In pure Newtonian gravity, Bertrand's theorem says that the only closed bound orbits in central potentials are those of V(r) ~ 1/r and V(r) ~ r^2. Any departure from these forms causes the orbit to fail to close: the perihelion moves around with each revolution. The 1PN correction in the orbit-averaged Schwarzschild metric introduces an effective extra 1/r^3

- **[q-state Potts Model on a 2D Square Lattice](../playgrounds/bsc-y2s1/FIS2014-potts-q-state-transition/index.html)** &nbsp; (verified, verified 2026-05-13T16:07:02Z)
  Each site of an L x L periodic square lattice holds a discrete spin s in {0, 1, ..., q - 1}. Energy: E = -J sum_{<i, j>} delta(s_i, s_j) with J = 1.

- **[Relativistic Beaming Pattern](../playgrounds/bsc-y3s2/AST3016-relativistic-beaming-azimuth/index.html)** &nbsp; (verified, verified 2026-05-13T16:07:02Z)
  A monochromatic source that emits isotropically in its rest frame. When the source moves at relativistic speed, the lab-frame emission is concentrated into a forward cone of half-angle ~ 1/gamma. The textbook beaming effect; it explains blazar variability and the brightness of AGN jets pointed near our line of sight.

- **[Rossler Funnel Attractor](../playgrounds/bsc-y2s2/FIS2021-rossler-funnel/index.html)** &nbsp; (verified, verified 2026-05-13T16:07:02Z)
  Otto Rossler's 1976 minimal continuous-time chaotic system. Three coupled first-order ODEs in (x, y, z) with one quadratic nonlinearity (z times x). Compared to Lorenz, the geometry is simpler: a near-planar spiral on the (x, y) plane with a single fold that lifts trajectories in z and drops them back near the origin. As the control parameter c increases, th

- **[Tidal Disruption Near a Massive Primary](../playgrounds/bsc-y2s1/AST2004-roche-tidal-disruption/index.html)** &nbsp; (verified, verified 2026-05-13T16:07:02Z)
  A cloud of 80 self-gravitating test particles ("a fluid satellite") on an eccentric orbit around a heavy point-mass primary. When the orbit takes the cloud inside the Roche radius, the tidal force from the primary overwhelms the satellite's self-gravity and stretches it into a stream. Outside the Roche radius the cloud holds together.

- **[t-SNE vs UMAP vs Isomap](../playgrounds/msc-y1/MAA-DM-tsne-vs-umap-vs-isomap/index.html)** &nbsp; (verified, verified 2026-05-13T13:50:00Z)
  A 3D dataset shown alongside three 2D embeddings of it. The Swiss roll is the classic "is your DR method nonlinear?" test: PCA squashes it because PCA only knows linear projections, Isomap unrolls it because it measures distances along the manifold, t-SNE clusters local neighborhoods but loses the global ordering. The two-blob dataset is easier and all three

- **[Attention as Soft Retrieval](../playgrounds/msc-y1/MAA-DM-attention-as-soft-retrieval/index.html)** &nbsp; (verified, verified 2026-05-13T12:54:00Z)
  Single-head scaled dot-product attention over a small key-value bank: w_i = softmax(Q . k_i / sqrt(d) / tau), output = sum w_i v_i. The left panel shows six keys in 2D; the query (red) can be dragged. The right panel shows the value bars colored by attention weight; the cat-3 bar is the weighted output. As temperature tau drops, attention concentrates on the

- **[Bayesian Coin Update](../playgrounds/msc-y1/MAA-DM-bayesian-coin-update/index.html)** &nbsp; (verified, verified 2026-05-13T12:43:00Z)
  Conjugate Beta-Binomial inference for the bias theta of an unfair coin. Prior Beta(alpha0, beta0); k heads in n flips; posterior Beta(alpha0 + k, beta0 + n - k). The plot overlays prior, normalized likelihood, and posterior, with a shaded 95 percent credible interval around the posterior mean.

- **[Henon Strange Attractor](../playgrounds/bsc-y2s2/FIS2021-henon-strange-attractor/index.html)** &nbsp; (verified, verified 2026-05-13T12:34:00Z)
  The Henon 1976 map x' = 1 - a x^2 + y, y' = b x. At the canonical (a=1.4, b=0.3) the iterates settle onto a strange attractor with maximum Lyapunov exponent ~ 0.4192 and box-counting dimension ~ 1.26. Tune a and b to walk through the period-doubling cascade and the Henon-Smale horseshoe regime.

- **[Strange Attractor Zoo](../playgrounds/bsc-y2s2/FIS2021-lorenz-attractor/index.html)** &nbsp; (verified, verified 2026-05-13T11:36:00Z)
  The Lorenz 1963 system: a three-variable truncation of the Saltzman convection equations, written

- **[MCMC Sampler Comparator](../playgrounds/msc-y1/MAA-ST-mcmc-comparator/index.html)** &nbsp; (verified, verified 2026-05-13T10:53:00Z)
  A 2D target density rendered as a contour map, with three Markov-chain Monte Carlo samplers running in parallel and laying down their accepted-state traces on the same plot. The user picks the target from a small bank (Gaussian, banana, Gaussian mixture, Neal's funnel) and the sampler triplet from {random-walk Metropolis, adaptive RWM, MALA, HMC}. A live rea

- **[Kepler Orbit Explorer](../playgrounds/bsc-y2s1/AST2004-kepler-orbit-explorer/index.html)** &nbsp; (verified, verified 2026-05-13T09:22:00Z)
  A test particle orbits a fixed central mass under inverse-square gravity in 2D. The system is the Newtonian Kepler problem in geometric units $GM = 1$ with the central mass at the origin and the test particle at $(x, y)$. The orbit is integrated by the velocity-Verlet branch of `shared/js/engine/symplectic.js`, which conserves total energy and angular moment

- **[Mandelbrot Rainbow Explorer](../playgrounds/bsc-y2s2/FIS2021-mandelbrot-explorer/index.html)** &nbsp; (verified, verified 2026-05-13T09:01:30Z)
  The Mandelbrot set $\mathcal{M} \subset \mathbb{C}$ is

- **[Rotation Curve Explorer](../playgrounds/bsc-y2s1/AST2004-rotation-curve-explorer/index.html)** &nbsp; (verified, verified 2026-05-13T08:43:00Z)
  A face-on synthetic spiral galaxy with a Hernquist bulge ($M_b = 10^{10} M_\odot$, $a_b = 0.5$ kpc) and a Miyamoto-Nagai disk ($M_d = 6 \times 10^{10} M_\odot$, $a_d = 4$ kpc, $b_d = 0.3$ kpc), seen from above. The same visible mass is present in all three models; what changes is the assumption about unseen mass.

- **[Schwarzschild Light Bending](../playgrounds/bsc-y3s2/AST3017-schwarzschild-geodesics/index.html)** &nbsp; (verified, verified 2026-05-13T08:35:00Z)
  A horizontal plane wave of photons enters from the left and encounters a non-rotating black hole of mass $M = 1$ in the equatorial plane. Geometric units $G = c = M = 1$. Each photon is a null geodesic with two conserved quantities (Killing vectors of the Schwarzschild metric): energy $E$ and angular momentum $L$. The orbital fate is determined entirely by t

- **[Three-Body Figure-Eight Choreography](../playgrounds/bsc-y2s1/AST2004-three-body-orbit/index.html)** &nbsp; (verified, verified 2026-05-13T06:59:03Z)
  Three equal masses $m_1 = m_2 = m_3 = 1$ interact under Newtonian gravity in 2D with $G = 1$. At the Chenciner-Montgomery initial condition (2000) the three masses chase one another on a single closed figure-eight curve, with period $T \approx 6.3259$. This is the most famous "choreography" solution of the planar three-body problem. The playground integrates

- **[Liouvillian Flow on the Pendulum Phase Space](../playgrounds/bsc-y2s2/FIS2021-liouvillian-flow/index.html)** &nbsp; (verified, verified 2026-05-13T06:34:16Z)
  A 1D pendulum is the simplest non-trivial Hamiltonian system: one degree of freedom, two-dimensional phase space (theta, p). Under Hamiltonian flow, phase-space volumes are preserved (Liouville's theorem), so an initial cloud of tracer particles traces out an evolving region whose area is invariant in time. The playground integrates N independent tracers und

- **[Lyapunov Spectrum via Benettin QR](../playgrounds/bsc-y2s2/FIS2021-lyapunov-spectrum/index.html)** &nbsp; (verified, verified 2026-05-13T06:24:18Z)
  The playground visualizes the full spectrum of Lyapunov exponents for the canonical Henon map, a 2D quadratic recurrence that is the archetypal discrete-time chaotic system. The map exhibits a strange attractor with complex mixing and sensitive dependence on initial conditions. Two panels display complementary views: the left panel shows the scatter of attra

- **[Double Pendulum Phase Portrait and Energy Conservation](../playgrounds/bsc-y1s1/FIS1013-double-pendulum/index.html)** &nbsp; (verified, verified 2026-05-13T02:28:59Z)
  A planar double pendulum consists of two rigid massless rods of lengths l1 and l2, joined at a pivot, with point masses m1 and m2 hanging from the free end of each rod. The system is suspended from a fixed support and evolves under gravity in two dimensions (the plane of the page). The state is described by two generalized coordinates: theta1, the angle of t

- **[Logistic Map Cobweb and Bifurcation Diagram](../playgrounds/bsc-y2s2/FIS2021-logistic-cobweb/index.html)** &nbsp; (verified, verified 2026-05-13T01:23:11Z)
  The playground visualizes the iterated logistic map on x in [0, 1] with parameter r in (0, 4]. The map is the archetypal discrete-time dynamical system exhibiting period-doubling bifurcations, the Feigenbaum cascade, and chaos. Two panels display complementary views: a cobweb diagram traces iterates from an initial condition x_0 via the graphical constructio

- **[Adding Angular Momenta - The Vector Model](../playgrounds/bsc-y3s1/FIS3003-angular-momentum-coupling-3d/index.html)** &nbsp; (verified)
  Two angular momenta of magnitudes j1 and j2 are added; the total J is observed in the vector model and the basis change is read off the Clebsch-Gordan table.

- **[Aperture Synthesis on the UV Plane](../playgrounds/msc-y1/MAA-OT-aperture-synthesis-uv-plane/index.html)** &nbsp; (verified)
  Five radio telescopes plotted on a procedural world map (continent outlines, no image texture): ALMA, VLA, Effelsberg, Metsahovi, JCMT. The sky-preview panel shows a three-source model (one bright dot + two fainter). As simulated time runs (one day per 10 s), each telescope pair traces an elliptical arc in the UV plane; the dirty image panel updates via 2D i

- **[Atwood Machine with a Massive Pulley](../playgrounds/bsc-y1s1/FIS1013-atwood-machine-constrained/index.html)** &nbsp; (verified)
  Two masses `m1`, `m2` hang from an inextensible massless rope over a pulley of mass `M`, radius `R` and moment of inertia `I`. The rope does not slip, so both masses share one coordinate and the pulley angular speed is `v/R`. Weight and tension force arrows (length proportional to force) are drawn on each block; the pulley carries a spinning spoke and its dr

- **[Bernoulli Air-Blower Ball](../playgrounds/bsc-y1s1/FIS1013-bernoulli-air-blower-ball/index.html)** &nbsp; (verified)
  A sphere of mass $m$ and radius $R$ sits in a turbulent free jet issuing from a nozzle whose axis can be tilted by an angle from vertical. The jet has a centreline speed that decays with distance and a Gaussian cross-section that spreads downstream.

- **[Biot-Savart 3D Field Explorer](../playgrounds/bsc-y1s2/FIS1014-biot-savart-3d-explorer/index.html)** &nbsp; (verified)
  Current-carrying wires (a straight wire, a loop, Helmholtz coils, a solenoid) sit in 3D. The magnetic field is computed at a lattice of sample points and drawn as arrow glyphs coloured by `|B|`, with field lines traced by integrating along `B` and the on-axis `Bz(z)` profile in a side panel. The wire is dashed and animated to show the current.

- **[Bouncing Shapes Concave Surface](../playgrounds/bsc-y1s1/FIS1013-bouncing-shapes-concave-surface/index.html)** &nbsp; (verified)
  Several point balls fall under uniform gravity into a concave bowl $y=f(x)$ chosen from a menu. Each contact reflects the velocity about the local tangent with a coefficient of restitution.

- **[Brownian Motion and the Diffusion Law](../playgrounds/bsc-y2s1/FIS2014-brownian-motion-diffusion/index.html)** &nbsp; (verified)
  A dilute suspension of Brownian particles released from a common origin in a two-dimensional fluid. Each particle performs an independent random walk driven by molecular collisions; one tracer is drawn large with its trail and the surrounding solvent agitation.

- **[Central-Force Orbit Gallery](../playgrounds/bsc-y1s1/FIS1013-central-force-orbit-gallery/index.html)** &nbsp; (verified)
  A unit-mass particle moves in a central potential `V(r) = k r^p` (with `k` signed so the well is attractive for every `p`; `p = 0` is the logarithmic potential). The orbit is drawn about a luminous force centre with a fading trail; a secondary panel shows the effective potential and the energy.

- **[Chandrasekhar Dynamical Friction](../playgrounds/msc-y1/MAA-GD-chandrasekhar-dynamical-friction/index.html)** &nbsp; (verified)
  A large perturber enters from the left through N=200 background particles drawn from a Maxwellian of dispersion sigma. Gravitational focusing pulls particles into an overdense wake trailing the perturber; the wake's pull decelerates it. The perturber speed readout decreases over time.

- **[Cosmic Distance Ladder Journey](../playgrounds/msc-y1/MAA-CO-cosmic-distance-ladder/index.html)** &nbsp; (verified)
  Click through four rungs of the distance ladder. Parallax: a nearby star swings against background, baseline 2 AU. Cepheid period-luminosity: a pulsating star with period 30 d, M_V from the Leavitt law. Type Ia: standard candle M_V = -19.3. Hubble flow: galaxy at z = 0.5, distance from D = cz/H_0.

- **[Cosmic-Ray Air Shower](../playgrounds/bsc-y3s2/FIS3030-cosmic-ray-air-shower/index.html)** &nbsp; (verified)
  Atmosphere is drawn as a gradient from dark space to ground. A primary cosmic ray streaks in from the top; the shower front then propagates downward and the Heitler cascade fans out into a bright-cored cone, colour-coded by particle energy (white at high energy near shower maximum, gold mid-cascade, blue once below the critical energy). The descending front 

- **[Dipole Radiation in 3D](../playgrounds/bsc-y2s2/FIS2006-dipole-radiation-3d/index.html)** &nbsp; (verified)
  An oscillating electric (or magnetic) dipole, or a centre-fed half-wave antenna, at the origin with its axis vertical. The radiated power flows outward through the far zone.

- **[Elastic Waves: P and S Modes in a Solid](../playgrounds/bsc-y2s1/FIS2002-elastic-wave-modes-solid/index.html)** &nbsp; (verified)
  A homogeneous isotropic elastic medium. A localised source (point force, explosive, or shear couple) excites body waves; a seismograph station off-axis records the ground motion.

- **[Fluid Painter: Lattice Boltzmann Sandbox](../playgrounds/bsc-y3s1/AST3014-fluid-painter-lattice-boltzmann/index.html)** &nbsp; (verified)
  Draw obstacles by click-drag; a 256 x 192 D2Q9 Lattice Boltzmann solver (running in a Worker) responds instantly. Visualize velocity magnitude with a viridis colormap and overlaid streamlines. Shift-drag injects a colored tracer dye that visualizes mixing. A circular obstacle produces a Von Karman vortex street; a sharp corner produces a Kelvin-Helmholtz rol

- **[Fresnel and Snell at an Interface](../playgrounds/bsc-y2s2/FIS2006-fresnel-snell-3d-interface/index.html)** &nbsp; (verified)
  A plane wave of chosen polarization strikes the boundary between two non-absorbing media of refractive indices n1 and n2 at a variable angle of incidence.

- **[Galaxy Merger N-Body](../playgrounds/msc-y1/MAA-GD-galaxy-merger-nbody/index.html)** &nbsp; (verified)
  Two Hernquist galaxies (800 tracer particles each, color-coded by initial galaxy) approach at user-chosen impact parameter and relative velocity. Each tracer feels the analytic potential of BOTH halos, while the halo centers integrate as a softened 2-body problem. Tidal tails, captured stars, bar instabilities, and a final mixed-color elliptical remnant emer

- **[Gravitational Lensing Caustics](../playgrounds/bsc-y3s2/AST3017-gravitational-lensing-caustics/index.html)** &nbsp; (verified)
  Drag up to four point-mass lenses; caustic curves (in amber) and critical curves (in white) are drawn analytically. A source position marker in the source-plane creates 2, 3, or 4 multiply-lensed images that update in real time. A background dot grid shears according to the lens map.

- **[Gravitational Microlensing Event](../playgrounds/bsc-y3s2/AST3017-gravitational-microlensing-event/index.html)** &nbsp; (verified)
  Top half is a 200-star procedural field; one star is the source (with a faint Einstein-radius ring), another is the lens moving across the field. As the lens approaches the source the user sees the two distorted images flanking it, an Einstein ring flash at zero impact parameter, and the characteristic Paczynski bump in the bottom-half light curve. A binary-

- **[Gravitational-Wave Chirp Sonification](../playgrounds/bsc-y3s2/AST3017-gravitational-wave-chirp-sonification/index.html)** &nbsp; (verified)
  A compact-binary inspiral. A compact strain $h(t)$ strip scrolls the chirp waveform (clamped so the post-Newtonian divergence near merger cannot flood the panel) and an $f(t)$ strip tracks the rising frequency. The main panel is a 3D inspiral: two perspective-shaded spheres orbit on an inclined plane at the barycentric Kepler separation $a \propto f_\mathrm{

- **[Gravity Assist Slingshot](../playgrounds/bsc-y1s1/FIS1013-gravity-assist-slingshot/index.html)** &nbsp; (verified)
  A Jupiter-scale planet orbits a central star. A spacecraft enters on a hyperbolic trajectory; the user drags the periapsis distance and the relative approach angle. Inset shows the symmetric hyperbola in the planet rest frame; main panel shows the asymmetric solar-system-frame trajectory. Velocity arrows before and after make the energy change explicit. Pres

- **[Hydrogen in Electric and Magnetic Fields](../playgrounds/bsc-y3s1/FIS3003-hydrogen-atom-stark-zeeman/index.html)** &nbsp; (verified)
  A hydrogen atom in a uniform magnetic field (Zeeman) and a uniform electric field (Stark), with a chosen emission transition observed in a synthetic spectrometer.

- **[Interactive 2D Heat Equation](../playgrounds/bsc-y2s1/FIS2014-heat-equation-2d-gpu/index.html)** &nbsp; (verified)
  A square slab of material with spatially varying thermal diffusivity `kappa(x, y)`, conducting heat between painted hot and cold regions or internal sources. The temperature field `T(x, y, t)` is the primary physical scene; conductive-flux streamlines `q = -kappa grad T` show where and how fast heat flows.

- **[Interactive Laplace Solver: Draw Your Own Conductors](../playgrounds/bsc-y1s2/FIS1014-laplace-solver-2d-interactive/index.html)** &nbsp; (verified)
  A grounded box encloses user-painted conductors. The electrostatic potential satisfies Laplace's equation in the charge-free region with Dirichlet data on every conductor; the electric field is `E = -grad phi` and is everywhere normal to the conductor surfaces.

- **[Magnetic Hysteresis: Domains and the B-H Loop](../playgrounds/bsc-y1s2/FIS1014-magnetic-hysteresis-bh-curve/index.html)** &nbsp; (verified)
  A ferromagnet under an oscillating applied field. The domain lattice reverses as a threshold-ordered wave that lags the field (the hysteresis); the B-H loop is traced alongside, its enclosed area the energy dissipated per cycle.

- **[Multipole Expansion: Exact vs Truncated Potential](../playgrounds/bsc-y1s2/FIS1014-multipole-expansion-3d/index.html)** &nbsp; (verified)
  A small cluster of point charges. Three maps of the `z = 0` potential slice are shown: the exact Coulomb sum, the multipole expansion truncated at the selected order, and the absolute error.

- **[Normal Modes of a Mass-Spring Chain](../playgrounds/bsc-y2s1/FIS2002-normal-modes-nd-chain/index.html)** &nbsp; (verified)
  A 1D chain of N point masses joined by springs with fixed ends. The monatomic chain has one spring constant; the diatomic chain alternates two spring constants along the chain (a two-atom basis).

- **[Pathfinding Dijkstra Astar](../playgrounds/bsc-y1s1/CC1017-pathfinding-dijkstra-astar/index.html)** &nbsp; (verified)
  A `cols x rows` grid is generated from a seed: building blocks and a diagonal river (with two bridges) become walls, a few piazzas cost 4, all other cells cost 1. Connectivity from start to goal is guaranteed.

- **[Poynting Vector: a Plane EM Wave in 3D](../playgrounds/bsc-y1s2/FIS1014-poynting-vector-wave-3d/index.html)** &nbsp; (verified)
  A monochromatic plane wave propagates along z. `E` oscillates in one transverse plane, `B` in the orthogonal one, and the Poynting vector `S = E x B / mu0` points along the propagation direction. Units are `c = 1`, `mu0 = 1`.

- **[Projectile with Drag and the Magnus Force in 3D](../playgrounds/bsc-y1s1/FIS1013-projectile-drag-magnus-3d/index.html)** &nbsp; (verified)
  A unit-mass ball is launched from the origin. Three copies fly simultaneously over an oblique-projected ground grid: vacuum (grey dashed), quadratic drag (amber) and drag plus Magnus (cyan). A spinning ball with a spin-axis arrow rides the Magnus path; landing markers show where each lands.

- **[Pulsar Dispersion Measure Dedispersion](../playgrounds/msc-y1/MAA-OT-pulsar-dispersion-measure/index.html)** &nbsp; (verified)
  Dynamic spectrum: frequency vertical (400 to 1600 MHz), time horizontal. The pulse arrives later at lower frequencies, tracing the classic $\propto f^{-2}$ DM sweep. Below, the dedispersed time series shifts each channel by the chosen DM and sums; correct DM gives a sharp narrow spike, wrong DM gives a smeared blob. Presets for Crab, B1937+21, Vela, FRB-like

- **[Quantum Double Slit, One Particle at a Time](../playgrounds/bsc-y2s2/FIS2003-quantum-double-slit-accumulator/index.html)** &nbsp; (verified)
  A source emits particles one at a time toward a barrier with two slits; each is detected as a single localised dot on a screen. An optional which-path detector at the slits records which path was taken.

- **[Quantum vs Classical Random Walk](../playgrounds/bsc-y3s2/FIS3029-quantum-random-walk/index.html)** &nbsp; (verified)
  Side-by-side: classical (binomial) on the left, Hadamard quantum walk on the right, both on a 101-site 1D lattice. The classical distribution is a Gaussian widening as $\sqrt{N}$; the quantum is the characteristic double-peaked distribution widening as $N$. Quantum amplitudes drawn with hue from phase, brightness from $|\psi|^2$. Bottom panel overlays both h

- **[Radioactive Decay Chain](../playgrounds/bsc-y2s2/FIS2003-nuclear-decay-chain-animation/index.html)** &nbsp; (verified)
  A radioactive parent nucleus decays through a chain of alpha and beta-minus steps until it reaches a stable lead isotope. The nucleus is drawn as a packed cluster of protons and neutrons; the Segre chart records the path in the (N, Z) plane.

- **[Rectangular Waveguide Modes](../playgrounds/bsc-y2s2/FIS2006-waveguide-mode-animator/index.html)** &nbsp; (verified)
  A hollow rectangular metallic waveguide of width a and height b (vacuum filled), excited in a chosen TE or TM mode at a variable frequency.

- **[Special Relativity Spacetime Lab](../playgrounds/bsc-y2s2/FIS2003-special-relativity-spacetime-lab/index.html)** &nbsp; (verified)
  A rigid rod (a train) of rest length L0 makes a round trip out to a coordinate distance L and back at speed beta (units c = 1). A twin rides the train; the other stays at the home station at x = 0.

- **[Stellar Habitable Zone](../playgrounds/msc-y1/MAA-SS-stellar-habitable-zone/index.html)** &nbsp; (verified)
  Move a planet between the inner and outer edges of the conservative HZ for a given star (T_eff, L). The planet surface displays ice (frozen), blue-green (liquid water), or steam (runaway) based on its equilibrium temperature with a fixed albedo.

- **[Stellar Oscillation Modes](../playgrounds/msc-y1/MAA-AS-stellar-oscillation-modes/index.html)** &nbsp; (verified)
  A stellar disk breathes, rings, and ripples according to the chosen spherical-harmonic mode $Y_l^m(\theta, \phi) \cos(\omega t)$. Sliders for radial order $n$, degree $l$, azimuthal order $m$ morph the surface pattern. Side panel shows the propagation diagram (Brunt-Vaisala and Lamb frequencies vs radius for an $n = 3$ polytrope) with the current mode freque

- **[TDSE Wavepacket Sculptor](../playgrounds/bsc-y3s1/FIS3003-tdse-wavepacket-sculptor/index.html)** &nbsp; (verified)
  A Gaussian wavepacket of chosen mean momentum launched into a chosen 1D potential: free space, infinite box, harmonic well, double well, periodic lattice, rectangular tunnelling barrier, or a delta spike.

- **[Tennis Racket Theorem](../playgrounds/bsc-y1s1/FIS1013-tennis-racket-theorem/index.html)** &nbsp; (verified)
  A torque-free rigid body with principal moments of inertia $I_1 < I_2 < I_3$. The angular velocity in the body frame obeys Euler's equations; the orientation is carried by a unit quaternion.

- **[The Heisenberg Uncertainty Seesaw](../playgrounds/bsc-y3s1/FIS3003-heisenberg-uncertainty-visualizer/index.html)** &nbsp; (verified)
  A normalised wavepacket of a chosen shape (Gaussian, box, triangle, double bump) presented simultaneously in position space and in momentum space, with a live squeeze.

- **[The Huygens Construction](../playgrounds/bsc-y2s1/FIS2002-huygens-construction-interactive/index.html)** &nbsp; (verified)
  A wavefront (a vertical aperture or a concave arc) is discretised into N coherent secondary point sources. Each radiates a circular wavelet; the superposition is the field downstream and the envelope is the reconstructed wavefront.

- **[The Photoelectric Effect](../playgrounds/bsc-y2s2/FIS2003-photoelectric-effect-simulator/index.html)** &nbsp; (verified)
  A phototube: monochromatic light of frequency nu illuminates a metal cathode of work function phi; ejected electrons cross to an anode held at an applied voltage V, and an ammeter reads the photocurrent.

- **[Thermodynamic Engine Simulator](../playgrounds/bsc-y2s1/FIS2014-thermodynamic-engine-simulator/index.html)** &nbsp; (verified)
  n moles of an ideal gas (gamma = 5/3) in a piston-cylinder, exchanging heat with hot and cold reservoirs as it runs a closed cycle. Molecule speeds scale with the live temperature; the piston position tracks the volume; the reservoirs glow when heat flows.

- **[Torque-Free Rigid Body (Euler's Equations) 3D](../playgrounds/bsc-y1s1/FIS1013-rigid-body-euler-3d/index.html)** &nbsp; (verified)
  A rigid body rotates freely in space with no applied torque. Its inertia tensor is diagonal in the body frame with principal moments `I1, I2, I3`. The body is drawn as the corresponding uniform-density inertia ellipsoid; the three principal axes are colour-coded arrows (red I1, green I2, blue I3). The angular-velocity vector omega is white, the conserved ang

- **[Two-Body Collision: Lab and CM Frames](../playgrounds/bsc-y1s1/FIS1013-collision-scattering-lab/index.html)** &nbsp; (verified)
  A projectile of mass `m1` scatters off a target `m2` initially at rest. The two-body problem reduces to one body of reduced mass `mu = m1 m2 / (m1+m2)` in a central potential. The CM-frame encounter is the primary scene; the lab trajectory, the potential profile and the differential cross-section are secondary panels.

- **[Van der Waals Condensation and the Maxwell Construction](../playgrounds/bsc-y2s1/FIS2014-van-der-waals-maxwell-construction/index.html)** &nbsp; (verified)
  A fixed amount of a van der Waals fluid in a piston-cylinder, held at a chosen reduced temperature, compressed and expanded along an isotherm. Below the critical point the fluid splits into coexisting liquid and vapour; the molecule rendering and the meniscus track the lever-rule liquid fraction.
