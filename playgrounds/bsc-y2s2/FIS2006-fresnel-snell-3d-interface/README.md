# Fresnel and Snell at an Interface

This playground shows what happens when light meets the boundary
between two media. The yellow incident beam splits into a reflected
beam and a refracted beam; the refracted one bends by Snell's law,
and the Fresnel equations set how much energy goes each way. Each
beam is drawn with a width proportional to its power, so you watch the
energy literally shift between reflection and transmission. The inset
shows the polarization state (E out of the plane for s, in the plane
for p) and the side panel is the Fresnel reflectance against angle.

Two effects are worth chasing. At Brewster's angle, with p
polarization, the reflected beam switches off completely, the
principle behind polarizing sunglasses and laser windows. Going from
glass to air, tip past the critical angle and there is no refracted
beam at all: the light is totally internally reflected and only an
evanescent skin leaks across the boundary, the mechanism of optical
fibres. Throughout, the readout confirms R + T = 1.

The incidence slider sweeps the angle through Brewster and the
critical angle; the n1 and n2 sliders set the two refractive indices
(and hence those angles); the polarization selector chooses p, s or
unpolarized. Reset returns to the Brewster configuration and Pause
freezes the beams.

## Reference

Primary citation: Hecht, *Optics* (5th ed.), Sec. 4.6 (`hecht2017`).

## Verification

- Strong invariant: Snell satisfied within 0.01 deg; R_p is exactly
  zero at Brewster; R + T = 1 within 1e-4; total internal reflection
  gives R = 1 with a positive evanescent decay.
- Visual gate: SSIM > 0.92 against committed golden frames at seed
  0xC0FFEE.
- Last verified: see `.verified`.
