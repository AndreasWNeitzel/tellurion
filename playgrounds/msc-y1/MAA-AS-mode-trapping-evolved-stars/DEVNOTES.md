# DEVNOTES - msc-y1/MAA-AS-mode-trapping-evolved-stars (hidden dev ref)

Repo-only.

## Sweep 2026-05-18
Rewrote placeholder hook/one_paragraph as first-exposure-undergrad prose; render-neutral.
invariants  + visual 5/5 x3. Shipped.

## Sweep 2026-05-18
Added comprehensive ## Explainer (first-exposure plain language, all governing equations in KaTeX, bibliographic origin); render-neutral.
invariants Tests  3 passed + visual 5/5 x3. Shipped.

## Hero rehaul 2026-05-19 (mission #286)
Was pure plot-only (the whole canvas was a deltaP(P) period-spacing
diagram) and a frozen still: violated no-plot-as-main; the spec's
physics (a glitch trapping modes, a deep-interior sounding) was
nowhere shown. Rebuilt; sim.js deltaP / modePeriods + the 3
invariants byte-identical; trapping / gModeEnvelope / gModePhase
appended:
- Primary is now a star-interior cutaway: the buoyancy frequency
  N(r) with a sharp composition-glitch spike, the g-mode cavity, the
  convective envelope, and the animated radial-displacement
  eigenfunction xi(r). The mode ladder sweeps; at deltaP minima the
  eigenfunction is TRAPPED (rings loudly just outside the glitch,
  colour shifts), between them it propagates across the cavity:
  exactly the physics the spec describes, made visible and alive.
- deltaP(P) vs P demoted to a thin strip (what Kepler/TESS observe)
  with the swept mode tracked on it and the asymptotic Pi_1 line.
- Live invariant readout: the mean spacing recovered over the ladder
  (~78.8 s) stays at the asymptotic Pi_1 (80 s) despite the wiggle,
  the modulation averaging out; P_trap, mode order and trapping %
  also shown.
- Invariants 3 -> 6: trapping in [0,1] and P_trap-periodic; trapping
  maximal exactly where deltaP is minimal; gModeEnvelope >= 0 and
  vanishes at both cavity ends.
- A first capture showed the eigenfunction overshooting the panel
  into the axis label/readout; amplitude and midline retuned, status
  label moved above the panel, then re-verified.
- Capture sweeps the mode ladder: 5 byte-distinct goldens
  (propagating -> trapped).
Live-verified (eigenfunction trapped at the dips vs propagating
between; strip dot tracks; mean deltaP recovers Pi_1).
Gate: 6 invariants + smoke + visual 5/5 x3 PASS. Shipped.
