# Hero playgrounds

Heroes are the showcase entries that justify the WebGL2 carve-out from CLAUDE.md hard rule 8. Each is held to the visual standard codified in `docs/HERO_VISUAL_STANDARD.md` and ships with a CPU mirror under `shared/js/engine/` for invariant testing.

## Selection criteria

A playground is hero-candidate if all of:

1. The phenomenon is visually arresting in three dimensions in a way Canvas2D cannot reproduce (volumetric, lensing, fluid, plasma, attractor cloud).
2. There is a clean closed-form or analytic check that gates the implementation (Larmor radiation pattern, ISCO radius, attractor centroid, etc.).
3. The didactic surface is wide enough that a reviewer spends more than five minutes interacting before exhausting the parameter space.

## Six designated heroes (status as of 2026-05-14)

| Slug | Status | Notes |
|-|-|-|
| `wave-heightfield-clickable-3d` | shipped Canvas2D MVP | 96x96 leapfrog wave equation; click impulses. 5 invariant tests pass. WebGL2 surface upgrade queued. |
| `lorenz-attractor-3d-ensemble` | shipped Canvas2D MVP | $10^3$ trajectories from $10^{-3}$ ball; RK4. 3 invariant tests pass. WebGL2 splat-accumulator queued. |
| `hydrogen-orbitals-3d` | needs-implementation | Analytic $|\psi|^2$ on a 128^3 voxel grid; volume ray-march. Spec scoped, code pending. |
| `tokamak-plasma-confinement-3d` | needs-implementation | Toroidal $B_\phi$, Grad-Shafranov $B_\theta$, field-line tubes, banana-orbit particles. Spec scoped, code pending. |
| `earth-axial-precession-nutation-3d` | needs-implementation | Oblate Earth, lunisolar precession (25,772 yr), 18.6-yr nutation. Spec scoped, code pending. |
| `schwarzschild-kerr-blackhole-3d` | needs-implementation | Per-pixel null geodesic in Kerr metric; Planck disk + Doppler. Spec scoped, code pending. |

## WebGL2 exemption

CLAUDE.md hard rule 8 is updated (Phase 15F) to allow `renderer: webgl2` only for hero-flagged playgrounds, and only when a CPU mirror exists at `shared/js/engine/<slug>-cpu.js`. The CPU mirror is what the invariant tests exercise; the GPU path is then checked to agree with the CPU path on a downsampled grid to 1e-4 after 1000 steps at seed 0xC0FFEE. Visual tests run under SwiftShader so SSIM thresholds remain meaningful across machines.

## Deferred work

The four `needs-implementation` heroes have spec.md skeletons with the full visual-standard instantiation and physics targets. A future session can pick them up directly. Per the iteration policy, each hero is bounded to 5 iterations before being marked `status: needs-physics-review` or `status: needs-invariant-fix` and moving on.
