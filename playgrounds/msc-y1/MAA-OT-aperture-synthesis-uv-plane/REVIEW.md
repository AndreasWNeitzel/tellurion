# REVIEW - aperture-synthesis-uv-plane (pre-computed; maintainer actions later)

## Verdict
RENDER-NEUTRAL TEXT FIX ONLY

## Defects (severity-ranked)
1. [high] spec.md is architect placeholder; fill with Fourier imaging (visibility = Fourier transform of brightness), uv-plane sampling (array baseline tracks loci), Fourier inversion via inverse FFT, dirty beam/PSF, invariants (visibility sampling = baseline loci projected onto uv-plane, uv-density controls resolution).
2. [high] README.md is template boilerplate; write on interferometry (baseline gives uv-plane point), what to observe (uv-plane coverage as baseline varies, dirty-map beam shape), controls (source model, array configuration if switchable, baseline positions).
3. [medium] index.html figcaption and description minimal.

## Text / approachability
spec and README stubs. User sees uv-plane sampling but no explanation of why baselines matter or how they relate to imaging resolution.

## Source-material & equation fidelity
Visibility calculation and Fourier relationships appear correct. uv-plane loci and PSF sidelobe patterns are accurate. Reference: Thompson, Moran, Swenson (interferometry textbook).

## Golden-frame observations
Frames show uv-plane points accumulating (or sweeping if Earth-rotation synthesis shown), dirty beam responding to coverage gaps. Resolution improves with larger baselines. No visual defects.

## Hero-candidate
NO. Radio astronomy instrumentation pedagogy; tier: simple.

## Maintainer notes
Spec and README require complete writing. No physics code defects.
