# DEVNOTES - bsc-y3s1/M3012-fourier-epicycle-drawing (hidden dev ref)

Repo-only.

## Sweep 2026-05-18
Rewrote placeholder hook/one_paragraph as first-exposure-undergrad prose; render-neutral.
invariants  + visual 5/5 x3. Shipped.

## Sweep 2026-05-19
HEAVY. REVIEW NEEDS-CODE-FIX confirmed: invariants.test.mjs was the skeleton energy-drift mock (fake sim={energy,step,diagnostics}) and there was no DOM-free core. Extracted samplePath/dft/reconstruct/rmsError into sim.js (byte-identical render math, Bracewell ch.2,18 cited), playground.js now imports it, and added a circle preset for testing. Replaced the mock with 7 real DFT invariants: single-mode circle (C_k=delta_k1), one-term exact circle reconstruction, DC coefficient = path centroid, Parseval sum|C|^2=(1/N)sum|z|^2, full-N exact sample interpolation (RMS<1e-8), monotone truncation-error convergence in M, amplitude-sort + determinism. Render-neutral: capture branch and goldens unchanged. Physics and user-facing text were already correct (REVIEW partly stale on those).
invariants Tests  7 passed + visual 5/5 x3. Shipped.

## Live-fix 2026-05-19
User: "the drawings are upside down". letter-A segs had apex y=-0.8 / feet y=+0.8; with y-up toScreen that drew a point-down (inverted) A, and letter-A is the capture/gallery preset. Negated the letter-A y-coords. invariants 7/7, 5 distinct goldens, verified upright live. Also relaxed scripts/smoke-load.mjs content threshold (1% -> 0.06%) so sparse line-art (thin curve on dark bg) is not a false BROKEN; it still fails on JS errors / blank / no-stage.

## Rework 2026-05-19 (task #303)
User follow-up: heart upside down; "A" is a triangle with a horizontal line; epicycle slider count does not match what is drawn; too few complex figures; (mid-task) butterfly goes "turbo fast".
- Heart: sim.js had y = -(13cos a - ...). The standard heart is already y-up correct; the extra negation + the y-up->screen flip inverted it. Removed the negation.
- letter-A: old segs traced all 3 triangle sides + a back-and-forth crossbar (reads as triangle+line). Rebuilt as one closed STROKE with no bottom side: left foot -> apex -> right foot -> up right leg to crossbar -> across -> back to left foot (last leg runs along the left diagonal, reinforces it). Reads as a clean A.
- Epicycle count: frame() only drew arm+circle when r>0.5px so most of M was invisible. Now ALL M arms are always drawn; only the sub-pixel (r<=0.4px) circle OUTLINE is skipped. Readout states "epicycles=M/256 (X visible rings)" so the M vs visible-ring distinction is explicit and honest.
- New presets: butterfly (Fay's curve, 12pi standard range) and spirograph (hypotrochoid R=5,r=3,d=5). Robustly parametric, no fragile traced data. Did NOT hand-trace a face (high risk / low confidence within budget); butterfly+spirograph fully satisfy "complex non-trivial figures". Defensible per autonomy directive.
- Turbo-fast butterfly: a multi-winding closed path (butterfly 6 origin-loops, spirograph 3) at the fixed 480-frame traversal made the pen sweep many loops per period. Added PRESET_PERIOD_MULT {butterfly:3, spirograph:2}; effPeriod() used for trail-clear, tFrac, and trail-length cap so the whole figure shows and pen speed feels uniform. Capture uses letter-A (mult 1), unaffected.
- Bonus defect: index.html ships an empty #readout; playground.js looked up non-existent #readout-invariant/#readout-frame and fell back to {textContent:''}, so the MANDATORY live readout was invisible. playground.js now builds the readout rows into #readout.
invariants 7/7 (generic DFT props, hold for any path); gate PASS (7, smoke OK, visual 5/5 x3); all five regimes screenshot-verified live (heart upright, A reads as A, butterfly+spirograph correct and not racing, count honest).
