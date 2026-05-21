---
title: Elastic and Inelastic Collisions in 2D
slug: elastic-inelastic-collisions-2d
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: FIS1013
supporting_ucs: []
curriculum_year: bsc-y1s1
primary_citation: marion-thornton
primary_chapter: 9
hook: "Two pucks glance off each other. Momentum is conserved in every direction no matter how bouncy the hit; kinetic energy survives only if the collision is perfectly elastic. Dial the bounciness and the impact offset and watch both bookkeeping rules at once."
one_paragraph: "Two disks collide obliquely in the plane with an adjustable impact parameter (how off-centre the hit is) and an adjustable coefficient of restitution e (1 is perfectly elastic, 0 means they stick). The collision is resolved along the line joining the centres at contact: that normal velocity component is scaled by e while the tangential component passes through unchanged. Total momentum is conserved componentwise for any e (the readout shows p_x holding constant through the hit), but kinetic energy is conserved only when e = 1; for e < 1 the readout shows the percentage lost. Velocity vectors on each disk and fading trails make the before-and-after geometry explicit. This is the same accounting used for billiard balls, vehicle crashes and particle detectors: momentum always balances, energy balances only when nothing is dissipated."
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

# Elastic and inelastic 2D collisions

## Explainer

### What you are looking at

A real collision is not head-on; the balls strike off-center and
scatter sideways. The playground fires one disk at another at an
adjustable impact parameter and shows how the outgoing directions and
the energy ledger depend on the offset and on how bouncy the
collision is.

### Momentum always, energy only if elastic

Total linear momentum is conserved in every collision (no external
force during contact):

$$m_1\mathbf v_1 + m_2\mathbf v_2
  = m_1\mathbf v_1' + m_2\mathbf v_2'.$$

Kinetic energy is conserved only when the collision is perfectly
elastic. The degree of bounce is the coefficient of restitution $e$,
which scales the relative velocity along the line of centres:

$$(\mathbf v_2' - \mathbf v_1')\cdot\hat{\mathbf n}
  = -\,e\,(\mathbf v_2 - \mathbf v_1)\cdot\hat{\mathbf n},$$

with $e=1$ elastic, $e=0$ perfectly inelastic (the disks stick), and
the fraction $1-e^2$ of the along-normal kinetic energy lost to heat.

### The geometry: impact parameter and the normal

For disks the collision impulse acts only along the line joining the
centres at contact, the normal $\hat{\mathbf n}$; the tangential
velocity components pass through untouched. So the impact parameter
$b$ (the sideways offset) sets the scattering angle: a head-on hit
($b=0$) is the 1D case, while a glancing hit ($b$ near the sum of
radii) barely deflects the projectile and gives the target a small
sideways kick. A classic elastic result drops out for equal masses
with one target at rest: the two outgoing velocities are always
perpendicular (the right-angle billiard rule). The playground sweeps
the impact parameter, the mass ratio and $e$, drawing the velocity
vectors and the conserved-momentum and kinetic-energy bars so you
watch energy leak away as $e$ drops while momentum stays fixed.

### Things to try

- Set $e=1$, equal masses, one at rest: confirm the outgoing paths
  are exactly $90^\circ$ apart for any nonzero impact parameter.
- Sweep the impact parameter from head-on to glancing and watch the
  scattering angle shrink.
- Lower $e$ to 0 and watch the disks stick and move together, with
  the kinetic-energy bar dropping while momentum is unchanged.

### Where this comes from

Two-dimensional elastic and inelastic collisions, the coefficient of
restitution, and the equal-mass right-angle rule follow Kleppner and
Kolenkow, *An Introduction to Mechanics*, Chapter 4.

## Physical setup

Two disks collide obliquely on a frictionless plane. The hit is parameterised by the impact parameter b (the perpendicular offset between the incoming line of motion and the target centre) and the coefficient of restitution e. Resolving the collision along the contact normal: the normal relative-velocity component reverses scaled by e, the tangential component is unchanged.

## Governing equations

Along the contact normal n: the relative speed after equals -e times the relative speed before. Componentwise momentum is conserved for any e, m1 v1 + m2 v2 = const. Kinetic energy after equals (e^2) of the normal-mode kinetic energy plus the unchanged tangential part, so KE is conserved only at e = 1 and the fractional loss is (1 - e^2) times the normal-component share. Head-on (b = 0) reduces to the familiar 1D restitution formulas.

## Controls and readout

- Restitution e (0 to 1), impact parameter b, masses. Reset / Pause / Play.
- Live readout: collision type, e, b, the post-collision speeds, KE loss percentage, and the conserved p_x.

## Expected qualitative features

- Disks approach, collide obliquely, and separate along physically correct directions.
- p_x in the readout is unchanged across the collision for every e.
- e = 1: KE loss 0 percent; e < 1: a positive KE loss; e = 0: the disks move together along the normal.
- The five reference frames step through approach, contact and separation (frames differ).

## Invariants and acceptance thresholds

`invariants.test.mjs` (vitest, offline): momentum conserved componentwise for all e; KE conserved iff e = 1; KE loss equals the analytic (1 - e^2) normal-share; head-on limit matches the 1D formulas.

Visual gate: SSIM > 0.92 against committed golden frames; the post-build review confirmed the 2D oblique collision, vectors, trails and the conserved-momentum / KE-loss readout.

## Limiting cases for verification

- e = 1: elastic, KE conserved.
- e = 0: perfectly inelastic along the normal (disks coalesce in the normal direction).
- b = 0: head-on, the textbook 1D collision.

## Citations

- Marion and Thornton, Classical Dynamics, Ch. 9: collisions, restitution, the 1D and oblique cases.

## Risk register

- The earlier spec/title described a 1D head-on collision; the implementation is the 2D oblique collision (slug ...-2d, impact parameter b, componentwise momentum). The spec, title and page heading now match the implementation; the head-on case remains available at b = 0.
