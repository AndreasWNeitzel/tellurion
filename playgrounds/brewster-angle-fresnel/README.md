# Brewster angle and the Fresnel reflectance

A plane wave incident on a planar dielectric interface from medium 1
(index n_1) onto medium 2 (index n_2). The reflectance splits into
s-polarization (perpendicular to the plane of incidence) and
p-polarization (in the plane). At Brewster's angle theta_B = atan(n_2/n_1)
the p-reflectance drops to zero: light at this angle is reflected purely
s-polarized. Polarizing sunglasses exploit this to block horizontal
surface glare.

Look for: drag the angle slider toward theta_B = 56.3 degrees (for the
default air-to-glass interface). The orange p-beam in the ray sketch
shrinks to nothing, and the right-panel R_p curve dips to zero. Past
Brewster, R_p grows again. The cyan s-beam (and R_s curve) increases
monotonically with theta_i, reaching 1 at grazing.

Use theta_i and n2/n1 sliders. Speed runs an auto-sweep. Reset returns
to the Brewster angle.

## Reference

- Hecht, Optics 5e Ch. 4.

## Verification

- Strong invariant: theta_B formula; R_p at Brewster below 1e-6;
  normal-incidence Fresnel formula exact; TIR above critical angle.
- Visual gate: SSIM > 0.92 across 5 frames showing angle sweep.
- Last verified: see `.verified`.
