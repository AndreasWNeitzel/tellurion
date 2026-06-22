# Hydrogen radial wavefunctions

Solving the hydrogen atom is one of the triumphs of quantum mechanics: the electron in the Coulomb pull of the proton has its wavefunction split into an angular part, the familiar orbital shapes, and a radial part $R_{nl}(r)$ that says how the probability is spread out from the nucleus. That radial piece is an associated Laguerre polynomial times a decaying exponential, pinned by two integers, the principal number $n$ and the angular number $l$ below $n$. The quantity that tells you where the electron is likely to be found is the radial probability density $P(r) = r^2|R_{nl}|^2$, the chance of finding it in a thin shell at radius $r$; the $r^2$ from the growing shell area competes with the wavefunction to set the peaks, which is why the cloud can be densest at the nucleus while the most likely shell sits far out. It has exactly $n - l - 1$ nodes, spheres where the electron is never found, and its most probable radius marches outward roughly as $n^2$ Bohr radii.

The scene shows the orbital two ways. On the left, a disk of the radial wavefunction oscillating in time, where the nodal spheres appear as dark rings between shells of alternating sign, red and blue, swinging in step. On the right, the probability curve $P(r)$ with its nodes in red, its peak (the most probable radius) in green, and its mean radius in gold. Comparing the two makes the $r^2$ point concrete: the disk is brightest near the centre, yet $P(r)$ peaks well outside it.

The bottom panel is the energy ladder $E_n = -13.6\,\text{eV}/n^2$, the rungs crowding toward zero as the electron is less and less bound, with the ionization threshold at the top. Every state of a given $n$ sits on the same rung whatever its $l$, the special degeneracy of the pure Coulomb force. Step $n$ and the cloud swells; step $l$ down and a node appears; in both the level and the radii update to match.

## Reference

Griffiths, *Introduction to Quantum Mechanics*, 2nd ed., Sec. 4.2 (the hydrogen atom); Bransden and Joachain, *Physics of Atoms and Molecules*, 2nd ed., Ch. 3.

## Verification

- Strong invariants: the radial wavefunction has exactly $n-l-1$ nodes; $E_n = -13.6\,\text{eV}/n^2$ independent of $l$; the most probable radius (1 $a_0$ for 1s, 4 $a_0$ for 2p) and the mean radius $(3n^2 - l(l+1))/2$ match the known values, and $P(r)$ integrates to one.
- Visual gate: SSIM against committed golden frames at both folds.
