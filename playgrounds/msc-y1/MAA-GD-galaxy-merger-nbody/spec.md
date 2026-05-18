---
title: "Galaxy Merger N-Body"
slug: galaxy-merger-nbody
status: verified
audience: portfolio
created: 2026-05-15
primary_uc: MAA-GD
supporting_ucs: []
curriculum_year: msc-y1
primary_citation: hockneyeastwood1988
primary_chapter: 5
hook: 'Two self-gravitating galaxies, each a dark halo plus a stellar disk, fall together; an isolated-boundary particle-mesh solves their gravity while a real vertical mode thickens the disk, and the shredded companion leaves the Gaia-Enceladus / Sausage signature in the energy vs angular-momentum plane.'
one_paragraph: 'Each galaxy is a dominant Hernquist dark-matter halo (about 82% of its mass) plus a stellar component (about 18%), ~16000 particles total. The in-plane gravity is solved self-consistently with the shared particle-mesh engine using ISOLATED (vacuum) boundaries (zero-padded Green-function FFT, no periodic box, no analytic cores, no merge event), so dynamical friction, tidal tails and coalescence all emerge. Every particle also has a real dynamical out-of-plane coordinate integrated by a symplectic leapfrog under the self-gravitating isothermal-sheet field with a PM-derived vertical frequency, so the disk starts in vertical equilibrium and physically thickens (vertical heating) when the encounter shocks it. The scene uses an inclined perspective camera you can orbit (drag), zoom (wheel) and pan (Shift-drag); a full self-consistent 3D PM solve is ~227 ms/step even at the coarsest usable grid (the isolated solve needs a zero-padded 64^3 FFT), so the in-plane PM plus the exact vertical-mode dynamics is the real-time physical decomposition. The view is locked to the robust bound-system centre of mass; a second panel tracks the stars in the energy vs angular-momentum plane in the primary frame, where the disrupted companion forms the Gaia-Enceladus / Sausage clump.'
tags: [galactic, interactive-drag, animation, live-readout]
difficulty: 4
tier: large
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 6
share_state_keys: []
---

# Galaxy Merger N-Body

Two literature-standard multi-component galaxies (each a dominant Hernquist dark-matter halo, about 82% of the galaxy mass, plus a stellar component, about 18%; ~16000 particles total, split by the mass sliders) fall together as one true self-gravitating system. The primary is a rotation-supported two-arm spiral disk; the infalling secondary is a diffuse, dispersion-supported dwarf (a centrally-concentrated blob on isotropic random orbits, no rotation, no arms), the realistic Gaia-Enceladus / Sausage progenitor. The in-plane gravity is solved self-consistently with the shared particle-mesh engine using ISOLATED (vacuum) boundaries (zero-padded Green's-function convolution, fast radix-2 FFT): no periodic box, no analytic cores, no special-case forces. The dark halo binds the disk (so it is tidally heated, not trivially stripped) and is the mass against which dynamical friction sinks the companion, so the in-fall, tidal tails, friction-driven inspiral, disk heating and coalescence all emerge from the particle dynamics. Every particle also carries a real, dynamical out-of-plane coordinate (z, vz) integrated by a symplectic leapfrog under the self-gravitating isothermal-sheet vertical field with a PM-derived vertical frequency, so the disk begins in vertical equilibrium and physically thickens (vertical heating) when the encounter shocks it. The scene is drawn with an inclined perspective camera (yaw plus a scene inclination plus a true perspective divide, so the disk is a clear ellipse and the secondary's angle of attack is unmistakable) that you can orbit (drag), zoom (wheel) and pan (Shift-drag). The view is locked to the robust bound-system mass-weighted centre of mass every frame. A second panel plots the STELLAR particles (with a valid PM potential) in the energy vs angular-momentum plane in the primary frame, where the disrupted lighter galaxy forms the Gaia-Enceladus / Sausage clump.

## Explainer

### What you are looking at

