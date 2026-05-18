# QED Feynman Diagram: e+e- to mu+mu-

This is the canonical worked example of quantum electrodynamics: an electron and a positron annihilate into a virtual photon that converts into a muon pair. At leading order one diagram contributes, with two vertices. Panel A draws that diagram (and a one-loop variant that adds a vacuum-polarisation bubble); since every QED vertex carries a coupling e, an amplitude with V vertices scales as alpha^{V/2} and the cross section as alpha^V. Panel B is the total cross section sigma(sqrt s) in nanobarns on log-log axes; Panel C shows the Mandelstam invariants and the angular distribution dsigma/dOmega.

What to look for: the cross section is exactly zero below sqrt s = 2 m_mu (you cannot make a muon pair you do not have the energy for), turns on sharply at threshold, peaks, then falls as a straight line on the log-log plot, the 1/s behaviour of a point cross section. Near threshold the muons are slow and the angular distribution is almost isotropic; well above it the distribution approaches the famous 1 + cos^2(theta) shape, always symmetric about 90 degrees. The identity s + t + u = 2 m_e^2 + 2 m_mu^2 holds to machine precision for every energy and angle, and switching to one loop shows the alpha^2 ~ 1/137^2 suppression of the next order.

Controls: the sqrt s slider sets the centre-of-mass energy and slides the operating point along the curve; the theta slider moves the marker on dsigma/dOmega and sets the t / u split (equal at 90 degrees); the order selector switches between the tree diagram (two vertices, alpha^2) and the one-loop diagram (four vertices, alpha^4). Reset restores defaults; Pause freezes the travelling-charge animation, which is decoration only, all physics is readable from a static frame.

## Reference

Primary citation: Peskin and Schroeder, An Introduction to Quantum Field Theory, Ch. 5 (Eqs. 5.12, 5.13); Halzen and Martin Ch. 6; Feynman 1949.

## Verification

- Strong invariant: s + t + u = 2 m_e^2 + 2 m_mu^2 (threshold 1e-9 GeV^2); sigma * s -> 4 pi alpha^2 / 3 to 1e-6.
- Visual gate: SSIM > 0.92 against committed golden frames.
- Last verified: see `.verified`.
