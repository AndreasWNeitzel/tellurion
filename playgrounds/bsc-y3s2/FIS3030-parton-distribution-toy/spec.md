---
title: Toy Parton Distribution Functions
slug: parton-distribution-toy
status: verified
audience: portfolio
created: 2026-05-14
primary_uc: FIS3030
supporting_ucs: []
curriculum_year: bsc-y3s2
primary_citation: griffiths-particles
primary_chapter: 9
hook: 'A proton is not three quarks but a swarm: valence quarks, a gluon sea, and quark-antiquark pairs, each carrying a share of the momentum.'
one_paragraph: 'Deep inelastic scattering shows the proton is made of partons sharing its momentum. A parton distribution f(x) gives the probability of finding a constituent that carries momentum fraction x; plotting x f(x) shows where the momentum actually sits. The playground draws toy distributions for the up and down valence quarks, the gluon, and the sea quarks, so you see the valence bumps at moderate x and the gluon and sea rising steeply toward small x. The momentum fractions must sum to one. Reference: Griffiths, Introduction to Elementary Particles, Ch. 9.'
tags: [nuclear-particle, animation, live-readout]
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
# Toy parton distributions
$x f(x)$ for $u_v$, $d_v$, gluon, sea quarks. Source: Griffiths-Particles Ch. 9 (`griffiths-particles`).

## Explainer

### What you are looking at

A proton is not three quarks rattling in a bag. Probe it hard enough
and you find a swarm: two-and-a-bit "valence" quarks, a huge cloud of
gluons, and a sea of quark-antiquark pairs. The playground plots how
the proton's momentum is shared among them, the parton distribution
functions, the input to every prediction at a hadron collider.

### Parton distributions

A parton distribution $f_i(x)$ is the probability density to find
constituent $i$ carrying a fraction $x$ of the proton's momentum. It is
conventional to plot $x f(x)$ because then equal areas mean equal
shares of momentum:

$$\int_0^1 x\,f_i(x)\,dx = \langle\text{momentum fraction of }i\rangle.$$

The toy curves show the qualitative truth measured in deep-inelastic
scattering:

- Valence up ($u_v$) and down ($d_v$): broad bumps at moderate $x$
  (around 0.1 to 0.3). They carry the proton's quantum numbers
  ($\int u_v\,dx = 2$, $\int d_v\,dx = 1$).
- Gluon: rises steeply toward small $x$ and dominates there.
- Sea quarks: also concentrated at small $x$, from gluons splitting
  into pairs.

### The momentum sum rule

Add up every parton's momentum fraction and it must total one:

$$\sum_i \int_0^1 x\,f_i(x)\,dx = 1.$$

The striking experimental fact: the quarks carry only about half; the
rest is gluons. The proton's mass and momentum are mostly the glue, not
the quarks. The playground lets you reshape the distributions and the
sum rule holds, the constraint every real PDF fit must respect.

### Things to try

- Note the valence bumps sit at moderate $x$ while the gluon and sea
  blow up toward $x\to0$.
- Check the areas: quarks alone fall short of 1; the gluon makes up
  the difference (the "missing momentum").
- Reshape a distribution and watch the others adjust to keep the
  momentum sum at 1.

### Where this comes from

Parton distributions, the $xf(x)$ representation, and the momentum sum
rule follow Griffiths, *Introduction to Elementary Particles*,
Chapter 9.
