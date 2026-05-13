# Billiards: circle, stadium, Sinai

A free particle bouncing inside three different 2D shapes. The shape determines whether the motion is integrable (regular forever) or chaotic (fills the space). Specular reflection at each wall, unit speed, no friction.

What to look for: circle traces a clean caustic ring with a circular gap in the middle (integrable). Stadium and Sinai quickly fill the whole region with what looks like random walk (chaotic). The pause/play and reset buttons control the simulation; the dropdown picks the geometry.

Controls: geometry dropdown, speed (bounces per frame), reset, pause/play.

## Reference

Berry 1981, Eur. J. Phys. 2, 91; Tabachnikov 2005, Geometry and Billiards.

## Verification

- Strong invariants: |v| = 1 exactly, position on boundary at each bounce, circle integrability invariant, stadium angular spread > 2 rad.
- Visual gate: SSIM > 0.92 against committed golden frames at seed 0xC0FFEE.
- Last verified: see `.verified`.
