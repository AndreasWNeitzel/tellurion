# DEVNOTES - msc-y1/MAA-GD-galaxy-merger-nbody (hidden dev ref)

Repo-only.

## Sweep 2026-05-18
Fixed degenerate byte-identical 5-frame goldens (warmup was a fixed 600 steps regardless of captureFraction): wired CAPTURE_FRAC to sweep merger time 250..1100 steps; recaptured 5 distinct physically-correct frames (clean approach, tidal interaction with bridge/tails, phase-mixed debris), screenshot-verified. Corrected the ## Explainer to not overclaim a bound elliptical remnant the frictionless restricted model cannot produce.
invariants Tests 1 passed + visual 5/5 x3. Shipped.

## Sweep 2026-05-18
User feedback: too few particles and not spiral. Replaced spherical Hernquist blob + random per-particle rotation with a coherently-rotating truncated disk of 7000 tracers/galaxy (>10x) and two trailing logarithmic spiral arms; rotation now coherent so the encounter makes proper tidal bridges/tails. Screenshot-verified spiral structure and tidal bridge; 60fps at 14000 particles.
invariants Tests 1 passed + visual 5/5 x3. Shipped.

## Sweep 2026-05-18
User feedback: cores kissed and froze, dubious mass distribution, wanted real coalescence + an E-Lz diagram + per-galaxy mass sliders + Sausage analogue. Replaced with exponential (Freeman) disks; unequal-mass two-body + exact Chandrasekhar dynamical friction so the orbit decays and the nuclei coalesce into one phase-mixed remnant (no kiss-and-freeze); added M1/M2 sliders and a COM-frame energy vs angular-momentum panel color-coded by origin showing the accreted galaxy as a distinct low-Lz clump (Gaia-Enceladus/Sausage). Screenshot-verified both panels at early and merged states; 60fps at 14000 particles.
invariants Tests 1 passed + visual 5/5 x3. Shipped.

## Sweep 2026-05-18
User feedback: with an unequal-mass primary the lab-frame view let the system drift off-screen, and the E-Lz plot looked suspicious (evolves then freezes). Fixed: render the spatial panel in the shared mass-weighted COM frame so the remnant stays centered at any mass ratio; reduced the merge radius so dynamical friction drives several decaying passages (violent relaxation churns E-Lz through the merger) before coalescence. The post-settling freeze is correct physics (conserved integrals in a relaxed remnant, the basis of the Gaia-Enceladus diagnostic) and is now documented. Screenshot-verified the remnant stays centered and the E-Lz plane evolves (t-050) then settles (t-100).
invariants Tests 1 passed + visual 5/5 x3. Shipped.
