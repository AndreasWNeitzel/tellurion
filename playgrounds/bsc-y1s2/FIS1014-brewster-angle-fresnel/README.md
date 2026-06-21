# Brewster angle and the Fresnel reflectance

A plane wave incident on a planar dielectric interface from medium 1
(index n_1) onto medium 2 (index n_2). The reflectance splits into
s-polarization (perpendicular to the plane of incidence) and
p-polarization (in the plane). At Brewster's angle theta_B = atan(n_2/n_1)
the p-reflectance drops to zero: light at this angle is reflected purely
s-polarized. Polarizing sunglasses exploit this to block horizontal
surface glare.

Look for: with p-polarization selected, sweep the angle toward
theta_B = 56.3 degrees (the default air-to-glass interface). The reflected
ray in the scene fades to nothing and the lower R_p curve dips to zero,
while the reflected and refracted rays sit at a right angle. Past Brewster,
R_p grows again. Switch to s-polarization and the reflection never vanishes;
switch to glass-to-air and push past the critical angle for total internal
reflection.

Use the interface and polarization selectors and the angle slider. Pause
freezes the flowing photons and Reset returns to the Brewster angle.

## Reference

- Hecht, Optics 5e Ch. 4.

## Verification

- Strong invariant: theta_B formula; R_p at Brewster below 1e-6;
  normal-incidence Fresnel formula exact; TIR above critical angle.
- Live readout: R + T = 1 (energy conserved at the interface), checked
  each frame in the rail.
