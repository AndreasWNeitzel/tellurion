# DEVNOTES - bsc-y3s1/FIS3003-heisenberg-uncertainty-visualizer (hidden dev ref)

Repo-only.

## Sweep 2026-05-18
Rewrote placeholder hook/one_paragraph as first-exposure-undergrad prose; render-neutral.
invariants  + visual 5/5 x3. Shipped.

## Sweep 2026-05-19
Pure first-exposure-physics user-facing text; no source-code, tooling, performance or CI references.
invariants Tests  7 passed + visual 5/5 x3. Shipped.

## Hero-promotion 2026-05-19
The breathing period (2 pi / 0.9 ~ 6.98) almost equalled the capture span (CAPTURE_FRAC x 7), so frames at fraction 0, 0.5 and 1.0 all aliased to the breathing zero-crossing (sigma ~ 1.0) and the goldens looked static. Replaced the capture-time mapping with a monotone squeeze sweep (sigma_x 0.50 -> 2.20, sigma_p 1.00 -> 0.227) so the five frames are five clearly distinct conjugate states demonstrating the seesaw; live mode keeps the sinusoidal breathing. Rebuilt the sigma_x.sigma_p meter: larger, with a shaded hatched FORBIDDEN band below the hbar/2 line and all labels inside the box, and moved it clear of the DOM readout panel (fixes a real overlap). Gradient-filled the packets and added a faint zero-coordinate guide. Triage verdict: was below bar (near-static aliased goldens, cramped/clipped widget); now at bar. sim.js, __physicsCheck and invariants byte-identical: product = 0.5000 (Gaussian minimum) across all frames, invariants 7/7, 5 distinct goldens, rAF ~16.7 ms (60 fps).
invariants Tests  7 passed + visual 5/5 x3. Shipped.

## Live-fix 2026-05-19
User: "the right side of the visuals are hard to understand, colors clash, difficult to read". My earlier promotion built a busy meter (red hatched FORBIDDEN band + cyan/gold gradients + dashed line + 5 labels in a 120px box). Replaced it with a calm self-explanatory meter: one flat-colour bar = the uncertainty product (cyan when at the bound, soft amber above), a single solid white hbar/2 = 0.50 line it cannot cross, a soft non-hatched impossible region, and plainly spaced labels ("uncertainty product", value, "hbar/2 = 0.50 (hard limit)", "cannot go below", "minimum (Gaussian)"). Palette matched to the two packets. sim.js/invariants byte-identical (7/7); seesaw + product=0.5000 preserved; verified live the right side now reads at a glance.
