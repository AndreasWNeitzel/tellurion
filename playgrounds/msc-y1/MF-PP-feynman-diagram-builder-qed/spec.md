---
title: "QED Feynman Diagram: e+e- to mu+mu-, |M|^2 and the Cross Section"
slug: feynman-diagram-builder-qed
status: verified
audience: portfolio
created: 2026-05-18
primary_uc: MF-PP
supporting_ucs: []
curriculum_year: msc-y1
primary_citation: peskin-schroeder
hook: 'The textbook QED process e+e- -> mu+mu-: two vertices, one virtual photon, an amplitude proportional to alpha and a cross section proportional to alpha^2; it vanishes at the muon-pair threshold, peaks just above it and then falls as 1/s, with a forward-backward-symmetric 1 + cos^2 angular distribution and the exact kinematic identity s + t + u = sum of the external masses squared.'
one_paragraph: 'A tree-level QED playground for e+e- -> mu+mu- (Peskin and Schroeder Ch. 5; Halzen and Martin Ch. 6; Feynman 1949). Panel A draws the s-channel Feynman diagram and reads off the Feynman-rule bookkeeping: each vertex carries a factor e, so a V-vertex amplitude scales as alpha^{V/2} and |M|^2 as alpha^V; a one-loop variant inserts a vacuum-polarisation bubble (four vertices, alpha^4, suppressed by alpha^2 relative to the tree). Panel B plots the total cross section sigma(sqrt s) in nanobarns on log-log axes: it is exactly zero below sqrt s = 2 m_mu, rises through the muon-pair threshold to a peak, then falls as a straight power-law line (sigma ~ 1/s). Panel C shows the Mandelstam invariants with the exact identity s + t + u = 2 m_e^2 + 2 m_mu^2 and the differential cross section dsigma/dOmega, which is even in cos(theta) (forward-backward symmetric) and tends to 1 + cos^2(theta) ultrarelativistically, becoming isotropic near threshold. The numerics are the gate-tested closed-form sim.js: the standard tree matrix element and two-body phase space, deterministic with no RNG. Invariants check the Mandelstam identity, the threshold turn-on, the 1/s scaling and the point cross section, the alpha^V vertex bookkeeping, the forward-backward symmetry and the consistency of the integrated angular distribution with the total cross section.'
tags: [particle-physics, qed, feynman-diagram, cross-section, live-readout]
difficulty: 4
tier: standard
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 4
share_state_keys: [e, th, order]
---

# QED Feynman Diagram: e+e- to mu+mu-, |M|^2 and the Cross Section

## Physical setup

The reaction is electron-positron annihilation into a muon pair, e+ e- -> mu+ mu-, in the centre-of-mass frame. At leading order in QED a single Feynman diagram contributes: the e+ e- pair annihilates at a vertex into a virtual photon (the s-channel propagator, with q^2 = s), which materialises into the mu+ mu- pair at a second vertex. The muon is treated as a structureless Dirac particle; the only interaction is the QED vertex, coupling e = sqrt(4 pi alpha). Energies are in GeV (natural units); the cross section is reported in nanobarns using 1 GeV^-2 = 0.389 mb.

A one-loop variant illustrates perturbative order: a vacuum-polarisation fermion loop is inserted into the photon propagator, adding two further vertices. With V vertices the amplitude scales as alpha^{V/2}, so the four-vertex diagram is down by alpha^2 ~ 1/137^2 relative to the tree.

## Governing equations

Muon velocity in the CM frame (Peskin and Schroeder Eq. 5.13):

  beta = sqrt(1 - 4 m_mu^2 / s),   s = (sqrt s)^2.

Mandelstam invariants at scattering angle theta, with the exact kinematic identity:

  s + t + u = 2 m_e^2 + 2 m_mu^2.

Total tree cross section (Peskin and Schroeder Eq. 5.13; Halzen and Martin Eq. 6.27):

  sigma = (4 pi alpha^2 / 3 s) * beta * (3 - beta^2) / 2,

which is zero for sqrt s <= 2 m_mu and tends to the point cross section 4 pi alpha^2 / 3 s as beta -> 1.

Differential cross section (Peskin and Schroeder Eq. 5.12):

  dsigma/dOmega = (alpha^2 beta / 4 s) [ 1 + cos^2(theta) + (1 - beta^2)(1 - cos^2(theta)) ],

even in cos(theta) and reducing to the 1 + cos^2(theta) shape ultrarelativistically. Integrating over the solid angle reproduces sigma above.

Feynman-rule bookkeeping: the amplitude exponent of alpha is V/2, and |M|^2 ~ sigma ~ alpha^V for V vertices.

## Numerical method

