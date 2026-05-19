# DEVNOTES - bsc-y3s2/FIS3020-bloch-oscillations (hidden dev ref)

Repo-only.

## Sweep 2026-05-18
Rewrote placeholder hook/one_paragraph as first-exposure-undergrad prose; render-neutral.
invariants  + visual 5/5 x3. Shipped.

## Sweep 2026-05-18
Rewrote placeholder hook/one_paragraph as first-exposure-undergrad prose; render-neutral.
invariants  + visual 5/5 x3. Shipped.

## Sweep 2026-05-19
REVIEW (CONFIRMED CODE FIX + RECAPTURE) partly stale: Bloch-oscillation physics correct (omega_B=F, T_B=2pi/omega_B, amp=W/2F), sim.js + 5 real invariants pass, hook real, has Explainer. Sole genuine defect: bootSync hardcoded st.t=(CAPTURE_NAME?2:0) so all 5 goldens identical. Fixed: added CAPTURE_FRAC; deterministic capture sets st.t = frac * 2.7 * (2pi/blochFrequency(F)) (2.7 periods, non-integer so first/last frames differ; 3.0 collided since the motion is periodic). Recaptured 5 distinct goldens; READ t-000 (k at band min, x at start) and t-050 (k advanced up the band, x at a different phase) physically correct Bloch oscillation, 60fps. No sim/invariants/text change. leakscan2=0. Shipped.

## Sweep 2026-05-19
REVIEW CONFIRMED-CODE-FIX partly stale: Bloch physics, sim.js, 5 invariants, text already correct. Sole genuine defect: bootSync hardcoded st.t so all 5 goldens identical. Added CAPTURE_FRAC; capture sweeps st.t over 2.7 Bloch periods (non-integer so endpoints differ); recaptured 5 distinct verified-correct goldens (k sweeps the band, x oscillates).
invariants Tests  5 passed + visual 5/5 x3. Shipped.
