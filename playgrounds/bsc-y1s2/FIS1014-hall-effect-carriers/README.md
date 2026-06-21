# The Hall effect and the sign of the carriers

Push a current down a conducting bar and put it in a magnetic field across the flow, and the moving charges feel the Lorentz force $q\mathbf{v}\times\mathbf{B}$, which shoves them sideways. They pile against one edge until the electric field of the accumulated charge is strong enough to cancel the magnetic push; from then on the carriers drift straight again, but the bar holds a transverse Hall voltage $V_H = IB/(nqt)$. The magnitude measures the carrier density $n$. The scene animates the deflection, draws the charge that builds at the edges (red positive, blue negative), wires a voltmeter across them, and points the Hall field arrow from the positive edge to the negative one.

The point of the measurement is the sign. Positive carriers drifting one way and negative carriers drifting the other are deflected to the very same edge, because flipping the charge also flips the velocity in $q\mathbf{v}\times\mathbf{B}$, so you cannot tell them apart by where they go. What differs is the charge they deposit there, so the polarity of the Hall voltage flips. Toggle between holes and electrons: the deflection stays put while the edge charges, the field arrow, and the voltmeter all reverse. This is how the Hall effect, in 1879 and ever since, reveals whether a conductor carries positive or negative charge. The bottom panel plots $V_H$ against $B$, a straight line through the origin whose slope $1/nq$ carries the carrier sign, with the operating point marked and the opposite carrier drawn dashed.

The B slider sets the field (sweep it through zero to flip everything), the current slider deflects harder and grows $V_H$, and the density slider shrinks $V_H$ as more carriers share the load. After any change, watch the brief transient: the carriers swing toward the edge, then straighten once the Hall field has grown to cancel the magnetic force.

## Reference

Ashcroft and Mermin, *Solid State Physics*, Ch. 1 (the Hall effect and the sign of the carriers); Griffiths, *Introduction to Electrodynamics*, 4th ed., Ex. 5.2.

## Verification

- Strong invariants: $V_H = IB/(nqt)$ is linear in $B$ and $I$ and inverse in $n$ and $t$; its sign tracks the carrier sign and field direction; in steady state the Hall field cancels the magnetic force, so $V_H$ equals the Hall field times the bar width.
- Visual gate: SSIM against committed golden frames at both folds.
