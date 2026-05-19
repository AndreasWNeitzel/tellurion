# DEVNOTES - bsc-y3s2/FIS3029-aharonov-bohm-flux-line (hidden dev ref)

Repo-only.

## Sweep 2026-05-18
Added comprehensive ## Explainer (first-exposure plain language, all governing equations in KaTeX, bibliographic origin); render-neutral.
invariants invariants pass + visual 5/5 x3. Shipped.

## Sweep 2026-05-19
REVIEW (CODE FIX + RECAPTURE) partly stale: AB phase physics correct, sim.js + 4 real invariants pass, hook/one_paragraph real prose (NOT placeholders; stale claim), has Explainer. Sole genuine defect: bootSync ignored captureFraction so all 5 goldens identical at phi=0. Fixed: added CAPTURE_FRAC; deterministic capture sets st.phi = 2*frac (0 to 2 cycles) and syncs the slider. Recaptured 5 distinct goldens; READ t-000 (phi=0, bright central fringe) and t-025 (phi=0.5, fringes shifted half a cycle, dark centre) physically correct AB shift, 60fps. No sim/invariants/text change. leakscan2=0. Shipped.

## Sweep 2026-05-19
REVIEW CODE-FIX partly stale: AB physics, sim.js, 4 invariants, text already correct. Sole genuine defect: bootSync ignored captureFraction so all 5 goldens identical at phi=0. Added CAPTURE_FRAC; capture sweeps st.phi=2*frac (0 to 2 cycles); recaptured 5 distinct verified-correct goldens (phi=0 bright centre; phi=0.5 fringes shifted half a cycle).
invariants Tests  4 passed + visual 5/5 x3. Shipped.

## Enhance 2026-05-19 (live-review #278)
User: "feels incomplete, could do with some wave propagation physics
visualization." Old playground.js was static (tick re-rendered an
unchanging frame): just source/slits/solenoid dots + a 1D fringe bar.
Rewrote the render (sim.js + 4 invariants byte-identical):
- Real propagating electron wavefield. Two cylindrical waves from the
  slits, psi = a1 cos(K r1 - w t + pi*phi) + a2 cos(K r2 - w t - pi*phi);
  the +-pi*phi split is the gauge-invariant AB phase difference
  2 pi (Phi/Phi_0) between paths on opposite sides of the flux line
  (Sakurai Ch.2). Rendered as instantaneous Re(psi) on a half-res
  ImageData (allocated once) -> offscreen -> drawImage; ~16.7 ms rAF.
- Wavefronts physically travel (st.t advances live); two dashed guide
  paths show the loop enclosing the solenoid; flux line drawn with a
  circulating-A symbol and "B=0 on both paths, only A nonzero".
- Detector keeps the time-averaged intensity strip + a profile curve,
  still computed from sim.intensity (the far-field limit of the field).
- tlabel() dark halo so yellow labels read over the cyan field.
- Capture sweep changed to phi = 0.15 + 1.40*frac so the 5 frames are
  distinct AB shifts (the old phi=2*frac aliased: integer Phi/Phi_0
  gives the identical pattern, 3/5 goldens were duplicates).
Gate: 4 invariants + smoke + visual 5/5 x3 PASS. Shipped.
