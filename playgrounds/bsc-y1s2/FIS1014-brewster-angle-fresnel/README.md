# Brewster angle and the Fresnel reflectance

A plane wave incident on a planar dielectric interface from medium 1
(index n_1) onto medium 2 (index n_2). The reflectance splits into
s-polarization (perpendicular to the plane of incidence) and
p-polarization (in the plane). At Brewster's angle theta_B = atan(n_2/n_1)
the p-reflectance drops to zero: light at this angle is reflected purely
s-polarized. Polarizing sunglasses exploit this to block horizontal
surface glare.

The scene renders the actual plane-wave field rather than rays: above the
interface the incident and reflected waves interfere, below it the refracted
wave travels at the Snell-bent angle with a wavelength shortened or lengthened
by the index ratio, and past the critical angle the transmitted wave becomes an
evanescent skin that decays with depth.

Look for: with p-polarization selected, sweep the angle toward
theta_B = 56.3 degrees (the default air-to-glass interface). The reflected wave
fades out, the interference pattern above the surface disappears leaving a clean
travelling wave, and the lower R_p curve dips to zero while the reflected and
refracted directions sit at a right angle. Switch to s-polarization and the
reflection (and its interference fringes) never vanish; switch to glass-to-air
and push past the critical angle to watch the refracted wavefronts give way to
the evanescent skin.

Use the interface and polarization selectors and the angle slider. Pause
freezes the wavefronts and Reset returns to the Brewster angle.

## Reference

- Hecht, Optics 5e Ch. 4.

## Verification

- Strong invariant: theta_B formula; R_p at Brewster below 1e-6;
  normal-incidence Fresnel formula exact; TIR above critical angle.
- Live readout: R + T = 1 (energy conserved at the interface), checked
  each frame in the rail.
