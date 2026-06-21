# Physics-faithfulness audit (June 2026)

A catalogue-wide audit for the proxy-visual trap: an animation must show the
actual physical mechanism, not a plausible-looking decoration. The audit covered
the five semesters that were largely codemod-migrated rather than hand-rebuilt
(bsc-y2s1, bsc-y2s2, bsc-y3s1, bsc-y3s2, msc-y1); bsc-y1s1 and bsc-y1s2 are
fully hand-built on Layout v2 and were excluded. Method: read each spec.md and
the scene-drawing code, no rendering.

## Headline

The catalogue is in good shape. The structured faithfulness sweep that rebuilt
the asteroseismology and stellar-structure playgrounds worked: across ~236
audited playgrounds, the great majority solve or step the real physics (a
documented integrator, eigensolver, sampler, or the exact closed-form solution
where that is the textbook treatment) rather than drawing a proxy. The
conclusion that matters for planning: keep building the missing topics, do not
churn the existing ones.

## Verification caveat (important)

The audit was run with a fan-out of per-semester review agents. Two of the
"high-severity proxy" findings were spot-checked against the source and were
false positives:

- `AST3015-particle-mesh-2d-disk` was flagged as "hand-tuned jitter, not a real
  N-body". The source has a real FFT-based Poisson solve with cloud-in-cell
  deposit and interpolation, re-solved every step (`solvePoisson2D`,
  `depositCIC`, `interpolateCIC`). The spiral grows from self-gravity. Faithful.
- `AST3015-aperture-photometry-toy` was flagged as "deterministic image-summing,
  no stochastic photons". The source injects per-pixel Poisson noise (Gaussian
  approximation for large counts, variance = signal + read-noise^2). Faithful.

Both accusations sounded plausible and were wrong on inspection. Treat any
agent-reported "proxy" as a hypothesis to confirm against the code before acting,
not a verdict. Reviews are verified with evidence, not rubber-stamped.

## Genuine, verified items

1. `MAA-AS-rotational-splitting-multiplets` (high). The one asteroseismology
   playground not yet rebuilt on Layout v2 (codemod-only), and the render was
   already flagged (the physics-faithful-visuals note). The splitting formula in
   sim.js is correct (delta-omega = m(1 - C_nl) Omega with the Ledoux constant)
   and the spec describes the faithful visual (the real Y_l^m pattern drifting in
   azimuth at the splitting rate, with the 2l+1 multiplet alongside). The task is
   to verify the actual draw renders a real spherical harmonic rather than
   colored bands, and rebuild it on Layout v2 reusing the Y_l^m code from
   `MAA-AS-stellar-oscillation-modes` if it does not. Tracked as a build task.

2. Orphaned reference-capture folder
   `msc-y1/MAA-GD-dynamical-friction-chandrasekhar` (cleanup). It holds only a
   `references/captured/` snapshot from 2026-05-19 and no playground files; the
   real playground lives under `MAA-GD-chandrasekhar-dynamical-friction`. Safe to
   remove as a rename leftover.

3. Minor, low priority (defer unless touched): `AST3014-sedov-taylor-blastwave`
   uses the exact self-similar R(t), which is the correct textbook solution; only
   the scene particles are decorative, so this is an enrichment, not a fix.
   `FIS3025-bernoulli-venturi-interactive` and `FIS3029-fine-structure-hydrogen`
   would benefit from a one-line "closed-form" note in their Numerical-method
   sections. None of these are proxies.

## Bottom line for the heartbeat queue

Existing playgrounds are faithful; the rebuild backlog is essentially one item
(rotational splitting) plus a folder cleanup. The productive direction is new
builds against the validated curriculum gaps (see PORTFOLIO_GAP_ANALYSIS.md).
