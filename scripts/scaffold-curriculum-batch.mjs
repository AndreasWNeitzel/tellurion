#!/usr/bin/env node
// scripts/scaffold-curriculum-batch.mjs
// Phase 2 of the UPorto curriculum reorganization.
// For each entry below, runs `bash scripts/scaffold.sh <slug>` (skips if folder
// already exists) then injects the curriculum frontmatter into the new spec.md.
// Each spec.md ends up with:
//   status: draft
//   primary_uc, supporting_ucs, curriculum_year
//   primary_citation: <bibkey>, chapter: <N>
// plus a one-line pitch at the bottom of the spec.md prose.

import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const FENCE = '-'.repeat(3);

// Each row: [slug, primary_uc, [supporting_ucs], curriculum_year,
//            primary_citation_key, chapter_ref, one-line pitch]
const ENTRIES = [
  // FIS1013 Mechanics (bsc-y1s1)
  ['inclined-plane-friction',           'FIS1013', [], 'bsc-y1s1', 'marion-thornton', '2', 'Coulomb-friction static-vs-kinetic transition exact'],
  ['elastic-inelastic-collisions-2d',   'FIS1013', [], 'bsc-y1s1', 'marion-thornton', '9', 'impulse and restitution coefficient exact'],
  ['coupled-pendulums-normal-modes',    'FIS1013', ['FIS2016'], 'bsc-y1s1', 'french-waves', '5', 'eigenmode frequencies; mode-mode beat period'],
  ['free-fall-stokes-vs-quadratic-drag','FIS1013', [], 'bsc-y1s1', 'marion-thornton', '2', 'Stokes terminal velocity vs Newton drag crossover'],

  // M1017 Real Analysis I (bsc-y1s1)
  ['epsilon-delta-continuity-visualizer','M1017', [], 'bsc-y1s1', 'arfken-weber', '1', 'delta-band reachable for every epsilon'],
  ['cauchy-sequence-convergence-monitor','M1017', [], 'bsc-y1s1', 'arfken-weber', '1', 'distance |a_n - a_m| < epsilon for n, m > N'],
  ['series-convergence-tests',          'M1017', [], 'bsc-y1s1', 'arfken-weber', '1', 'geometric, ratio, root, alternating-series partial sums'],

  // M1038 Linear Algebra and Analytic Geometry (bsc-y1s1)
  ['eigenvector-rotation-2x2',          'M1038', [], 'bsc-y1s1', 'arfken-weber', '3', 'eigenvector directions snap to axes under entry drag'],
  ['gram-schmidt-orthogonalization',    'M1038', [], 'bsc-y1s1', 'arfken-weber', '3', 'orthonormality verified to 1e-12'],
  ['svd-singular-values-2d-shape',      'M1038', [], 'bsc-y1s1', 'arfken-weber', '3', 'unit circle under M = U S V^T; singular values exact'],

  // CC1017 Programming I (bsc-y1s1)
  ['floating-point-precision-pitfalls', 'CC1017', ['FIS2018'], 'bsc-y1s1', 'newman2013', '4', 'catastrophic cancellation; 1 - cos(x) reformulation; rel err scaling'],
  ['big-o-empirical',                   'CC1017', ['FIS2018'], 'bsc-y1s1', 'newman2013', '4', 'N log N vs N^2 vs N^3 sorted comparisons on same input'],

  // FIS1014 Electromagnetism I (bsc-y1s2)
  ['method-of-images-2d',               'FIS1014', [], 'bsc-y1s2', 'griffithsem2017', '2', 'image-charge analytic potential within 1e-6'],
  ['capacitor-discharge-rc',            'FIS1014', [], 'bsc-y1s2', 'griffithsem2017', '7', 'V(t) = V_0 exp(-t / RC) to machine precision'],
  ['coulomb-equilibrium-charges',       'FIS1014', [], 'bsc-y1s2', 'griffithsem2017', '2', 'N-charge equilibrium; potential-energy minimum verified'],
  ['gauss-law-flux-through-surface',    'FIS1014', [], 'bsc-y1s2', 'griffithsem2017', '2', 'flux invariant under deformation of closed surface'],

  // FIS1015 Physics Laboratory I (bsc-y1s2)
  ['michelson-fringe-counter',          'FIS1015', ['FIS3019'], 'bsc-y1s2', 'hecht2017', '9', 'fringe count = 2 d / lambda within 0.5 percent'],

  // M1015 Analysis II (bsc-y1s2)
  ['line-integral-vs-path',             'M1015', [], 'bsc-y1s2', 'riley-hobson', '10', 'conservative vs non-conservative; path independence verified'],
  ['multiple-integral-fubini',          'M1015', [], 'bsc-y1s2', 'riley-hobson', '10', 'Fubini equality demonstrated numerically'],

  // FIS2013 Electromagnetism II (bsc-y2s1)
  ['larmor-radiation-pattern',          'FIS2013', [], 'bsc-y2s1', 'jackson1998', '14', 'sin^2(theta) pattern within 1 percent; relativistic correction'],
  ['lienard-wiechert-synchrotron',      'FIS2013', ['AST3016'], 'bsc-y2s1', 'jackson1998', '14', 'v / c sweep collapses beaming cone'],
  ['skin-effect-1d-conductor',          'FIS2013', [], 'bsc-y2s1', 'jackson1998', '8', 'penetration depth delta = sqrt(2 / (mu omega sigma)) exact'],
  ['transmission-line-impedance-matching','FIS2013', [], 'bsc-y2s1', 'jackson1998', '8', 'reflection coefficient zeros at matched load'],

  // FIS2014 Thermal Physics (bsc-y2s1)
  ['equipartition-from-collisions',     'FIS2014', [], 'bsc-y2s1', 'reif', '6', 'hard-disk thermalization; each DOF reaches kT / 2 within 2 percent'],
  ['adiabatic-vs-isothermal-pv',        'FIS2014', [], 'bsc-y2s1', 'callen', '3', 'two paths on PV diagram; entropy change exact for reversible'],
  ['engine-cycle-explorer',             'FIS2014', [], 'bsc-y2s1', 'callen', '4', 'Otto, Diesel, Stirling, Carnot side by side; efficiency closed-form'],

  // FIS2016 Waves and Continuous Media (bsc-y2s1)
  ['group-vs-phase-velocity',           'FIS2016', [], 'bsc-y2s1', 'crawford-waves', '6', 'dispersion relation drives envelope speed'],
  ['wavepacket-dispersion-1d',          'FIS2016', ['FIS3029'], 'bsc-y2s1', 'crawford-waves', '6', 'Gaussian wavepacket spreads as t / (m sigma_0^2) analytic'],
  ['transverse-vs-longitudinal-mode',   'FIS2016', [], 'bsc-y2s1', 'crawford-waves', '2', 'pulse speeds vs medium parameters exact'],

  // AST2004 Astrophysics (bsc-y2s1)
  ['kepler-orbit-elements',             'AST2004', [], 'bsc-y2s1', 'carroll-ostlie', '2', 'six orbital elements drive trajectory; Kepler 3rd law'],
  ['transit-mandel-agol-analytic',      'AST2004', ['MAA-SS'], 'bsc-y2s1', 'carroll-ostlie', '7', 'Mandel and Agol 2002 closed-form light curve'],
  ['radial-velocity-orbital-trace',     'AST2004', ['MAA-SS'], 'bsc-y2s1', 'carroll-ostlie', '7', 'RV semi-amplitude K from m, P, e, i closed-form'],
  ['stellar-blackbody-vs-line',         'AST2004', ['MAA-SP'], 'bsc-y2s1', 'carroll-ostlie', '3', 'Planck function plus Voigt absorption line analytic'],
  ['saha-boltzmann-ionization',         'AST2004', ['MAA-SP'], 'bsc-y2s1', 'carroll-ostlie', '8', 'Saha crossing T_ion within 1 percent'],
  ['jeans-instability',                 'AST2004', ['MAA-GD'], 'bsc-y2s1', 'carroll-ostlie', '12', 'lambda_J = sqrt(pi c_s^2 / (G rho)) exact'],
  ['bohr-hydrogen-spectrum',            'AST2004', ['FIS2017'], 'bsc-y2s1', 'carroll-ostlie', '5', 'Rydberg E_n = - 13.6 eV / n^2 exact'],

  // M2037 Analysis III (bsc-y2s1)
  ['vector-field-div-curl-visualizer',  'M2037', [], 'bsc-y2s1', 'riley-hobson', '10', 'div and curl computed pointwise on dragged 2D vector field'],
  ['stokes-theorem-2d-circulation',     'M2037', [], 'bsc-y2s1', 'riley-hobson', '10', 'contour integral equals surface integral of curl within 1e-10'],

  // FIS2017 Modern Physics (bsc-y2s2)
  ['compton-scattering-kinematics',     'FIS2017', [], 'bsc-y2s2', 'eisberg-resnick', '2', 'Delta lambda = (h / mc)(1 - cos theta) exact'],
  ['photoelectric-effect-threshold',    'FIS2017', [], 'bsc-y2s2', 'eisberg-resnick', '2', 'KE_max = h nu - phi linear above threshold'],
  ['de-broglie-wavelength',             'FIS2017', [], 'bsc-y2s2', 'eisberg-resnick', '3', 'lambda = h / p verified across regimes'],
  ['davisson-germer-diffraction',       'FIS2017', [], 'bsc-y2s2', 'eisberg-resnick', '3', 'Bragg peak at lambda = 2 d sin(theta) exact'],

  // FIS2018 Computational Physics (bsc-y2s2)
  ['root-finding-bisect-newton-secant', 'FIS2018', ['MAA-NM'], 'bsc-y2s2', 'newman2013', '6', 'quadratic vs linear convergence rates'],
  ['ode-solver-euler-rk4-rk45',         'FIS2018', ['MAA-NM'], 'bsc-y2s2', 'newman2013', '8', 'error scaling O(h), O(h^4), O(h^5) verified'],
  ['linear-system-direct-vs-iterative', 'FIS2018', ['MAA-NM'], 'bsc-y2s2', 'newman2013', '6', 'LU vs Jacobi vs Gauss-Seidel vs CG on same matrix'],

  // FIS2021 Analytical Mechanics (bsc-y2s2)
  ['lagrangian-vs-newtonian',           'FIS2021', ['FIS1013'], 'bsc-y2s2', 'goldstein-mech', '1', 'same constrained system, two formulations agree'],
  ['hamiltonian-phase-space-flow',      'FIS2021', [], 'bsc-y2s2', 'goldstein-mech', '8', 'flow preserves symplectic 2-form numerically'],
  ['liouville-phase-volume-conservation','FIS2021',[], 'bsc-y2s2', 'goldstein-mech', '9', 'integrated phase volume constant within 1e-6'],
  ['noether-symmetry-to-conservation',  'FIS2021', [], 'bsc-y2s2', 'goldstein-mech', '2', 'cyclic coordinate gives conserved momentum exact'],

  // AST3014 Fluids and Plasmas in Astrophysics (bsc-y3s1)
  ['bondi-accretion-spherical',         'AST3014', ['MAA-HE'], 'bsc-y3s1', 'frank-king-raine', '2', 'sonic-point analytic solution'],
  ['parker-solar-wind',                 'AST3014', [], 'bsc-y3s1', 'frank-king-raine', '2', 'transonic flow through critical point'],
  ['sedov-taylor-blastwave',            'AST3014', [], 'bsc-y3s1', 'shu-vol2', '18', 'self-similar r ~ t^(2/5) within 1 percent'],
  ['alfven-wave-mhd-1d',                'AST3014', ['MAA-PL'], 'bsc-y3s1', 'goedbloed-plasma', '7', 'phase velocity v_A = B / sqrt(mu_0 rho) exact'],

  // AST3015 Computational Astronomy (bsc-y3s1)
  ['kepler-equation-newton-iteration',  'AST3015', ['AST2004'], 'bsc-y3s1', 'carroll-ostlie', '2', 'converges quadratically from E_0 = M'],
  ['least-squares-orbit-fit-gauss',     'AST3015', ['MAA-ST'], 'bsc-y3s1', 'press2007', '15', 'chi^2 minimization on synthetic noisy ephemerides'],
  ['aperture-photometry-toy',           'AST3015', ['MAA-OT'], 'bsc-y3s1', 'press2007', '15', 'SNR analytic on synthetic Gaussian PSF'],

  // FIS3019 Optics and Photonics (bsc-y3s1)
  ['michelson-interferometer',          'FIS3019', ['MAA-OT'], 'bsc-y3s1', 'hecht2017', '9', 'visibility vs coherence length analytic'],
  ['fabry-perot-finesse',               'FIS3019', ['MAA-OT'], 'bsc-y3s1', 'hecht2017', '9', 'F = pi sqrt(R) / (1 - R); FSR = c / (2 n L)'],
  ['grating-resolving-power',           'FIS3019', ['MAA-OT'], 'bsc-y3s1', 'hecht2017', '10', 'R = m N; minimum resolvable wavelength'],

  // M3012 Mathematical Methods in the Sciences (bsc-y3s1)
  ['sturm-liouville-eigenfunctions',    'M3012', [], 'bsc-y3s1', 'arfken-weber', '8', 'orthogonality on weighted inner product'],
  ['green-function-1d-laplacian',       'M3012', [], 'bsc-y3s1', 'arfken-weber', '10', 'integral representation of solution exact'],
  ['fourier-vs-laplace-transform-pair', 'M3012', [], 'bsc-y3s1', 'arfken-weber', '15', 'reconstruction error vs sampling'],

  // AST3016 Radiative Processes (bsc-y3s2)
  ['bremsstrahlung-spectrum',           'AST3016', ['MAA-HE'], 'bsc-y3s2', 'rybickilightman1979', '5', 'nu^0 below cutoff; exponential rolloff above'],
  ['synchrotron-spectrum',              'AST3016', ['MAA-HE'], 'bsc-y3s2', 'rybickilightman1979', '6', 'nu^(1/3) below peak; exponential above'],
  ['compton-vs-inverse-compton',        'AST3016', ['MAA-HE'], 'bsc-y3s2', 'rybickilightman1979', '7', 'energy gain factor 4 gamma^2 / 3 in Thomson limit'],
  ['radiative-transfer-1d-slab',        'AST3016', ['MAA-SP'], 'bsc-y3s2', 'rybickilightman1979', '1', 'optically thick vs thin closed-form'],

  // AST3017 Relativistic Cosmology and Astrophysics (bsc-y3s2)
  ['friedmann-cosmography',             'AST3017', ['MAA-CS'], 'bsc-y3s2', 'liddle-cosmology', '4', 'H(z) from (Omega_m, Omega_Lambda); age of universe'],
  ['inflation-slow-roll',               'AST3017', ['MAA-CS'], 'bsc-y3s2', 'mukhanov-cosmology', '5', 'epsilon, eta slow-roll params drive n_s, r predictions'],
  ['distance-ladder-toy',               'AST3017', ['MAA-CS'], 'bsc-y3s2', 'liddle-cosmology', '5', 'parallax to Cepheid to SNIa logical chain'],
  ['bbn-light-element-toy',             'AST3017', ['MAA-CS'], 'bsc-y3s2', 'kolb-turner', '3', 'primordial abundance vs eta_B from rate equations'],

  // FIS3020 Condensed Matter Physics (bsc-y3s2)
  ['fermi-surface-2d-square',           'FIS3020', [], 'bsc-y3s2', 'ashcroft-mermin', '8', 'Fermi circle from 2D electron density'],
  ['bloch-oscillations',                'FIS3020', [], 'bsc-y3s2', 'ashcroft-mermin', '12', 'T_B = h / (e E a); Zener tunneling regime'],
  ['phonon-dispersion-1d-monatomic-diatomic','FIS3020',[],'bsc-y3s2','kittel-cm', '4', 'acoustic and optical branches; band gap analytic'],
  ['bcs-gap-self-consistent',           'FIS3020', [], 'bsc-y3s2', 'kittel-cm', '10', 'gap equation iterates to Delta(T); Tc analytic'],
  ['cooper-pair-binding-energy',        'FIS3020', [], 'bsc-y3s2', 'kittel-cm', '10', 'bound state for arbitrarily weak attractive coupling'],

  // FIS3028 Electrodynamics and Relativity (bsc-y3s2)
  ['relativistic-doppler',              'FIS3028', [], 'bsc-y3s2', 'jackson1998', '11', 'longitudinal vs transverse exact'],
  ['aberration-of-light-stellar',       'FIS3028', ['AST2004'], 'bsc-y3s2', 'jackson1998', '11', 'theta_prime minus theta vs v / c analytic'],
  ['thomas-precession',                 'FIS3028', [], 'bsc-y3s2', 'jackson1998', '11', 'Omega_T = (1 - gamma) / gamma Omega_orbit exact'],
  ['relativistic-collision-mandelstam', 'FIS3028', [], 'bsc-y3s2', 'jackson1998', '11', '4-momentum conservation closed-form'],

  // FIS3029 Quantum Mechanics II (bsc-y3s2)
  ['aharonov-bohm-flux-line',           'FIS3029', [], 'bsc-y3s2', 'sakurai2020', '2', 'topological phase e Phi / hbar exact'],
  ['addition-of-angular-momenta',       'FIS3029', [], 'bsc-y3s2', 'sakurai2020', '3', 'Clebsch-Gordan table for j1 x j2; orthonormality'],
  ['fine-structure-hydrogen',           'FIS3029', [], 'bsc-y3s2', 'sakurai2020', '5', '|Delta E| ~ alpha^2 E_n analytic perturbation'],
  ['zeeman-paschen-back-crossover',     'FIS3029', [], 'bsc-y3s2', 'sakurai2020', '5', 'weak vs strong field regimes'],

  // FIS3030 Physics of the Nucleus and Particles (bsc-y3s2)
  ['alpha-decay-gamow-tunneling',       'FIS3030', [], 'bsc-y3s2', 'krane-nuclear', '8', 'tunneling probability vs Q; Geiger-Nuttall'],
  ['nuclear-shell-model-magic-numbers', 'FIS3030', [], 'bsc-y3s2', 'krane-nuclear', '5', 'shell filling at 2, 8, 20, 28, 50, 82, 126'],
  ['semi-empirical-mass-formula',       'FIS3030', [], 'bsc-y3s2', 'krane-nuclear', '3', 'Bethe-Weizsacker fit to known binding energies'],
  ['nuclear-beta-decay-fermi-vs-gt',    'FIS3030', [], 'bsc-y3s2', 'krane-nuclear', '9', 'Sargent rule lifetime ~ Q^-5 scaling'],
  ['parton-distribution-toy',           'FIS3030', [], 'bsc-y3s2', 'griffiths-particles', '7', 'structure function from quark momenta'],
  ['ckm-mixing-unitarity-triangle',     'FIS3030', [], 'bsc-y3s2', 'griffiths-particles', '11', 'phases sum to pi; CP-violation magnitude'],

  // M3007 Differential Geometry (bsc-y3s2)
  ['parallel-transport-on-sphere',      'M3007', ['AST3017'], 'bsc-y3s2', 'carroll2019', '3', 'holonomy equals solid angle exact'],
  ['geodesic-deviation-equation',       'M3007', ['AST3017'], 'bsc-y3s2', 'carroll2019', '3', 'tidal stretching vs Riemann tensor exact'],
  ['curvature-tensor-2d-surfaces',      'M3007', [], 'bsc-y3s2', 'carroll2019', '3', 'Gauss-Bonnet integral over closed surface exact'],

  // MAA-GD Galactic Dynamics (msc-y1)
  ['jeans-isothermal-sphere',           'MAA-GD', [], 'msc-y1', 'binneytremaine2008', '4', 'density profile rho ~ r^-2 analytic'],
  ['dynamical-friction-chandrasekhar',  'MAA-GD', [], 'msc-y1', 'binneytremaine2008', '8', 'ln(Lambda) factor plus analytic decel'],
  ['orbits-in-axisymmetric-potential',  'MAA-GD', [], 'msc-y1', 'binneytremaine2008', '3', 'surface-of-section regular vs chaotic'],
  ['spiral-density-wave-dispersion',    'MAA-GD', [], 'msc-y1', 'binneytremaine2008', '6', 'Lin-Shu dispersion relation'],

  // MAA-SA Stellar Astrophysics (msc-y1)
  ['polytrope-lane-emden',              'MAA-SA', [], 'msc-y1', 'hansen-kawaler', '7', 'M-R relation for n = 0, 1, 3/2, 3 closed-form'],
  ['convection-mixing-length',          'MAA-SA', [], 'msc-y1', 'hansen-kawaler', '5', 'Schwarzschild criterion vs Ledoux'],
  ['nuclear-burning-rate-temperature',  'MAA-SA', [], 'msc-y1', 'hansen-kawaler', '6', 'pp, CNO, 3-alpha vs T scaling'],
  ['main-sequence-mass-luminosity',     'MAA-SA', [], 'msc-y1', 'hansen-kawaler', '8', 'L ~ M^3.5 from radiative envelope'],

  // MAA-AS Asteroseismology (msc-y1)
  ['p-g-mode-cavities',                 'MAA-AS', [], 'msc-y1', 'aerts-asteroseism', '3', 'Lamb plus Brunt frequency boundaries'],
  ['asymptotic-period-spacing',         'MAA-AS', [], 'msc-y1', 'aerts-asteroseism', '3', 'Pi_l = 2 pi^2 / sqrt(l (l + 1)) integral N / r dr'],
  ['rotational-splitting-multiplets',   'MAA-AS', [], 'msc-y1', 'aerts-asteroseism', '3', 'm-splitting linear in Omega within 1 percent'],
  ['mode-trapping-evolved-stars',       'MAA-AS', [], 'msc-y1', 'aerts-asteroseism', '7', 'oscillator coupling at glitches'],

  // MAA-CS Cosmology (msc-y1)
  ['linear-perturbation-growth',        'MAA-CS', [], 'msc-y1', 'mukhanov-cosmology', '7', 'D(a) growth factor analytic for LCDM'],
  ['baryon-acoustic-oscillation-toy',   'MAA-CS', [], 'msc-y1', 'mukhanov-cosmology', '8', 'sound horizon at recombination ~ 150 Mpc'],
  ['matter-radiation-equality',         'MAA-CS', [], 'msc-y1', 'liddle-cosmology', '4', 'z_eq from Omega_m / Omega_r'],
  ['cmb-power-spectrum-toy',            'MAA-CS', [], 'msc-y1', 'mukhanov-cosmology', '9', 'first acoustic peak at l ~ 220 analytic'],

  // MAA-OT Observational Techniques (msc-y1)
  ['point-spread-function-strehl',      'MAA-OT', ['FIS3019'], 'msc-y1', 'hecht2017', '11', 'Strehl ratio from aberration RMS'],
  ['speckle-pattern-statistics',        'MAA-OT', [], 'msc-y1', 'born-wolf', '10', 'exponential intensity histogram'],

  // MAA-SP Stellar Atmospheres and Spectra (msc-y1)
  ['eddington-grey-atmosphere',         'MAA-SP', [], 'msc-y1', 'hansen-kawaler', '3', 'T(tau) = T_eff (3 / 4 (tau + 2 / 3))^(1/4) exact'],
  ['voigt-profile-decomposition',       'MAA-SP', [], 'msc-y1', 'rybickilightman1979', '1', 'convolution of Lorentzian and Gaussian; equivalent width'],

  // MAA-SS Solar System and Exoplanets (msc-y1)
  ['secular-perturbation-laplace-lagrange','MAA-SS',[], 'msc-y1','murraydermott1999', '7', 'eigenfrequencies of inclination and eccentricity'],
  ['resonance-mean-motion-toy',         'MAA-SS', [], 'msc-y1', 'murraydermott1999', '8', 'libration vs circulation in 2:1 MMR'],

  // MAA-HE High-Energy Astrophysics (msc-y1)
  ['inverse-compton-scattering-cooling','MAA-HE', [], 'msc-y1', 'rybickilightman1979', '7', 'cooling time vs gamma analytic'],
  ['pulsar-wind-nebula-magnetization',  'MAA-HE', [], 'msc-y1', 'maggiore-gw', '6', 'sigma parameter spectrum'],

  // MAA-AB Astrobiology (msc-y1)
  ['habitable-zone-stellar-flux',       'MAA-AB', ['AST2004'], 'msc-y1', 'carroll-ostlie', '7', 'effective flux S_eff(T_eff) closed-form'],
  ['drake-equation-explorer',           'MAA-AB', [], 'msc-y1', 'carroll-ostlie', '7', 'drag each factor; histogram emerges from Monte Carlo'],
];

