
## Sweep 2026-05-18 (recapture + text)
Visual gate failed on stale goldens (render drift); bootSync deterministic (st.t=CAPTURE_FRAC*4). Recaptured 5 distinct, screenshot-verified (sigma 1.80, center 9.00, packet glides+broadens). No code change. Rewrote placeholder hook/one_paragraph. invariants 5, visual 5/5 x3.

## Sweep 2026-05-18
Added comprehensive ## Explainer (first-exposure plain language, all governing equations in KaTeX, bibliographic origin); render-neutral.
invariants Tests  5 passed + visual 5/5 x3. Shipped.

## Hero rehaul 2026-05-19 (mission #286)
Below hero: a thin bare 1D line (Re psi + |psi|^2 on an axis).
Rebuilt render-only (sim.js spreadAt/center/density/realPsi + the 5
invariants byte-identical, exact analytic solution preserved):
- Top: the packet as a glowing |psi|^2 probability cloud with the
  Re(psi) de Broglie carrier riding inside it, translating at the
  group velocity and visibly broadening/dimming; sigma(t) bracket.
- Bottom: an (x, t) waterfall (offscreen canvas, self-scroll) so the
  dispersion is unmistakable: the bright worldline drifts (group
  velocity = slope) and fans out (spreading). Deterministically
  rebuilt in capture for byte-stable goldens.
- One spacing tweak so the sigma label clears the waterfall caption.
Capture sweeps t (frac*5) -> 5 distinct goldens (narrow tall packet
-> wide low packet, empty -> fanned waterfall).
Gate: 5 invariants + smoke + visual 5/5 x3 PASS. Shipped.
