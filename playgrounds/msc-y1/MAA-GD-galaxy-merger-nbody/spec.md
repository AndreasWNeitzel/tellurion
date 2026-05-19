---
title: "Galaxy Merger N-Body"
slug: galaxy-merger-nbody
status: verified
audience: portfolio
created: 2026-05-15
primary_uc: MAA-GD
supporting_ucs: []
curriculum_year: msc-y1
primary_citation: barneshut1986
primary_chapter: 1
hook: 'Two galaxies, each a dark halo plus a stellar disk, fall together in true 3D; a Barnes-Hut octree solves the gravity, dynamical friction sinks the companion, and the shredded debris leaves the Gaia-Enceladus / Sausage signature in the energy vs angular-momentum plane.'
one_paragraph: 'Each galaxy is a Hernquist dark-matter halo (about 80% of its mass) plus a stellar component (about 20%); the primary is a rotating spiral disk, the companion a diffuse dispersion-supported dwarf. Gravity is the shared 3D Barnes-Hut octree (O(N log N), no grid, no periodic box, no analytic cores, no merge event): distant groups of bodies are replaced by their centre of mass once the cell size over distance falls below the opening angle, and a kick-drift-kick leapfrog with Plummer softening advances the true 3D positions. The in-fall, tidal bridges and tails, the dynamical-friction inspiral and the coalescence all emerge from the 3D dynamics, solved per frame at 60fps. The angle of attack is the inclination of the companion approach to the primary disk plane (edge-on to face-on). The camera orbits the real point cloud (drag), zooms (wheel) and pans (Shift-drag); the view is locked to the robust bound-system centre of mass. A second panel shows the stars in the energy vs angular-momentum plane in the surviving primary frame, where the disrupted companion forms the Gaia-Enceladus / Sausage clump.'
tags: [galactic, interactive-drag, animation, live-readout]
difficulty: 4
tier: large
hero_candidate: true
renderer: canvas2d
estimated_engagement_minutes: 6
share_state_keys: []
---

# Galaxy Merger N-Body

Two literature-standard multi-component galaxies (each a dominant Hernquist dark-matter halo, about 80% of the galaxy mass, plus a stellar component, about 20%; ~3000 bodies total, split by the mass sliders) fall together as one fully three-dimensional self-gravitating system. The primary is a rotation-supported two-arm spiral disk; the companion is a diffuse, dispersion-supported dwarf, the realistic Gaia-Enceladus / Sausage progenitor. Gravity is the shared 3D Barnes-Hut octree engine (`shared/js/engine/barnes-hut-3d.js`): O(N log N), no grid, no periodic box, no analytic cores, no special-case forces, no merge event. Every particle has a true 3D position and velocity; the dark halo binds the disk and carries the dynamical friction, so the in-fall, tidal tails, friction-driven inspiral and coalescence all emerge from the 3D particle dynamics, solved per frame at a solid 60fps. The angle of attack sets the inclination of the companion's approach to the primary disk plane (0 deg edge-on, 90 deg face-on). The clean orbitable view (drag rotates, wheel zooms, Shift-drag pans) is locked to the robust bound-system mass-weighted centre of mass every frame. A second panel plots the STELLAR particles in the energy vs angular-momentum plane in the primary frame, where the disrupted lighter galaxy forms the Gaia-Enceladus / Sausage clump.

## Explainer

### What you are looking at

Two galaxies fall together in three dimensions, tidally shred, and
settle into a single relaxed remnant with stripped debris. The left
panel is the real 3D encounter (orbit it with the mouse); the right
panel is the same stars in the energy vs angular-momentum plane, the
diagram galactic archaeologists actually use, where the disrupted
galaxy leaves the Gaia-Enceladus / "Sausage" fingerprint. Sliders set
the two masses, the impact parameter, the closing speed, and the
angle of attack of the companion to the primary disk.

### The Barnes-Hut tree: O(N log N) gravity

Summing the force between every pair of N bodies is O(N^2), far too
slow. The Barnes-Hut method (Barnes and Hut, Nature 324, 446, 1986)
builds an octree: space is recursively split into cubes until each
holds at most one body. To get the force on a body, the tree is
walked from the root; a whole cell of size $s$ at distance $d$ is
replaced by a single pseudo-body at its centre of mass when

$$\frac{s}{d} < \theta ,$$

