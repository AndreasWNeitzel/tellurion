---
title: Inclined Plane Friction
slug: inclined-plane-friction
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: FIS1013
supporting_ucs: []
curriculum_year: bsc-y1s1
primary_citation: marion-thornton
primary_chapter: 2
hook: 'STATUS: needs_hook'
one_paragraph: 'STATUS: needs_paragraph'
tags: [mechanics, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
---

# Inclined plane with Coulomb friction

## Physical setup

A unit-mass block sits at the top of a slope of length 5 m inclined at angle $\theta$. The block is in contact with the slope through Coulomb friction characterized by a static coefficient $\mu_s$ and a kinetic coefficient $\mu_k$. Gravity $g = 9.81$ m/s$^2$ points downward. The block is released from rest and the simulation tracks position $x$ along the slope and velocity $v$ along the slope (positive = downhill).

## Governing equations

Normal force balance gives $N = m g \cos\theta$. Along the slope:

- Static regime: the block is at rest if $m g \sin\theta \le \mu_s N$, that is $\tan\theta \le \mu_s$. Static friction silently adjusts up to $\mu_s N$.
- Kinetic regime: once $\tan\theta > \mu_s$, the block slides downhill. Kinetic friction $\mu_k N$ opposes motion. Newton's second law along the slope gives constant acceleration

$$a = g (\sin\theta - \mu_k \cos\theta).$$

Closed-form integration from rest: $v(t) = a t$, $x(t) = \tfrac{1}{2} a t^2$.

## Numerical method

Time integration is velocity-Verlet at $\Delta t = 1/480$ s. For constant acceleration velocity-Verlet is exact (no truncation error), so the numerical trajectory and the analytic prediction coincide to machine precision. The render loop uses a fixed-step accumulator pattern at 240 Hz physics; the rAF loop runs the renderer at the display rate.

## Controls

- Slope angle $\theta$ in degrees (0 to 60).
- Static friction $\mu_s$ (0 to 1).
- Kinetic friction $\mu_k$ (0 to 1).
- Playback speed multiplier (1 to 6 physics ticks per displayed frame).
- Reset button restarts from rest with current parameter values.
- Play / Pause button toggles the simulation.

## Expected qualitative features

1. Below the threshold $\tan\theta \le \mu_s$ the block does not move. The readout shows $\theta_c$ and labels the regime as "static" in blue.
2. Above threshold the block accelerates uniformly. The label switches to "sliding" in accent color.
3. The right-half $v(t)$ plot shows the numerical curve overlaying the analytic line to within $10^{-12}$ relative.
4. Tightening $\mu_k$ toward $\tan\theta$ flattens the kinetic acceleration toward zero. The block creeps but doesn't accelerate.

## Invariants and acceptance thresholds

| invariant | threshold | location |
| static threshold | $\theta_c = \arctan(\mu_s)$ within $10^{-12}$ | `criticalAngle` |
| equilibrium for $\theta < \theta_c$ | $x = v = 0$ within $10^{-12}$ over 5000 steps | invariants test |
| kinematic $x(t) = a t^2 / 2$ | within $10^{-3}$ relative for $\theta = 0.6$ rad | invariants test |
| kinematic $v(t) = a t$ | within $10^{-3}$ relative | invariants test |
| marginal $\mu_k$ keeps block almost still | $a < 10^{-4}$, $x < 10^{-3}$ over 10 s | invariants test |
| energy balance | $|KE + PE + W_f - E_0| / E_0 < 10^{-8}$ | invariants test |

All confirmed in `invariants.test.mjs` (6 tests passing).

## Limiting cases for verification

- $\mu_s = \mu_k = 0$: pure constant-acceleration drop, $a = g \sin\theta$.
- $\theta \to 0$: $a \to -g \mu_k$ (kinetic regime never engages from rest).
- $\mu_k = \tan\theta$: $a = 0$, block coasts at whatever velocity it has.

## Visual fallback

If KaTeX or Canvas2D is unavailable, the figure caption still reads as a paper sentence and the controls remain operable as plain HTML sliders. The block animation and $v(t)$ plot degrade gracefully.

## Citations

- Marion and Thornton, *Classical Dynamics of Particles and Systems*, 5e, Ch. 2 (`marion-thornton`).

## Stretch goals

- Add an angled applied force $F$ at angle $\phi$ to the slope normal.
- Variable friction coefficient along the slope.
- Two-block coupled system with friction between them.

## Risk register

- Speed slider at high multipliers can blow past the slope length within one rAF frame; mitigated by clamping `s.x` to `s.slopeLength` and auto-restarting at `t >= TOTAL_T`.
- Slider extremes ($\mu_s = 0$) leave $\theta_c = 0$, which is a degenerate edge: the block always slides; visual still correct.
