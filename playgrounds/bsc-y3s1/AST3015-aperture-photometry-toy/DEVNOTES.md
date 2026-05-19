# DEVNOTES - bsc-y3s1/AST3015-aperture-photometry-toy (hidden dev ref)

Repo-only.

## Sweep 2026-05-18
Rewrote placeholder hook/one_paragraph as first-exposure-undergrad prose; render-neutral.
invariants  + visual 5/5 x3. Shipped.

## Sweep 2026-05-18
Rewrote placeholder hook/one_paragraph as first-exposure-undergrad prose; render-neutral.
invariants  + visual 5/5 x3. Shipped.

## Hero rehaul + extreme-input fix 2026-05-19 (mission #286)
Was a frozen still (frame only changed on slider input), hand-rolled
amber ramp, and it never showed the spec's own headline (the SNR
sweet spot / growth curve). Render-only; sim.js moffat /
generateImage / aperturePhot + the 4 invariants byte-identical:
- CCD frame now reshuffles a fresh photon-noise realisation ~3/s
  (successive exposures), shared viridis map with an asinh stretch
  so the Moffat wings + sky read like a real frame; pixelated
  (imageSmoothingEnabled=false).
- Demoted growth-curve strip: F(r) (plateaus at F_true) and CCD
  SNR(r) (peaks) computed from a NOISELESS model image (reconstructed
  from the exported moffat, no sim change) so the SNR-optimal r
  marker is stable; your live noisy measurement scatters around it.
  Optimal r ~ 2.9 px vs FWHM 2.5 (a seeing radius: the spec's
  "couple of seeing radii").
- EXTREME-INPUT BUG: when the aperture exceeded the sky annulus,
  aperturePhot's else-if sky branch found 0 annulus pixels ->
  sky = 0/0 = NaN -> all readouts NaN (seen at the wide-aperture
  golden). Fixed with skyRing(rap)=max(st.s,rap+2)..+4 used for the
  live measurement, the drawn rings, and every growth-curve point:
  the sky ring is always outside the aperture (physically correct).
  Capture sweep capped at r 2.5..15.5.
- Capture sweeps the aperture: small (undercounts, error -20%) ->
  optimal -> large (SNR collapses); 5 byte-distinct goldens.
Live-verified both extremes (no NaN; rings follow the aperture).
Gate: 4 invariants + smoke + visual 5/5 x3 PASS. Shipped.
