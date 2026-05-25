---
title: Magnus Effect on a Spinning Ball
slug: magnus-effect-spinning-ball
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: FIS1013
primary_citation: taylor-mech
supporting_ucs: [AST3014]
curriculum_year: bsc-y1s1
hook: "A spinning ball curves. The spin drags air around with it, the flow is faster on one side than the other, and the pressure difference pushes the ball sideways. That is the Magnus force, the physics of a curveball, a topspin forehand and a banana free kick."
one_paragraph: "A ball moving through air while spinning feels a Magnus force perpendicular to both its velocity and its spin axis, on top of gravity and quadratic drag. The playground fires the same launch with three spins: no spin (the reference arc), the chosen spin, and the opposite spin, so the trajectory visibly bends up, down or sideways relative to the reference. Topspin makes the ball dive and shortens the range; backspin lifts it and stretches the range; sidespin curves it laterally. The ball is drawn spinning with a spin-direction arrow, and the readout reports the range with and without spin so the effect is quantified. The force grows with spin rate and speed, which is why a fast, heavily spun ball curves most. This is the mechanism behind a baseball curveball, a tennis topspin lob and a football knuckleball."
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
references:
  - "Taylor, Classical Mechanics."
---

# Magnus effect on a spinning ball

## Explainer

### What you are looking at

A spinning ball curves in flight: that is the banana free kick, the
curveball, the topspin dip. The playground launches a ball with
adjustable speed and spin and shows the trajectory bending, plus the
drag that always shortens the flight.

### The Magnus force

A spinning ball drags air around with it (the viscous boundary
layer co-rotates), so the airflow speed is asymmetric. By Bernoulli's
principle the static pressure is lower on the side where the surface
moves with the flow. The net pressure imbalance gives a lift force
perpendicular to both the velocity and the spin axis,

$$\boxed{\;\mathbf F_M = S\,\boldsymbol\omega \times \mathbf v,\;}$$

with $\boldsymbol\omega$ the spin (rad/s) and $S$ a positive
coefficient. A useful explicit form is

$$S = C_L\,\frac{\rho_{\rm air}\,A\,R_{\rm ball}}{2},$$

where $C_L$ is a dimensionless lift coefficient that depends on the
spin parameter $\sigma \equiv \omega R_{\rm ball} / |\mathbf v|$.
For a typical football $C_L$ ranges from about $0.2$ (modest spin)
to $0.5$ (heavy spin).

Backspin lifts ($\mathbf F_M$ up, the ball "floats"); topspin pushes
it down (a sharp dip); sidespin curves it laterally (the banana free
kick). The force is always perpendicular to the motion, so it bends
the path without doing work; only drag dissipates kinetic energy.

### Competing with gravity and drag

The full equation of motion for a spinning ball in air is

$$\boxed{\;m\,\frac{d\mathbf v}{dt}
  = m\,\mathbf g
  - \tfrac{1}{2}\,\rho_{\rm air}\,C_D\,A\,|\mathbf v|\,\mathbf v
  + S\,\boldsymbol\omega \times \mathbf v.\;}$$

The three terms:

- $m\,\mathbf g$, the weight ($\mathbf g \approx (0, -9.81)\,\mathrm{m/s^2}$).
- $-\tfrac{1}{2} \rho_{\rm air} C_D A |\mathbf v|\,\mathbf v$,
  *quadratic drag*: always antiparallel to $\mathbf v$ and growing
  with $v^2$. For a smooth sphere $C_D \approx 0.47$ in the laminar
  regime and drops to about $0.2$ in the post-crisis turbulent
  regime (around Reynolds number $3 \times 10^5$). This is why a
  fast spin can trigger the drag crisis and a knuckleball flutters.
- $S\,\boldsymbol\omega \times \mathbf v$, the Magnus force.

For a football ($m \approx 0.43\,\mathrm{kg}$, $R \approx 0.11\,\mathrm{m}$)
launched at $30\,\mathrm{m/s}$ with $10\,\mathrm{rev/s}$ sidespin, the
Magnus force is comparable to half the weight, which is exactly the
deflection scale of a Roberto Carlos free kick.

