# DEVNOTES - msc-y1/MAA-OT-aperture-synthesis-uv-plane (hidden dev ref)

Repo-only.

## Sweep 2026-05-18
Added comprehensive ## Explainer (first-exposure plain language, all governing equations in KaTeX, bibliographic origin); render-neutral.
invariants Tests  1 passed + visual 5/5 x3. Shipped.

## Fix + rework 2026-05-19 (user: "very laggy, broken visualization, description missing, the whole thing is broken")
- Lag: dirtyImage() was O(N_uv * N_pix^2 * N_src) recomputed every
  rAF (25M+ ops/frame). Now UV is accumulated incrementally with a
  bound, the dirty image is the dirty beam placed at the source
  positions, recomputed only every ~18 sim steps on a 72^2 grid with
  the UV set capped at 520. Smooth.
- Broken UV plot: uvMax was hard-coded 5e3 wavelengths while real
  baselines are ~1e8-1e9, so every point was off-canvas (blank
  panel). Now auto-scaled to the true max baseline -> proper
  Earth-rotation arcs.
- Broken dirty image: the sky model and FOV were in arcsec while a
  global 3 mm array resolves ~0.06 mas, so the beam was undersampled
  into pure noise. FOV and source offsets are now derived from the
  synthesised resolution (FOV = 13 x res, sources at a few res) ->
  the central source + sidelobes are visible and sharpen with
  coverage.
- Missing description: index.html data-slot was literally
  "Playground."; filled with a real "What you are seeing" paragraph.
- Readout DOM panel overlapped the map and overwrote the telescope
  labels; panels moved below it (MAP.y 40 -> 104), redundant
  on-canvas title removed.
- Telescope drag (vertical = latitude) added (spec promised it):
  baselines/UV/resolution recompute live. Shared cividis colormap.
- invariants.test.mjs was a placeholder skeleton (dummy energy sim);
  replaced with 7 real invariants on the new sim.js (station on the
  Earth sphere; zero baseline -> origin; Hermitian conjugate;
  1000 km/3 mm ~ 0.6 mas; global array sub-mas; dirty beam real,
  centro-symmetric, peak 1 on axis; on-axis point source peaks at
  the grid centre).
Gate: 7 invariants + smoke + visual 5/5 x3 PASS. Shipped.

## Follow-up 2026-05-19 (user: still laggy, overlap, flipped image, UV plot unclear)
- Lag: the every-18-steps full O(N_uv*N_pix^2) dirty-image rebuild
  caused a periodic hitch. Replaced with an incremental builder: 8
  rows/frame, looping continuously (full image ~9 frames), so no
  single frame does the whole sum. ~43 fps now. UV_CAP 520 -> 360.
- Overlap: the DOM readout box overlapped the map. Readout is now
  drawn on-canvas in the clear top band; the DOM node is kept (aria)
  but visually clipped out.
- Flip: the dirty image was vertically mirrored vs the sky model
  (ImageData row 0 = top, but m=-fov was row 0). computeRows writes
  row j to output row (N-1-j) so +m is at the top, matching the sky
  panel. sim.js dirtyImage/invariants untouched (the flip is in the
  playground's own row build).
- UV plot clarity: added u/v axis labels and an in-panel note ("each
  arc = one antenna pair, swept by Earth rotation; the Fourier
  components the array samples").
Gate: 7 invariants + smoke + visual 5/5 x3 PASS.
