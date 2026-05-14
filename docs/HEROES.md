# Hero playgrounds

Heroes are the showcase entries that justify the WebGL2 carve-out from CLAUDE.md hard rule 8. Each one is held to the visual standard codified in `docs/HERO_VISUAL_STANDARD.md` and ships with a CPU mirror under `shared/js/engine/` for invariant testing.

## Selection criteria

A playground is hero-candidate if all of:

1. The phenomenon is visually arresting in three dimensions in a way Canvas2D cannot reproduce (volumetric, lensing, fluid, plasma, attractor cloud).
2. There is a clean closed-form or analytic check that gates the implementation (Larmor radiation pattern, ISCO radius, attractor centroid, etc.).
3. The didactic surface is wide enough that a reviewer can spend more than five minutes interacting before exhausting the parameter space.

## The six designated heroes

| Slug | What it shows | Citation |
|-|-|-|
| `wave-heightfield-clickable-3d` | 2D wave equation $\partial_t^2 u = c^2 \nabla^2 u - \gamma \partial_t u$ with click-seeded Gaussian impulses on a 256x256 grid; Blinn-Phong lit heightfield with viridis density LUT. | French Waves Ch. 6 (`french-waves`) |
| `lorenz-attractor-3d-ensemble` | Ensemble of $10^4$ Lorenz trajectories from a microscopic ball around $(1, 1, 1)$; RK4 advection in a fragment shader, log-density accumulator with temporal decay, viridis colormap on the attractor cloud. | Strogatz Nonlinear Dynamics Ch. 9 |
| `hydrogen-orbitals-3d` | Analytic $|\psi_{n,l,m}|^2$ on a 128^3 voxel grid with volume ray-march or marching-cubes isosurface; HSV phase coloring toggleable. | Eisberg-Resnick Ch. 5 (`eisberg-resnick`) |
| `tokamak-plasma-confinement-3d` | Tokamak vacuum chamber with toroidal $B_\phi$ and Grad-Shafranov approximation for $B_\theta$; field lines as glowing tubes, guiding-center test particles with banana orbits. | Goedbloed-Poedts Plasma Ch. 5 (`goedbloed-plasma`) |
| `earth-axial-precession-nutation-3d` | Oblate Earth precessing at 50.29 arcsec/yr with 18.6-yr lunisolar nutation and 9.3-yr / semiannual terms; procedural fractal-noise surface texture. | Smart, Celestial Mechanics |
| `schwarzschild-kerr-blackhole-3d` | Kerr metric in Boyer-Lindquist; backward-traced null geodesics from camera, Planck blackbody disk emission with Doppler beaming and gravitational redshift; ergosphere shaded for $a/M > 0.01$. | Shapiro-Teukolsky Ch. 12 (`shapiro-teukolsky`) |

## WebGL2 exemption

Hard rule 8 of CLAUDE.md restricts the rendering stack to Canvas2D + SVG. The exemption is documented in CLAUDE.md (Phase 15F edit) and applies only to playgrounds with `hero_candidate: true` and `renderer: webgl2` in their spec.md.

Every hero ships a CPU mirror at `shared/js/engine/<slug>-cpu.js`; the mirror is what the invariant tests exercise (the GPU path is then checked to agree with the CPU path on a downsampled grid to 1e-4 after 1000 steps at seed 0xC0FFEE). Visual tests run under SwiftShader so SSIM thresholds remain meaningful across machines.

## Superseded slugs

The following non-hero slug is marked deprecated and stays in the catalog with a `superseded_by` field in its spec.md frontmatter:

- `schwarzschild-photon-sphere` -> superseded by `schwarzschild-kerr-blackhole-3d`.

The folder is preserved for the catalog history; the spec.md status is flipped to `deprecated`.

## Implementation status

(As of this writing) All six heroes are designated but not yet implemented. The infrastructure (visual standard + WebGL2 wrappers) lands first in Phase 7-8; the heroes follow in Phase 9-14 of the dissemination directive. Heroes that hit `needs-physics-review` or `needs-invariant-fix` after their budget keep their slug and document open findings in `failures/architect.md`.
