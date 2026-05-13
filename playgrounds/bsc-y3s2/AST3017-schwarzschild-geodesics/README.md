# Schwarzschild Light Bending

A plane wave of photons hits a non-rotating black hole. Geometric units G = c = M = 1. Each photon follows a null geodesic with conserved energy and angular momentum; the impact parameter b at infinity (the offset from the head-on line) determines its fate. Photons with |b| < 3*sqrt(3) ≈ 5.196 cross the photon sphere at r = 3 and fall through the event horizon at r = 2; photons with |b| > 5.196 are deflected. Photons with |b| just above critical loop the photon sphere multiple times before escaping; photons far above critical are weakly deflected by ~4M/b radians.

Look at the four regimes the user-set slider range exposes: head-on plunges (red, going straight in), wide-angle captures (red, looping into the BH), critical-but-deflected loops (blue, sweeping multiple times around r=3 before escaping), and weak deflections (blue, nearly straight lines). The boundary between red and blue sits at the critical impact parameter; you can verify it visually as the impact-parameter range crosses 5.196.

Controls: drag the N slider to vary photon count (the density of the wave). Drag the b_max slider to narrow or widen the impact-parameter range. Reset returns to defaults.

## Reference

Primary citation: Carroll, "Spacetime and Geometry: An Introduction to General Relativity", Sections 5.1 (The Schwarzschild Metric), 5.3 (Singularities), and 5.4 (Geodesics of Schwarzschild). Bib key `carroll2019`, chapter_index verified. Engine: `shared/js/engine/symplectic.js`, integrator 'verlet'.

## Verification

- Strong invariants:
  - Photons at |b| = 4 are swallowed; at |b| = 7 are deflected; the boundary lies near |b| = 3*sqrt(3) within +/- 0.1.
  - Weak-field deflection at b = 12 matches 4M/b ≈ 0.33 rad within 30 percent.
- Medium invariant: photons within 0.05 of b_crit loop the photon sphere at least one full 2*pi.
- Visual gate: SSIM > 0.92 against committed golden frames.
- Last verified: see `.verified`.
