# DEVNOTES - hydrogen-orbitals-3d (hidden dev reference)

Repo-only. NOT linked from index.html, NOT in the gallery, never shown
to site users. Exhaustive debugging/maintenance reference.

## What it is
WebGL2 hero. Volume ray-march of the hydrogen probability density
|psi_{n,l,m}|^2. Three views: density (viridis emission), phase (hue =
arg psi), iso (Blinn-Phong isosurface, two-tone by sign of psi).
Sliders n,l,m clamp to l<n and |m|<=l. Orbit camera. Share keys
n,l,m,view.

## Engine reuse (hard rule 6)
- CPU truth: shared/js/engine/hydrogen-orbital-cpu.js (densityAt,
  phaseAt, phaseFullAt, signedAmplitudeAt, energyEV, expectedR). The
  invariant tests import the local sim.js which re-exports these.
- GL engine: shared/js/engine-gl/hydrogen-orbital.js. Confirmed sole
  consumer is this playground (grep: only playground.js imports it), so
  shader edits here are localised, no cross-playground regression.
- Volume upload is RG16F 3D texture: R = density/dmax, G = phase/2pi.

## Numerical method
32^3 CPU grid, box half-extent rmax = max(12, 2.5 n^2) a0 so the wall
density is << 1e-4 of peak even at n=5. Fragment shader marches 160
steps, density-weighted alpha, ACES + vignette, then a bloom pass
(threshold 0.75) on the scene FBO. Deterministic: no RNG, legend and
volume depend only on uMode/uv/(n,l,m), so capture is pixel-stable.
DETERMINISTIC mode renders 24 warmup frames to settle the 3D-texture
upload and the bloom ping-pong before signalling simulation-ready
(without warmup the first screenshot caught a half-converged bloom and
the visual gate flaked 5/5 then 4/5).

## Invariants (invariants.test.mjs) and rationale
1. E_n = -13.6057/n^2 eV (n=1,2) to 0.01: Bohr energies.
2. 1s density larger near nucleus than far: exponential decay.
3. 2p_z node in xy-plane (theta=pi/2) ~0, nonzero on z-axis: cos theta
   angular factor.
4. m=2 azimuthal phase advances 4 pi over a loop: e^{i m phi} winding.
5. <r> = 1.5 a0 (1s), 5 a0 (2p): analytic radial expectation.
6. signedAmplitude^2 == density; sign flips across a nodal plane; phase
   winds with phi while density does not; phase offsets by pi across a
   radial node (2s near r=2 a0). Pins that the GL phase channel is the
   true arg(psi), not a cosmetic ramp.
All evaluated analytically on the CPU, NOT on the 32^3 grid, so grid
coarseness never affects the physics claims.

## Post-build sweep record (2026-05-18)
- Opus visual-reviewer (multimodal, 5 golden frames + rubric):
  5/6 PASS. PASS: recognizable orbitals (1s sphere, 2p dumbbell, 3d
  cloverleaf), readout legible no overlap, physically sensible shapes,
  visible variation across t-000/050/100, no text-vs-graphics
  contradiction, camera/iso changes visible. FAIL (criterion 6): no
  colour key, so the viewer could not tell density (viridis) from
  phase (HSV) coloring although the spec promises both.
- Fix applied: added a screen-space colour key to FS_RAY in the shared
  GL engine (top-right vertical bar, dark backplate, light border).
  mode 0 -> viridis ramp, mode 2 -> full HSV hue ramp, mode 1 ->
  teal/gold sign two-tone. Time-independent (uv + uMode only) so the
  deterministic capture stays pixel-stable. keyCol scaled 0.92 to keep
  the bloom from smearing the bright top of the bar; verified crisp by
  screenshot analysis. The five capture stages step density x3, phase,
  iso, so the goldens exercise all three key variants.
- Also fixed: spec.md had placeholder hook ("STATUS: needs_hook") and
  one_paragraph ("STATUS: needs_paragraph"), which rendered literally
  on the gallery card; rewrote hook/one_paragraph/description/caption
  for first-exposure undergrads and expanded the spec body to the
  standard sections. index.html description + figcaption rewritten
  approachably (no raw LaTeX-only blob, no bare cite key shown to
  users). Physics constants unchanged.
- The #stage WebGL render changed (legend pixels), so golden frames
  were recaptured with --deterministic and the visual gate reran x3
  (SSIM>0.92). Index rebuilt for the new card text.

## Known approximations / limitations
- 32^3 grid: the finest nodes of the largest (n,l) orbitals are a
  little soft. Cosmetic only; invariants are analytic.
- Real (cos m phi / sin m phi) style is not exposed; m sets |m| in the
  density and the e^{i m phi} winding in the phase channel.
- Bloom gives the bright end of the colour key a faint halo by design;
  it stays legible (confirmed by screenshot).

## Gate commands
- node --check playground.js
  (engine: node --check ../../../shared/js/engine-gl/hydrogen-orbital.js)
- npx vitest run invariants.test.mjs   (11 assertions, 2 describes)
- recapture goldens: the deterministic capture harness with
  --deterministic (REQUIRED here because the #stage render changed)
- visual gate: npx playwright test visual.test.mjs (SSIM>0.92 x3)
- node scripts/build-index.mjs         (regenerate gallery card)

## Sweep 2026-05-18
Added comprehensive ## Explainer (first-exposure plain language, all governing equations in KaTeX, bibliographic origin); render-neutral.
invariants Tests  11 passed + visual 5/5 x3. Shipped.