### Symbols, at a glance

- $\mathbf v$, ball velocity (m/s); $\boldsymbol\omega$, spin
  (rad/s).
- $m$, ball mass (kg); $R_{\rm ball}$, ball radius (m).
- $A = \pi R_{\rm ball}^2$, frontal area; $\rho_{\rm air}$, air density
  ($\approx 1.2\,\mathrm{kg/m^3}$ at sea level).
- $C_D$, drag coefficient; $C_L$, Magnus lift coefficient; $S$, the
  Magnus prefactor above.
- $\sigma = \omega R_{\rm ball}/|\mathbf v|$, the spin parameter.

### Things to try

- Add backspin and watch the trajectory flatten and carry farther
  than the no-spin curve.
- Switch to topspin and watch it dip sharply and fall short.
- Crank the speed and see drag bend the path away from the ideal
  parabola even with zero spin.

### Bibliographic origin

The effect was described in Magnus, *Annalen der Physik* **88** (1853)
1, after earlier observations by Newton (1671) and Robins (1742) of
the lateral deflection of musket balls. The lift formula
$\mathbf F = \rho\,\boldsymbol\omega \times \mathbf v\,V$ for an
inviscid spinning cylinder is the Kutta-Joukowski theorem (1902).
The aerodynamic context is in Goff, *Gold Medal Physics: The
Science of Sports* (Johns Hopkins 2010), Ch. 4. The drag crisis is
discussed in Mehta, *Annu. Rev. Fluid Mech.* **17** (1985) 151.

### Things to try

- Add backspin and watch the trajectory flatten and carry farther
  than the no-spin curve.
- Switch to topspin and watch it dip sharply and fall short.
- Crank the speed and see drag bend the path away from the ideal
  parabola even with zero spin.

### Where this comes from

The Magnus force, quadratic drag, and projectile flight follow
Halliday, Resnick and Walker, *Fundamentals of Physics*, Chapters 4
and 6, and Adair, *The Physics of Baseball*.

## Physical setup

A baseball-like ball (m = 0.15 kg) launched with initial speed v_0 and
angle, subject to gravity, quadratic drag, and Magnus lift due to spin.
Convention: positive spin = top-spin (ball rotates in direction of
flight; Magnus force pushes down). Negative spin = back-spin (Magnus
force pushes up).

## Governing equations

  d v / dt = -g y-hat - (c_drag |v|) v / m + (c_mag * spin)(vy, -vx) / m

with c_drag = 0.005, c_mag = 0.0003, g = 9.81.

## Numerical method

Fourth-order Runge-Kutta with dt = 0.01.

## Controls

- v_0: launch speed, 10 to 40 m/s.
- angle: launch angle, 5 to 60 degrees.
- spin: -100 (back-spin) to +100 (top-spin).
- Reset / Pause / Play.

## Expected qualitative features

1. spin = 0: parabolic-like trajectory (with drag asymmetry).
2. spin > 0 (top-spin): shorter range, trajectory curls downward.
3. spin < 0 (back-spin): longer range, trajectory floats.
4. At fixed angle, the trajectory continues until it lands.

## Invariants and acceptance thresholds

1. Positive spin shortens range vs spin = 0.
2. Negative spin extends range vs spin = 0.
3. Zero-spin peak is between 30 and 70 percent of range.
4. Spin sign produces nonzero range difference.
5. Trajectory lands at y = 0 (within 0.1).

All confirmed in `invariants.test.mjs`.

## Limiting cases for verification

- No drag, no spin: pure parabola.
- Very high spin: trajectory hooks dramatically.

## Visual fallback

Canvas2D only. Three trajectories on common axes: no-spin (dashed
yellow), opposite-spin (cyan), current-spin (orange) with animated
ball.

## Citations

- Adair 1990, The Physics of Baseball.
- Jackson, Classical Electrodynamics Ch. 12.

## Stretch goals

- Tennis serve trajectories.
- Soccer free kicks (lateral Magnus).
- 3D extension with full angular velocity vector.

## Risk register

- c_drag and c_mag are tuned for visual effect, not measured. Behaviors
  are qualitatively correct.
