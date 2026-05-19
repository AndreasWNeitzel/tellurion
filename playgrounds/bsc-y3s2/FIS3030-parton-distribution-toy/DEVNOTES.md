# DEVNOTES - bsc-y3s2/FIS3030-parton-distribution-toy (hidden dev ref)

Repo-only.

## Sweep 2026-05-18
Rewrote placeholder hook/one_paragraph as first-exposure-undergrad prose; render-neutral.
invariants  + visual 5/5 x3. Shipped.

## Sweep 2026-05-18
Rewrote placeholder hook/one_paragraph as first-exposure-undergrad prose; render-neutral.
invariants  + visual 5/5 x3. Shipped.

## Hero rehaul 2026-05-19 (mission #286)
Was pure plot-only (the whole canvas was x f(x) vs x curves) and a
frozen still: violated no-plot-as-main; the spec's hook ("a proton
is a swarm") was nowhere on screen. Rebuilt; sim.js
u_v/d_v/gluon/sea/betaIntegral + the 5 invariants byte-identical;
partonShape/sampleX appended:
- Primary is now the proton confinement bag holding a live parton
  swarm: 2u + 1d valence (haloed, the number sum rule), ~78 gluon
  wavy quanta, ~26 sea quark-antiquark pairs. Each parton sits at an
  x sampled (rejection, deterministic) from its toy shape, so the
  spatial pile-up IS the PDF: gluon/sea crowd small x, valence bump
  near x ~ 0.2.
- Swarm COMPOSITION + the momentum-budget bar use the measured DIS
  fractions (gluon 0.42, u_v 0.27, d_v 0.11, sea 0.20; Griffiths
  Ch. 9 / PDG) so the gluon visibly carries the most: the toy
  normalisations are number-normalised, not momentum-normalised, and
  using them raw would wrongly show quarks dominating, contradicting
  the spec ("nearly half is glue"). The momentum sum rule
  Sum x f = 1.000 is the live invariant readout.
- A deep-inelastic e- probe periodically strikes at the cursor x and
  flashes the partons there (what DIS measures). Gluons/sea resample
  continuously (emission / pair creation); valence persist: alive.
- x f(x) curves demoted to a thin strip (lin/log via the select).
- Invariants 5 -> 7: sampleX in (0,1), partonShape matches the named
  PDFs, sampled mean-x ordering valence > gluon > sea.
- Capture sweeps swarm evolution: 5 byte-distinct goldens. One
  transient VIS_FAIL run1 then PASS x3 clean twice (RT flake
  precedent; capture path is deterministic).
Gate: 7 invariants + smoke + visual 5/5 x3 PASS. Shipped.
