# FCUP Physics Curriculum Bible: Build Backlog

Durable spec for the complete FCUP curriculum simulation suite (user
directive 2026-05-17). Build in curriculum order, heroes first within
each section, one genuinely-verified commit per playground, never stop
until the backlog is exhausted. Mark `[x]` when shipped (verified plus
committed). On 6-cycle failure: status `needs-attention`, note in
docs/NEEDS-ATTENTION.md, move on.

## Non-negotiable quality gates (per playground)

- Q1 AUTOPLAY: something physical moves within 3 s of load.
- Q2 DRAMA: at least one parameter regime is qualitatively different
  (phase transition, chaos, resonance, instability).
- Q3 PHYSICAL INSTANTIATION: primary canvas is a scene in physical
  space (particles, fields, orbits, structures, spectra, 3D objects),
  NOT a 2D cartesian curve. A curve is allowed only as a SECONDARY
  side panel. Strongly prefer literal 3D-perspective renders or n-body.
- Plus the standing per-playground recipe: node --check; sim.js with
  REAL invariants (no `1.0*=1-1e-9` stub); `interaction-probe.mjs`
  every control perceptibly effective; capture-reference 5 frames at
  60fps; view the screenshot (no overlap/clip/dead panel); promote
  golden frames; invariants pass; visual gate 5/5 x3 cross-process;
  cite a source in the header (rule 7/11). No em or en dash, no emoji,
  none of the guard-bash denylist words in commit text. Reseed RNG in
  any reset() for deterministic capture; wire a live readout (rule 6).
- Use existing shared engines and `shared/js/rng.js`; HTML from the
  template; KaTeX for math; renderers: webgl2 (heroes), canvas2d
  (standard), svg (diagrams).
- Iteration budget 6 cycles per playground. Stop conditions: 5
  consecutive needs-attention writes docs/HALTED.md; a hero failing 6
  cycles downgrades tier, keeps physics, simplifies renderer.

## Final integration phase (after sections built)

- A: update docs/CURRICULUM.md with FCUP mapping by code/year/sem.
- B: add `curriculum_year` frontmatter (e.g. `L:F-1Y-1S`, `M:EF-1Y-1S`).
- C: landing-page "Study by Course" grouping.
- D: run scripts/build-curriculum-index.mjs plus build-landing.mjs.
- E: write docs/CURRICULUM-BIBLE.md (coverage, study order).
- Commit: `feat(curriculum): FCUP physics Bible complete suite`.

---

## Section 1: F1006 Mecanica (L:F/L:EF 1Y-1S; Marion-Thornton, Kleppner)

- [x] rigid-body-euler-3d : hero webgl2. Torque-free tumbling ellipsoid,
  principal-axis arrows, body omega plus space L, polhode plus
  herpolhode trails, Dzhanibekov preset. Euler eqs RK4 dt=.005,
  quaternion qdot=0.5 q x [0,w]. Inv: E and |L|^2 conserved 1e-4 over
  1e4 steps; intermediate-axis flip under 5000 steps.
- [x] atwood-machine-constrained : medium canvas2d. Masses plus massive
  pulley, force arrows, v(t)/a(t). a=(m1-m2)g/(m1+m2+I/R^2). Inv: E
  1e-6; massless-limit classical 0.1%; T1=T2 massless.
- [x] central-force-orbit-gallery : medium canvas2d. Orbit trail, force
  centre, V_eff(r) with E line/turning pts; r^alpha slider. Symplectic
  Verlet. Inv: 1/r closed ellipse; E,L 1e-4; virial T=-V/2.
- [x] projectile-drag-magnus-3d : medium canvas2d 3D-proj. Vacuum/drag/
  drag+Magnus, spin axis. F=-mg-c|v|v+cM(w x v) RK4. Inv: vacuum=
  analytic parabola; Magnus perp v,w under 1e-12.
- [x] collision-scattering-lab : medium canvas2d. Lab vs CM frames,
  dsigma/dOmega polar, Rutherford overlay. mu reduction. Inv: p,E
  conserved; hard-sphere isotropic R^2/4; Rutherford 0.1%.

## Section 2: FIS1004 Eletromagnetismo I (1Y-2S; Griffiths, Purcell)

- [x] laplace-solver-2d-interactive : hero webgl2. Draw conductors, SOR
  relax phi (RdBu), E streamlines. omega=1.8. Inv: parallel plate
  E=V/d 1%; coax phi=A ln r+B 0.5%; E normal at conductors.
- [x] poynting-vector-wave-3d : hero webgl2. Plane EM wave, E(x)/B(y)
  ribbons, white S axis; linear/circular/standing. Inv: E perp B
  1e-12; |E|=c|B| 1e-6; S parallel k; standing nodes kz=n pi.
- [x] biot-savart-3d-explorer : advanced canvas2d 3D. Place wires, B
  glyphs viridis, presets wire/Helmholtz/solenoid/loop plus axial
  inset. Inv: divB<1e-4; Helmholtz dB/dz=0; solenoid mu0 n I 1%.
