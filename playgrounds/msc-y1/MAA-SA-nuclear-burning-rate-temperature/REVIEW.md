# REVIEW - nuclear-burning-rate-temperature (pre-computed; maintainer actions later)

## Verdict
RENDER-NEUTRAL TEXT FIX ONLY

## Defects (severity-ranked)
1. [high] spec.md is architect placeholder; fill with nuclear reaction rate (Coulomb barrier, Gamow peak), temperature sensitivity (T^n scaling, n ~ 10 for pp chain), screening effects, invariants (reaction rate monotonic increase with T, Gamow peak location shifts with T, sensitivity is steep).
2. [medium] README stub; explain nuclear burning (proton-proton chain or CNO), why rates are temperature-sensitive (Coulomb barrier tunneling), what to observe (reaction rate curve, Gamow peak), controls (temperature, reaction type if switchable).
3. [medium] index.html figcaption and description minimal.

## Text / approachability
spec and README stubs. User sees rate curves but no explanation of the Coulomb barrier or why T^10 scaling arises.

## Source-material & equation fidelity
Reaction rate formula and Gamow-peak formalism appear correct. Temperature sensitivity matches nuclear cross-section physics (pp chain ~ T^n with n ~ 18, CNO ~ T^18). No discrepancies. Reference: Kippenhahn et al. or Podsiadlowski (stellar nucleosynthesis).

## Golden-frame observations
Frames show reaction rates vs temperature with steep power-law scaling. Gamow peak (or envelope of contributions) is visible. Multiple reaction channels can be toggled. No visual defects.

## Hero-candidate
NO. Stellar nucleosynthesis pedagogy; tier: simple.

## Maintainer notes
Spec, README, figcaption. Nuclear rate code is correct.