the opening angle (here the classic $\theta \approx 1$); otherwise
the cell is opened and its children are examined. Distant structure
is thus coarse-grained, nearby structure resolved, and the cost
drops to O(N log N). The pairwise force is Plummer-softened,

$$\mathbf a_i = \sum_j \frac{G\,m_j\,
   (\mathbf r_j-\mathbf r_i)}
   {\left(|\mathbf r_j-\mathbf r_i|^2+\epsilon^2\right)^{3/2}},$$

so close passages stay finite (the standard collisionless-N-body
prescription). Time integration is a kick-drift-kick leapfrog. This
is exactly how isolated galaxy mergers are simulated (Barnes and
Efstathiou 1987; the tree, with PM added for cosmology, is the
GADGET-2 scheme, Springel 2005). There is no periodic box and no
zero-padded FFT, so the method is naturally 3D and isolated; the
shared engine is unit-tested against direct summation (under 2% at
$\theta=0.5$, exact at $\theta=0$).

### The galaxies

Each galaxy is built in 3D from its distribution function. The dark
matter is a Hernquist (1990) sphere, sampled by the analytic inverse
CDF $r=a\sqrt q/(1-\sqrt q)$ with random directions, carrying about
80% of the mass; it is the dominant potential that binds the disk and
against which dynamical friction acts. The primary's stars are a
rotating exponential disk (surface density $\Sigma\propto e^{-R/R_d}$,
the Freeman 1970 law) with a thin scale height and two spiral arms;
the companion's stars are a compact diffuse, dispersion-supported
dwarf. At $t=0$ one self-consistent Barnes-Hut force solve sets the
velocities: the disk on near-circular orbits (small 3D dispersion),
the halo and dwarf on isotropic 3D dispersions, so each galaxy starts
in approximate equilibrium before they fall together.

### Why coalescence is automatic

Nothing is added to make them merge. Dynamical friction arises by
itself: the companion plows through the primary halo, raises a
trailing density wake whose pull drains its orbital energy, sinks,
and is tidally stripped into streams that violently relax around the
survivor. There is no two-body core integration, no Chandrasekhar
term, no merge teleport. The default companion is heavy, concentrated
and on a tight bound orbit, so the merger is decisive (the headless
diagnostic confirms first passage near step 162, the cores merged
near step 199, the bound system staying centred and finite).

### The integrals-of-motion panel and the Sausage

For each star the playground computes, in the surviving primary's
mass-weighted centroid frame, the specific z-angular momentum and the
real (Barnes-Hut potential) orbital energy

$$L_z = x\,v_y - y\,v_x,
  \qquad
  E = \tfrac12 v^2 + \Phi_{\rm BH}(\mathbf x).$$

While the galaxies interact the potential is time-dependent and the
points churn (violent relaxation); as the remnant relaxes $E,L_z$
become near-conserved labels, so the accreted debris stays clustered
in a distinct low-$|L_z|$, radial locus, the Gaia-Enceladus / Sausage
signature found in the Milky Way halo (Helmi et al. 2018; Belokurov
et al. 2018). Change the mass ratio and the angle of attack and watch
the accreted clump shift.

### Things to try

- Drag to orbit the real 3D cloud, scroll to zoom, Shift-drag to pan;
  view the inclined encounter from any angle.
- Set the angle of attack to 0 (companion comes in within the disk
  plane, edge-on) versus 90 (straight down the disk normal, face-on)
  and watch how the tidal response and tails change.
- Read the right panel: the accreted (gold) debris forms a distinct
  low-$L_z$ locus separate from the primary's rotation sequence; set
  $M_1=M_2$ for a major merger or a large ratio for a clean Sausage.

### Where this comes from

The Barnes-Hut octree follows Barnes and Hut, Nature 324, 446
(1986); its use for galaxy mergers follows Barnes and Efstathiou
(1987) and (with PM for cosmology) Springel 2005, GADGET-2; the
Hernquist halo follows Hernquist (1990); emergent dynamical friction
and tidal disruption follow Binney and Tremaine, *Galactic Dynamics*
2e, Chapter 8; the integrals-of-motion Sausage diagnostic follows
Helmi et al., Nature 563, 85 (2018), and Belokurov et al., MNRAS 478,
611 (2018).

## Physical setup

