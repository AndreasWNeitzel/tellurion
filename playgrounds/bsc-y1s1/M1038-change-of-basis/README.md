# Change of basis

A vector is a thing in the world, an arrow, and it does not care how you describe it. Coordinates are the description, and they depend entirely on the basis you measure against. Pick two basis vectors $b_1$ and $b_2$ and the same arrow $v$ acquires new coordinates $(c_1, c_2)$, the amounts of each basis vector you stack to reach it: $v = c_1 b_1 + c_2 b_2$. Collect the basis vectors as the columns of $P = [\,b_1\ \ b_2\,]$ and this reads $Pc = v$, so the coordinates are $c = P^{-1}v$, while the familiar standard basis just returns $c = v$. The top panel draws both readings at once: the faint square grid of the standard basis and the slanted grid of yours, with $v$ resolved along the oblique axes into its two components.

Drag $b_1$ and $b_2$ to re-grid the plane and the coordinates of the unmoved vector change before your eyes, the determinant of $P$ measuring how much the basis cell is stretched and sheared. Drag the vector instead and both its standard and its basis coordinates update together, tied by $P^{-1}$. The bottom panel sweeps $v$ once around a circle and plots its coordinates in each basis: clean cosine and sine in the standard one, the same circle re-read as phase-shifted, rescaled sinusoids in yours, with the current direction marked. An orthonormal basis keeps the grid square and lengths intact, so its sinusoids only shift in phase; a skew basis distorts their amplitudes too.

Next basis cycles a skew basis, a rotated orthonormal one, a stretched one, and a sheared one. This relabelling, harmless as it looks, is the engine behind diagonalization: choose the eigenbasis and a tangled matrix $P^{-1}AP$ collapses to a diagonal one, the operator finally written in coordinates that suit it.

## Reference

Strang, *Introduction to Linear Algebra*, 5th ed., Sec. 7.2 (change of basis and the matrix in a new basis); Axler, *Linear Algebra Done Right*, Ch. 3.

## Verification

- Strong invariants: the coordinates reconstruct the vector, $c_1 b_1 + c_2 b_2 = v$; the standard basis returns the vector itself; a similarity transform $P^{-1} A P$ preserves trace and determinant and is diagonal in an eigenbasis.
- Visual gate: SSIM against committed golden frames at both folds.
