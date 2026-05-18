# REVIEW - convection-mixing-length (pre-computed; maintainer actions later)

## Verdict
RENDER-NEUTRAL TEXT FIX ONLY

## Defects (severity-ranked)
1. [high] spec.md is architect placeholder; fill with mixing-length theory (MLT), convective flux formula, opacity scaling, temperature and density gradients, invariants (convective luminosity monotonic in unstable gradient, mixing-length scale l ~ alpha H_p where H_p is pressure scale height).
2. [medium] README stub; explain stellar convection (buoyancy-driven mixing), mixing-length approximation, what to observe (convective luminosity profile, temperature gradient), controls (mixing-length parameter alpha, stellar parameters if adjustable).
3. [medium] index.html figcaption and description minimal.

## Text / approachability
spec and README stubs. User sees a stellar structure but no explanation of convection or mixing-length closure.

## Source-material & equation fidelity
MLT expressions (convective flux ~ rho c_p v l_t dT/dr) and mixing-length scale appear correct. Superadiabatic gradient in convection zones is accurately computed. Reference: Kippenhahn, Weigert, Weiss (stellar structure).

## Golden-frame observations
Frames show convection zone with superadiabatic gradient, convective flux profile, temperature and density stratification. No visual defects.

## Hero-candidate
NO. Stellar structure pedagogy; tier: simple.

## Maintainer notes
Spec, README, figcaption. MLT code is correct.
