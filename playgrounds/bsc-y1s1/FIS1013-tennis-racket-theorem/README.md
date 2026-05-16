# Tennis racket theorem (Dzhanibekov effect)

A flat rigid body spins freely in space under Euler's equations. Spin
it about its longest or shortest principal axis and it rotates
steadily. Spin it about the intermediate axis and the smallest wobble
grows until the body suddenly flips end-over-end, then flips back, over
and over, even though no torque acts and the kinetic energy and angular
momentum are conserved to machine precision.

Watch the spin-axis selector. Major and minor keep the slab turning
quietly. Intermediate makes it tumble: the decaying corner trace and
the colored faces swapping sides show each flip. Lowering the
perturbation lengthens the quiet interval between flips but never
removes them, the instability is linear, not a numerical artifact.

Controls: the spin-axis menu picks which principal axis carries the
initial rotation; spin rate and perturbation set the initial state;
Pause/Play and Reset. The omega and dE/E readouts stay flat through
every flip. Reference: Goldstein, Poole, Safko, Classical Mechanics 3e
Sec. 5.6 (`goldstein-mech`).

## Verification

- Strong invariants: energy and |L| conserved to 1e-3; major/minor
  spins stable; the intermediate-axis component flips sign; the
  quaternion stays normalized (5 tests).
- Visual gate: SSIM > 0.92 against committed golden frames at seed
  0xC0FFEE (the flip sequence captured across the five frames).
- Last verified: see `.verified`.