- [x] magnetic-hysteresis-bh-curve : medium canvas2d. BH loop traced,
  domain schematic, loop-area=loss. Jiles-Atherton. Inv: M=Mr at H=0;
  M=0 at |H|>Hc; area prop dissipation.
- [x] multipole-expansion-3d : medium canvas2d. Exact vs multipole vs
  error colormaps. Inv: error to 0 large r; monopole dominates q!=0;
  quadrupole r^-3.

## Section 3: FIS2001 Fisica Termica (2Y-1S; Callen, Reif)

- [x] thermodynamic-engine-simulator : hero canvas2d. Piston plus 200
  molecules (T-coloured), live PV, Sankey eta; Carnot/Otto/Diesel/
  Stirling; reverse=fridge. Inv: dU=Q-W <1e-3/cycle; eta<=1-Tc/Th;
  eta=0 at Tc=Th; Otto 0.5%.
- [x] heat-equation-2d-gpu : advanced canvas2d (viridis; webgl2 deferred
  per blind-build stop-condition). Paint kappa/source/heat/cold, flux
  streamlines, T(x) panel, CFL shown. Inv: heat conserved 0.1%;
  high-kappa faster at equal physical time; steady to Laplace 1%;
  composite gradient ratio; CFL bound. 6/6; probe pass; visual x3.
- [x] van-der-waals-maxwell-construction : advanced canvas2d, primary
  scene is a piston-cylinder with condensing molecules and a lever-rule
  meniscus; secondary p-V panel has the S-curve, Maxwell line and
  binodal/spinodal envelope. Inv 7/7: critical inflection 1e-9; Maxwell
  equal-area + equal end p 1e-4; binodal closure; spinodal nesting;
  mechanical stability; lever rule. probe pass; visual x3.
- [x] brownian-motion-diffusion : advanced canvas2d. 1600-walker
  diffusing cloud + buffeted tracer with trail; secondary MSD-vs-4Dt
  and displacement-vs-Gaussian panels; Stokes-Einstein D from T/eta/r.
  Inv 6/6: MSD=4Dt 5%; linearity; isotropy; KS<0.05; SE scaling;
  determinism. probe pass; visual x3.

## Section 4: FIS2002 Ondas e Meios Continuos (2Y-1S; French, Crawford)

- [x] wave-2d-complex-geometry : advanced canvas2d (5-pt leapfrog +
  sponge; webgl2/9-pt deferred per blind-build stop-condition). Shared
  wave-2d-cpu engine extended (barriers/slits/sponge/source) with zero
  hero regression; tanh water map; free/single/double/obstacle presets;
  screen-intensity panel. Engine inv 6/6 (wave speed, CFL, damped
  energy, slit-vs-wall, double-slit central+symmetry, hard-wall phase
  invert) + scene inv 6/6 (circular isotropy, transmission, obstacle
  shadow, damping). probe pass; visual x3.
- [x] huygens-construction-interactive : advanced canvas2d. N=1..100
  secondary wavelets, 2D superposition field + swept Huygens circles +
  reconstructed wavefront; flat aperture (sinc diffraction) vs concave
  arc (focus); sinc-envelope side panel. Inv 6/6: single-wavelet
  isotropy; sinc envelope; first min sin th=lam/a; coherent on-axis
  max; sinc symmetry; arc focusing gain. probe pass; visual x3.
- [x] elastic-wave-modes-solid : advanced canvas2d. Leapfrog vector
  elastodynamics; divergence map + deformed grid + analytic P/S rings;
  seismogram side panel with P-then-S delay; source force/explosive/
  shear. Inv 6/6: analytic speeds; P>S front; measured speeds within
  10%; mu->0 no S; seismograph delay d(1/vS-1/vP) within 20%; CFL.
  added landau-elasticity to bib. probe pass; visual x3.
- [x] normal-modes-nd-chain : advanced canvas2d. Oscillating N-mass
  chain (mono/diatomic) + clickable dispersion panel with shaded band
  gap; mode slider spans acoustic+optical. Inv 7/7: N ordered modes;
  omega_n closed form 0.1%; mode-shape nodes; Verlet matches omega 1%;
  energy conserved; diatomic endpoints exact; gap closes at K1=K2.
  probe pass; visual x3. Section 4 (FIS2002) complete.

## Section 5: FIS2003 Fisica Moderna (2Y-2S; Eisberg-Resnick, Tipler)

- [x] special-relativity-spacetime-lab : hero canvas2d. Physical
  contracting rod-train + twin clocks (round trip) primary; Minkowski
  diagram (light cone, simultaneity grid, bent twin worldline)
  secondary. Inv 8/8: gamma refs; s^2 invariant 1e-10; L=L0/2 at
  beta=.866; time dilation; twin gap exact; velocity addition + c
  invariant; Doppler reciprocity; relativity of simultaneity. added
  taylor-wheeler to bib. probe pass; visual x3.
