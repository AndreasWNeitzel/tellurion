---
title: Laser Rate-Equation Dynamics
slug: laser-rate-equations-dynamics
status: verified
audience: portfolio
created: 2026-05-18
primary_uc: FIS4035
supporting_ucs: []
curriculum_year: bsc-y3s2
primary_citation: siegman1986
hook: 'A pumped gain medium in a resonator does not switch on smoothly. Below threshold the cavity is dark; the moment the pump crosses r_th = 1/q0 the inversion clamps at n_th and the output rises linearly with pump, and the laser reaches that steady state through a giant first photon spike followed by damped relaxation oscillations. The clamp n -> 1/q0 is exact and the engine settles onto it to better than 0.06%.'
one_paragraph: 'An interactive view of the normalised two-level laser rate equations dn/dt = r - n - n p, dp/dt = n p - p/q0 + s (Siegman 1986, Ch. 13, 25; Saleh and Teich 2007, Ch. 16). Net round-trip gain requires n > 1/q0, so the threshold inversion and threshold pump are both 1/q0; above threshold the inversion clamps at n_th = 1/q0 (gain clamping, pump-independent) and the steady photon number is r q0 - 1, giving an output power with a sharp kink at threshold and a linear branch above it. The class-B turn-on is the headline: starting from a spontaneous seed the inversion overshoots, dumps a giant photon pulse, and both quantities ring down through damped relaxation oscillations onto the steady state (the linearised Jacobian has complex eigenvalues with damping ratio r q0 / (2 sqrt(r - 1/q0)); the cw default r = 12, q0 = 0.25 gives 0.53, several visible rings). Q-switching charges a large inversion at low cavity Q then opens the cavity to dump one giant pulse. Below threshold the photon number sits at the spontaneous floor; above it the inversion clamps at 1/q0 independent of pump and the output power is piecewise-linear with a sharp kink at threshold; the class-B turn-on overshoots and rings down through damped relaxation oscillations, and a Q-switched pulse satisfies the rate-equation energy balance. The trace shows the full transient so the first spike and the ring-down stay visible. Reference: Siegman, Lasers, Chapters 13 and 25; Saleh and Teich, Fundamentals of Photonics, Chapter 16.'
tags: [photonics, lasers, nonlinear-dynamics, relaxation-oscillations, live-readout]
difficulty: 4
tier: hero
hero_candidate: true
renderer: canvas2d
estimated_engagement_minutes: 5
share_state_keys: [regime, pump, q0]
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
  - "Siegman, Lasers."
---

# Laser Rate-Equation Dynamics

## Explainer

### What you are looking at

A laser is a feedback loop: a pump builds population inversion, that
inversion amplifies light in the cavity, and the growing light burns
the inversion back down. Two coupled equations capture it, and they
explain three behaviors: dark below threshold, a ringing turn-on, and
the giant pulse of a Q-switch.

### The rate equations

Let $n$ be the population inversion and $p$ the cavity photon number:

$$\dot n = R_\text{pump} - \frac{n}{\tau} - B\,n\,p,$$

$$\dot p = B\,n\,p - \frac{p}{\tau_c} + \epsilon\,n.$$

Read the terms: the pump feeds $n$; spontaneous decay ($n/\tau$) and
stimulated emission ($Bnp$) drain it; stimulated emission feeds $p$;
cavity loss ($p/\tau_c$) drains it; a tiny spontaneous term $\epsilon n$
seeds the field so the laser can start from darkness.

### The three regimes

- Below threshold: gain never beats loss, $p\to0$, the device is dark.
  Threshold is where round-trip gain equals loss, $B\,n_\text{th} =
  1/\tau_c$.
- Continuous-wave above threshold: $n$ and $p$ settle to a steady
  state, but they get there via damped relaxation oscillations, the
  characteristic ringing turn-on as the inversion overshoots and the
  photon number chases it.
- Q-switched: hold the cavity loss high (low Q) so the pump charges a
  huge inversion without lasing, then suddenly drop the loss; the
  stored energy dumps into one giant nanosecond pulse.

