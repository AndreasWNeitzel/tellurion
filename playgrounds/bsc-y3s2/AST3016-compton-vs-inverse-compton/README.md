# Compton vs inverse Compton

Two channels of photon-electron scattering on the same energy axis: forward Compton (photon down-shifts off a stationary electron) and inverse Compton (a relativistic electron pumps a low-energy photon up by $4 \gamma^2$ in the Thomson limit). Inverse Compton is the workhorse of high-energy astrophysics: $\gamma = 10^4$ electrons up-scatter CMB photons into 100-keV X-rays in hot intracluster gas.

Look for the typical IC enhancement: a $\gamma = 10^4$ electron with an optical photon ($E \sim 1$ eV) gives a 400 MeV gamma-ray, comfortably in the gamma band. Increase $E$ further and Klein-Nishina suppression caps the up-shift; the regime label flips.

Two sliders for input photon energy and electron Lorentz factor.

## Reference

Primary citation: Rybicki and Lightman, *Radiative Processes in Astrophysics*, Ch. 7 (`rybickilightman1979`).

## Verification

- Strong invariants: Thomson IC max $= 4\gamma^2 E$ within $10^{-3}$; 511 keV backscatter gives $m_e c^2 / 3$ exact.
- Visual gate: SSIM > 0.92 against committed golden frames at seed 0xC0FFEE.
- Last verified: see `.verified`.
