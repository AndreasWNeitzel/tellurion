# REVIEW - orbits-in-axisymmetric-potential (pre-computed; maintainer actions later)

## Verdict
RENDER-NEUTRAL TEXT FIX ONLY

## Defects (severity-ranked)
1. [high] spec.md is architect placeholder; fill with axisymmetric potential (e.g., logarithmic or Hernquist), orbit equations (Lagrangian in cylindrical coords), initial conditions (E, L_z control shape), expected orbits (circular, eccentric, box orbits in 3D), invariants (energy and z-component angular momentum conserved).
2. [medium] README stub; explain potentials in galactic models, orbit families (circular for co-rotation, eccentric for radial oscillation, chaotic at separatrix), what to observe (orbit shapes, resonances, stability islands), controls (E, L_z, potential type if switchable).
3. [medium] index.html figcaption and description minimal.

## Text / approachability
spec and README stubs. User sees orbit trajectories but no explanation of what E and L_z represent or how they control orbit morphology.

## Source-material & equation fidelity
Orbit integration appears correct (equations of motion in axisymmetric potential, energy/L_z conservation). Poincare section or orbit families (circular, eccentric, box) are correctly drawn. Reference: Binney and Tremaine Ch. 3.

## Golden-frame observations
Frames show distinct orbit families: circular at low E, eccentric (rosette) at higher E, potentially chaotic near separatrix. Phase-space structure is preserved. No visual defects.

## Hero-candidate
NO. Galactic dynamics pedagogy; tier: simple.

## Maintainer notes
Spec, README, figcaption. No physics code defects.
