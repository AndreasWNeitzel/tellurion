# DEVNOTES - FIS1013-atwood-machine-constrained (hidden dev ref)

Repo-only. Not linked, not in gallery, never shown to users.

## Rework 2026-05-18 (user feedback)

User: "(1) resets too early. (2) need a stopping force so the rising
weight does not go up into and over the pulley. (3) let me grab and tug
the weights. (4) the point is gravity vs tension, not the pulley disk
inertia. (5) add a double (compound) Atwood toggle."

- (4) Default pulley M = 0 (ideal): T1 = T2, a = (m1-m2)g/(m1+m2). The
  weight (m g, red, down) and tension (T, green, up) arrows are the
  focus; net = (m1-m2)g in the readout. The M slider stays as the
  advanced case (I/R^2 braking, split tensions) but is no longer the
  default. sim.js single-Atwood API is unchanged so its 6 invariants
  still pass; added 3 double-Atwood invariants (T = 2 T2, balanced
  a1 = 0, energy conserved) -> 9/9.
- (1)+(2) Replaced the teleport `if(|x|>X_MAX){x=0;v=0;}` with a hard
  stop: LLIM = half the pulley-to-floor span; when a block reaches the
  pulley or the floor it clamps and v -> 0 and s.stopped freezes the
  rig (no auto reset). Reset, a Reset button, or a tug clears it.
- (3) Pointer grab: pointerdown hit-tests the block rects, drag sets
  the constrained displacement (the other block moves oppositely),
  release hands a clamped velocity back to the dynamics. Integration
  pauses while dragging.
- (5) sim.js: ideal double Atwood (Morin Ch.3) closed form
  T2 = 4g/(1/m2+1/m3+4/m1), T = 2 T2, a1/a2/a3; createDouble /
  stepDouble / doubleVels / energyDouble. playground.js mode selector
  swaps the rig and the m3 vs pulley-M control row.
- Render reworked twice: first pass had the double pulleys overlapping
  and the v(t)/a(t) trace + double annotations colliding with the HTML
  readout overlay. Fix: HUD_SAFE_X column for the machine, trace and
  double annotations moved to the clear lower band (y > 360), arrows
  capped so they never cross the floor/pulley or leave the canvas,
  movable pulley B given a gentle PXD scale and generous clamps so A
  and B never overlap. Both modes inspected directly; gate 5/5 x3.

## Original notes

## What it is
Canvas2D. Atwood machine with a finite-inertia pulley:
a = (m1-m2)g / (m1+m2+I/R^2); unequal tensions T1 = m1(g-a),
T2 = m2(g+a). Disk/ring selector, zero-mass-pulley option, v(t)/a(t)
side traces. Pure local sim.js, no shared engine, no GL.

## Post-build sweep record (2026-05-18)
- Opus visual-reviewer 6/6 PASS; confirmed by my own t-050
  inspection: shaded massive pulley + gold spoke, m1/m2 blocks, cyan
  T=24 vs T=23 (unequal, the physics point), magenta weights, full
  readout (a, T1, T2, I, regime), linear v(t) / flat a(t) traces.
- Health: hook/one_paragraph already approachable. Only fix: removed
  the raw bib key "(`marion-thornton`)" from the user-facing
  data-slot caption (kept the human-readable Marion and Thornton
  source). Render-neutral (figcaption is below #stage), NO recapture.
- 6 invariants. Index rebuilt.

## Gate commands
- node --check playground.js sim.js
- npx vitest run invariants.test.mjs   (6 tests)
- node scripts/build-index.mjs
- visual gate only if #stage changes (this sweep was caption-only).

## Double-mode drag fix + smaller blocks (2026-05-18, #255)

User: "double Atwood physics seems broken, especially drag and
release" and later "make the masses half size, it feels cramped."

- Root cause of the "broken" double drag: pointermove/endDrag mapped
  screen pixels to metres with PX (150, the single-rig scale) while
  the compound rig is drawn at PXD (64). So a double-mode drag moved
  the wrong distance and released a velocity off by PX/PXD ~ 2.3x with
  the wrong feel. Fixed: drag now uses `sPx = mode==='double' ? PXD :
  PX` for both the position delta and drag.v.
- Second bug: clampStops only bounded q1, never q2, so m2/m3 (the
  generalized coord q2) diverged while the render pinned them at the
  floor (looked frozen, numbers exploded, release threw garbage).
  Added LLIM2 = 0.85 bound on q2 with v2 -> 0 and a hard stop.
- PXD promoted to a module const (was local in renderDouble) so the
  drag handler can use it. doubleAccel signs re-checked against the
  render (y1 up with q1, yB down with -q1, y2/y3 with +-q2): the ODE
  was already correct (energy 5e-9, balanced a1=0); only the drag
  scale and the q2 bound were wrong.
- blockSize 26+20*cbrt(m) -> 13+10*cbrt(m) (halved): both modes were
  visually cramped; now there is room around the rig and arrows.
- Invariants 9/9 unchanged (sim.js untouched). Both modes inspected
  directly: single uncramped, double pulleys distinct and bounded,
  T=2T2; visual gate 5/5 x3.

## Double: random stop + cable-under-pulley (2026-05-18, #257)

User: "double Atwood stops at random times (feels like the masses'
hitboxes collide)" and "the smaller pulley's cable goes under the
machine instead of over."

- Random stop: my #255 q2 clamp set s.stopped=true whenever |q2|
  reached LLIM2 (0.85). q2 (the m2/m3 differential) has a constant
  nonzero acceleration in general, so it hit the bound quickly and
  froze the WHOLE rig at seemingly random times. Fix: only q1 (m1
  reaching the floor / fixed pulley) is a true full stop; the q2 bound
  now just pins that pair (clamp q2, v2 -> 0) via an else-if and does
  NOT set s.stopped, so the machine keeps running on the q1 DOF.
  LLIM2 widened 0.85 -> 1.4 so m2/m3 have visible travel. There is no
  block-block hitbox logic; clampStops was the only stop, so this
  fully removes the spurious freezes.
- Cable under: renderDouble drew the movable-pulley arc with
  `arc(cxB, yB, RB, 0, Math.PI)` = the BOTTOM half in screen coords
  (y down), so rope 2 appeared to wrap under B. Changed to
  `Math.PI, 2*Math.PI` (top half, matching the fixed pulley); rope 2
  now drapes over the top with m2/m3 hanging from the side tangents.
- Invariants 9/9 (sim.js untouched). Double frame inspected: rope over
  B, blocks on the sides; gate 5/5 x3.

## Sweep 2026-05-18
Added comprehensive ## Explainer (first-exposure plain language, all governing equations in KaTeX, bibliographic origin); render-neutral.
invariants Tests  9 passed + visual 5/5 x3. Shipped.
