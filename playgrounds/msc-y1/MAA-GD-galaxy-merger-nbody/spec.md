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
hook: 'Two galaxies, each a dark-matter halo wrapped around a stellar disk, fall together in 3D; dynamical friction drags the smaller one in, tidal forces shred it, and the debris leaves the Gaia-Enceladus / Sausage fingerprint in the energy vs angular-momentum plane.'
one_paragraph: 'Each galaxy has two parts: a Hernquist dark-matter halo carrying about 80% of the mass and a luminous stellar component, the primary a rotating spiral disk and the companion a small diffuse dwarf. All bodies move under their mutual gravity, computed as a full three-dimensional N-body system with a hierarchical (Barnes-Hut) approximation and a softened force so close passages stay finite; nothing about the merger is scripted. The companion raises a trailing wake in the primary halo, loses orbital energy to dynamical friction, sinks, is tidally stretched into bridges and tails, and the debris violently relaxes into a single remnant. A slider sets the angle at which the companion comes in (edge-on to the disk through face-on), alongside the two masses, impact parameter and closing speed; drag to orbit the view, scroll to zoom. A second panel plots the stars in the energy versus angular-momentum plane in the survivor''s rest frame, where the shredded companion settles into the distinct low-angular-momentum clump that identifies the Gaia-Enceladus / Sausage debris in the real Milky Way halo.'
tags: [galactic, interactive-drag, animation, live-readout]
difficulty: 4
tier: large
hero_candidate: true
renderer: canvas2d
estimated_engagement_minutes: 6
share_state_keys: []
---

# Galaxy Merger N-Body

Two literature-standard multi-component galaxies fall together as one fully three-dimensional self-gravitating system. There are 12000 live N-body particles total: at the default mass ratio about 11500 are luminous stars (most of the particle count, light) and only about 500 are dark-matter particles in the two Hernquist halos (few, and about 92x heavier per particle). The dark matter is explicitly modelled as particles, not an analytic potential, and carries about 80% of each galaxy's mass; it is what binds the disk and drives the dynamical friction. Particles are equal-mass within a component, with halo particles about 92x heavier than star particles (the dark halo is low-resolution: it only supplies the smooth binding potential and the dynamical-friction wake, so few heavy particles suffice, while the numerous light stars trace the light); per-particle mass matches in both galaxies because the count scales with galaxy mass. The primary is a rotation-supported spiral disk; the companion is a diffuse, dispersion-supported dwarf, the realistic Gaia-Enceladus / Sausage progenitor. Gravity is the shared 3D Barnes-Hut octree engine (`shared/js/engine/barnes-hut-3d.js`): O(N log N), no grid, no periodic box, no analytic cores, no special-case forces, no merge event. Every particle has a true 3D position and velocity; the in-fall, tidal tails, friction-driven inspiral and coalescence all emerge from the 3D particle dynamics. The 12000-body tree solve runs in a Web Worker (about 15 steps/s) so the render stays at a steady 60fps; the deterministic capture path (the SSIM gate) runs the same model and engine synchronously. The angle of attack sets the inclination of the companion's approach to the primary disk plane (0 deg edge-on, 90 deg face-on). The clean orbitable view (drag rotates, wheel zooms, Shift-drag pans) is locked to the robust bound-system mass-weighted centre of mass every frame. A second panel plots the STELLAR particles in the energy vs angular-momentum plane in the primary frame, where the disrupted lighter galaxy forms the Gaia-Enceladus / Sausage clump.

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

### How gravity is computed

Every star and dark-matter particle feels the pull of every other.
Computing each pair directly is prohibitively expensive for a galaxy,
so the simulation uses the hierarchical idea introduced by Barnes and
Hut (Nature 324, 446, 1986): a distant clump of bodies is well
approximated by a single mass at its combined centre of mass. A group
of angular size $s$ seen at distance $d$ is treated as one body when

$$\frac{s}{d} < \theta ,$$

where the opening angle $\theta$ trades detail for cost: small
$\theta$ resolves more structure, $\theta\approx1$ is the usual
choice. Nearby bodies are still summed individually, with the force
softened so a close passage stays finite,

$$\mathbf a_i = \sum_j \frac{G\,m_j\,
   (\mathbf r_j-\mathbf r_i)}
   {\left(|\mathbf r_j-\mathbf r_i|^2+\epsilon^2\right)^{3/2}},$$

the standard collisionless prescription ($\epsilon$ a softening
length). Orbits are advanced with a time-symmetric leapfrog, so the
energy stays well behaved over the whole encounter. This is the same
approach used for real galaxy-merger studies (Barnes and Efstathiou
1987; large simulations such as GADGET, Springel 2005).

