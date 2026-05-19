# DEVNOTES - msc-y1/MAA-OT-point-spread-function-strehl (hidden dev ref)

Repo-only.

## Sweep 2026-05-18
Added comprehensive ## Explainer (first-exposure plain language, all governing equations in KaTeX, bibliographic origin); render-neutral.
invariants Tests  5 passed + visual 5/5 x3. Shipped.

## Sweep 2026-05-19
Real card text (hook + one_paragraph) sourced from the spec body; render-neutral.
invariants Tests  5 passed + visual 5/5 x3. Shipped.

## Fix + rework 2026-05-19 (user: "broken and uninteresting; two sliders do nothing")
Root cause: the angular scale was firstNull(lambda,D)/80 px, which
normalised lambda and D out of the image entirely; they changed only
the readout, never the picture. Render-only fix; sim.js
airyIntensity/strehl/firstNullArcsec + the 5 invariants
byte-identical:
- Fixed sky FOV (+/-0.18") with two stars at a fixed 0.10"
  separation. The Airy PSF size is now physical, so D and lambda
  visibly shrink/grow it and the pair resolves or merges (Rayleigh
  limit made concrete): D=1.5 m -> merged blob NOT RESOLVED;
  D=25 m -> two pinpoints RESOLVED.
- sigma now drains the Strehl-scaled cores into an organic boiling
  speckle halo (hashed value-noise, deterministic) and the Strehl
  reads the Marechal law: sigma=0.3 -> S=0.029, washed out. (First
  speckle attempt was a single sinusoid -> diagonal moiré artifact;
  replaced with smoothed lattice value-noise -> real AO-residual
  look.)
- Shared viridis + asinh stretch (was a hand-rolled amber ramp).
  RESOLVED/NOT-RESOLVED verdict, 1.22 lambda/D scale bar, demoted
  log radial-cut strip through both stars.
- Capture sweeps sigma 0 -> 0.34: clean resolved Airy pair ->
  speckle-washed; 5 byte-distinct goldens.
Live-verified at small/large D and high sigma (all three sliders
now effective; physics exact). Gate: 5 inv + smoke + visual 5/5 x3.