- [x] quantum-double-slit-accumulator : hero canvas2d. One-by-one
  Born-sampled dots accumulate into fringes on a physical detection
  screen; which-path detector erases them; histogram-vs-|psi|^2 panel.
  Inv 6/6: fringe dy=lam L/d (zero-to-zero, bias-free) 1%; visibility
  1->0 ~ gamma; Born KS<0.02 + seed-determinism; envelope zeros;
  symmetry; lam/L/d scaling. probe pass; visual x3.
- [x] nuclear-decay-chain-animation : advanced canvas2d. Packed
  proton/neutron nucleus transmuting + emitted alpha/beta; Segre-chart
  path; SEMF Q-values + Geiger-Nuttall half-life; U-238 & Th-232
  series. Inv 6/6: mode transforms + A/charge conservation; SEMF B/A
  iron peak (Fe-56 3%); U-238 8a/6b -> Pb-206; chain exothermic;
  Geiger-Nuttall at fixed Zd; beta- m_n-m_H term. probe pass; visual x3.
- [x] photoelectric-effect-simulator : advanced canvas2d. Phototube
  (beam hue~nu, dense electron field~intensity, V-tinted gap) + I-V
  curve + Einstein line panels; 5 metals. Inv 6/6: K=hv-phi + threshold;
  no current below nu0 at any I/V; K indep of intensity; Einstein slope
  =h/e 1e-6 metal-indep; Isat prop intensity, cutoff indep; nu/phi
  trends. probe pass; visual x3. Section 5 (FIS2003) complete.

## Section 6: FIS2006 Eletromagnetismo II (2Y-2S; Griffiths8+, Jackson)

- [x] dipole-radiation-3d : hero canvas2d (3D projection; webgl2
  deferred per blind-build stop-condition). Rotating sin^2 donut +
  polarization texture + pulsing source + wavefronts; polar panel;
  electric/magnetic/antenna. Inv 7/7: pattern nulls/max/symmetry;
  Larmor=integral 0.2%; omega^4 & p0^2; 1/r^2 flux; orthogonal triad
  |E|=c|B|; D=3/2 vs antenna 1.64. probe pass; visual x3.
- [x] fresnel-snell-3d-interface : advanced canvas2d (webgl2 deferred
  per blind-build stop-condition). Power-width incident/reflected/
  refracted beams, Brewster extinction, TIR + evanescent skin,
  polarization-state inset, Fresnel R panel. Inv 6/6: Snell 0.01deg;
  Rp=0 at thetaB; R+T=1 1e-4; TIR R=1 + evanescent; normal-incidence
  coincidence; grazing/no-interface limits. probe pass; visual x3.
- [x] waveguide-mode-animator : advanced canvas2d. TE/TM transverse
  field map + longitudinal travelling/evanescent strip + cutoff
  spectrum panel. Inv 7/7: fc formula 0.1%; TE10 dominant (TE20=2x);
  propagating/evanescent/beta=0-at-cutoff; lambda_g divergence; TE/TM
  existence (TM11 lowest); wall BCs; size scaling. probe pass; visual
  x3. Section 6 (FIS2006) complete.

## Section 7: FIS3003 Mecanica Quantica I (3Y-1S; Griffiths, CT, Sakurai)

- [x] tdse-wavepacket-sculptor : hero canvas2d (webgl2 deferred per
  blind-build stop-condition). Crank-Nicolson TDSE on the shared
  cn-tridiag Thomas solver (zero regression, no prior users); phase-
  coloured |psi|^2 over V(x); barrier/free/HO/double/box/lattice/delta;
  <x>(t) trace. Inv 8/8: norm 1e-6; unconditional stability; lattice
  group velocity + Ehrenfest; coherent x0 cos(wt); energy 2e-3; HO
  ground state E=w/2; tunnelling R+T=1. probe pass; visual x3. Section
  7 (FIS3003) hero done.
- [x] heisenberg-uncertainty-visualizer : advanced canvas2d. Dual-
  space |psi(x)|^2 + |phi(k)|^2 packets with width bars + breathing
  seesaw + sx*sp gauge vs hbar/2 floor; gaussian/box/triangle/double.
  Inv 7/7: Gaussian =1/2 (2%); all >=1/2; non-Gaussian strictly above;
  squeeze tradeoff const product; FT unitary 1e-6; shift/boost
  invariance; scaling. probe pass; visual x3.
- [x] hydrogen-atom-stark-zeeman : advanced canvas2d. Term diagram
  (n=1..4 fanning, auto-normalised) + synthetic spectrum (Zeeman
  triplet / Stark multiplet) + transition selector. Inv 8/8: Rydberg
  ladder; no 1st-order Stark n=1 (quadratic only); n=2 +/-3 e a0 F;
  Zeeman mu_B B linear; Lorentz triplet; dl=+-1 |dm|<=1; zero-field
  degeneracy; Balmer-alpha triplet. probe pass; visual x3.
