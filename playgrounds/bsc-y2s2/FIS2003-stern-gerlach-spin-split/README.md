# The Stern-Gerlach experiment

Send a beam of atoms through a magnet whose field is stronger on one side than the other, and the field grabs each atom by its magnetic moment and tugs it sideways by an amount set by how the moment is tilted. A classical spinning charge could point any way at all, so the beam should fan out into a continuous smear, a vertical streak on the far screen. In 1922 Stern and Gerlach saw something else: the beam split cleanly into two, two sharp spots with a gap between them and nothing in the middle. The tilt of the moment is quantised. The top panel fires atoms one at a time from the oven, sends them through the inhomogeneous magnet (the red N wedge and blue S block), and watches the discrete spots build up dot by dot inside the faint blue band where the classical smear would have landed.

A spin-1/2 atom has only two allowed orientations, $m_s = \pm\tfrac{1}{2}$, hence two deflections and two spots. More generally a spin-$s$ beam fractures into exactly $2s+1$ spots, which is precisely how the experiment weighs the spin: you count the spots. The bottom panel reads the screen as an intensity profile, the quantum peaks standing sharp where a flat classical density (the dashed band) would have spread evenly. The spots sit inside the classical band, not at its edges, because the full moment $\mu \propto \sqrt{s(s+1)}$ reaches a little past the largest $m_s$.

Switch the spin to watch the spot count step through two, three, four, and slide the field gradient to push the spots farther apart, the deflection growing in proportion. Reset clears the screen and starts the beam over.

## Reference

Griffiths, *Introduction to Quantum Mechanics*, 2nd ed., Sec. 4.4.1 (spin and the Stern-Gerlach experiment); Gerlach and Stern 1922, Z. Phys. 9, 349.

## Verification

- Strong invariants: the beam splits into exactly $2s+1$ discrete spots; the spots are symmetric about the axis with zero mean deflection; the quantum spots lie inside the wider classical band ($d\sqrt{s(s+1)}/s > d$).
- Visual gate: SSIM against committed golden frames at both folds.