The nonlinear $Bnp$ coupling is what produces the overshoot ring and
the explosive Q-switch pulse. The playground integrates the equations
and lets you cross threshold and trigger a Q-switch.

### Things to try

- Pump just below threshold (dark) then just above and watch the
  relaxation-oscillation ringing settle to CW.
- Q-switch: charge at low Q, dump, and watch a giant short pulse far
  above the CW level.
- Raise the pump and watch the steady photon number rise roughly
  linearly above threshold.

### Where this comes from

The two-level laser rate equations, the threshold condition,
relaxation oscillations, and Q-switching follow Siegman, *Lasers*, and
Svelto, *Principles of Lasers*.

## Physical setup

A gain medium (a two-level inversion) sits in an optical resonator. An
external pump builds the population inversion `n`; the inversion decays
on the upper-state lifetime and is depleted by stimulated emission into
the cavity photon number `p`. Photons grow when the round-trip gain
exceeds the cavity loss and leave through the output coupler. A small
fixed spontaneous-emission term seeds the field so the laser can turn
on from darkness. Three regimes are exposed: below threshold (dark),
continuous-wave above threshold (the relaxation-oscillation turn-on),
and Q-switched (charge the gain at low cavity Q, then dump a giant
pulse).

## Governing equations

Normalised two-level rate equations (time in units of the upper-state
lifetime; `r` the pump rate, `q0` the dimensionless cavity quality, `s`
a fixed spontaneous seed) (Siegman 1986, Ch. 13 and Ch. 25; Saleh and
Teich 2007, Ch. 16, Eqs. 16.1-3):

```math
\frac{dn}{dt} = r - n - n\,p, \qquad
\frac{dp}{dt} = n\,p - \frac{p}{q_0} + s .
```

Net photon growth needs `n > 1/q0`, so the threshold inversion and
threshold pump are `n_th = r_th = 1/q0`. Above threshold the steady
state is gain-clamped:

```math
n^\* = \frac{1}{q_0}, \qquad p^\* = r\,q_0 - 1, \qquad
P_\mathrm{out} \propto \frac{p^\*}{q_0} = \frac{r q_0 - 1}{q_0},
```

so the inversion is pinned at `1/q0` independent of pump and the output
power is zero below threshold and linear in `r` above it (the threshold
kink). Linearising about `(n^*, p^*)` gives a Jacobian with trace
`-r q0` and determinant `r - 1/q0`; for `r q0 < 2 sqrt(r - 1/q0)` the
eigenvalues are complex and the approach to steady state is a damped
oscillation (class-B relaxation oscillations), damping ratio
`zeta = r q0 / (2 sqrt(r - 1/q0))`.

## Numerical method

Classical fixed-step RK4 on the two-state system, step `STEP_DT = 2e-3`
in normalised time. The system is non-stiff in the cw and below
regimes; RK4 at this step resolves the giant turn-on spike (fastest
e-folding ~ `1/(r - 1/q0)`, well above the step) without blow-up. The
spontaneous seed is a fixed constant, not a random draw, so every run
is bit-deterministic. The trace history is decimated (one sample every
`SAMPLE_DT = 0.05` of sim time) so the entire turn-on transient,
ring-down, and settled clamp fit in a bounded buffer rather than a
scrolling FIFO window; the cw/below run integrates to a fixed window
`T_WINDOW = 24` and then freezes on its settled state. The capture
path maps capture fraction directly to absolute sim time
(`t = f * T_WINDOW`), so reference frames are reproducible and
independent of frame rate.

## Controls

- `regime` (share key `regime`): below threshold / CW above threshold /
  Q-switched.
- `pump r` (share key `pump`): pump rate; crossing `1/q0` moves the
  operating point through the threshold kink.
- `cavity q0` (share key `q0`): cavity quality; sets the threshold
  `1/q0` and the relaxation-oscillation damping.
- Reset (restores the cw default `r = 12`, `q0 = 0.25`), Pause/Play
  (Play replays the transient once settled), Copy URL.

## Expected qualitative features

