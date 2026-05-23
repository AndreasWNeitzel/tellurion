---
title: Foucault Pendulum and Coriolis Precession
slug: foucault-pendulum
status: superseded
superseded_by: foucault-pendulum-rotating-earth-3d
audience: portfolio
created: 2026-05-13
primary_uc: FIS1013
supporting_ucs: []
curriculum_year: bsc-y1s1
hook: "A pendulum does not know the Earth is turning, so it keeps swinging in a fixed plane while the floor rotates underneath. From the ground the swing plane appears to precess: slowly at the equator, once a day at a pole. Foucault hung one in the Pantheon in 1851 to prove the Earth spins."
one_paragraph: "A long pendulum swings in a plane fixed in space, but the Earth turns beneath it, so an observer on the ground sees the swing plane slowly rotate. The rate is Omega sin(latitude), where Omega is Earth's rotation rate: zero at the equator (the plane never precesses) and a full turn per sidereal day at a pole; at 45 degrees it is a few degrees per hour. The top-down view traces the rosette the bob sweeps out, a dashed line marks the original swing axis, and the lit rim pegs mark the current swing plane, so the precession is read off the drift between them. The readout gives the latitude, the local vertical rotation rate omega_z, the precession period and how far the plane has turned. This is the first laboratory proof, due to Leon Foucault in 1851, that the Earth rotates, no astronomy required."
tags: [mechanics, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
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
---

# Foucault pendulum: Coriolis precession

## Explainer

### What you are looking at

A long pendulum swings in a straight line. Watch for a while and the
line itself slowly turns, like a clock hand. Nothing pushes it
sideways; the floor (the Earth) is rotating underneath it. In 1851 Leon
Foucault hung a 67 m pendulum in the Pantheon in Paris and let the
public watch the planet spin. This is that experiment, with the clock
sped up so you do not have to wait a day.

### Why the swing plane turns

In the small patch of ground under the pendulum, the Earth's rotation
$\Omega$ contributes a vertical spin rate

$$\omega_z = \Omega \sin\phi,$$

where $\phi$ is the latitude. The pendulum bob, moving in that rotating
frame, feels the Coriolis acceleration. Writing the swing in ground
coordinates $(x, y)$, the linearized equations are

$$\ddot x = -\omega_0^2\, x + 2\,\omega_z\, \dot y,$$

$$\ddot y = -\omega_0^2\, y - 2\,\omega_z\, \dot x,$$

with the ordinary pendulum frequency $\omega_0 = \sqrt{g/L}$. The first
term on each right-hand side is just the pendulum restoring force. The
$2\omega_z \dot{}$ terms are the Coriolis coupling: they do no work
(they are always perpendicular to the velocity), so the bob keeps
swinging at $\omega_0$, but the whole plane of the swing rotates.

### The precession rate

Solving those equations shows the plane precesses at exactly $-\omega_z$.
The time for one full turn is

$$T_\text{prec} = \frac{2\pi}{\omega_z}
  = \frac{T_\text{day}}{\sin\phi}.$$

At the North Pole ($\phi = 90^\circ$) the plane turns once per
sidereal day. At the equator ($\phi = 0$) it never turns at all. In
Paris ($\phi \approx 49^\circ$) it takes about 32 hours. The playground
scales time so the polar period is 24 seconds, so the effect is
visible immediately; the latitude slider shows the $\sin\phi$ law
directly.

### Things to try

- Set latitude to 90 degrees and watch the fastest precession.
- Set it near 0 and watch the plane barely move: no Coriolis spin at
  the equator.
- Note the swing speed itself never changes; only the plane rotates,
  because Coriolis does no work.

### Where this comes from

The rotating-frame equations, the Coriolis term, and the
$1/\sin\phi$ precession period follow Marion and Thornton, *Classical
Dynamics of Particles and Systems*, 5th ed., Chapter 10. The original
demonstration is Foucault (1851), *Comptes Rendus de l'Academie des
Sciences*.

## Physical setup

A small-amplitude pendulum suspended over a point on a rotating Earth at
latitude phi. In the horizontal (x, y) frame at that point, the Coriolis
acceleration has a vertical component omega_z = Omega sin(phi). The
linearized equations of motion are
  x'' = -omega_0^2 x + 2 omega_z y'
  y'' = -omega_0^2 y - 2 omega_z x'.

The pendulum still oscillates at omega_0 = sqrt(g / L) but the plane of
oscillation slowly precesses at -omega_z.

## Governing equations

Above. Time is scaled so that T_reference (precession period at the pole)
is 24 seconds rather than 24 hours, for visibility.

## Numerical method

Fourth-order Runge-Kutta with dt = 0.02. Pendulum period T_0 = 2 pi.

## Controls

- latitude: -90 to +90 degrees.
- speed: integrator steps per render frame.
- Reset / Pause / Play.

## Expected qualitative features

1. latitude = 90 deg (pole): precession period equals T_reference = 24 s.
2. latitude = 45 deg: precession period 24 / sin(45) approx 33.9 s.
3. latitude = 0 (equator): no precession; swing stays along x-axis.
4. negative latitude (southern hemisphere): rotation reverses.
5. Trace forms a rosette / Spirograph pattern.

## Invariants and acceptance thresholds

1. Energy bounded: |delta E / E_0| < 1e-3 over 5000 RK4 steps.
2. Precession period = T_reference / sin(lat) exact.
3. omega_z = 0 at equator.
4. Pole precession period equals T_reference.
5. Hemisphere sign flip: omega_z(lat) = -omega_z(-lat).
6. Swing plane actually rotates: max |y| > 0.5 within a quarter precession
   at the pole.

All confirmed in `invariants.test.mjs`.

## Limiting cases for verification

- Equator: no precession.
- Pole: maximum precession rate.
- omega_z = 0: trajectory is pure SHO along x.

## Visual fallback

Canvas2D only. Center: rosette trace of the pendulum bob. Dashed line:
initial swing axis. Current bob position highlighted in warm orange.

## Citations

- Marion and Thornton, Classical Dynamics 5e Ch. 10.
- Foucault 1851, Comptes Rendus.

## Stretch goals

- Latitude-varying realistic Omega (Earth = 7.27 x 10^-5 rad/s).
- Friction and gravitational restoring force in 3D.
- Side-by-side at multiple latitudes.

## Risk register

- Linearized EOM assumes small amplitude. Slider amplitude is hard-coded
  at x_0 = 1.0.
- At very long times, energy drift from RK4 can shrink the swing amplitude.
  Trail size capped to keep the figure crisp.
