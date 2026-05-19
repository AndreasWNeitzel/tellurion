# DEVNOTES - bsc-y2s1/FIS2016-transverse-vs-longitudinal-mode (hidden dev ref)

Repo-only.

## Sweep 2026-05-18
Rewrote placeholder hook/one_paragraph as first-exposure-undergrad prose; render-neutral.
invariants 5/5 + visual 5/5 x3. Shipped.

## Sweep 2026-05-18
Added comprehensive ## Explainer (first-exposure plain language, all governing equations in KaTeX, bibliographic origin); render-neutral.
invariants Tests  5 passed + visual 5/5 x3. Shipped.

## Hero rehaul 2026-05-19 (mission #286)
Was thin (dots on a line) and missing the spec's headline: the
longitudinal compression pattern and the dispersion relation were
absent (only omega shown as a number); no live invariant readout.
Render-only; sim.js omegaK / modePosition / totalEnergy + the 5
invariants byte-identical:
- Transverse: spring-coil chain + glowing spheres on the sine
  waveform, vertical shake arrow (string / light / S-wave).
- Longitudinal: atoms coloured by local compression via shared rdbu
  (compressed red, rarefied blue) over a density-shaded band with
  spring coils, horizontal shake arrow: the travelling
  compression/rarefaction bands are now unmistakable (the spec's
  exact ask).
- Demoted dispersion strip: omega(k)=2 sqrt(K/m)|sin(ka/2)| over the
  first Brillouin zone with the long-wavelength sound asymptote, the
  zone-edge v_group=0 standing-wave marker, and the current-k dot.
- Live invariant readout: mode energy from the exported totalEnergy,
  |dE/E| ~ 0 for the analytic mode; also lambda, v_phase, v_group.
- Layout fixed after first capture showed the strip clipped into the
  last ~60 px: chains moved up, strip given a full ~120 px band.
- Capture sweeps t (phase) -> 5 byte-distinct goldens.
Live-verified (both waves travel; compression bands move; strip and
energy correct).
Gate: 5 invariants + smoke + visual 5/5 x3 PASS. Shipped.
