# FODO Synchrotron: Betatron Tune, Emittance and Stop Bands

This is the linear theory of a circular accelerator. A FODO lattice alternates focusing and defocusing quadrupoles; each magnet and drift is a 2x2 symplectic transfer matrix, and the matrix for one full turn decides everything about the transverse motion. From its trace comes the betatron tune (the number of transverse oscillations per turn) through cos(mu) = trace(M)/2; from its shape come the Courant-Snyder parameters and the beam ellipse. Panel A shows the ring and the periodic beta function; Panel B is the transverse phase space; Panel C is the stability diagram and the dipole rigidity.

What to look for: a tracked particle returns turn after turn to the same invariant ellipse, and the emittance readout does not change. That constancy is Liouville's theorem, the area of phase space is conserved by symplectic transport. Now lower the quad focal length below 2.5 m: the cell crosses into a stop band, the ring turns red, no periodic beta function exists and the betatron amplitude grows without bound. The tune curve in Panel C crosses integer and half-integer resonance lines where a tiny magnet error would be amplified without limit, the reason real machines are tuned carefully between resonances.

Controls: the focal-length slider sets the tune, the beta function and stability (drag it below 2.5 m to reach the stop band); the cell-count slider scales the ring tune, Q is the per-cell phase advance times the number of cells; the dipole-field slider sets the bending radius through B rho = p / (0.299792458 q), and rho scales as 1/B. Reset restores defaults; Pause freezes the circulating bunch and the turn-by-turn tracking.

## Reference

Primary citation: Courant and Snyder, Theory of the Alternating-Gradient Synchrotron, Ann. Phys. 3, 1 (1958); Wiedemann, Particle Accelerator Physics.

## Verification

- Strong invariant: single-particle emittance conserved over 500 turns (relative 1e-9); every transfer matrix symplectic, det = 1 (1e-12).
- Visual gate: SSIM > 0.92 against committed golden frames.
- Last verified: see `.verified`.
