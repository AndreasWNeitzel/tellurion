# DEVNOTES - msc-y1/MAA-GD-galaxy-merger-nbody (hidden dev ref)

Repo-only.

## Sweep 2026-05-18
Fixed degenerate byte-identical 5-frame goldens (warmup was a fixed 600 steps regardless of captureFraction): wired CAPTURE_FRAC to sweep merger time 250..1100 steps; recaptured 5 distinct physically-correct frames (clean approach, tidal interaction with bridge/tails, phase-mixed debris), screenshot-verified. Corrected the ## Explainer to not overclaim a bound elliptical remnant the frictionless restricted model cannot produce.
invariants Tests 1 passed + visual 5/5 x3. Shipped.
