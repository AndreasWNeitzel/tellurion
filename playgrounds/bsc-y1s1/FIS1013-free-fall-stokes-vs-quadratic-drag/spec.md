---
title: Free Fall Stokes vs Quadratic Drag
slug: free-fall-stokes-vs-quadratic-drag
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: FIS1013
supporting_ucs: []
curriculum_year: bsc-y1s1
primary_citation: marion-thornton
primary_chapter: 2
hook: "Drop three identical balls: one in vacuum, one through a fluid that drags in proportion to speed, one through air that drags as speed squared. The vacuum ball never stops speeding up; the other two coast to two different terminal speeds."
one_paragraph: "Three objects fall from the same height under three force laws. In vacuum only gravity acts and the speed climbs without limit (v = g t). With Stokes (linear) drag, the regime for slow, small or very viscous flow, the drag is proportional to v and the body relaxes exponentially to a terminal speed where drag balances gravity. With quadratic drag, the regime for fast everyday motion in air, the drag goes as v squared, so the approach to terminal speed is faster and (for the same coefficient) the terminal speed is lower. The left panel shows the three falling; the right panel plots v(t) for all three with a dashed line at the Stokes terminal velocity, so one curve keeps rising while the other two flatten at different heights. The readout gives the two terminal velocities. Which drag law applies is set by the Reynolds number of the flow, not by the object itself."
tags: [mechanics, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
---

# Free fall under vacuum, Stokes drag, and quadratic drag

## Explainer

### What you are looking at

Three identical balls are dropped from the same height at the same
instant. One falls in vacuum, one through a fluid that resists it in
proportion to its speed, and one through air, where resistance grows
with the square of the speed. They separate immediately, and each
settles into a different steady fall. This is the difference between
"no drag", "slow/small-object drag", and "everyday air drag", side by
side.

### The three equations of motion

For a unit mass falling (taking downward as negative $v$), gravity is
constant and drag opposes motion:

$$\dot v = -g \quad \text{(vacuum)},$$

$$\dot v = -g - b\,v \quad \text{(Stokes, linear)},$$

$$\dot v = -g - c\,|v|\,v \quad \text{(quadratic, Newtonian)}.$$

Stokes drag $-bv$ describes slow flow past small objects (a bead in
honey, a fog droplet). Quadratic drag $-c|v|v$ describes fast flow
where the object throws air aside (a skydiver, a baseball). The
absolute value keeps the quadratic force pointing opposite the motion.

### Terminal velocity: where gravity and drag cancel

Each drag law has a speed at which the drag exactly balances gravity,
so $\dot v = 0$ and the ball stops accelerating:

$$v_t^{(S)} = \frac{m g}{b}, \qquad
  v_t^{(Q)} = \sqrt{\frac{m g}{c}}.$$

The vacuum ball never has one; it speeds up forever. The two drag laws
even have a crossover speed $v_c = b/c$ above which the quadratic term
wins.

### The exact fall curves

These equations can be solved in closed form from rest, which is the
exact answer the simulation must match:

$$v_S(t) = -v_t^{(S)}\left(1 - e^{-b t / m}\right),$$

$$v_Q(t) = -v_t^{(Q)} \tanh\!\left(\frac{g t}{v_t^{(Q)}}\right).$$

Stokes approaches terminal velocity as a decaying exponential;
quadratic approaches it as a $\tanh$, which is flatter early and turns
over more sharply. Watching the velocity readouts you can see the
exponential and the $\tanh$ pull away from the straight vacuum line.

### Things to try

- Let it run until the two drag balls flatten out at their terminal
  speeds while the vacuum ball keeps accelerating.
- Raise the Stokes coefficient $b$: the linear ball reaches a lower,
  earlier terminal speed.
- Compare early time (all three almost together, drag still weak) with
  late time (drag dominant, speeds locked).

### Where this comes from

The three drag laws, the terminal-velocity expressions, and the closed
-form solutions follow Marion and Thornton, *Classical Dynamics of
Particles and Systems*, 5th ed., Chapter 2. The 2D version is the
companion playground `projectile-with-air-drag`.

## Physical setup

Three unit-mass balls dropped from the same height $y_0$ at $t = 0$, falling under three different drag laws: vacuum, Stokes (linear in velocity), and quadratic (Newtonian). Gravity acts downward; $g = 9.81$ m/s$^2$.

## Governing equations

$$\dot v = -g \quad \text{(vacuum)},$$
$$\dot v = -g - b\,v \quad \text{(Stokes)},$$
$$\dot v = -g - c\,|v|\,v \quad \text{(quadratic)}.$$

Terminal velocities (magnitudes, downward): $v_t^{(S)} = m g / b$ and $v_t^{(Q)} = \sqrt{m g / c}$. Crossover velocity above which quadratic drag dominates Stokes drag is $v_c = b / c$.

Analytic Stokes solution from rest: $v(t) = -v_t^{(S)} (1 - e^{-b t / m})$, giving exponential approach to terminal. Analytic quadratic is $v(t) = -v_t^{(Q)} \tanh(g t / v_t^{(Q)})$.

## Numerical method

RK4 with $\Delta t = 1/240$ s. RK4 reproduces the analytic Stokes solution to within $10^{-6}$ relative at this step.

## Controls

- Drop height $y_0$ (20 to 500 m).
- Stokes coefficient $b$ (0.05 to 2.0).
- Quadratic coefficient $c$ (0.005 to 0.5).
- Reset / Play button.

## Expected qualitative features

1. Vacuum lands first; Stokes second; quadratic third (heavier drag terms slow the fall more).
2. Velocity-time plot shows the iconic shapes: linear (vacuum), exponential approach to plateau (Stokes), tanh-like (quadratic).
3. Terminal velocity dashed lines mark the analytic asymptotes; the simulated curves approach them as $t$ grows.
4. Stokes terminal exceeds quadratic terminal here ($v_t^{(S)} = 19.6$ m/s, $v_t^{(Q)} = 14.0$ m/s for default $b, c$), but the relative ordering depends on slider values.

## Invariants and acceptance thresholds

| invariant | threshold | location |
| vacuum: $v = -g t$ | within $10^{-8}$ relative | invariants test |
| Stokes terminal $v_t = m g / b$ | within $10^{-6}$ relative at large t | invariants test |
| quadratic terminal $v_t = \sqrt{m g / c}$ | within $10^{-3}$ relative at large t | invariants test |
| analytic Stokes $v(t)$ matches RK4 | within $10^{-6}$ relative | invariants test |
| drag lengthens fall time vs vacuum | strict | invariants test |
| crossover velocity $v_c = b / c$ | exact | invariants test |
| terminal-velocity formulae match closed forms | within $10^{-12}$ | invariants test |

All confirmed in `invariants.test.mjs` (7 tests passing).

## Limiting cases for verification

- $b, c \to 0$: terminal velocities diverge, fall reduces to vacuum.
- $b \to \infty$: Stokes terminal $\to 0$, particle hovers (in the limit).
- Vacuum and analytic Stokes both reproduce textbook closed forms exactly.

## Visual fallback

If KaTeX or Canvas2D is unavailable, sliders remain functional and the figure caption still reads as a paper sentence.

## Citations

- Marion-Thornton, *Classical Dynamics of Particles and Systems*, 5e, Ch. 2 (`marion-thornton`).
- Companion playground: `projectile-with-air-drag` for the 2D version.

## Stretch goals

- Add a third drag mode: linear + quadratic combined.
- Quantitative side panel showing $v_t$ vs particle radius for spherical objects in air vs water.
- Re-derive the Reynolds number that selects Stokes vs quadratic regime.

## Risk register

- Setting $c$ very small while $y_0$ is small can keep the quadratic ball above the screen for an unhelpfully long time; mitigated by a Reset button.
- Crossover velocity $v_c$ depends on both $b$ and $c$; the readout doesn't show $v_c$ directly but the plot conveys the regime visually.