Two multi-component galaxies, each a Hernquist (1990) dark-matter halo (about 80% of the galaxy mass) plus a stellar component (about 20%), ~3000 bodies total split by the M1, M2 sliders. The primary stellar component is a two-arm exponential spiral disk on near-circular orbits; the companion is a compact diffuse dispersion-supported dwarf. Gravity is the shared 3D Barnes-Hut octree (opening angle theta ~ 1, Plummer softening, kick-drift-kick leapfrog). At t=0 one self-consistent force solve sets the velocities (disk circular plus small 3D dispersion; halo and dwarf isotropic 3D dispersion). The companion approaches at the angle of attack to the primary disk plane. No analytic cores, no Chandrasekhar term, no merge event: friction-driven inspiral and coalescence are emergent. The view follows the robust bound-system COM. References: Barnes & Hut 1986 (tree), Hernquist 1990 (halo), Binney & Tremaine 2e Ch. 8 (friction, disruption).

## Numerical method

3000-body 3D Barnes-Hut: an octree is rebuilt each step; the force walk uses the s/d < theta opening criterion with Plummer softening, threaded for stackless traversal; a kick-drift-kick leapfrog reuses the end-of-step acceleration as the next start-of-step acceleration (one tree build per step), holding a solid 60fps for the faithful cuspy-halo model (about 10 ms/step; larger N is below interactive rates because the cuspy centre deepens the tree, and a fully self-consistent 3D particle mesh is far slower still, so 3000 is the honest per-frame ceiling). The energy / angular-momentum panel uses the real Barnes-Hut potential recomputed every 8th frame. The deterministic golden sweep covers the in-fall up to the first deep passage (a positive-Lyapunov N-body is not bitwise-reproducible across browser environments after the violent encounter); the live run integrates indefinitely, showing the full coalescence and Sausage.

## Controls

- M1 (primary mass), M2 (accreted mass), impact parameter b, closing speed, angle of attack to the primary disk plane (deg).
- Relaunch (re-seed the encounter), Pause/Play. No auto-replay.
- Camera: drag to orbit, wheel to zoom, Shift-drag to pan (left panel only).
- share_state_keys: none.

## Invariants

`invariants.test.mjs` plus the shared engine tests in `tests/engines/barnes-hut-3d.test.mjs`:

- Barnes-Hut force matches direct O(N^2) summation within ~2% at theta = 0.5, and exactly (to roundoff) at theta = 0.
- Momentum drift is small and bounded for theta > 0 (a tree code is not exactly momentum-conserving; cell-monopole forces are not pairwise antisymmetric) and is conserved to roundoff at theta = 0.
- The acceleration is deterministic; a cold sphere self-gravitates inward.
- Headless physics diagnostic: with the default parameters the companion makes a first passage near step 162, the cores merge near step 199, the bound system stays centred, no state goes non-finite.

Visual gate: SSIM > 0.92 against the five committed deterministic golden frames, which span the reproducible in-fall; the chaotic post-coalescence evolution is shown live, not SSIM-gated.

## Citations

- Barnes and Hut, Nature 324, 446 (1986): the O(N log N) octree (`barneshut1986`).
- Barnes and Efstathiou (1987): the tree code applied to interacting galaxies (`barnesefstathiou1987`).
- Springel, MNRAS 364, 1105 (2005): tree(+PM) gravity, leapfrog, Plummer-equivalent softening (`springel2005gadget2`).
- Binney and Tremaine, *Galactic Dynamics*, 2nd ed., Ch. 8: dynamical friction and tidal disruption (`binney-tremaine`).
- Helmi et al., Nature 563, 85 (2018); Belokurov et al., MNRAS 478, 611 (2018): the Gaia-Enceladus / Sausage integrals-of-motion signature.

## Risk register

- A tree code does not conserve momentum to machine precision; the drift is bounded and vanishes as theta -> 0 (verified in the engine tests). At theta ~ 1 the force is visual-grade, not science-grade; the merger morphology is robust to it.
- 3000 bodies is the per-frame 60fps ceiling for the faithful cuspy 3D model in single-threaded JS; more particles need a worker offload or a leaf-bucket engine, a documented future enhancement.
- Energy and L_z are conserved labels only once the remnant relaxes; during violent relaxation they churn by design (this is the physics the Sausage panel shows), not a leak.