- [x] angular-momentum-coupling-3d : advanced canvas2d. 3D vector-
  model precession cones (J1+J2=J) + Clebsch-Gordan table (Racah) +
  allowed-J ladder. Inv 8/8: triangle+dimension; CG col & row
  orthonormal 1e-9; M=m1+m2 selection; Condon-Shortley tabulated
  values; exchange symmetry; vector-model geometry. probe pass;
  visual x3.
- [x] spin-bloch-sphere-dynamics : advanced canvas2d (webgl2 ->
  canvas2d 3D projection per stack rule). 3D Bloch sphere, Larmor
  precession, circularly polarized RF, detuned Rabi, instantaneous
  pi/pi-half pulses, predicted-orbit preview, lab/rotating frame.
  Inv 8/8: Rodrigues correctness; |S| 1e-9; free Larmor Sz/cone/phi;
  resonant pi inverts; pi/2 to equator; generalized off-resonance
  Rabi 2e-3; deepest-inversion bound; time-reversibility. probe pass
  (w0 2.97, w1 2.96, delta 2.24, frame 2.29); visual 5/5 x3.

## Section 8: FIS3008 Fisica Estatistica (3Y-1S; Reif, Pathria, Huang)

- [x] quantum-gas-statistics-visualizer : hero canvas2d (webgl2 ->
  canvas2d per stack rule). Autoscaled occupied g(e)n(e) curves for
  MB/FD/BE, Fermi sea, BEC spike + condensate bar, occupation-cells
  cartoon, cooling sweep through Tc. Inv 9/9: FD n(mu)=1/2; T->0 step
  + Sommerfeld mu; BE mu->0 at Tc + condensate fraction; classical
  limit; closed-form MB mu and 3kT/2; N conservation 1%; BE>MB>FD
  ordering. probe pass (tau 2.09, stat 2.21); visual 5/5 x3.
- [x] ising-2d-gpu-phase-transition : hero canvas2d (webgl2 ->
  144^2 canvas2d per stack rule). NEW shared engine
  shared/js/engine/lattice-mc.js (checkerboard Metropolis, Onsager
  helpers) + tests/engines/lattice-mc.test.mjs 9/9. Live lattice +
  Onsager m(T) curve + measured trail + chi + speed bar; quench on
  control change. Playground inv 6/6: Tc 0.5% + exact; M->+-1 T->0,
  E/spin->-2J; hot disorder; chi peak at Tc; |M| vs Onsager; beta=
  1/8. probe pass (T 10.73, speed 0.96, init 10.41); visual 5/5 x3.
  Bib: onsager1944, newman-barkema added.
- [x] renormalization-group-flow-1d : advanced canvas2d. Exact 1D
  Ising decimation RG (Goldenfeld Ch.9 recursion), (u=tanh K, h)
  flow field + fixed points + draggable trace + zero-field cobweb +
  live f_RG vs f_exact. Inv 8/8: zero-field K'=1/2 ln cosh 2K;
  brute-force decimation match 1e-10; (0,0) super-stable; K->0 no
  finite-T transition; T=0 unstable K'~K-ln2/2, h'~2h; xi halves
  (b=2); RG free energy = exact transfer matrix 1e-9. probe pass
  (k0 0.57, h0 0.63, n 0.54, view 2.55); visual 5/5 x3. Bib:
  goldenfeld, nelson-fisher1975 added.
- [x] md-lennard-jones-thermodynamics : advanced canvas2d. 300 LJ
  disks KE-coloured (viridis), periodic box, live g(r) + T + virial
  P + dE/N, reuses shared symplectic velocity-Verlet, shifted-force
  cutoff, melt sweep. Inv 8/8: LJ landmarks + shifted-force
  continuity; per-particle E drift 1e-3 (caught a real force-law
  bug: r^-2 vs r^-1); momentum 1e-8; no overlap >0.7; kinetic T;
  g(r) core/peak/->1; P=rho T 1e-9 no-interaction; determinism.
  probe pass (T 20.57, rho 15.63, speed 0.76); visual 5/5 x3. Bib:
  allen-tildesley added.

## Section 9: FIS3014 Optica (3Y-2S; Hecht, Born-Wolf)

- [x] fourier-optics-4f-system : hero canvas2d (webgl2/512^2 ->
  128^2 in-line radix-2 FFT per stack rule). 3 panels object |
  Fourier-plane log|F|+filter overlay | filtered image; object
  grating/aperture/double-slit/checker; filter none/low/high/slit.
  Inv 9/9: FFT vs DFT 1e-9; round-trip; Parseval; Hermitian;
  linearity; no-filter image=object 1e-7; low-pass blur+variance+
  energy-non-increasing; high-pass DC removed; mask shape. probe
  pass (rc 6.16, object 17.53, filter 1.21); visual 5/5 x3. Bib:
  goodman-fourier added.
