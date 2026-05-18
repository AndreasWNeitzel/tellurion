---
title: BTW Sandpile and Self-Organized Criticality
slug: abelian-sandpile-btw
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: FIS2014
supporting_ucs: [FIS2018, MAA-NM]
curriculum_year: bsc-y2s1
hook: 'Drop sand one grain at a time and the pile organizes itself onto a knife edge where a single grain can trigger an avalanche of any size.'
one_paragraph: 'The Bak-Tang-Wiesenfeld sandpile is the original model of self-organized criticality. Grains drop on a lattice; a site holding four or more topples, handing one grain to each neighbour and possibly toppling them in turn, while grains at the edge fall off. With no tuning at all, the pile drives itself to a critical state where avalanche sizes follow a power law P(s) ~ s^(-tau) with tau about 1.21 in 2D: scale-free, with no typical avalanche size. The playground runs the dynamics and builds the avalanche-size histogram live so the power law appears on its own. This is the prototype for earthquakes, forest fires, and neuronal cascades. Reference: Bak, Tang and Wiesenfeld 1987.'
tags: [thermodynamics, statistical-physics, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
---

# BTW sandpile and self-organized criticality

## Explainer

### What you are looking at

Add sand one grain at a time to a pile and most grains do nothing,
but occasionally one triggers an avalanche, and those avalanches come
in all sizes with no typical scale. The system tunes itself to the
critical point with no parameter adjustment. The playground is the
Bak-Tang-Wiesenfeld sandpile, the original model of
self-organized criticality.

### The toppling rule

Each cell of a grid holds an integer height. Drop a grain on a random
cell; whenever a cell reaches the threshold (4 on a square lattice)
it topples, sending one grain to each of its four neighbours:

$$z_i \ge 4 \;\Longrightarrow\;
  z_i \to z_i - 4,\quad
  z_{\text{nbr}} \to z_{\text{nbr}} + 1,$$

and grains that fall off the boundary leave the system. Toppling can
push neighbours over threshold, so one grain can set off a chain
reaction, an avalanche, before the pile is stable again. (The rule is
"abelian": the final stable configuration does not depend on the
order in which unstable cells are relaxed.)

### Self-organized criticality

Driven slowly and dissipating at the edges, the pile drives itself to
a stationary critical state with no tuning. The signature is that the
avalanche sizes $s$ follow a power law,

$$P(s) \sim s^{-\tau},$$

with no characteristic size: most events are tiny, but events of
every magnitude up to system-spanning occur, and the distribution is
scale-free (a straight line on log-log). This is fundamentally
different from a tuned phase transition: nothing sets the control
parameter, the dynamics finds the critical point itself. The same
idea is invoked for earthquakes (Gutenberg-Richter), neuronal
avalanches, and forest fires. The playground drops grains, animates
the avalanches, and accumulates the size distribution so you watch
the power law build up.

### Things to try

- Drop grains and watch most do nothing while rare ones trigger
  large cascades.
- Build up the avalanche-size histogram and see it straighten into a
  power law on log-log (scale-free).
- Note the pile self-tunes to criticality: you never set a
  parameter, it finds it.

### Where this comes from

The BTW sandpile, abelian toppling, and self-organized criticality
follow Bak, Tang and Wiesenfeld, Phys. Rev. Lett. 59, 381 (1987),
and Jensen, *Self-Organized Criticality*.

## Physical setup

32 x 32 lattice of integer heights. Drop a grain at a random site;
topple when height >= 4. Boundary sites lose grains to the outside.
After enough drops the system settles into a critical state where
avalanche-size distribution is a power law P(s) ~ s^(-tau), tau ~ 1.21
in 2D.

## Governing equations

  z(x, y) -= 4   if z(x, y) >= 4
  z(x +/- 1, y), z(x, y +/- 1) += 1   (within lattice)
  Cascade until stable.

## Controls

- speed: drops per render frame.
- Reset / Pause / Play.

## Expected qualitative features

1. Early: small isolated avalanches.
2. After many drops: system reaches critical density; large cascades
   occur intermittently.
3. Histogram develops a clear power-law tail.

## Invariants and acceptance thresholds

1. Heights bounded to [0, 3] at steady state.
2. Topple count non-negative.
3. Heavy-tailed: max avalanche > 10 after 10k drops.
4. Histogram populated.
5. L = 32 lattice exported.

All confirmed in `invariants.test.mjs`.

## Limiting cases for verification

- 1D BTW: tau = 1 exactly.
- Boundary loss: grains escape, preventing global infinity.

## Visual fallback

Canvas2D only. Lattice cells colored by height (0..3). Right panel:
log-log avalanche-size histogram with s^(-1.21) reference line.

## Citations

- Bak, Tang, Wiesenfeld 1987 PRL.
- Bak 1996, How Nature Works (`bak1996`).

## Stretch goals

- Manna model variant.
- Forest fire model.
- Detailed scaling exponents (alpha for area, t for duration).

## Risk register

- Power-law tail is statistical; need ~ 10^4+ drops to see it cleanly.
