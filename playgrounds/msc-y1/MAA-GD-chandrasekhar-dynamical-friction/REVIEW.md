# REVIEW - chandrasekhar-dynamical-friction (pre-computed; maintainer actions later)

## Verdict
RENDER-NEUTRAL TEXT FIX ONLY

## Defects (severity-ranked)
1. [high] spec.md is architect placeholder; fill with Chandrasekhar friction formula, impulse approximation, velocity-dependence (drag ~ v), encounter cross-section, invariants (energy loss monotonic, velocity decreases, orbital decay timescale).
2. [high] README.md is template boilerplate ("One short paragraph"); replace with three substantive paragraphs on dynamical friction (massive perturber slowed by stellar halo via gravity), what to observe (intruder decelerating, sinking inward, losing energy), controls (intruder mass, halo properties if adjustable).
3. [medium] index.html figcaption and description minimal.

## Text / approachability
spec and README are stubs. User sees animated decay but no physical explanation of what causes it (dynamical friction as cumulative impulses from halo).

## Source-material & equation fidelity
Friction acceleration appears to follow Chandrasekhar formula (proportional to halo density and intruder mass, velocity-dependent). Energy loss is monotonic. Reference: Binney and Tremaine Ch. 8.

## Golden-frame observations
Frames show intruder spiraling inward, slowing as it sinks, energy decreasing monotonically. Halo particles re-orient around the intruder's wake. No visual defects.

## Hero-candidate
NO. N-body dynamics pedagogy; tier: simple.

## Maintainer notes
Spec and README require complete rewrites. No physics code defects.
