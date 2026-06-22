# Landau levels

A magnetic field does something a static electric field never can: it bends a moving charge into a closed loop. A free electron drifting through a perpendicular field B curls into a cyclotron orbit, going around at the frequency $\omega_c = eB/m$, and the stronger the field the tighter and faster the loop. Classically the radius can be anything, set by how fast the electron happens to be moving. Quantum mechanically that freedom disappears. The circular motion is just a two-dimensional harmonic oscillator in disguise, and like any oscillator it has a quantized energy ladder: the Landau levels $E_n = (n+\tfrac12)\hbar\omega_c$. The rungs are evenly spaced, the gap between them is exactly one quantum of cyclotron energy, and that gap grows linearly with the field. The scene shows the orbit on the left, shrinking toward the magnetic length $\ell_B = \sqrt{\hbar/eB}$ as you turn up B, and the energy ladder on the right, with every level below the Fermi energy filled.

What makes Landau levels more than a textbook curiosity is the degeneracy. Each level is not one quantum state but a vast reservoir of them, and the number it can hold also rises in proportion to B. So increasing the field does two things at once: it pushes the rungs apart, and it widens each rung so it can swallow more electrons. The electrons that used to occupy the higher levels have to fall into lower ones as those lower levels gain capacity, and the top filled level keeps emptying as the field climbs.

The lower panel is the diagram that connects this to real measurements: the Landau fan. Plotting the level energies against the field gives a family of straight lines splaying out from the origin, each with a slope set by its quantum number. As the field increases, every line sweeps upward, and one after another they cross the fixed Fermi energy and depopulate. That regular crossing is periodic in $1/B$, and it shows up in experiments as oscillations in the magnetization (de Haas-van Alphen) and the resistance (Shubnikov-de Haas). Reading the period of those oscillations is how physicists measure the cross-sectional area of a metal's Fermi surface, one of the most direct windows onto the electronic structure of a solid.

## Reference

Ashcroft and Mermin, *Solid State Physics*, Holt-Saunders, 1976, Ch. 14; Kittel, *Introduction to Solid State Physics*, 8th ed., Ch. 9.

## Verification

- Strong invariants: the Landau levels are equally spaced by exactly $\hbar\omega_c$; the lowest level sits at $B/2$, the cyclotron zero-point; the degeneracy is proportional to $B$; the cyclotron orbit and magnetic length shrink as $1/\sqrt{B}$; the number of filled levels decreases monotonically as $B$ rises at fixed Fermi energy.
- Visual gate: SSIM against committed golden frames at both folds.
