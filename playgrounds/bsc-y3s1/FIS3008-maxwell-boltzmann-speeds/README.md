# The Maxwell-Boltzmann speed distribution

A gas at a single temperature is not a crowd of molecules all moving alike; it is a riot of speeds, some crawling, some tearing along, most somewhere in the middle. The spread is not arbitrary. Because each component of a molecule's velocity is an independent Gaussian set by the temperature, the speed, the length of that velocity vector, follows the Maxwell-Boltzmann distribution $f(v) \propto v^2 e^{-mv^2/2kT}$. The $v^2$ from the growing surface of faster-and-faster velocity shells pushes the curve up from zero, and the exponential Boltzmann factor pulls it back down, leaving a lopsided bell with a long high-speed tail. The scene is a box of molecules drawn from exactly this distribution, coloured from blue for the slow ones to red for the fast.

Three speeds pin the distribution down, always in the same order and the same ratio: the most probable speed at the peak, the slightly larger mean, and the larger still root-mean-square that sets the pressure and the average kinetic energy. The bottom panel samples speeds one after another and stacks them into a histogram that fills in the smooth $f(v)$ curve as the count grows, a Monte Carlo demonstration that the random velocities really do obey the law, with the three characteristic speeds marked as coloured lines clustered just past the peak.

Turn the temperature up and the whole distribution slides to higher speeds and flattens out, the molecules in the box turning redder, but its area stays at one because every molecule still has some speed. Make the molecules heavier and it shrinks back toward the slow end, since at the same temperature a heavier molecule carries the same kinetic energy at a lower speed, $v_p \propto 1/\sqrt{m}$.

## Reference

Reif, *Fundamentals of Statistical and Thermal Physics*, Sec. 7.9-7.10; Blundell and Blundell, *Concepts in Thermal Physics*, 2nd ed., Ch. 5.

## Verification

- Strong invariants: the distribution integrates to one; the three speeds obey $v_p < v_\text{avg} < v_\text{rms}$ with the fixed ratios $\sqrt 2 : \sqrt{8/\pi} : \sqrt 3$ and $v_p$ is the peak of $f$; the speed sampler reproduces the analytic mean and rms.
- Visual gate: SSIM against committed golden frames at both folds.
