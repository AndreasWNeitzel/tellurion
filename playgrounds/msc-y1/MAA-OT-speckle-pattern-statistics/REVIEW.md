# REVIEW - speckle-pattern-statistics (pre-computed; maintainer actions later)

## Verdict
RENDER-NEUTRAL TEXT FIX ONLY

## Defects (severity-ranked)
1. [high] spec.md is architect placeholder; fill with speckle definition (coherent light interference), intensity statistics (exponential distribution), structure function (autocorrelation), invariants (histogram matches exponential, autocorrelation decay timescale = D/v where D is seeing disk diameter, v is wind speed).
2. [medium] README stub; explain speckle (atmospheric wavefront distortion, coherent noise in astronomy), what to observe (speckle pattern evolution, intensity histogram exponential tail), controls (seeing quality, wind speed if exposed, exposure time).
3. [medium] index.html figcaption and description minimal.

## Text / approachability
spec and README stubs. User sees dancing speckles but no explanation of atmospheric origin or why the intensity distribution has an exponential tail.

## Source-material & equation fidelity
Intensity autocorrelation and exponential statistics for fully-developed speckle appear correct. Timescale ~ D/v matches atmospheric physics. Reference: Roggemann & Welsh (speckle/adaptive optics).

## Golden-frame observations
Frames show speckle pattern jittering (if time-stamped), intensity histogram building toward exponential shape. Autocorrelation decays on seeing-timescale. No visual defects.

## Hero-candidate
NO. Atmospheric optics pedagogy; tier: simple.

## Maintainer notes
Spec, README, figcaption. Speckle statistics code is correct.
