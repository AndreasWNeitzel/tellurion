# Quantum occupation distributions

How particles fill the available energy states depends on what kind of particle they are, and the three rules are the heart of quantum statistics. Identical fermions obey the Pauli exclusion principle, so each state holds at most one and the mean occupation follows the Fermi-Dirac function $1/(e^{(E-\mu)/kT}+1)$, capped at one and equal to one half at the chemical potential $\mu$. Identical bosons have no such limit and the Bose-Einstein function $1/(e^{(E-\mu)/kT}-1)$ diverges as the energy approaches $\mu$ from above. Distinguishable classical particles follow Maxwell-Boltzmann, $e^{-(E-\mu)/kT}$. The scene plots all three against energy with $\mu$ marked, a band one $kT$ wide around it, and a draggable cursor that reads the three occupations at once.

Let the temperature sweep, or set it by hand. At low $kT$ the Fermi-Dirac curve sharpens into a step at $\mu$, the sharp boundary between filled and empty states that defines the Fermi sea; raise $kT$ and the step softens into a gradual slope. The Bose-Einstein curve climbs ever more steeply just above $\mu$, where occupation of the lowest accessible states runs away. Move the cursor to high energy and the three readouts converge: once states are sparsely filled the difference between the statistics disappears.

The lower panel shows the same curves on a logarithmic axis. The high-energy tails straighten into parallel lines of slope $-1/kT$, the shared classical exponential, and the shaded region marks where $E-\mu>2kT$ and the quantum corrections have fallen below a few percent. That collapse is why the Maxwell-Boltzmann distribution works so well for dilute gases despite ignoring quantum statistics entirely.

## Reference

Pathria and Beale, *Statistical Mechanics*, 3rd ed., Elsevier, 2011, Ch. 6; Reif, *Fundamentals of Statistical and Thermal Physics*, Ch. 9.

## Verification

- Strong invariants: the Fermi-Dirac occupation stays within [0,1] and equals 1/2 at $\mu$; it obeys particle-hole symmetry $n(\mu+d)+n(\mu-d)=1$ to 1e-9; the ordering $n_\mathrm{BE}>n_\mathrm{MB}>n_\mathrm{FD}$ holds for every $E>\mu$; the quantum departures from MB fall below 1e-3 for $E-\mu\gg kT$.
- Visual gate: SSIM against committed golden frames at both folds.
