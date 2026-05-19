# DEVNOTES - bsc-y2s2/FIS2021-standard-map-kam (hidden dev ref)

Repo-only.

## Sweep 2026-05-18
Rewrote placeholder hook/one_paragraph as first-exposure-undergrad prose; render-neutral.
invariants  + visual 5/5 x3. Shipped.

## Sweep 2026-05-18
Added comprehensive ## Explainer (first-exposure plain language, all governing equations in KaTeX, bibliographic origin); render-neutral.
invariants Tests  6 passed + visual 5/5 x3. Shipped.

## Rework 2026-05-19 (user: never see the rotator; buttons don't work)
sim.js + 6 invariants byte-identical. playground.js:
- Added the kicked-rotor panel (left): a rod that free-rotates then
  gets the periodic impulse K sin(theta); its stroboscopic (theta,p)
  is one standard-map iterate and is drawn live in gold on the phase
  portrait, tying the physical rotor to the map (the missing piece).
- Buttons didn't work because an always-on K-sweep called rebuild()
  every frame and overwrote state.K, clobbering Reset/K_crit and
  lagging. Removed the sweep. K slider applies on input via a
  coalesced state.dirty flag (one rebuild/frame, responsive); Reset
  re-seeds the rotor; K_crit snaps K; Play/Pause toggles the rotor.
  Click on the portrait seeds a new rotor IC.
Gate 6 + smoke + 5/5 x3.
