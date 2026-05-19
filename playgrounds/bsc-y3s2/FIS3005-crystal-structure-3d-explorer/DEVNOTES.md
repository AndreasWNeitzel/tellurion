# DEVNOTES - bsc-y3s2/FIS3005-crystal-structure-3d-explorer (hidden dev ref)

Repo-only.

## Sweep 2026-05-18
Rewrote placeholder hook/one_paragraph as first-exposure-undergrad prose; render-neutral.
invariants  + visual 5/5 x3. Shipped.

## Sweep 2026-05-19
Pure first-exposure-physics user-facing text; no source-code, tooling, performance or CI references.
invariants Tests  9 passed + visual 5/5 x3. Shipped.

## Sweep 2026-05-19
REVIEW (NEEDS CODE FIX + RECAPTURE) partly stale: FCC physics correct (d_111=a/sqrt3=0.577a, 14 BZ faces, XRD selection rules 111/002/022), sim.js + 9 real invariants pass, hook real, has Explainer. PARTIAL-degenerate defect: bootSync swept st.yaw = 0.6 + frac*2*pi (a full turn) so frame 0 and frame 4 showed the same orientation modulo 2 pi (4/5 distinct). Fixed: span changed to 0.6 + frac*5.2 rad (not a full turn). Recaptured 5 distinct goldens; READ t-000 (111 plane edge-on) and t-100 (rotated, 111 face-on) physically correct, 60fps. No sim/invariants/text change. leakscan2=0. Shipped.

## Sweep 2026-05-19
REVIEW NEEDS-CODE-FIX partly stale: physics + sim.js + real invariants + text already correct; sole genuine defect was bootSync ignoring captureFraction (5 identical goldens). Added CAPTURE_FRAC sweep + slider sync; recaptured 5 distinct verified-correct goldens.
invariants Tests  9 passed + visual 5/5 x3. Shipped.

## Enhance 2026-05-19 (live-review #271)
User: "perhaps include some kind of 2D crystallography plot as well?"
The 1D powder-XRD strip + reciprocal view already existed; what was
missing was a real single-crystal diffraction image. Added a third
select-view option "2D diffraction pattern" -> drawDiffraction2D():
the reciprocal layer at l = selected-l, each (h,k) a spot with area
~ sqrt(|F_hkl|), systematic absences drawn as faint open rings so the
FCC all-same-parity / BCC h+k+l-even extinction is visible, (000)
beam stop, labelled h,k axes, selected reflection gold-ringed, caption
states the extinction rule. Reuses sim.js structureFactor/isAllowed
(no engine change). Default view stays 'crystal' so the 5 goldens are
byte-identical; gate re-run confirms visual 5/5 x3 unchanged.
Imported structureFactor, isAllowed; added index.html option.
Gate: 9 invariants + smoke + visual 5/5 x3 PASS. Shipped.
