# GATES: exoplanet-transit-3d

- Physics: shared/js/engine/transit-cpu.js (built and tested first,
  tests/transit.test.mjs, 8 tests). Keplerian orbit + numerical
  intensity-weighted disc integration with planet shadow mask.
- Render: shared/js/engine-gl/transit-3d.js, star and planet as
  point-sprite imposters (limb-darkened fragment for the star,
  dark disc for the planet) + orbit-ring LINE_LOOP + background
  star field. Default framebuffer + in-shader ACES (the
  headless-GL lesson).
- Anti-cheat: __physicsCheck recomputes central-transit depth =
  (Rp/Rs)^2 to 1e-4. Invariants assert depth, Kepler III, out-of-
  transit = 1, limb-darkening deepens the dip, tilted orbit removes
  the transit.
- Determinism: capture fixes orbital phase, camera azimuth, params.
- S3 exception: the light curve panel is somewhat prominent because
  it IS the observable, as stated in the suite directive.
