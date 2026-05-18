# REVIEW - cosmic-ray-air-shower (deep audit; supersedes any earlier pass)

## Verdict
RENDER-NEUTRAL TEXT FIX ONLY

## A. Scientific validity

Cosmic-ray shower cascade: primary particle interaction producing pions, subsequent decay/interaction cascade, muon and photon components. Multiplicities and energy scales realistic for >GeV cosmic rays.

Spec.md cites particle physics correctly.

**No physics defects identified.**

## B. Physics & numerical robustness

Stochastic cascade simulation with energy-dependent cross sections. Golden frames 5 frames should show cascade trees.

**No robustness defects identified.**

## C. Presentability

**DEFECT (HIGH)**: index.html contains data-slot attributes (identified earlier). Must remove or fill template slots.

Figcaption and README likely acceptable but should verify for 3-paragraph README format.

## Hero-candidate

NO. Scientific simulation, but not visually distinctive.

## Action checklist

1. [BLOCKER] Remove or fill data-slot attributes in index.html.
2. Verify README is 3 paragraphs.
3. Invariants.test.mjs passes.