No time integration and no random numbers: every quantity is a closed-form evaluation of the formulas above (`sim.js`). The angular distribution is integrated with composite Simpson over cos(theta) in [-1, 1] purely as an internal consistency check against the analytic total. The cross-section curve is sampled on 600 points in sqrt s and drawn on log-log axes so the threshold turn-on, the peak and the power-law (1/s) tail are all visible in one frame. Deterministic; seed not applicable.

## Controls

- `e`: centre-of-mass energy sqrt s, 0.22 to 20 GeV (slider value is sqrt s x 100). Moves the operating point along the cross-section curve and rescales the Mandelstam invariants and the angular anisotropy.
- `th`: scattering angle theta, 5 to 175 degrees. Moves the marker on dsigma/dOmega and sets the t / u split (t = u at 90 degrees).
- `order`: tree (2 vertices, alpha^2) or one-loop (4 vertices, alpha^4). Switches the diagram topology and the alpha-power readout.
- Reset, Pause/Play. Pause freezes the travelling-charge animation; the physics is static.

## Expected qualitative features

- The s-channel diagram with two labelled vertices, fermion arrows and a wavy photon; the one-loop option adds a vacuum-polarisation bubble and four vertices.
- M ~ alpha^{V/2} and |M|^2 ~ sigma ~ alpha^V displayed and consistent with the chosen order.
- sigma(sqrt s) exactly zero below 2 m_mu, a turn-on through threshold to a peak, then a straight line on log-log (the 1/s power law).
- s + t + u = 2 m_e^2 + 2 m_mu^2 verified live for every sqrt s and theta.
- dsigma/dOmega symmetric about theta = 90 degrees; near-isotropic close to threshold, 1 + cos^2 ultrarelativistically.

## Invariants and acceptance thresholds

`invariants.test.mjs` (vitest, offline):

1. s + t + u = 2 m_e^2 + 2 m_mu^2 to 1e-9 (absolute, GeV^2) for a grid of sqrt s and cos(theta).
2. sigma = 0 at and below sqrt s = 2 m_mu; sigma > 0 above; continuity into threshold.
3. sigma * s -> 4 pi alpha^2 / 3 (to 1e-6) and sigma -> sigma_point well above threshold; sigma(2 sqrt s)/sigma(sqrt s) = 1/4.
4. amplitudeAlphaExponent(V) = V/2 and matrixElementAlphaPower(V) = V; sigma(k alpha)/sigma(alpha) = k^2.
5. dsigma/dOmega even in cos(theta) to 1e-12; sigmaFromAngular = sigmaEEtoMuMu to 1e-9; cos=1 vs cos=0 ratio -> 2.
6. beta in [0,1), beta = 0 exactly at threshold, beta > 0.9999 at sqrt s = 1000 GeV.
7. The sampled curve is non-negative and monotonically decreasing above the peak.
8. Determinism: identical inputs reproduce sigma, sigmaFromAngular and the Mandelstam invariants bit-for-bit.

Visual gate: SSIM > 0.92 against committed golden frames at 60 fps (rAF budget logged during capture).

## Limiting cases for verification

- Threshold sqrt s -> 2 m_mu: beta -> 0, sigma -> 0, the angular distribution becomes isotropic.
- Ultrarelativistic sqrt s >> 2 m_mu: beta -> 1, sigma -> 4 pi alpha^2 / 3 s (point cross section), dsigma/dOmega -> (alpha^2 / 4 s)(1 + cos^2 theta).
- theta = 90 degrees: t = u; the Mandelstam identity gives s + 2 t = 2 m_e^2 + 2 m_mu^2.
- Coupling rescaling alpha -> k alpha: sigma scales exactly as k^2, confirming the alpha^V (V = 2 tree) Feynman-rule counting.

## Visual fallback

Static log-log cross-section curve plus the labelled diagram and the Mandelstam bar chart; no animation is required to read any physics. The travelling-charge pulses are decoration only.

## Citations

- Peskin and Schroeder, An Introduction to Quantum Field Theory, Ch. 5 (Eqs. 5.12, 5.13).
- Halzen and Martin, Quarks and Leptons, Ch. 6 (Eq. 6.27).
- Feynman, Space-Time Approach to Quantum Electrodynamics, Phys. Rev. 76, 769 (1949).

## Stretch goals

- Add the t-channel for Bhabha-like processes and the interference term.
- Overlay the Z resonance (electroweak) to show the photon-Z interference dip.

## Risk register

- Log-log axes can hide the exact sigma = 0 at threshold (it leaves the bottom of the frame); mitigated by an explicit threshold marker and the readout reporting "below threshold".
- The one-loop diagram is illustrative of the alpha-power counting only; the loop is not numerically evaluated (stated in the panel).