- [x] fabry-perot-spectrometer : advanced canvas2d. Etalon Airy
  T(d) scan, Na doublet (D2 + line2), R-sweep splits the doublet,
  finesse/R_p/FSR/resolved readout. Inv 9/9: F*~312 R=.99; maxima
  T=1 delta=2m pi, minima 1/(1+F); R=0 T=1; bounds+2pi-periodic;
  exact FWHM 4 asin(1/sqrt F); FSR/order; R_p=mF* + Na resolves
  only high R with FSR>dl (caught FSR-vs-doublet subtlety); R
  sharpens. probe pass (R 5.38, d 2.59, dl 1.76); visual 5/5 x3.
- [x] laser-gaussian-beam-propagation : advanced canvas2d. ABCD
  q-parameter bench, beam envelope through a draggable lens, focus
  + waist markers, live zR/w0'/law/focus/theta. Inv 9/9: q=q0+z
  1e-12 + spot law; zR landmarks w(zR)=sqrt2 w0, R=2zR; collimated
  focus = lam f/pi w0 0.5%; ABCD composition; reversible; Gouy 0/
  pi-4/pi; resonator stable iff |(A+D)/2|<=1 with self-consistent
  mode; front->back focus imaging. probe pass (w0 11.66, f 24.60,
  zl 13.84, lam 6.51); visual 5/5 x3.
- [x] polarization-jones-calculus : advanced canvas2d. Polarization
  ellipse + Poincare sphere, 2-element Jones chain, live psi/chi/
  handed/intensity/DOP. Inv 9/9: Malus + polarizer idempotent;
  QWP45 lin->circ; HWP reflects 2b-a; wave-plate/rotator unitary;
  R(a)R(b)=R(a+b); S0^2=S1^2+S2^2+S3^2 DOP=1; chain=product; 2QWP=
  HWP + full-wave identity; ellipse classification. probe pass (ang
  0.66, a1 0.67, selects 0.72-0.84); visual 5/5 x3.

## Section 10: FIS3005 Materia Condensada (3Y-2S; Kittel, Ashcroft)

- [x] crystal-structure-3d-explorer : hero canvas2d (webgl2 ->
  hand-rolled 3D per stack rule). Rotating SC/BCC/FCC cell, shaded
  spheres, Miller plane, supercell, reciprocal view + G_hkl vector +
  BZ face label, powder XRD with selected-line highlight. Inv 9/9:
  bi.aj=2pi dij 1e-10; Vrec=(2pi)^3/Vdir; d100/110/111; SC/BCC/FCC
  absences + powder seq 1234/2468/3 4 8 11; atoms 1/2/4; Bragg
  consistency; BZ faces 6/12/14. probe pass (sc 21.8, lat 9.4,
  view 20.6, hkl 0.48); visual 5/5 x3.
- [x] semiconductor-pn-junction : hero canvas2d. Autoscaled band
  diagram (or charge+field) + live I-V + operating point, bias/
  doping sliders, depletion shading. Inv 9/9: I=0 V=0, I0(e^4-1) at
  4kT/q, -I0 reverse; Vbi>0 grows w/ doping; W~sqrt(Vbi-V) reverse
  widens/forward narrows/0 at Vbi; NA xp=ND xn neutral; triangular
  E both sides + drop=Vbi-V; band gap const + bending q(Vbi-V);
  Mott-Schottky 1/C^2 linear. probe pass (V 0.85, NA 5.22, ND 9.40,
  view 13.71); visual 5/5 x3. Bib: sze-devices added.
- [x] band-structure-tight-binding : advanced canvas2d. 1D / SSH /
  2D dispersion, filled-to-EF + DOS / Fermi-surface, fixed energy
  axis, SSH default. Inv 9/9: E=eps+-2t k=0/pi W=4t; 2pi-periodic
  even; v_g=0 edges + numeric dE/dk; m*=hbar^2/2ta^2; SSH gap
  2|t1-t2| chiral + 2x2 eigenvalue; 2D -4t/+4t/saddle 0; DOS
  norm+divergence; filling 0/1/half; 2D FS half-fill diamond.
  probe pass (t 1.20, dim 1.30, EF 10.31, lat 1.81); visual 5/5 x3.
- [x] superconductivity-meissner-3d : medium canvas2d (webgl2 ->
  hand-rolled per stack rule). Field-line cross-section expelled
  around the SC sphere, Bc(T) phase diagram (type II: Bc1/Bc2 +
  vortex region), Abrikosov vortices, fixed B axis + B0-scaled line
  density. Inv 9/9: B=0 inside; normal=B0 uniform; Br(R)=0 &
  |Bt|=3/2 B0 sin; far->B0; Bc parabola; London exp; Phi0=h/2e;
  type I/II kappa=1/sqrt2 Bc1<Bc2; Abrikosov 1 Phi0/cell ~B^-1/2.
  probe pass (T 21.8, B 12.1, bc0 1.22, type 1.80); visual 5/5 x3.
  Bib: tinkham added.

