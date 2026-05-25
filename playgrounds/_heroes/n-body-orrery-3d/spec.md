---
title: N-body Orrery and Chaotic Asteroid Pair
slug: n-body-orrery-3d
status: verified
audience: portfolio
created: 2026-05-20
primary_uc: AST2004
supporting_ucs: [FIS2021]
curriculum_year: hero
primary_citation: yoshida1990
primary_chapter: 1
hook: 'A miniature solar system rendered in 3D with a fourth-order symplectic integrator, where two ghost asteroids on identical orbits separated by one part in a million drift apart over centuries: bounded total energy, exponential sensitivity.'
one_paragraph: 'A sun plus five planets at small inclinations, integrated forward in 3D with the Yoshida-4 symplectic scheme from the shared engine. Total energy is preserved to a fixed-amplitude oscillation forever; the live readout reports the running drift. Two test asteroids start on the same orbit between Mars and Jupiter with a one-part-in-a-million phase offset; over long integrations their trajectories pull apart, the hallmark of Hamiltonian chaos in the restricted N-body problem. Reference: Yoshida, Phys. Lett. A 150 (1990) 262.'
caption: 'Figure 1. 3D N-body orrery integrated with Yoshida-4: sun at the origin, five planets in low-inclination orbits, two ghost asteroids separated by a phase offset of 1e-6. The live energy readout shows the bounded symplectic drift; the asteroid separation grows exponentially with time. Method: gravitational sum with Plummer softening, symplectic Yoshida-4 integration, Canvas2D perspective projection with z-ordered drawing. Source: Yoshida, Phys. Lett. A 150 (1990) 262.'
tags: [mechanics, animation, live-readout, gravity, three-d]
difficulty: 3
tier: single
hero_candidate: true
renderer: canvas2d
estimated_engagement_minutes: 4
share_state_keys: [seed, ghost_visible]
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
  - "Yoshida, Construction of higher order symplectic integrators, Ch. 1."
---

# 3D N-body orrery
Yoshida-4 symplectic; two ghosts diverging. Source: Yoshida, Phys. Lett. A 150 (1990) 262.

## Explainer

### What you are looking at

A toy solar system: one sun at the center plus five planets at slightly
inclined orbits, drawn in 3D with a perspective projection. Two extra
particles, the "ghost asteroids," sit between Mars and Jupiter on
identical orbits, separated by a microscopic phase offset of one part
in a million. As you watch, they trace out the same trajectory for
many revolutions, then peel apart.

The readout reports two numbers. The first is the energy drift,
$|E(t) - E_0| / |E_0|$. Because the integrator is symplectic (it
respects the Hamiltonian structure exactly to a slightly shifted
"shadow" Hamiltonian), this number stays bounded forever instead of
secularly growing. The second is the distance between the two ghost
asteroids; that one does grow, exponentially.

### The N-body Hamiltonian

For $N$ point masses in 3D, the equations of motion are

$$\ddot{\vec r}_i \;=\; \sum_{j\ne i}\, G\,m_j\,
  \frac{\vec r_j - \vec r_i}{\bigl(|\vec r_j - \vec r_i|^2
  + \varepsilon^2\bigr)^{3/2}},$$

with Plummer softening $\varepsilon$ to keep close encounters
well-conditioned. The total energy

$$E \;=\; \tfrac{1}{2}\sum_i m_i |\dot{\vec r}_i|^2
       \;-\; \sum_{i<j}\, \frac{G m_i m_j}{|\vec r_i - \vec r_j|}$$

is the conserved quantity that a symplectic integrator preserves to a
shadow Hamiltonian, $E_{\text{integrator}} = E + O(\Delta t^4)$, with
no secular drift.

### Why Yoshida-4

A naive Euler step would lose energy steadily. Even Runge-Kutta of high
order shows a slow secular drift over millions of steps. The Yoshida-4
composition of velocity-Verlet half-steps is fourth-order symplectic:
the long-time energy error oscillates at the level of $(\Delta t)^4$
but never wanders. For a 1000-revolution integration with $\Delta t$
about 1% of the inner orbit period that is the difference between
"sun-spitting planets" and "still a credible solar system after a
million steps."

### The chaos demonstration

Two ghost asteroids start at $\phi = 0.7$ and $\phi = 0.7 + 10^{-6}$
on the same circular orbit at $r = 3.2$. The full $N$-body system
around them is non-integrable: Jupiter's $4{:}3$ resonance lives in
that region, and the dynamics has positive Lyapunov exponent. Their
separation grows like

$$d(t) \;\sim\; d_0\, e^{\lambda t},$$

so a $10^{-6}$ offset blows up to order unity in roughly
$\log(10^6)/\lambda \approx 14/\lambda$ time units. You can watch it
in the live readout; the asteroids visibly part ways after a few tens
of orbital periods.

### Symbols

- $\vec r_i$: 3D position of body $i$.
- $\vec v_i = \dot{\vec r}_i$: velocity of body $i$.
- $m_i$: mass of body $i$.
- $G$: gravitational constant (set to 1 in code units).
- $\varepsilon$: Plummer softening length.
- $\lambda$: largest Lyapunov exponent of the restricted orbit.

### Where this comes from

The Yoshida-4 symplectic integrator and its energy-conservation
property are from Yoshida, Phys. Lett. A 150 (1990) 262. Chaos in the
restricted three-body problem and the role of mean-motion resonances
follow Murray and Dermott, Solar System Dynamics, Ch. 9.