Two galaxies fall together, tidally shred, and settle into a single
relaxed remnant with stripped debris. The left panel is the encounter
in space, drawn as a real inclined 3D scene; the right panel is the
same particles in the energy vs angular-momentum plane, the diagram
galactic archaeologists actually use, where the disrupted galaxy
leaves the Gaia-Enceladus / "Sausage" fingerprint. Sliders set the
two galaxy masses, the impact parameter, the closing speed and the
angle of attack of the infalling companion.

### A true self-gravitating particle mesh

The primary is a dense rotating two-arm spiral disk; the companion is
a diffuse, dispersion-supported dwarf. Crucially there are no
point-mass cores and no prescribed potential: gravity is computed
from the particles themselves with a particle-mesh (PM) solver. Each
step deposits the particle masses on a grid (cloud-in-cell), then
solves the Poisson equation $\nabla^2\Phi = 4\pi G\,\rho$ with
ISOLATED (free-space) boundaries. In 2D the Green's function of the
Laplacian is $\tfrac{1}{2\pi}\ln r$, so the potential is the
convolution

$$\Phi(\mathbf r) = 2G\!\int \ln|\mathbf r-\mathbf r'|\;
  \rho(\mathbf r')\,d^2r',$$

evaluated by the zero-padded FFT trick (the density is embedded in a
doubled grid and convolved with the discretized Green's function).
There is no periodic box, so no spurious image forces and no wrapping
of particles. The force $-\nabla\Phi$ is interpolated back to each
particle, which is advanced by a kick-drift-kick leapfrog (Hockney
and Eastwood 1988). Because the field is built from the actual
particle distribution and fed back to them, the self-gravity is
fully self-consistent.

### Real 3D: a dynamical vertical mode, not a flat sheet tilted

A disk seen even at a steep angle still looks flat if it has no real
thickness, so the vertical motion here is genuine dynamics, not a
passive offset. A self-gravitating stellar sheet has the Spitzer 1942
vertical structure: density $\rho(z)=\rho_0\,\mathrm{sech}^2(z/z_0)$
and vertical field

$$K_z = -\,2\pi G\,\Sigma\,\tanh(z/z_0)
   \;\;\xrightarrow[\;|z|\ll z_0\;]{}\;\; -\nu^2 z ,$$

a bounded restoring force that is harmonic for small excursions with
vertical frequency $\nu$. Each particle integrates $z, v_z$ with a
symplectic leapfrog under this field, with $\nu^2$ taken from the
self-consistent PM in-plane force, $\nu^2 = \beta\,|a_R|/R$ (a
flattened disk has $\nu>\Omega$; Binney and Tremaine 2e Sec. 3.2.3).
The disk is seeded in matched equilibrium (initial $z$-spread equal
to the scale height, initial $v_z$ from the matched dispersion), so
in isolation it neither collapses nor puffs. When the encounter
tidally shocks it, energy is pumped into $z$ and the disk visibly
thickens (the headless diagnostic shows the disk root-mean-square
height growing by roughly a factor of three through the collision and
then partly relaxing): this disk-thickening is observed merger
physics, the standard channel for forming a thick disk, and it is
what makes the scene a real 3D body rather than a tilted plane.

### Why not a full 3D particle mesh

A fully self-consistent 3D PM Poisson solve was measured at about
227 ms per step even at the coarsest usable grid ($32^3$), far below
60 fps. The reason is specific and physical, not an implementation
detail: an isolated (vacuum) solve must zero-pad the grid to double
size before the FFT (otherwise wrap-around image forces appear, the
very fly-through artifact this playground had to remove), so a
$32^3$ run needs a $64^3$ ($\sim$262k-cell) 3D FFT, about 190 times
the 2D work. The merger's dominant physics (orbit decay, tidal tails,
the bar, the remnant, the Sausage in $E$ vs $L_z$) lives in the
orbital plane; the exact in-plane PM plus the exact vertical-mode
dynamics is the physically faithful decomposition that runs in real
time, and it is stated openly here rather than hidden.

### The integrals-of-motion panel and the Sausage

For each particle the playground computes, in the rest frame of the
primary galaxy's mass-weighted density centroid, the specific angular
momentum and the real (PM-potential) orbital energy

$$L_z = x\,v_y - y\,v_x,
  \qquad
  E = \tfrac12 v^2 + \Phi_\mathrm{PM}(\mathbf x),$$

with positions and velocities relative to that centroid. The centroid
is a continuous function of the particle positions, so the reference
frame never jumps. This is the Galactocentric analogue: the real
Gaia-Enceladus / Sausage integrals are measured relative to the
surviving Milky Way, not the system barycentre. While the galaxies
interact the potential is time-dependent and the points churn (violent
relaxation); as the remnant relaxes the potential becomes nearly
stationary and $E, L_z$ become near-conserved labels, so the accreted
debris stays clustered in a distinct low-$|L_z|$, radial locus, the
Gaia-Enceladus / Sausage signature found in the Milky Way halo (Helmi
et al. 2018; Belokurov et al. 2018). Change the mass ratio and watch
the accreted clump's position and prominence shift.

### Things to try

- Drag to orbit the camera, scroll to zoom, Shift-drag to pan: the
  disk reads as a clear inclined ellipse with real depth, and the
  companion comes in along the angle-of-attack direction.
- Watch the lighter galaxy raise a trailing wake, sink, tidally
  shred into streams, and the survivor's disk visibly thicken
  (vertical heating) as it is shocked.
- Read the right panel: the accreted (gold) debris forms a distinct
  low-$L_z$ locus separate from the primary's rotation sequence.
- Set $M_1=M_2$ for a major merger (both disrupted), or a large ratio
  for a minor one (clean Sausage), and change the angle of attack.

### Where this comes from

The particle-mesh method follows Hockney and Eastwood, *Computer
Simulation Using Particles* (1988), Chapters 5 to 7; the
self-gravitating isothermal-sheet vertical structure follows Spitzer,
ApJ 95, 329 (1942), and Binney and Tremaine, *Galactic Dynamics* 2e,
Chapters 3 to 4; emergent dynamical friction and tidal disruption
follow Binney and Tremaine 2e, Chapter 8; the integrals-of-motion
Sausage diagnostic follows Helmi et al., Nature 563, 85 (2018), and
Belokurov et al., MNRAS 478, 611 (2018).

## Physical setup

Two multi-component galaxies, each a Hernquist (1990) dark-matter halo (about 82% of the galaxy mass, the dominant component that binds the disk and carries dynamical friction) plus a stellar component (about 18%), about 16000 particles total split by the M1, M2 sliders. The primary stellar component is a two-arm spiral disk on circular orbits; the secondary is a diffuse dispersion-supported dwarf. In-plane self-gravity is solved with the shared 2D particle-mesh engine (`shared/js/engine/particle-mesh-2d.js`): cloud-in-cell deposit on a 64 x 64 grid, ISOLATED Poisson solve (zero-padded Green's-function convolution on the doubled grid, radix-2 FFT), CIC force interpolation, kick-drift-kick leapfrog, no periodic wrap. Each particle also has a vertical coordinate integrated under the Spitzer (1942) isothermal-sheet field with a PM-derived vertical frequency, so the disk is a real 3D body in vertical equilibrium that heats when shocked. At t=0 disk particles get the local circular speed and halo and dwarf particles an isotropic dispersion (including in z) from the 2D Jeans estimate against the actual self-consistent PM force, so each galaxy starts in approximate 3D equilibrium. No analytic cores, no Chandrasekhar term, no merge event: friction-driven inspiral, disk heating and coalescence are all emergent. The view follows the robust bound-system mass-weighted COM each frame. References: Hernquist 1990 (halo), Spitzer 1942 and Binney & Tremaine 2e Ch. 3 to 4 (vertical structure), Binney & Tremaine 2e Ch. 8 (friction, disruption).

## Numerical method

In-plane: CIC deposit, isolated zero-padded FFT Poisson solve, CIC force interpolation, kick-drift-kick leapfrog (the shared engine, with its own tests). Vertical: a symplectic leapfrog per substep under the bounded Spitzer (1942) isothermal-sheet field a_z = -nu^2 H tanh(z/H), with the vertical frequency nu^2 = min(NU2_MAX, 2 pi G Sigma / H) taken from the self-consistent PM SURFACE DENSITY (CIC deposit) interpolated at the particle, frozen over the render frame (the vertical period spans many frames, so no extra Poisson solve is needed and 60 fps is preserved). Sigma is non-negative wherever there is mass, so unlike an |a_R|/R proxy the restoring force never spuriously vanishes on a radial orbit or at apocentre (which had launched collimated vertical jets). Off-grid escapers feel no vertical force and coast, consistent with the open in-plane boundary. The inclined perspective camera yaws about the vertical axis, inclines the scene about the screen-x axis, and projects with a true perspective divide by camera distance (near particles larger and brighter); painter-sorted far-to-near with additive blending and a solid-disc-stack core glow (no gradient, so it rasterizes identically across browser backends). The default camera, a tight bound orbit (M1 ~ 1.1, M2 ~ 0.7, sep ~ 2.6, vRel ~ 0.07, EPS ~ 1.2 cells) gives a decisive plunge (headless: first passage ~step 248, cores merged ~step 294, the secondary stays 100 percent bound). The deterministic golden sweep spans only the in-fall up to the first deep passage (~30 to 200 PM steps): a positive-Lyapunov N-body is not bitwise-reproducible across browser JIT environments after the violent encounter, so only the predictable in-fall is SSIM-gated. The LIVE run integrates indefinitely, so the user still watches the full coalescence, violent relaxation and Sausage formation.

## Controls

- M1 (primary mass), M2 (accreted mass), impact parameter b, closing speed, angle of attack of the secondary (deg).
- Relaunch (re-seed the encounter), Pause/Play. The encounter only restarts on Relaunch (no auto-replay).
- Camera: drag to orbit, wheel to zoom, Shift-drag to pan (left panel only).
- share_state_keys: none.

## Invariants

`invariants.test.mjs` plus the shared engine tests in `tests/engines/particle-mesh-2d.test.mjs`:

- The periodic PM Poisson solve recovers a single Fourier mode to 1e-9, and the isolated solve recovers the analytic monopole.
- The leapfrog conserves total momentum to < 1e-6 over 200 steps.
- A cold blob self-gravitates inward (RMS radius shrinks).
- Determinism: identical inputs reproduce the state bit-for-bit.
- Headless physics diagnostic: the primary disk starts at its scale height (vertical equilibrium), heats during the encounter and partly relaxes, the in-plane bound system stays in view, and no vertical state goes non-finite.

Visual gate: SSIM > 0.92 against the five committed deterministic golden frames, which span the reproducible in-fall (approach to the first deep passage); the chaotic post-coalescence evolution is shown live, not SSIM-gated, because it is not bitwise-reproducible across browser environments.

## Citations

- Hockney and Eastwood, *Computer Simulation Using Particles* (1988), Chs. 5 to 7: the particle-mesh method (`hockneyeastwood1988`).
- Spitzer, ApJ 95, 329 (1942): the self-gravitating isothermal sheet and the vertical field K_z = -2 pi G Sigma tanh(z/z0) (`spitzer1942`).
- Binney and Tremaine, *Galactic Dynamics*, 2nd ed., Chs. 3 to 4 (vertical structure and frequencies) and Ch. 8 (dynamical friction, tidal disruption) (`binney-tremaine`).
- Helmi et al., Nature 563, 85 (2018); Belokurov et al., MNRAS 478, 611 (2018): the Gaia-Enceladus / Sausage integrals-of-motion signature.

## Risk register

- The vertical mode uses a PM-derived frequency frozen per render frame; this is accurate because the vertical period spans many frames, and the headless diagnostic confirms equilibrium at t=0, bounded heating, and no blow-up. A fully self-consistent 3D PM is the only alternative and is ~227 ms/step (documented above), below interactive rates.
- Energy and L_z are conserved labels only once the remnant relaxes; during violent relaxation they churn by design (this is the physics the Sausage panel shows), not a leak.
