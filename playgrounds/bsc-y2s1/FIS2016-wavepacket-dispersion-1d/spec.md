---
title: Wavepacket Dispersion in 1D
slug: wavepacket-dispersion-1d
status: verified
audience: portfolio
created: 2026-05-14
primary_uc: FIS2016
supporting_ucs: [FIS2017]
curriculum_year: bsc-y2s1
primary_citation: eisberg-resnick
primary_chapter: 5
hook: 'A quantum particle is a wave packet: it drifts at its group velocity while inevitably spreading, the unavoidable price of being localized.'
one_paragraph: 'A free-particle Gaussian wave packet does two things at once. Its centre moves at the group velocity hbar k_0 / m, like a classical particle, while its width grows as sigma(t) = sigma_0 sqrt(1 + (hbar t / 2 m sigma_0^2)^2) because the component plane waves travel at different phase velocities. The playground evolves the probability density so you watch the packet glide and broaden, and a tighter initial packet spreads faster, the position-momentum uncertainty trade-off made visible. This is why localization in quantum mechanics is always temporary. Reference: Eisberg and Resnick, Quantum Physics, Ch. 5.'
tags: [waves, animation, live-readout]
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
# Free-particle Gaussian wavepacket
The packet center drifts at $\hbar k_0 / m$; the width broadens as $\sigma(t) = \sigma_0\sqrt{1 + (\hbar t/2m\sigma_0^2)^2}$. Source: Eisberg-Resnick Ch. 5.

## Explainer

### What you are looking at

A free quantum particle is not a point: it is a wave packet, and even
with no forces at all it spreads out as it travels. The playground
launches a Gaussian packet and shows the centre gliding at constant
speed while the packet inexorably broadens, the purest demonstration
of quantum dispersion.

### Why it spreads

A localized packet is a superposition of plane waves with a spread of
momenta $\hbar k$. For a free particle each component evolves with the
quadratic dispersion relation

$$\omega(k) = \frac{\hbar k^2}{2m}.$$

The packet centre moves at the group velocity
$v_g = d\omega/dk\big|_{k_0} = \hbar k_0/m$ (the classical speed), but
because $\omega$ is curved in $k$ the components dephase, so the
envelope width grows:

$$\sigma(t) = \sigma_0\sqrt{1
  + \left(\frac{\hbar t}{2 m \sigma_0^2}\right)^2}.$$

### What it means

Two lessons fall out:

- A more tightly localized packet (small $\sigma_0$) spreads faster,
  a direct dynamical face of the uncertainty principle: pinning
  position sharply forces a wide momentum spread, which disperses
  quickly. There is an optimal $\sigma_0$ that minimizes the spread
  at a given time.
- The spreading is intrinsic to the quadratic kinetic energy, not to
  any force or measurement; it is why electrons in free space cannot
  stay point-like and why matter-wave optics must manage dispersion.
  The phase velocity ($\omega/k$) differs from the group velocity, so
  the carrier ripples move through the envelope.

The playground sweeps $\sigma_0$ and $k_0$ and shows the centre drift
at $\hbar k_0/m$ while the width follows the broadening law exactly.

### Things to try

- Launch a narrow packet and a wide one and watch the narrow one
  spread far faster (uncertainty in action).
- Confirm the centre always moves at $\hbar k_0/m$ regardless of
  spreading (group velocity = classical speed).
- Note the fast internal ripples (phase velocity) sliding through the
  slowly broadening envelope (group velocity).

### Where this comes from

The free-particle wave packet, group vs phase velocity and the
spreading law follow Eisberg and Resnick, *Quantum Physics*,
Chapter 5, and Griffiths, *Introduction to Quantum Mechanics*,
Chapter 2.
