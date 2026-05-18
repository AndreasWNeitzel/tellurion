# DEVNOTES - FIS1013-collision-scattering-lab (hidden dev ref)

Repo-only. Not linked, not in gallery, never shown to users.

## What it is
Canvas2D. Elastic two-body scattering shown in the lab frame (inset)
and the centre-of-mass frame (main), with the differential cross-
section panel and a Rutherford analytic overlay; readout chi_CM,
theta_lab, impact parameter b, potential, regime. Pure local sim.js.

## Post-build sweep record (2026-05-18)
- Opus visual-reviewer 6/6 PASS (lab-vs-CM contrast clear, trajectories
  clean, cross-section + Rutherford overlay correct, no defects).
  Health: hook/one_paragraph already approachable. Only fix: removed
  the raw `goldstein` key from the user-facing data-slot caption.
  Render-neutral, NO recapture. Invariants 7/7. Index rebuilt.

## Gate commands
- node --check playground.js sim.js
- npx vitest run invariants.test.mjs   (7 tests)
- node scripts/build-index.mjs
- visual gate only if #stage changes (this sweep was caption-only).

## Yukawa lag + hard-sphere no-collision (2026-05-18, #250)

User: "Yukawa is extremely laggy; rigid body doesn't even show the
collision animation."

- Lag root cause: render() runs every frame and the dsigma/dOmega
  polar loop called chiOf(b)/chiOf(b+) ~180x per frame; for Yukawa each
  chiOf is a numerical orbit (was up to 4e5 velocity-Verlet steps), so
  a single frame did tens of millions of steps -> multi-second freeze.
  Fix: buildCache() computes the 90-sample curve and the current-b
  deflection ONCE per parameter change (rebuild); render() just draws
  the cached arrays (zero integration per frame). chiYukawa also
  coarsened (dt 0.001->0.002, cap 4e5->8e4): still monotone and
  accurate (invariants 7/7), and the one-time rebuild is ~150 ms.
- Hard-sphere "no collision": relTrajectory used a k=4000 stiff spring
  with explicit Euler at dt=0.004 -> the particle barely deflected, so
  the bounce was invisible. Replaced with the exact elastic hard
  sphere: free flight, solve the segment/circle intersection, one
  specular reflection about the contact normal. Headless: b=0.5,R=1 ->
  exit 120.0 deg = pi-2asin(0.5) exactly; b>=R is a clean miss.
- Capture cycles coulomb / hard / yukawa so the goldens prove all
  three render (incl. the sharp hard-sphere bounce and the
  no-longer-laggy Yukawa). Frames inspected directly; gate 5/5 x3.
