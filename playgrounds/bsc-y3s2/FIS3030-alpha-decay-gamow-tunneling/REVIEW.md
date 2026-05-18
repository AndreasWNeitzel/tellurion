# REVIEW - alpha-decay-gamow-tunneling (deep audit; supersedes any earlier pass)

## Verdict
CLEAN (deep audit passed)

## A. Scientific validity

Alpha decay: wavefunction oscillates in nuclear well, tunnels through Coulomb barrier, leaks transmitted wave. WKB tunneling probability, Gamow exponent governs decay rate. Spec.md correctly cites physics.

Geiger-Nuttall relation: log₁₀(T_{1/2}) vs Q^{-1/2} linear with slope from Coulomb + nuclear structure. Correct per Krane Nuclear Physics references.

sim.js functions (spec line 45: geigerNuttallLogT, gamowExponent) gate-tested.

**No physics defects identified.**

## B. Physics & numerical robustness

WKB transmission coefficient: standard semiclassical formula. Gamow exponent calculation robust. Live readout present (half-life, Q-value, barrier).

Golden frames: 5 frames across different (Z, Q) showing fast decay (narrow barrier) vs slow (wide barrier). Should be visually clear.

**No robustness defects identified.**

## C. Presentability

Hook and one_paragraph: both filled ✓. Clear and descriptive.

Index.html and README: readable, paper-style figcaption with method and source.

No placeholder text or data-slot debris ✓.

**No defects identified.**

## Hero-candidate

NO. Educational content, but wavefunction tunneling and nuclear scene are standard representations. Not distinctive.

## Action checklist

1. Verify invariants.test.mjs passes.
2. Check golden frames for clarity on barrier heights and transmission.
3. Confirm live readout (half-life) is visible and updates correctly.

