---
title: Tokamak Plasma Confinement 3D
description: "A tokamak holds a 100-million-degree plasma with magnetic fields instead of walls. A toroidal vessel carries helical field lines (coloured by field strength); charged particles either spiral along the field (passing) or get mirror-trapped on the weak-field outboard side, tracing the classic banana orbits. Drag to orbit, scroll to zoom."
caption: "Figure 1. Tokamak magnetic confinement: helical field lines coloured by |B|, a glowing plasma core, and co-passing, counter-passing and trapped (banana-orbit) particle populations. Method: 1/R toroidal field plus a current-driven poloidal twist (safety factor q), guiding-centre particle classification. Source: Goedbloed and Poedts, Principles of Magnetohydrodynamics, Ch. 5."
slug: tokamak-plasma-confinement-3d
status: verified
audience: portfolio
created: 2026-05-14
primary_uc: AST3014
supporting_ucs: [FIS3020]
curriculum_year: hero
primary_citation: goedbloed-plasma
primary_chapter: 5
hook: "A fusion plasma is ten times hotter than the Sun's core; no material can touch it. A tokamak cages it in a twisted magnetic donut. Watch the field lines spiral around the torus and the particles split into ones that race along the field and ones that get trapped, bouncing back and forth in slow banana-shaped loops."
one_paragraph: "A tokamak confines a fusion plasma in a torus using magnetic fields. External coils make a toroidal field that falls off as 1/R (stronger on the inboard side), and the current driven through the plasma adds a poloidal field, so the total field lines spiral helically around the donut. How many times a line goes the long way around per short-way loop is the safety factor q; this build uses ITER-like parameters, with the edge q a few and the on-axis value about half that for a parabolic current. Charged particles fall into two families. Passing particles spiral freely along the field: white ones move with the plasma current (co-passing, the majority that carries the current), blue ones move against it (counter-passing, a minority). Trapped particles (amber) do not have enough speed along the field to climb into the strong-field inboard region, so the field acts as a magnetic mirror and reflects them; seen in a poloidal cut their guiding centre traces a closed banana, which is why they are called banana orbits. The trapped fraction grows with the square root of the inverse aspect ratio (a/R). A glowing core marks the hot confined plasma. Sliders set the major radius R0, minor radius a, toroidal field B0 and plasma current Ip; the readout shows the edge and axis q and the trapped percentage. Drag to orbit, scroll to zoom."
tags: [fluids-mhd, animation, live-readout]
difficulty: 4
tier: single
hero_candidate: true
renderer: webgl2
estimated_engagement_minutes: 6
share_state_keys: [R0, a, B0, Ip]
invariants:
  - key: runs
    label: simulation advances each frame
    tolerance: 1
  - key: bounded
    label: state stays finite
    tolerance: 1
  - key: deterministic
    label: fixed seed reproduces the run
    tolerance: 1
what_to_try:
  - Vary each control and watch the rail readouts respond.
  - Compare the diagnostic plot against the live scene.
references:
  - "Goedbloed, Poedts, Principles of Magnetohydrodynamics, Ch. 5."
---

# Tokamak Plasma Confinement 3D

## Explainer

### What you are looking at

A fusion plasma is ten times hotter than the Sun's core, so no
material wall can touch it. A tokamak holds it with magnetic fields
twisted into a doughnut. The playground shows the helical field
lines, the nested flux surfaces they wrap, and charged particles
spiralling along them, the geometry that confines a star in a bottle.

### Why a magnetic bottle works

A charged particle in a magnetic field gyrates tightly around the
field line (Larmor radius $r_L = mv_\perp/qB$) and streams freely
along it. So a field line is a track: confine the field lines and you
confine the plasma. A purely toroidal field is not enough, the
gradient and curvature drifts push particles out. The fix is to add a
twist.

### Two fields, one twist

A tokamak superposes:

- a toroidal field $B_\phi$ from external coils (the long way around
  the doughnut), and
- a poloidal field $B_\theta$ from a large current driven through
  the plasma itself (the short way around).

Their sum is a set of helical field lines that wind around nested
toroidal flux surfaces. The pitch of the helix is the safety factor

$$q = \frac{r B_\phi}{R B_\theta},$$

the number of toroidal turns per poloidal turn. The twist is what
cancels the vertical drift (a particle spends equal time on the
inner and outer sides), giving net confinement, and $q$ also sets
MHD stability: low-order rational $q$ surfaces are where instabilities
(kinks, tearing modes) grow. The playground renders the toroidal +
poloidal field, the resulting helical lines on nested flux surfaces,
and particles spiralling along them, with $q$ and the fields tunable.

### Things to try

- Turn off the poloidal field and watch confinement fail (particles
  drift off the pure toroidal field).
- Add the plasma current and watch the field lines become helical and
  the particles stay trapped on flux surfaces.
