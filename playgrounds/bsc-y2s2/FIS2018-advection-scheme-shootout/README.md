# Advection scheme shootout

Solve u_t + c u_x = 0 (the simplest PDE there is) on a square pulse using four numerical methods at once. The exact solution just translates the pulse forever; the four methods all fail in different, instructive ways.

What to look for: FTCS top-left blows up regardless of CFL (unstable). Upwind smears the pulse but stays positive (dissipative). Lax-Wendroff keeps the shape but rings near the discontinuity (Gibbs-like). MacCormack is similar to LW.

Controls: advection speed c, CFL number, speed, reset, pause/play.

## Reference

LeVeque 1992, Numerical Methods for Conservation Laws, Chapter 9.

## Verification

- Strong invariants: upwind TVD, FTCS explosion, LW bounded TV on smooth data, mass conservation.
- Visual gate: SSIM > 0.92 against committed golden frames at seed 0xC0FFEE.
- Last verified: see `.verified`.