## Section 11: Mecanica Analitica (3Y-2S; Goldstein, Landau)

- [x] lagrangian-field-sandbox : hero canvas2d (placed FIS2021 in
  bsc-y2s2, the real Analytical-Mechanics UC; Section 11 "3Y-2S" is
  a backlog grouping). Pendulum/double/spring/Kepler EL systems via
  shared RK4 (ode-rk), animated mechanism + filled phase portrait +
  Noether readouts; pre-integrated preview, fixed phase scale, speed
  bar. Inv 8/8: small-T pendulum 2pi sqrt(l/g) 0.5%; EL rhs exact;
  H conserved all systems 1e-3; rot-symmetry<->L 1e-4 (broken by g);
  double modes; reversible; libration/rotation; determinism. probe
  pass (g 1.08, amp 4.26, speed 1.06, sys 4.21); visual 5/5 x3.
- [x] hamilton-jacobi-action-angle : advanced canvas2d (FIS2021
  bsc-y2s2). Phase orbit + shaded action area beside the
  action-angle circle r=sqrt(2J), Verlet, adiabatic ramp. Inv 9/9:
  harmonic J=E/w0 contour 0.1%; isochronous omega=w0; circle
  sqrt(2J) 1e-6; theta uniform = w0 dt; pendulum anharmonic; E<->J
  inversion; J=area/2pi; adiabatic |dJ/J|<2% while |dE/E|>40%.
  probe pass (E 11.55, w0 9.15, pot 1.17); visual 5/5 x3.
- [x] canonical-transformation-visual : medium canvas2d (FIS2021
  bsc-y2s2). Phase blob + image under hoScale/rotation/squeeze/
  point/identity/pDouble, {Q,P} + area-ratio readouts, deforming
  lattice. Inv 8/8: {Q,P}=1 canonical 1e-10 / =2 pDouble; area
  preserved; ellipse->circle r=sqrt(2E/w); M^T J M=J 1e-12;
  composition/inverse closure; canonical!=symmetry (squeeze keeps
  {,}=1 but changes H); shoelace exact. probe pass (par 6.39, E
  11.42, map 7.66); visual 5/5 x3.
- [x] kam-theory-poincare-section : advanced canvas2d (FIS2021 bsc-y2s2). Chirikov standard map Poincare section, golden torus, K-sweep through Kc. Inv 9/9: det J=1; K=0 conserved+straight; invertible; golden bounded<Kc diffuses>Kc; (pi,0) elliptic 0<K<4; diffusion blocked sub-Kc; determinism. probe pass (K 11.16, orb 15.92, it 12.38); visual 5/5 x3.

## Section 12: Mecanica de Fluidos (3Y; Munson, White, Batchelor)

- [x] navier-stokes-2d-gpu-fullscreen : hero webgl2. 512x384 NS, draw
  obstacles, vorticity colormap, Re sweep (Stokes/von Karman/turb),
  tracers, St. Chorin. Inv: divu<1e-3; St~0.2 Re=100 15%; symmetric
  Re to 0; bounded Re<1000.
- [x] rayleigh-benard-convection : advanced webgl2. Heated layer, rolls
  above Ra_c=1707, Nu. Boussinesq. Inv: no convection Ra<Rac; rolls
  just above; Nu to 1 at Rac.
- [x] bernoulli-venturi-interactive : medium canvas2d. Variable pipe,
  v prop 1/A, p columns, airfoil lift. Inv: Bernoulli const 0.1%; Av
  const.
- [x] vortex-dynamics-2d : medium canvas2d. Point vortices, dipole
  translate, streamlines. Inv: circulation conserved; pair v=G/2pi d;
  H 0.1%.

## Section 13: FIS3007 Plasmas (3Y opt; Bittencourt, Freidberg)

- [x] single-particle-em-drift-3d : hero webgl2. Charged particle in
  B/E, presets cyclotron/ExB/grad-B/curvature/mirror, helix trail.
  F=q(E+v x B). Inv: |v| const pure B; ExB dir; mirror reflect
  vperp2/v2=B0/Bmax.
- [x] plasma-waves-dispersion : advanced canvas2d. log w-k modes (O/X/
  Langmuir/ion-acoustic/Alfven), cutoffs/resonances, pulse decompose.
  Inv: O-mode w=wp k=0; X stop-band; wp formula.
- [x] two-stream-instability-pic : advanced canvas2d. UPGRADE existing
  two-stream-instability-1d-pic: add E(t) spectrogram, g=wp/2sqrt2
  mark, phase-space vortex colour trails.

## Section 14: M:EF Nanotech (M:EF-1Y; Callister, Kittel)

