---
title: Laser Cavity (Hero)
description: A gain medium between two mirrors driven by the laser rate equations. Below the lasing threshold a faint trickle; cross the sharp threshold and the cavity fills with synchronized photons and the beam ignites. The threshold and the Q-switched giant pulse are emergent, not scripted.
caption: Figure 1. Laser rate equations driving an atom/photon particle cavity; the threshold and the Q-switched giant pulse are emergent. Source: Siegman, Lasers, Ch. 13.
slug: laser-cavity-3d
status: verified
audience: portfolio
created: 2026-05-19
program: EVF
course: EVF Quantum Mechanics and Technology
suite: summer-school-hero-suite
primary_uc: EVF
supporting_ucs: []
curriculum_year: hero
primary_citation: siegman-lasers
primary_chapter: 13
hook: 'Turn the pump up slowly: nothing, nothing, then the whole cavity ignites at once. That kink is the laser threshold.'
one_paragraph: 'A gain medium between two mirrors, governed by the laser rate equations for the population inversion and the cavity photon number, integrated live. Below a sharp pump threshold the excited atoms glow but the cavity holds only a negligible incoherent trickle; above it the inversion clamps and every extra pumped atom feeds the beam, so the output rises linearly with a sharp kink. None of this is scripted: the threshold falls out of the steady state. Arm the Q-switch and the cavity is spoiled while the pump piles up a huge inversion; release it and the stored energy dumps as one giant pulse.'
tags: [optics, animation, live-readout, webgl2, hero]
difficulty: 5
tier: single
hero_candidate: true
renderer: webgl2
estimated_engagement_minutes: 6
share_state_keys: [P, R, Lc, tau]
---

# Laser Cavity

## Explainer

### What you are seeing and why it matters

A laser is not just a bright lamp. Below a certain pump rate it does
nothing special: atoms get excited and dribble out incoherent light.
Above a threshold pump, something abrupt happens: photons already in
the cavity stimulate excited atoms to emit MORE photons in exact step,
which stimulate yet more, and the cavity fills with one coherent,
synchronized field that pours out as a beam. The hallmark is the kink:
plot output against pump and it is flat, then suddenly a straight
rising line. The pump that buys the inversion past that point all goes
into the beam (the inversion "clamps"). Spoil the cavity while pumping
and you store a huge inversion, then release it in a single giant
pulse, which is how laser range-finders and laser machining work.

### Try this

- "below threshold": atoms glow, the cavity stays dark.
- Drag the pump up through "at threshold": the beam ignites sharply.
- "well above threshold": a bright steady column through the output
  mirror; the inversion readout stops rising (gain clamping).
- "Q-switched giant pulse" (or Fire Q-switch): one brief brilliant
  flash that drains the stored inversion.

### The rate equations of a four-level laser

A coupled pair of ODEs for the population inversion $N$ (number of
atoms in the upper laser state minus the lower) and the cavity
photon number $n$ captures everything:

$$\boxed{\;
\dot N = P - \frac{N}{\tau} - B\,N\,n,\qquad
\dot n = B\,N\,n - \frac{n}{\tau_c} + s\,\frac{N}{\tau}.
\;}$$

What each term does:

- $P$, the pump rate (excited atoms produced per unit time). The
  knob you turn on the front panel.
- $-N/\tau$, spontaneous emission with upper-state lifetime $\tau$:
  excited atoms drop on their own, scrambling into all directions.
- $-B\,N\,n$, *stimulated* emission: each photon in the cavity
  triggers another excited atom to emit a copy in the same mode.
  The coefficient $B$ is the Einstein $B$ coefficient times the
  mode density.
- $+B\,N\,n$, the photon-gain twin of the line above.
- $-n/\tau_c$, photons leaking out (the cavity decay time
  $\tau_c$ depends on mirror reflectivity and absorption).
- $+s\,N/\tau$, the small fraction $s \ll 1$ of spontaneous photons
  that land in the lasing mode and seed the build-up.

### Steady state and the threshold

Set $\dot N = \dot n = 0$. Below threshold the second equation gives
$n_{\rm ss} \approx s\,(N_{\rm ss}/\tau) \cdot \tau_c / (1 - B\,N_{\rm ss}\,\tau_c)$,
which is small. The gain-loss balance $B\,N\,\tau_c = 1$ defines

$$N_{\rm th} = \frac{1}{B\,\tau_c},\qquad
  P_{\rm th} = \frac{N_{\rm th}}{\tau} = \frac{1}{B\,\tau\,\tau_c}.$$

Above threshold the inversion *clamps* at $N_{\rm ss} = N_{\rm th}$ and
all extra pump goes into the beam:

$$n_{\rm ss} = \tau_c\,(P - P_{\rm th}),\qquad P > P_{\rm th}.$$

This is the kink in the output-vs-pump curve and the most reliable
diagnostic that you have a laser, not a bright lamp.

### The Q-switched giant pulse

Set $\tau_c$ very small (the cavity is "spoiled", $Q$ low) and pump
hard. The atoms cannot lase, so the inversion piles up far above
threshold; the steady-state inversion would be $P\,\tau$. Then
suddenly snap $\tau_c$ back to its high-$Q$ value. The stimulated
term explodes: $B\,N\,n$ runs away because $N$ is now far above
threshold. The result is a sub-microsecond burst of light that
dumps the stored inversion in one pulse. The peak photon number
is of order

