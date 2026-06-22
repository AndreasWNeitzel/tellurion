# Quantum wavepacket revivals

Put a quantum particle in a box, hand it a compact wavepacket, and release it. For a short while it does what you would expect: the lump of probability slides across the well, reflects off a wall, and slides back, tracing out the classical motion. Then it falls apart. The packet spreads, develops ripples, and within a couple of bounces looks like featureless quantum hash filling the box. If you stopped watching there you would conclude the structure was gone for good. It is not. The mess is perfectly deterministic, and at special later instants it undoes itself.

The reason is the spectrum. An infinite well has energies $E_n = n^2 E_1$, exact squares of integers, and the state is a sum of stationary pieces each carrying a phase $e^{-iE_n t/\hbar}$. Phases that are integer multiples of one base frequency all come back into step at once, and because the $n^2$ are integers that happens at the revival time $T_\mathrm{rev} = 2\pi\hbar/E_1$, when the original packet reappears almost perfectly. Halfway there, the phases conspire to rebuild the packet as a single mirror-image copy; at a third and a quarter of the period they assemble two, three, or more shrunken replicas spread across the well. These are the fractional revivals, and they are the fingerprints of the quadratic spectrum.

No single snapshot shows any of this, which is why the middle panel stacks them all into one image: position runs across, time runs downward over a full revival period, and the brightness is the probability density. The result is the quantum carpet, laced with diagonal canals where the density stays low and bright knots at the revival points. The strip at the very top is the live density at the current instant, a single horizontal slice of the carpet, and the yellow line marks where it is being read. The lower panel measures the revivals directly through the survival probability, the overlap of the present state with its starting shape: it spikes to one at the full revival and to smaller peaks at the marked fractions, exactly the moments where the carpet brightens into focus.

## Reference

Griffiths, *Introduction to Quantum Mechanics*, 3rd ed., Cambridge, 2018, Ch. 2; Robinett, *Quantum wave packet revivals*, Phys. Rep. **392**, 1 (2004).

## Verification

- Strong invariants: the survival probability is exactly 1 at $t=0$ and returns to 1 at the full revival $T_\mathrm{rev}$ (to 1e-3); it dips well below 1 between revivals; the total probability is conserved as the packet evolves; the well eigenstates are orthonormal with energies $E_n = n^2$.
- Visual gate: SSIM against committed golden frames at both folds.