- [x] quantum-confinement-nanostructure : advanced canvas2d. well/wire/
  dot 3D box plus DOS (E^.5/step/spike/delta) plus absorption.
  En=hbar2 pi2 n2/2mL2. Inv: L to inf bulk DOS; E2-E1=3E1; gap up L
  down.
- [x] nanofabrication-lithography-resolution : medium canvas2d. Reticle
  to aerial image FFT, lam EUV/DUV/i-line, Rayleigh k1 lam/NA. Inv:
  Rayleigh 5%; smaller lam sharper.
- [x] afm-stm-surface-interaction : medium canvas2d. Tip scans surface,
  LJ V(d), tapping amplitude, STM I prop e^-2kd. Inv: STM x10 per 1A.

## Section 15: M:EF Optical/Lasers (FIS4035/4027/4036; Saleh-Teich)

- [x] laser-rate-equations-dynamics : hero canvas2d. Medium plus levels,
  N1/N2 bars, photon phi(t), 3 regimes, resonator, P-vs-pump kink,
  Q-switch giant pulse. Inv: below thr phi to 0; above N2-N1=1/sct 1%;
  Q-switch energy prop inversion 5%.
- [x] jaynes-cummings-model : advanced canvas2d. 2-level atom in cavity,
  Rabi collapse/revival, Wigner, P(n). Inv: collapse/revival Eberly 1%;
  Pg+Pe=1; On=g sqrt(n+1).
- [x] nonlinear-optics-shg : advanced canvas2d. SHG growth, phase match
  dk=0 z^2 vs coherence length, Sellmeier. Inv: photon conserved; dk=0
  I2w prop z^2; eta<100%.
- [x] optical-fiber-modes-dispersion : medium canvas2d. Fiber modes
  |E|^2, beta-w, V<2.405 single-mode, GVD pulse broaden. Inv: LP11
  cutoff V=2.405 0.1%.

## Section 16: M:EF Semiconductors/Spintronics (F4029/FIS4026; Neamen)

- [x] mosfet-operation-animated : advanced canvas2d. MOSFET x-section,
  inversion channel, pinch-off, ID-VDS regions. Inv: ID<1e-6 Isat
  below Vth; lin/sat boundary VDS=VGS-Vth 0.1%.
- [x] gmr-spin-valve-simulator : advanced canvas2d. FM/NM/FM two-current,
  P low-R AP high-R, GMR hysteresis, TMR Julliere. Inv: P<AP; GMR>0;
  Julliere 1%.
- [x] solar-cell-generation-iv : medium canvas2d. Cell, photon rain,
  e-h pairs, IV plus power, FF/eta, AM0/1.5. Inv: Voc<Eg/q; SQ limit;
  V=0 I=Isc; I=0 Voc.

## Section 17: M:F Adv QM (Sakurai, CT II, Merzbacher)

- [x] scattering-theory-differential-cross-section : hero canvas2d 3D.
  Incident plane wave plus scattered spherical, dsigma/dOmega surface
  of revolution, partial-wave bars, delta_l, sigma_tot. Inv: optical
  thm Im f(0)=k sig/4pi 0.1%; hard-sphere sig to pi a^2; Born=FT[V].
- [x] dirac-equation-relativistic-hydrogen : advanced canvas2d.
  Schrodinger vs Dirac levels, fine structure, Z slider,
  Zitterbewegung. Inv: ground -13.6eV 0.01%; FS prop a^4 prop Z^4.
- [x] second-quantization-bosons-fermions : advanced canvas2d. Level
  rungs, adag/a operators, Fock kets, (anti)commutators. Inv: boson
  a|n>=sqrt n|n-1>; fermion a|1>=|0>,a|0>=0.

## Section 18: M:F GR and Cosmology (Carroll, MTW, Wald)

- [x] geodesics-curved-spacetime-3d : hero webgl2. Schwarzschild (photon
  sphere 3M, ISCO 6M, capture)/Kerr (frame drag, ergosphere, Penrose)/
  FLRW (expansion, horizon). Geodesic Gamma eqn. Inv: bc=3 sqrt3 M
  0.1%; ISCO 6M; E,L conserved; FLRW v=H0 d 1%. NB per memory
  feedback-bh-no-2d-fbm-under-lensing: NO 2D FBM in (x,z)/equirect;
  procedural stars plus pure-azimuthal disk noise.
- [x] gravitational-wave-detector : advanced canvas2d. LIGO arms, h(t)
  strain, chirp, matched filter peak. Inv: chirp mass 0.1%; h~1e-21
  30+30Msun 400Mpc.
- [x] friedmann-expansion-multicomponent : medium canvas2d. Expanding
  galaxy grid, H(t), Omega bands, eras, horizons. Inv: a=1 H=H0 0.01%;
  age 13.8Gyr 1%.
- [x] inflation-quantum-fluctuations : advanced canvas2d. Inflaton field
  plus fluctuations stretched superhorizon, V(phi) roll, P_s(k). Inv:
  ns~0.965 1%; near scale-invariant.

