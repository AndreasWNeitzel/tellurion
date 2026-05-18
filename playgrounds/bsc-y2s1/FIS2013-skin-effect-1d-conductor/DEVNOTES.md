
## Sweep 2026-05-18 (recapture + text)
Deep-audit verdict was RENDER-NEUTRAL TEXT FIX ONLY but the committed goldens were stale/byte-identical (1/5). bootSync already sweeps st.t (AC pulse = 0.55+0.45*cos(3 st.t)); recapture alone yields 5 distinct, physically-correct frames (current-density bar, delta line, E(z) decay + AC envelope). No code change. Known minor pedagogical weakness: zmax=5*delta auto-rescales so the curve is self-similar in frequency; physics CLEAN. Rewrote placeholder hook/one_paragraph. invariants 6, visual 5/5 x3.

## Sweep 2026-05-18
Rewrote placeholder hook/one_paragraph as first-exposure-undergrad prose; render-neutral.
invariants  + visual 5/5 x3. Shipped.