- Below threshold the photon number stays at the spontaneous floor and
  the inversion sits at `~ r < n_th`; the cavity is dark.
- Above threshold the inversion clamps on the `n_th = 1/q0` line
  independent of pump (visible as `n` settling exactly on the dashed
  reference and the readout reading `(= n_th)`).
- The class-B turn-on: a giant first photon spike after the inversion
  overshoots, then damped relaxation oscillations ringing onto the
  steady values `n^* = 1/q0`, `p^* = r q0 - 1`.
- Output power vs pump shows a sharp kink at `r_th = 1/q0`: identically
  zero below, exactly linear above, with the operating point marked.
- Q-switched: a slowly charged large inversion, then on opening the
  cavity a single giant pulse that strongly depletes the inversion.

## Invariants and acceptance thresholds

Checked offline in `invariants.test.mjs` (7 tests):

1. Below threshold the photon number collapses to `< 1e-3` (spontaneous
   floor) and `n -> r`.
2. Above threshold the inversion clamps at `1/q0` to within 1%,
   independent of pump (`r = 3, 6, 12 r_th`).
3. The RK4 steady state matches the closed-form gain-clamped solution
   (`n` to 2 decimals, `p` within ~10%).
4. Output power is exactly piecewise-linear: zero below threshold,
   constant slope above (ratio of successive increments = 1 to 1e-6).
5. Relaxation oscillations: in the underdamped regime (Jacobian
   discriminant `r^2 q0^2 - 4(r - 1/q0) < 0`) the transient photon
   peak overshoots steady by `> 1.3x`.
6. Q-switch giant pulse obeys the exact rate-equation energy balance
   `E = (n_i - n_end) + integral(r - n) - (p_end - p_init)` to within
   1%; more charge gives a larger pulse and larger energy.
7. Determinism: identical inputs reproduce the run bit-for-bit.

Visual gate: SSIM > 0.92 against the five committed golden frames.

## Limiting cases for verification

- `r < 1/q0`: no lasing, `p -> s q0 / (1 - r q0)` (negligible),
  `n -> r`. Test 1.
- `r >> 1/q0`: `n` clamped at `1/q0`, `p ~ r q0`, `P_out` linear in
  `r`. Tests 2-4.
- Overdamped limit (`r q0 > 2 sqrt(r - 1/q0)`): monotone approach, no
  overshoot; the underdamped condition in test 5 is the complementary
  check.
- Steady state independent of initial seed amplitude (only the turn-on
  delay depends on it).

## Visual fallback

Static three-panel Canvas2D (no animation needed for the physics): the
resonator with the inversion bar and `n_th` line, the full decimated
turn-on transient with steady reference lines, and the output-vs-pump
kink with the operating point. The terminal golden frame shows the
settled clamped state with the entire transient still visible.

## Citations

- Siegman, A. E. *Lasers*, University Science Books, 1986, Ch. 13
  (rate equations), Ch. 25 (relaxation oscillations, Q-switching).
  `siegman1986`.
- Saleh, B. E. A. and Teich, M. C. *Fundamentals of Photonics*, 2nd
  ed., Wiley, 2007, Ch. 16 (laser dynamics, Eqs. 16.1-3).
  `saleh2007`.

## Stretch goals

- Gain-switching and pump modulation (sinusoidal `r(t)`) to show the
  relaxation-oscillation resonance peak in the modulation response.
- Multimode / spatial-hole-burning extension.
- Repetitive Q-switching train with pulse-to-pulse energy statistics.

## Risk register

- RK4 step too large for a very stiff regime (small `q0`, very large
  `r`): the giant spike could under-resolve. Mitigated by the fixed
  `STEP_DT = 2e-3` and the cw default chosen well inside the
  RK4-stable, clearly-underdamped region; invariants test 5 asserts the
  overshoot in a separate clean underdamped regime.
- A scrolling FIFO trace would hide the turn-on spike. Mitigated by the
  decimated full-run history and the freeze-on-settle behaviour.
- Capture tied to frame count would be non-reproducible. Mitigated by
  mapping capture fraction directly to absolute sim time.
