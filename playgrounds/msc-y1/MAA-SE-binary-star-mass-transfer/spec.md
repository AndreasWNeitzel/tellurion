---
title: "Close Binary: Roche Lobes and Conservative Mass Transfer"
slug: binary-star-mass-transfer
status: verified
audience: portfolio
created: 2026-05-18
primary_uc: MAA-SE
supporting_ucs: []
curriculum_year: msc-y1
primary_citation: eggleton1983
hook: 'The corotating Roche potential of a close binary: the figure-eight critical surface through L1, the Eggleton lobe radius, and conservative mass transfer that holds the total mass and angular momentum fixed while the orbit shrinks (runaway, common envelope) or widens (stable).'
one_paragraph: 'A close-binary Roche-geometry and mass-transfer playground (Eggleton 1983; Frank, King and Raine, Accretion Power in Astrophysics; Hilditch). The corotating Roche potential gives the five Lagrange points and the figure-eight critical equipotential through the inner point L1; the Eggleton (1983) formula gives the volume-equivalent Roche-lobe radius. Conservative mass transfer holds the total mass and the orbital angular momentum fixed, so the separation scales as a ~ (M1 M2)^-2 and the orbit shrinks while the donor is the more massive star, reaches a minimum at q = 1, then widens. Panel A is the corotating frame with both lobes, the Lagrange points and, on overflow, the L1 stream and accretion disk; Panel B is the separation and period under transfer with the shrink-then-widen turning point; Panel C is the stability map, the Roche-lobe response exponent against stiff and soft donors, classifying detached, stable transfer and common envelope. Conservative transfer holds total mass and orbital angular momentum fixed, so the orbit shrinks while the donor is the more massive star and widens past q = 1, with the donor-versus-Roche-lobe radius response setting whether transfer is stable or runs away. Reference: Frank, King and Raine, Accretion Power in Astrophysics, Chapter 4; Eggleton 1983.'
tags: [binary-stars, roche-lobe, mass-transfer, accretion, live-readout]
difficulty: 4
tier: standard
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 5
share_state_keys: [m1, m2, fill, dm]
---

# Close Binary: Roche Lobes and Conservative Mass Transfer

## Explainer

### What you are looking at

Most stars are in binaries, and when one swells up it can dump matter
onto its companion. Whether that happens, and what it does to the
orbit, is governed entirely by the shape of the combined gravity-
plus-rotation potential. The playground shows the Roche lobes and
how conservative mass transfer drives the orbit.

### The Roche potential

In the frame rotating with the binary, a test particle feels both
stars' gravity plus the centrifugal term. The effective (Roche)
potential is

$$\Phi_R = -\frac{GM_1}{r_1} - \frac{GM_2}{r_2}
  - \tfrac12\,\Omega^2\,s^2,$$

with $s$ the distance from the rotation axis and $\Omega$ the orbital
angular frequency. Its equipotentials are nested closed surfaces
around each star. The critical one passes through the inner Lagrange
point $L_1$ and forms a figure-eight: the two lobes are the Roche
lobes. A star that swells to fill its lobe spills gas through the
$L_1$ nozzle onto its companion.

### What conservative transfer does to the orbit

If no mass or angular momentum leaves the system (conservative
transfer), the total $M_1+M_2$ and the orbital angular momentum
$J = M_1 M_2\sqrt{Ga/(M_1+M_2)}$ are both fixed. Holding $J$ constant
while moving mass gives the separation response

$$\frac{\dot a}{a}
  = 2\,\dot M_1
  \left(\frac{1}{M_1} - \frac{1}{M_2}\right),$$

so the behavior flips at equal mass:

- Mass from the more massive star to the lighter one ($M_1>M_2$):
  the orbit shrinks, $L_1$ moves further into the donor, and transfer
  runs away (unstable, rapid).
- Mass from the lighter to the heavier star: the orbit widens and
  transfer is self-limiting (stable).

This single sign change explains Algol-type systems, the formation of
X-ray binaries, and why some binaries merge. The playground lets you
set the masses and Roche-lobe filling and watch the lobes and the
separation/period respond as mass moves.

### Things to try

- Fill the donor's Roche lobe and watch gas stream through $L_1$ to
  the companion.
- Transfer from the heavier star and watch the orbit shrink (runaway);
  transfer from the lighter star and watch it widen (stable).
- Set $M_1=M_2$ and note the turning point where $\dot a$ changes
  sign.

### Where this comes from

The Roche potential, Lagrange points, and conservative mass-transfer
orbital response follow Frank, King and Raine, *Accretion Power in
Astrophysics*, Chapter 4, and Hilditch, *An Introduction to Close
Binary Stars*.

## Physical setup

Two stars on a circular orbit, viewed in the corotating frame. The effective (Roche) potential is the sum of both gravitational potentials and the centrifugal term. Its critical equipotential through the inner Lagrange point L1 is the figure-eight that defines each star's Roche lobe; a star that fills its lobe loses mass through L1 to its companion. When the transfer is conservative (no mass or angular momentum leaves the system) the orbital separation and period change in a way fixed entirely by the changing mass ratio. SI units; separation in metres, masses in kg.

