# Davisson-Germer electron diffraction

Electrons accelerated through voltage $V$ have de Broglie wavelength $\lambda = h c / pc$ and scatter off the (111) Ni surface at angles satisfying $D \sin\theta = n\lambda$ for row spacing $D = 0.215$ nm. At the original 1927 voltage $V = 54$ V the first-order peak appears at $\theta \approx 51^\circ$, the iconic confirmation of de Broglie's hypothesis.

Look for the two-panel display. The left panel is a geometry sketch: vertical incident beam, horizontal crystal surface with atomic-row dots, accent-colored arrow at the first-order peak direction. The right panel is the N-slit grating intensity $I(\theta) = (\sin N\phi / \sin\phi)^2$ with $\phi = \pi D \sin\theta / \lambda$, with dashed vertical lines marking each principal order. Raising $V$ pulls the peaks inward; raising $N$ sharpens them.

Sliders control $V$ in volts and $N$ in atomic rows. Both update the geometry and intensity plots in real time.

## Reference

Primary citation: Eisberg and Resnick, *Quantum Physics of Atoms, Molecules, Solids, Nuclei, and Particles*, 2e, Ch. 3 (`eisberg-resnick`).

## Verification

- Strong invariants: canonical $V = 54$ V $\to$ $\lambda = 0.167$ nm and $\theta_1 \approx 51^\circ$.
- N-slit principal max $= N^2$ exact.
- Visual gate: SSIM > 0.92 against committed golden frames at seed 0xC0FFEE.
- Last verified: see `.verified`.