function patchSpec(content, primary, supporting, year, citationKey, chapter, pitch) {
  const lines = content.split('\n');
  if (lines[0] !== FENCE) throw new Error('expected YAML fence at start');
  let close = -1;
  for (let i = 1; i < lines.length; i += 1) {
    if (lines[i] === FENCE) { close = i; break; }
  }
  if (close < 0) throw new Error('no closing YAML fence');
  const supportingFmt = supporting.length === 0
    ? '[]'
    : `[${supporting.join(', ')}]`;
  const injection = [
    `primary_uc: ${primary}`,
    `supporting_ucs: ${supportingFmt}`,
    `curriculum_year: ${year}`,
    `primary_citation: ${citationKey}`,
    `primary_chapter: ${chapter}`,
  ];
  const out = [...lines.slice(0, close), ...injection, ...lines.slice(close)];

  // Append the curriculum pitch just below the placeholder note.
  const text = out.join('\n');
  const note = `\n\n## Curriculum pitch\n\nStrong invariant: ${pitch}. Primary citation: ${citationKey}, chapter ${chapter}. Spec body to be filled by playground-architect.\n`;
  return text + note;
}

let created = 0;
let already = 0;
let failed = [];
for (const row of ENTRIES) {
  const [slug, primary, supporting, year, cite, chapter, pitch] = row;
  const dst = path.join(ROOT, 'playgrounds', slug);
  let exists = false;
  try { await fs.access(dst); exists = true; } catch {}
  if (exists) { already += 1; continue; }
  const r = spawnSync('bash', [path.join(ROOT, 'scripts/scaffold.sh'), slug], { cwd: ROOT, encoding: 'utf-8' });
  if (r.status !== 0) {
    failed.push(`${slug}: ${r.stderr.trim()}`);
    continue;
  }
  const specPath = path.join(dst, 'spec.md');
  const raw = await fs.readFile(specPath, 'utf-8');
  const patched = patchSpec(raw, primary, supporting, year, cite, chapter, pitch);
  await fs.writeFile(specPath, patched);
  created += 1;
}

console.log(`Created: ${created}`);
console.log(`Already existed (skipped): ${already}`);
console.log(`Failed: ${failed.length}`);
for (const f of failed) console.log(`  ${f}`);
console.log(`Total entries: ${ENTRIES.length}`);