### The galaxies

Each galaxy is two components. The dark matter follows a Hernquist
(1990) profile and carries about 80% of the mass; it is the dominant
potential that binds the disk and against which dynamical friction
acts. The primary's stars form a rotating exponential disk (surface
density $\Sigma\propto e^{-R/R_d}$, the Freeman 1970 law) with a thin
scale height and two spiral arms; the companion is a compact, diffuse,
dispersion-supported dwarf. Each galaxy is launched in approximate
internal equilibrium, the disk on near-circular orbits and the halo
and dwarf with isotropic random motions, so any structure that
appears is produced by the encounter, not by the starting state.

### Why coalescence is automatic

Nothing is added by hand to make the galaxies merge. Dynamical
friction arises on its own: the companion plows through the primary
halo and raises a trailing density wake whose backward pull drains
its orbital energy. It sinks, is tidally stripped into streams, and
the debris violently relaxes around the survivor. There is no
imposed drag term and no merge event; with a heavy companion on a
tight bound orbit the sinking takes only a couple of pericentre
passages, so the coalescence is decisive.

### The integrals-of-motion panel and the Sausage

For each star the right panel shows, measured in the surviving
primary's rest frame, the specific vertical angular momentum and the
orbital energy in the system's own gravitational potential
$\Phi(\mathbf x)$,

$$L_z = x\,v_y - y\,v_x,
  \qquad
  E = \tfrac12 v^2 + \Phi(\mathbf x).$$

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

Two multi-component galaxies, each a Hernquist (1990) dark-matter halo (about 80% of the galaxy mass, modelled as live particles) plus a stellar component (about 20%), 12000 bodies total (about 11500 light shining stars and about 500 heavy low-resolution dark-halo particles at the default mass ratio), split by the M1, M2 sliders. Particles are equal-mass within a component (halo particles roughly 13% heavier than disk-star particles). The primary stellar component is a two-arm exponential spiral disk on near-circular orbits; the companion is a compact diffuse dispersion-supported dwarf. Gravity is the shared 3D Barnes-Hut octree (opening angle theta ~ 1, Plummer softening, kick-drift-kick leapfrog). At t=0 one self-consistent force solve sets the velocities (disk circular plus small 3D dispersion; halo and dwarf isotropic 3D dispersion). The companion approaches at the angle of attack to the primary disk plane. No analytic cores, no Chandrasekhar term, no merge event: friction-driven inspiral and coalescence are emergent. The view follows the robust bound-system COM. References: Barnes & Hut 1986 (tree), Hernquist 1990 (halo), Binney & Tremaine 2e Ch. 8 (friction, disruption).

## Numerical method

12000-body 3D Barnes-Hut: an octree is rebuilt each step; the force walk uses the s/d < theta opening criterion with Plummer softening, threaded for stackless traversal; a kick-drift-kick leapfrog reuses the end-of-step acceleration as the next start-of-step acceleration (one tree build per step). The faithful cuspy 10000-body solve is about 50 ms/step (the cuspy centre deepens the tree), too slow for a 60fps per-frame loop, so it runs in a Web Worker (about 15 steps/s); the main thread renders the latest snapshot at a steady 60fps. The stars are the high-resolution component (90% of the particle count, light) and the dark matter low-resolution (10% of the count, about 92x heavier per particle), the standard mass-resolution split (only the stars shine; the dark halo just supplies the smooth potential and friction). The energy / angular-momentum panel uses the real Barnes-Hut potential recomputed in the worker every 6th step. The deterministic capture path (the SSIM gate) runs the same model and engine SYNCHRONOUSLY (a larger step, few warmups) and covers the in-fall up to the first deep passage; a positive-Lyapunov N-body is not bitwise-reproducible across browser environments after the violent encounter, so only the predictable in-fall is gated while the live run integrates indefinitely.

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
- The main-thread per-frame 60fps ceiling for the faithful cuspy 3D model is roughly 3000-4000 bodies; 12000 is reached by offloading the tree solve to a Web Worker (about 20 physics-steps/s, render at 60fps). Even larger N or a leaf-bucket engine optimisation is a documented future enhancement.
- A tree code does not conserve momentum to machine precision; the drift is bounded and vanishes as theta -> 0 (verified in the engine tests).
- Energy and L_z are conserved labels only once the remnant relaxes; during violent relaxation they churn by design (this is the physics the Sausage panel shows), not a leak.
