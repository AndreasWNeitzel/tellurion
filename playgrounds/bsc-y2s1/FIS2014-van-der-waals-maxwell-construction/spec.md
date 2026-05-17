---
title: Van der Waals Condensation and the Maxwell Construction
slug: van-der-waals-maxwell-construction
status: verified
audience: portfolio
created: 2026-05-17
hook: 'Compress the gas and watch it condense: a liquid meniscus rises while the pressure refuses to move, pinned on the flat Maxwell line, until the liquid pushes back.'
one_paragraph: 'A van der Waals fluid in reduced units shown as a real piston-cylinder. Compressing an isotherm below the critical temperature drives condensation: gas molecules join a growing liquid pool by the lever rule, a meniscus rises, and the observed pressure stays pinned on the equal-area Maxwell plateau until the nearly incompressible liquid resists. Above the critical temperature the meniscus never forms. The side panel is the p-V isotherm with its unstable S-curve, the Maxwell coexistence line, and the binodal and spinodal envelope, with a live operating point. The headless sim.js is gate-tested for the critical inflection, the Maxwell equal-area and equal-end-pressure conditions, binodal closure at Tc, spinodal nesting, mechanical stability, and the lever rule.'
tags: [thermodynamics, phase-transition, animation, multi-panel, live-readout]
difficulty: 3
tier: advanced
hero_candidate: true
renderer: canvas2d
estimated_engagement_minutes: 5
curriculum_year: 'L:F-2Y-1S'
primary_uc: FIS2001
share_state_keys: []
---

# Van der Waals Condensation and the Maxwell Construction

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
Sec. 3.6 and Problem 9.4-1 (`callen`).

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
9.4-1 (`callen`).
