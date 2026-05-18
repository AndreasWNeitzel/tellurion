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
