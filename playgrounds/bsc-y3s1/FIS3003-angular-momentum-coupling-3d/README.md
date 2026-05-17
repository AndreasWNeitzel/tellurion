# Adding Angular Momenta - The Vector Model

Two angular momenta do not simply add as numbers. A total J of
magnitude sqrt(J(J+1)) can only take the values |j1-j2| up to j1+j2,
the triangle rule, and for each one the two momenta sit on cones,
precessing about the resultant so their vector sum stays fixed. The
left panel animates that vector model; the right panel is the
Clebsch-Gordan table, the actual unitary matrix that rotates between
the uncoupled |j1 m1>|j2 m2> states and the coupled |J M> states.

Step through the allowed-J ladder and watch the cones reorient: the
stretched state J = j1 + j2 leans J1 and J2 together, while the
minimum J = |j1 - j2| sets them against each other. Change j1 or j2
and the ladder and the whole coefficient table rebuild. The table is
coloured by the magnitude of each coefficient; the squares in any
column sum to one, the statement that the transformation is unitary,
and the stretched corner is exactly 1.

The j1 and j2 sliders set the two magnitudes in half-integer steps;
the total-J selector chooses which coupled multiplet to display.
Reset returns to j1 = 3/2, j2 = 1 and Pause freezes the precession.
The readout gives |J| and the cone angles.

## Reference

Primary citation: Sakurai and Napolitano, *Modern Quantum Mechanics*
(2nd ed.), Sec. 3.8 (`sakurai-qm`).

## Verification

- Strong invariant: the Clebsch-Gordan matrix is unitary (rows and
  columns orthonormal to 1e-9) and reproduces the standard
  Condon-Shortley tables; the triangle rule and M = m1+m2 selection
  hold.
- Visual gate: SSIM > 0.92 against committed golden frames at seed
  0xC0FFEE.
- Last verified: see `.verified`.