## Governing equations

Roche potential (a = 1, G(M1+M2) = 1, Omega^2 = 1):

  Phi(x,y) = -m1/r1 - m2/r2 - (x^2 + y^2)/2,

with m_i = M_i / M_tot and the stars on the x-axis. The Lagrange points are the stationary points of Phi; L4 and L5 are the equilateral points (exactly unit distance from both stars). The Eggleton (1983) volume-equivalent Roche-lobe radius is

  r_L / a = 0.49 q^{2/3} / (0.6 q^{2/3} + ln(1 + q^{1/3})),  q = M_this / M_companion,

accurate to better than 1 percent for all q. Circular orbital angular momentum J = M1 M2 sqrt(G a / M_tot); at fixed M_tot and J, a ~ (M1 M2)^-2, so transfer from the more massive star (q > 1) shrinks the orbit and from the less massive star (q < 1) widens it; the period follows Kepler, P = 2 pi sqrt(a^3 / G M_tot). Stability compares the donor mass-radius exponent zeta_* = d ln R / d ln M with the Roche-lobe exponent zeta_L = d ln R_L / d ln M1.

## Numerical method

Closed-form throughout: the Eggleton formula is evaluated directly; the Lagrange points are bracketed roots of dPhi/dx on the line of centres (bisection); the critical potential is Phi(L1); the lobe contour is the first outward crossing of the critical level on a polar scan; conservative transfer is the exact a ~ (M1 M2)^-2 scaling; zeta_L is a centred finite difference of ln R_L under conservative transfer. Deterministic; seed not applicable.

## Controls

- `m1`: donor mass M1, 0.3 to 20 M_sun. Sets the mass ratio and the lobe sizes.
- `m2`: accretor mass M2, 0.3 to 20 M_sun.
- `fill`: donor radius over its Roche-lobe radius, 0.4 to 1.15. Below 1 the system is detached; at and above 1 the donor overflows and the L1 stream and accretion disk appear.
- `dm`: cumulative conservatively transferred mass, 0 to 0.8 M_sun. Slides the operating point along the separation curve through the q = 1 minimum.
- Reset, Pause/Play. Pause freezes the stream animation; the geometry is static.

## Expected qualitative features

- The figure-eight critical surface with both Roche lobes and the five Lagrange points; the donor lobe larger when q > 1, smaller when q < 1.
- On overflow, a stream from L1 curving onto an accretion disk around the companion.
- The separation falling to a minimum at q = 1, then rising (the shrink-then-widen behaviour of conservative transfer).
- The stability map: low q stable, high q driving common envelope.

## Invariants and acceptance thresholds

`invariants.test.mjs` (vitest, offline):

1. Eggleton r_L matches the published formula exactly; the q = 1 value is in (0.378, 0.380) and within 0.5 percent of 0.3789; monotone in q, bounded in (0,1).
2. Conservative transfer: total mass fixed (1e-12); J conserved within 1 percent (exact by construction); a = a (M1 M2 / M1' M2')^2.
3. Transfer from the more massive star shrinks the orbit, from the less massive widens it.
4. Kepler third law: P^2 proportional to a^3; explicit 2 pi sqrt(a^3 / G M_tot).
5. L1 is a stationary point between the stars; L2, L3 outside; L4/L5 unit distance from both masses; Phi symmetric in y.
6. The critical equipotential equals Phi(L1) and a deeper level closes a lobe contour.
7. zeta_L > 0 for q > 1; the classification returns detached, stable transfer and common envelope correctly.
8. Determinism.

Visual gate: SSIM > 0.92 against committed golden frames at 60 fps.

## Limiting cases for verification

- q -> 0: the donor lobe radius -> 0 (a low-mass donor has a tiny lobe).
- q = 1: the figure-eight is symmetric and the conservative separation is at its minimum.
- Conservative transfer that reverses the mass ratio: a decreases then increases, P following Kepler.
- L4 and L5: equilateral points at unit distance for any mass ratio.

## Visual fallback

The separation curve and the stability map carry the physics statically; the L1 stream and disk are animated only as illustration.

## Citations

- Eggleton, P. P., Approximations to the radii of Roche lobes, ApJ 268, 368 (1983).
- Frank, King and Raine, Accretion Power in Astrophysics (Roche geometry, conservative transfer, stability).
- Hilditch, An Introduction to Close Binary Stars.

## Stretch goals

- Add non-conservative transfer with isotropic re-emission and a mass-loss fraction.
- Show the donor mass-radius track and follow a real evolutionary sequence.

## Risk register

- The Eggleton value at q = 1 is 0.3789 (the exact formula), not the rounded 0.38; the invariant brackets the formula value and its stated better-than-1-percent accuracy honestly.
- Stability uses fixed reference donor exponents (stiff +0.6, soft -1/3); the classification is illustrative of the criterion zeta_* vs zeta_L, not a specific stellar model.
