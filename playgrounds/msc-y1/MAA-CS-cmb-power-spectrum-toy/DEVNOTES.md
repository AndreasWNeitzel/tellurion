# DEVNOTES - msc-y1/MAA-CS-cmb-power-spectrum-toy (hidden dev ref)

Repo-only.

## Sweep 2026-05-18
Rewrote placeholder hook/one_paragraph as first-exposure-undergrad prose; render-neutral.
invariants  + visual 5/5 x3. Shipped.

## Sweep 2026-05-18
Rewrote placeholder hook/one_paragraph as first-exposure-undergrad prose; render-neutral.
invariants  + visual 5/5 x3. Shipped.

## Hero rehaul 2026-05-19 (mission #286)
Was plot-only and a frozen still: the canvas was a static D_l-vs-l
yellow curve redrawn identically every frame. Violated no-plot-as-main
and was not alive. Rebuilt:
- Primary is now the recognizable CMB temperature sky: a flat-sky
  Gaussian random field synthesized from the toy spectrum as a
  running sum of random acoustic plane waves (l drawn by rejection
  from the 2D power density l C_l; rdbu colormap, cold blue / hot
  red). Modes stream in (the sky sharpens from a few coherent
  standing waves to the full Gaussian mottling), hold, and regrow,
  so it is alive and shows the CMB sky IS a superposition of frozen
  sound modes.
- l_peak sets the spot size (~180/l_peak deg; ~0.82 deg at 220, the
  famous one-degree scale); l_damp smooths the small scales (Silk).
  Both act through the real spectrum, no special casing.
- D_l vs l demoted to a thin strip; the dashed marker is now at the
  controlled acoustic scale l_peak (the earlier global-argmax label
  reported ~1750 because of the rising l^1.2 envelope, which is not
  the first acoustic peak; fixed).
- sim.js Dl / firstPeakL byte-identical; clFromDl / synthModes /
  fieldValue appended. Invariants 3 -> 5 (clFromDl inverts the
  D_l/C_l definition to 1e-9; synthesized patch is zero-mean with
  finite O(1) variance, deterministic).
- Capture sweeps the accumulated mode count 6 -> 260 -> 5
  byte-distinct goldens (few coherent waves -> full CMB patch).
Live-verified (sky sharpens and regrows; physically faithful).
Gate: 5 invariants + smoke + visual 5/5 x3 PASS. Shipped.
