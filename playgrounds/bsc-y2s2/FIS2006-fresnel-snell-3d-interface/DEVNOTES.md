# DEVNOTES - bsc-y2s2/FIS2006-fresnel-snell-3d-interface (hidden dev ref)

Repo-only.

## Sweep 2026-05-19
Pure first-exposure-physics user-facing text; no source-code, tooling, performance or CI references.
invariants Tests  6 passed + visual 5/5 x3. Shipped.

## Rebuild 2026-05-19 (live-review #282)
User: "visualizing the actual waves diffracting and reflecting is a
lot more interesting than just straight lines. Also ... the incident
wave is coming from the bottom here, it should come from the top."
Old render was three straight beam() bands; incident ang = -pi/2+th1
started below the interface (came from the bottom). Rebuilt the scene
as a real wavefield (sim.js, __physicsCheck, invariants byte-identical):
- Medium 1 (TOP) = incident plane wave (down-right, ki = k0 n1
  (sin,cos)) + reflected (up-right) with the complex Fresnel r, so
  the partial standing-wave interference is the reflection made
  visible. Medium 2 (BOTTOM) = transmitted plane wave at the Snell
  angle (complex t), or the exp(-kappa y) evanescent skin in TIR.
  Re(E) on a once-allocated half-res ImageData -> drawImage, animated.
- Incident now descends from the top; thin dashed guide rays + angle
  arcs kept so the angles stay explicit; polarization inset and the
  Fresnel reflectance-vs-angle plot kept as the diagnostic.
- Capture sweeps incidence 15..82 deg (frozen phase) for 5 distinct
  physically meaningful goldens.
Gate: 6 invariants + smoke + visual 5/5 x3 PASS. Shipped.
