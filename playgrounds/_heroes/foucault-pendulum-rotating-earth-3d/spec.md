---
title: Foucault Pendulum on a Rotating Earth (Hero)
slug: foucault-pendulum-rotating-earth-3d
status: verified
audience: portfolio
created: 2026-05-20
primary_uc: FIS1013
supporting_ucs: [FIS2021]
curriculum_year: hero
primary_citation: goldstein-mechanics
primary_chapter: 4
hero_candidate: true
hook: 'Release the bob and watch its plane of swing rotate against the floor: that rotation IS the Earth turning. Foucault made the case in 1851 with a 28 kg ball on a 67-metre wire.'
one_paragraph: 'A pendulum is suspended at latitude phi and released along a single line on the floor. In the Earth-co-rotating frame the Coriolis force rotates its plane of oscillation at angular rate Omega_earth * sin(phi). At the geographic pole the plane completes a full revolution in one sidereal day; at the equator the plane never rotates at all. The playground integrates the small-angle equations of motion with a Boris-style symplectic step that handles the Coriolis term as an exact 2D rotation, draws the bob trajectory on the floor (a slowly precessing star pattern), and shows the rotating Earth with the suspension point fixed to a latitude line. Reference: Goldstein, Classical Mechanics, 3rd ed., Ch. 4.10.'
caption: 'Figure 1. Foucault pendulum bob trace on the local floor at latitude phi, alongside the rotating Earth with the suspension point marked. The trace forms a many-petalled rosette that closes only after the full precession period 2 pi / (Omega_earth sin phi). Method: Boris-style symplectic step for the rotating-frame Coriolis term; predictor-corrector spring. Source: Goldstein, Classical Mechanics, Ch. 4.10.'
tags: [mechanics, animation, three-d, live-readout]
difficulty: 3
tier: single
renderer: canvas2d
estimated_engagement_minutes: 4
share_state_keys: [latitude_deg, amp]
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

# Foucault pendulum
Coriolis precession of the swing plane. Source: Goldstein, Classical Mechanics, Ch. 4.10 (`goldstein-mechanics`).

## Explainer

### What you are looking at

A simple pendulum swings on a wire at some latitude on Earth. The
floor of its enclosure is fixed to the rotating Earth, so from that
floor's viewpoint the pendulum's plane of oscillation slowly rotates.
That apparent rotation is the Coriolis force in the rotating frame
revealing Earth's rotation, and the original Foucault pendulum at the
Pantheon in 1851 made this case decisively for a non-scientific
audience of thousands.

The playground shows the pendulum bob's trace on the local horizontal
floor (a slowly precessing rosette) next to a globe with the
suspension point marked at the chosen latitude.

### The rotating-frame equations

In the Earth-co-rotating frame the linearized small-angle equations of
motion for a bob in the local tangent plane (east, north) are

$$\ddot x \;=\; -\omega_{\rm pend}^2\, x \;+\; 2\,\Omega_{\rm eff}\,\dot y,$$
$$\ddot y \;=\; -\omega_{\rm pend}^2\, y \;-\; 2\,\Omega_{\rm eff}\,\dot x,$$

where $\omega_{\rm pend} = \sqrt{g/L}$ is the pendulum's natural
frequency and

$$\Omega_{\rm eff} \;=\; \Omega_\oplus \,\sin\phi.$$

The Coriolis terms rotate the velocity vector at angular rate
$\Omega_{\rm eff}$, so the plane of oscillation rotates at this rate.

### Latitude dependence

At the poles ($\phi = \pm 90^\circ$), $\Omega_{\rm eff} = \Omega_\oplus$
and the pendulum's plane completes a full revolution in one sidereal
day,

$$T_{\rm Foucault}(\phi) \;=\; \frac{T_{\rm sidereal}}{|\sin\phi|}.$$

At Paris (49° N), $T_{\rm Foucault} \approx 32$ h. At the equator,
$\sin\phi = 0$ and the plane does not precess at all (the rotation
axis is in the local horizontal plane, so the Coriolis force on a
horizontally-swinging bob has zero vertical projection and the plane
is unchanged). Move the latitude slider in the playground from 0 to
90 and watch the rosette tighten from a straight line back-and-forth
(no rotation) to fully closed petals.

### The symplectic step

A naive Euler step would not conserve the harmonic-oscillator energy.
We use a Boris-style splitting: a half-kick by the spring force, an
exact 2D rotation of velocity by $-2\Omega_{\rm eff}\,\Delta t$ to
handle the Coriolis Hamiltonian, a drift, and a final half-kick. This
is symplectic and stable for any $\Delta t \lesssim 1/\omega_{\rm pend}$.

### Symbols

- $\vec r = (x, y)$: bob position in the local horizontal floor.
- $L$: pendulum length.
- $g$: gravitational acceleration.
- $\omega_{\rm pend} = \sqrt{g/L}$: pendulum natural angular frequency.
- $\Omega_\oplus$: Earth's sidereal angular velocity ($2\pi /
  86164\,\mathrm{s}$).
- $\phi$: geographic latitude.
- $\Omega_{\rm eff} = \Omega_\oplus \sin\phi$: precession rate of the
  swing plane.
- $T_{\rm sidereal} = 23\,\mathrm{h}\,56\,\mathrm{min}$: one sidereal
  day.

### Where this comes from

The Coriolis-precession formula and the rotating-frame derivation
follow Goldstein, *Classical Mechanics*, 3rd ed., Addison-Wesley 2001,
Section 4.10, and the historical setup is in Foucault, *Comptes
Rendus de l'Académie des Sciences* 32 (1851) 135.
