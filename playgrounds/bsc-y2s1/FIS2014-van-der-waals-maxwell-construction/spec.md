---
title: Van der Waals Condensation and the Maxwell Construction
slug: van-der-waals-maxwell-construction
status: verified
audience: portfolio
created: 2026-05-17
hook: 'Compress the gas and watch it condense: a liquid meniscus rises while the pressure refuses to move, pinned on the flat Maxwell line, until the liquid pushes back.'
one_paragraph: 'A van der Waals fluid, shown as a piston and cylinder in reduced units. Compressing an isotherm below the critical temperature drives condensation: gas molecules join a growing liquid pool in the proportion set by the lever rule, a meniscus rises, and the measured pressure stays pinned on a flat plateau, the level fixed by Maxwell''s equal-area construction, until the nearly incompressible liquid finally resists. Above the critical temperature the gas passes to liquid continuously and no meniscus ever forms. The side panel shows the p-V isotherm with its thermodynamically unstable S-curve, the Maxwell coexistence line, and the binodal and spinodal envelope with a live operating point, so the link between the loop, the equal-area rule and real condensation is explicit. Reference: van der Waals 1873; Callen, Thermodynamics and an Introduction to Thermostatistics, Chapter 9.'
tags: [thermodynamics, phase-transition, animation, multi-panel, live-readout]
difficulty: 3
tier: advanced
hero_candidate: true
renderer: canvas2d
estimated_engagement_minutes: 5
curriculum_year: 'L:F-2Y-1S'
primary_uc: FIS2001
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

# Van der Waals Condensation and the Maxwell Construction

## Explainer

### What you are looking at

Compress a real gas below its critical temperature and at some point it
stops fighting back: the pressure stays flat while the volume shrinks,
because the gas is condensing into liquid. The van der Waals equation
predicts a wiggly isotherm there; the Maxwell construction replaces the
unphysical wiggle with that flat coexistence line. The playground shows
the piston, the meniscus, and the isotherm together.

### The equation of state

In reduced units (everything scaled by its critical value) the van der
Waals equation is

$$p = \frac{8T}{3V - 1} - \frac{3}{V^2},$$

with the critical point at $V = T = p = 1$, where the isotherm has an
inflection ($dp/dV = d^2p/dV^2 = 0$). The $-3/V^2$ term is molecular
attraction; the $3V-1$ term is the finite size of molecules.

### The unphysical loop and Maxwell's fix

For $T < 1$ the isotherm is non-monotonic: it has a stretch where
$dp/dV > 0$, meaning compressing the fluid would *lower* its pressure,
which is mechanically impossible. Nature avoids it by phase-separating
at a fixed coexistence pressure $p_\text{co}$. Maxwell's equal-area
construction sets that pressure so the two lobes of the loop have equal
area:

$$\int_{V_l}^{V_g} p\,dV = p_\text{co}\,(V_g - V_l), \qquad
  p(V_l) = p(V_g) = p_\text{co}.$$

Between the binodal volumes $V_l$ (liquid) and $V_g$ (gas) the system is
a mixture, and the lever rule gives the liquid fraction
$x = (V_g - V)/(V_g - V_l)$. The spinodal ($dp/dV = 0$) marks the
absolutely unstable core inside that.

### Things to try

- Set $T$ just below 1 and watch a tiny flat coexistence segment
  appear; lower $T$ and it widens.
- Compress through the flat region and watch the meniscus rise as the
  lever-rule liquid fraction grows.
- Go to $T = 1$ and see the flat region shrink to a single point: the
  critical point, where liquid and gas become indistinguishable.

### Where this comes from

The reduced van der Waals equation of state, the Maxwell equal-area
construction, the lever rule, and the spinodal follow Callen,
*Thermodynamics and an Introduction to Thermostatistics*, 2nd ed.,
Section 3.6 and Problem 9.4-1.

## Physical setup

A fixed amount of a van der Waals fluid in a piston-cylinder, held at
a chosen reduced temperature, compressed and expanded along an
isotherm. Below the critical point the fluid splits into coexisting
liquid and vapour; the molecule rendering and the meniscus track the
lever-rule liquid fraction.

## Governing equations

Reduced van der Waals equation of state

`p = 8 T / (3 V - 1) - 3 / V^2`,

with the critical point at `V = T = p = 1`, where
`dp/dV = d2p/dV2 = 0`. For `T < 1` the isotherm is non-monotonic; the
physical coexistence pressure `p_co` and the binodal volumes
`V_l, V_g` follow from the Maxwell equal-area construction,
`integral_{V_l}^{V_g} p dV = p_co (V_g - V_l)` with
`p(V_l) = p(V_g) = p_co`. The lever rule gives the liquid fraction
`x = (V_g - V) / (V_g - V_l)`. The spinodal `dp/dV = 0` bounds the
mechanically unstable core.

## Numerical method

The area integral of the reduced EOS is closed form,
`integral p dV = (8T/3) ln(3V-1) + 3/V`. The binodal volumes are found
by bisecting `p_co` between the spinodal pressures, with the liquid and
gas roots located by spinodal-bracketed monotone bisection (no
cubic-root branch logic). Spinodal volumes solve `(3V-1)^2 = 4 T V^3`
by bracketed bisection. Reference: Callen, *Thermodynamics* (2nd ed.),
Sec. 3.6 and Problem 9.4-1.

## Controls

- temperature T/Tc: 0.70 to 1.20 (crosses the critical point).
- volume V/Vc: manual scrub; grabbing it leaves the auto cycle.
- motion: auto compress-expand cycle, or manual volume slider.
- Reset, Pause.

## Expected qualitative features

- Below Tc: compressing past the gas binodal nucleates a liquid pool
  whose meniscus rises with the lever rule; the operating point sits
  on the flat Maxwell line and the readout pressure stays at `p_co`.
- Past the liquid binodal the pressure climbs steeply (the liquid is
  nearly incompressible).
- At and above Tc: a single supercritical fluid, no meniscus, a
  monotonic isotherm with no Maxwell line.
- The binodal closes onto the critical point as T to 1.

## Invariants and acceptance thresholds

- Critical point: `dp/dV = d2p/dV2 = 0` at `(1, 1)` within 1e-9.
- Maxwell: signed area `< 1e-4`, `p(V_l) = p(V_g) = p_co` within
  1e-4, `V_l < 1 < V_g`, `0 < p_co < 1`.
- Binodal closes as `T to 1` (width shrinks, brackets 1).
- Spinodal nests strictly inside the binodal.
- Mechanical stability: `dp/dV < 0` on both coexisting phases,
  `dp/dV > 0` between the spinodals.
- Lever rule: 1 at `V_l`, 0 at `V_g`, monotone, 0.5 at the mid volume.
- Observed pressure is flat at `p_co` across coexistence and
  continuous with the bare EOS at the binodal.

## Limiting cases for verification

- `T = 1`: `dp/dV = d2p/dV2 = 0` at `V = 1`, no coexistence.
- `T >= 1`: `maxwell` returns null (single phase).

Source: Callen, *Thermodynamics* (2nd ed.), Sec. 3.6 and Problem
9.4-1.