- Change the safety factor $q$ and see the helix wind tighter or
  looser (and rational-$q$ resonant surfaces appear).

### Where this comes from

Tokamak field geometry, the safety factor and drift confinement
follow Freidberg, *Plasma Physics and Fusion Energy*, and Wesson,
*Tokamaks*.

## Physical setup

Fusion needs a plasma at roughly 100 million kelvin, far too hot for any solid wall. A tokamak holds it with magnetic fields shaped into a torus. Field-aligned charged particles spiral tightly around field lines and drift slowly across them, so a suitably shaped field cages the plasma. Two field components combine: a toroidal field from external coils and a poloidal field from the current driven through the plasma itself. Their sum is a set of helical field lines lying on nested toroidal flux surfaces.

## Governing equations

The toroidal field falls off with major radius, B_t proportional to 1/R, so the field is stronger on the inboard side of the torus. The field-line helicity is the safety factor

q(r) = (r B_t) / (R B_p(r)),

the number of toroidal transits per poloidal transit of a field line. For a parabolic current profile the on-axis value is about half the edge value, q_axis ~ q_a / 2, and ITER-like parameters give an edge q of a few. A particle is trapped when its parallel speed is too low to overcome the magnetic mirror between the weak outboard field and the strong inboard field; the trapped fraction scales as sqrt(epsilon) with the inverse aspect ratio epsilon = a / R0. A trapped guiding centre, projected into a poloidal plane, traces a banana whose width sets the neoclassical transport step.

## Numerical method

A WebGL2 engine (`shared/js/engine-gl/tokamak.js`, sole consumer this playground) draws the toroidal vessel, the helical field lines coloured by |B|, and the glowing core, and advances a particle ensemble (seeded `mulberry32`, fixed `DEFAULT_SEED`, so the scene is deterministic). Each particle is classified passing or trapped from its pitch and the local mirror ratio; passing particles advance their toroidal and poloidal angles along the field, trapped particles bounce between mirror points and slowly precess. The closed-form plasma quantities (q_edge, q_axis, B_t(R), bounce time) come from the shared `tokamak-cpu` module, which the invariant tests call directly.

## Controls

- R0 (1.0 to 3.0 m): major radius of the torus.
- a (0.2 to 1.0 m): minor radius (sets the aspect ratio and the trapped fraction).
- B0 (1 to 10 T): toroidal field strength on axis.
- Ip (0.1 to 20 MA): plasma current (sets the poloidal field and hence q).
- Drag to orbit the camera, scroll to zoom. The readout shows q_edge, q_axis, trapped % and FPS.
- share_state_keys: `R0`, `a`, `B0`, `Ip` (the four physics sliders).

## Expected qualitative features

- A clear 3D torus with helical field lines on nested flux surfaces, coloured by |B| (brighter inboard where B is larger).
- Three colour-coded particle populations: white co-passing, blue counter-passing, amber trapped.
- Amber particles visibly bounce on the low-field outboard side and trace closed banana shapes, not full loops.
- A glowing plasma core distinct from the field lines.
- The five reference frames differ (particle transport over time); the trapped percentage tracks the aspect ratio.

## Invariants and acceptance thresholds

`invariants.test.mjs` (vitest, offline):

1. q_a from the formula is an ITER-like number (between 0.5 and 3 for the test parameters).
2. q_axis = q_a / 2 for a parabolic current profile.
3. B_t scales as 1/R (B_t(2,5,1) = 2.5, B_t(4,5,1) = 1.25).
4. The banana bounce period is positive.

Visual gate: SSIM > 0.92 against committed golden frames (deterministic seed). Inter-frame SSIM of the reference set is about 0.87, so the five frames are objectively distinct (particle transport is visible across them).

## Limiting cases for verification

- Large aspect ratio (small a / R0): the trapped fraction shrinks toward zero (almost all particles passing).
- Higher Ip: stronger poloidal field, lower q, tighter field-line twist.
- B_t at fixed R doubles when B0 doubles; B_t halves when R doubles (the 1/R law).

## Visual fallback

If `EXT_color_buffer_float` is unavailable the engine init throws and the page renders nothing rather than a misleading schematic; the q and trapped-fraction readout plus the invariants still define correctness.

## Citations

- Goedbloed and Poedts, Principles of Magnetohydrodynamics, Ch. 5: tokamak equilibrium, the safety factor, toroidal and poloidal field structure.
- Wesson, Tokamaks: trapped-particle (banana) orbits and the neoclassical trapped fraction sqrt(epsilon).

## Risk register

- Particle motion is a guiding-centre / classification model, not a full gyro-orbit integration; it conveys the passing/trapped split and banana bounce, not exact drift magnitudes. Stated here.
- The field-line and population structure is correct but visually dense at thumbnail scale; thinning the particle cloud, emphasising the helical flux surfaces and adding a stronger core glow are tracked as hero-promotion items (see DEVNOTES), not correctness defects.
