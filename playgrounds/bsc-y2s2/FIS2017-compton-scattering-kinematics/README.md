# Compton scattering kinematics

A photon of incident wavelength $\lambda$ scatters off a free electron at angle $\theta$ and emerges with $\lambda' = \lambda + (h/m_e c)(1 - \cos\theta)$. The Compton wavelength $h/m_e c \approx 2.426$ pm sets the universal scale; the shift is zero at forward scatter, equal to $\lambda_C$ at right angle, and reaches its maximum $2\lambda_C$ at backscatter. The recoiling electron carries the missing energy $T = hc(1/\lambda - 1/\lambda')$ and flies off at angle $\phi$ with $\cot\phi = (1 + \alpha) \tan(\theta/2)$.

Look for the geometry on the left: the scattered-photon arrow sweeps around the electron as $\theta$ changes; the recoil-electron arrow sweeps the opposite hemisphere with $\phi \to 0$ in the backscatter limit. The right-hand $\Delta\lambda$ curve is a flipped cosine bounded by $2\lambda_C$, regardless of $\lambda$. Picking a small $\lambda$ (hard X-ray) makes the fractional shift large; picking a large $\lambda$ (visible) makes the shift visually invisible even though the closed-form value is exact.

Sliders set the incident wavelength $\lambda$ in pm and the scattering angle $\theta$ in degrees. The Sweep button animates $\theta$ through a full 0 to 180 sweep over 8 s. Reset returns to the canonical $\lambda = 2.5$ pm, $\theta = 60$ deg. Keyboard focus follows the standard tab order.

## Reference

Primary citation: Eisberg and Resnick, *Quantum Physics of Atoms, Molecules, Solids, Nuclei, and Particles*, 2e, Ch. 2 (`eisberg-resnick`).

## Verification

- Strong invariant: $\Delta\lambda = \lambda_C (1 - \cos\theta)$ exact; backscatter shift $= 2\lambda_C$ within $10^{-15}$ pm.
- Energy conservation $h\nu = h\nu' + T$ within $10^{-12}$ relative.
- Visual gate: SSIM > 0.92 against committed golden frames at seed 0xC0FFEE.
- Last verified: see `.verified`.