## Section 19: M:F QFT (Peskin, Srednicki, Zee)

- [ ] klein-gordon-wavepacket-mass : medium canvas2d. KG packet, vg=
  pc^2/E<c, w^2=k^2+m^2. Inv: vg<1; causal; m=0 dispersion-free.
- [ ] casimir-effect-zero-point-energy : medium canvas2d. Plates, allowed
  modes, missing modes red, F~d^-4 log-log. Inv: F prop d^-4 0.1%;
  1.3e-3 Pa at 1um 1%.
- [ ] symmetry-breaking-mexican-hat : medium webgl2. V(|phi|) 3D, ball
  rolls to brim, Goldstone vs Higgs, T restores symmetry. Inv: min at
  v=sqrt(mu2/2lam) 0.1%; mH=sqrt(2 mu2).

## Section 20: M:F Particle Physics (Griffiths, Halzen-Martin)

- [ ] standard-model-particle-zoo : hero canvas2d. SM chart, click cards
  (mass/spin/charge/lifetime), force toggle, decay-chain animator. PDG
  embedded. Inv: charge/lepton/baryon conserved; PDG matched.
- [ ] feynman-diagram-builder-qed : advanced canvas2d. Draw vertices/
  lines, topology plus alpha power plus Feynman rules, |M|^2, sigma.
  Inv: sigma to 0 threshold; s+t+u=sum mi^2.
- [ ] particle-accelerator-betatron : medium canvas2d. Synchrotron,
  dipole/quad/RF, phase-space emittance ellipse, tune resonance. Inv:
  Q=integer unstable; emittance conserved symplectic; dp/dt=qvB.

## Section 21: M:A_ASTR Stellar (Carroll-Ostlie, Kippenhahn)

- [ ] stellar-structure-full-model : hero webgl2. 3D sliced star (core/
  radiative/convective bubbling/photosphere) plus T,rho,P,L profiles
  plus eps(r) pp/CNO/3a plus HR dot on ZAMS. Shooting. Inv: P0~1e16Pa
  x2; T0~1.5e7K 20%; L=Lsun 5%; Schwarzschild gradient.
- [ ] binary-star-mass-transfer : advanced canvas2d. Roche lobes fig-8,
  overflow stream/disk, period change; stable/CE/detached. Inv:
  Eggleton rL 0.5%; J conserved 1%.
- [ ] neutron-star-tov-equation : advanced canvas2d. TOV integrate, EOS
  stiff/soft/quark, M-R diagram, 2Msun line. Inv: soft Mmax<stiff;
  rhoc to 0 M to 0; free Fermi 0.71Msun 5%.

## Section 22: M:FM Medical Physics (Khan, Bushberg, Podgorsak)

- [ ] ct-reconstruction-lab : hero canvas2d. Phantom, rotating gantry
  sinogram fill, FBP progressive (5 vs 180 angles), filter selector,
  vs MLEM. Radon/FBP Ram-Lak. Inv: Radon linear; FBP exact point;
  SNR~sqrt N; MLEM converges.
- [ ] mri-bloch-equations-k-space : hero canvas2d. Bloch sphere spin,
  FID plus spectrum, k-space fill, 2D iFFT image; T1/T2 presets, SE vs
  GE. Inv: TR>>T1 Mz to M0; S prop rho e^-TE/T2 (1-e^-TR/T1); |M|
  1e-10.
- [ ] proton-therapy-bragg-peak : advanced canvas2d. Proton depth-dose
  Bragg peak vs X-ray, SOBP superposition. Bethe-Bloch R prop E^1.77.
  Inv: R prop E0^1.77 2%; peak at range 1mm; no dose beyond.
- [ ] monte-carlo-photon-transport : advanced canvas2d. Tissue slab,
  photon histories (Compton/PE/Rayleigh colours), dose map, Web Worker.
  Inv: high-E Compton, low-E PE; lambda 2%; build-up.
- [ ] radiation-dosimetry-detector : medium canvas2d. Ion chamber,
  Compton recoil e, ion pairs drift, Q, Bragg-Gray. Inv: W ICRU 1%;
  collection to 1 high V; D prop QW.

## Section 23: Cross-curricular / Math Methods (M2009)

- [ ] pde-zoo-interactive : hero webgl2. 5 tabs (wave/heat/Laplace/
  Schrodinger/Navier-Stokes) shared GPU engine, paint IC/BC, analytic
  vs numeric vs error. Cross-link to laplace/tdse/NS heroes.
- [ ] fourier-series-convergence-gibb : medium canvas2d. Target vs
  N-term sum plus epicycles, Gibbs 8.9% arrow. Inv: Parseval 0.1%;
  Gibbs 8.9% 1%.
- [ ] green-function-propagator : advanced canvas2d. Source f(x), u=
  integral G f, draggable tent G(x,x'), Dirichlet. Inv: G symmetric;
  G(0)=G(L)=0; ODE 1e-4.