$$n_{\rm peak} \sim N_0 - N_{\rm th} - N_{\rm th}\,\ln(N_0 / N_{\rm th}),$$

solving the giant-pulse algebra of Wagner and Lengyel 1963.

### Symbols, at a glance

- $N$, population inversion (atoms in the upper laser level minus
  the lower, summed over the gain medium).
- $n$, number of photons in the lasing cavity mode.
- $P$, pump rate (atoms/s).
- $\tau$, spontaneous-emission lifetime of the upper level (s).
- $\tau_c$, cavity photon lifetime; depends on mirror reflectivity
  and absorption.
- $B$, stimulated-emission coupling (atoms photon$^{-1}$ s$^{-1}$).
- $s$, spontaneous-emission branching into the cavity mode (a small
  geometric factor).

### Bibliographic origin

The Einstein 1917 derivation of the A and B coefficients is
Einstein, *Physikalische Zeitschrift* **18** (1917) 121, the
ancestor of the rate-equation framework. The textbook treatment of
laser rate equations is Siegman, *Lasers* (University Science 1986),
Ch. 6, 7. The original Q-switching analysis is Hellwarth in
*Advances in Quantum Electronics* (1961), with the giant-pulse
algebra in Wagner and Lengyel, *J. Appl. Phys.* **34** (1963)
2040. A clean modern treatment is Milonni and Eberly, *Laser
Physics* (Wiley 2010), Ch. 5, 6.

## Physical setup

A gain rod between a fully reflecting and a partially reflecting
mirror. Particle counts and brightness track N and n; the output beam
intensity tracks $n/\tau_c$.

## Numerical method

RK4 integration of the rate equations; engine
`shared/js/engine/laser-rate-cpu.js` (DOM-free, tested in
`tests/laser-rate.test.mjs`). Render:
`shared/js/engine-gl/laser-cavity-3d.js`.

### Stack note (WebGL2 relaxation)

Project default is Canvas2D/SVG; relaxed to WebGL2 (hundreds of
additive atom/photon sprites plus the beam at 60 fps is not feasible
in Canvas2D). Reuses `createGL2` / `compileProgram`; default
framebuffer + in-shader ACES.

## INTERACTIVITY (standard S4)

- Camera orbit (drag): yes, shared orbit camera around the cavity.
- Camera zoom (scroll): yes.
- Camera pan: not applicable (the cavity is centred and is the
  subject; fixed target; stated).
- Direct manipulation: the pump dial is the primary control; the
  Q-switch is fired with a button (spoils then releases the cavity).
- Parameters: pump P (0 to 8); mirror reflectivity R (0.5 to 0.99,
  sets the cavity lifetime); cavity length (0.5 to 3, also sets it);
  upper-state lifetime tau (0.3 to 6).
- Time controls: play, pause, reset. No speed multiplier (the
  integrator sub-steps are fixed; the dynamics are the subject).
- Presets: below threshold, at threshold, well above threshold,
  Q-switched giant pulse.
- Probe/readout: live inversion N, photon number n, output power,
  the threshold pump, and the state (below threshold / lasing /
  Q closed).

## Diagnostic plot (secondary)

A Canvas2D panel plots the steady-state output power versus pump,
showing the sharp lasing-threshold kink, with the current pump
marked. Subordinate to the 3D cavity (S3).

## Expected qualitative features

1. On load the cavity is running and atoms glow within 3 s (S5).
2. Crossing the pump threshold ignites a bright synchronized beam
   abruptly (S6); the Q-switch produces one giant flash.
3. Above threshold the inversion readout clamps while output keeps
   rising with pump.
4. The output-vs-pump panel shows the flat-then-linear kink.

## Invariants and acceptance thresholds

| invariant | threshold | location |
| cavity lifetime grows with R; N_th = 1/(B tauC) | exact | invariants test |
| below threshold photon number is the seed floor | < 1e-2 | invariants test |
| above threshold inversion clamps at N_th | within 1 percent | invariants test |
| output kink: ~0 below, linear above | strict | invariants test |
| Q-switch: stored inversion -> transient giant pulse, energy accounts | strict / energy balance | invariants test |
| integrator deterministic | exact | invariants test |

Confirmed in `invariants.test.mjs` and `tests/laser-rate.test.mjs`.

## Limiting cases for verification

- P -> 0: no inversion, dark cavity.
- P >> P_th: strong clamped inversion, bright linear output.
- Q closed indefinitely: inversion saturates at P tau, no beam.

## Citations

- Siegman, Lasers, University Science Books 1986, Ch. 13
  (`siegman-lasers`).
- Svelto, Principles of Lasers, 5th ed., Springer 2010, Ch. 7-8
  (`svelto-lasers`).

## Risk register

- The Q-switched giant pulse is stiff; the engine uses RK4 and the
  playground sub-steps each frame so the spike is resolved.
- Golden determinism: capture fixes a per-fraction pump multiple of
  the threshold, a fixed step count and camera.
