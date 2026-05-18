# Stellar Structure: the Eddington Standard Model

This is a star built from the inside out. With a polytropic equation of state of index n = 3 (Eddington's standard model: gas plus radiation pressure in a constant ratio), the whole mechanical structure reduces to one dimensionless function, the solution of the Lane-Emden equation. Scaling it to a chosen mass and composition gives the run of density, pressure and temperature; the pp chain, CNO cycle and triple-alpha reactions give the luminosity; and the Schwarzschild criterion says where energy is carried by convection. Panel A is a temperature-coloured sliced star with its burning core, radiative and convective zones and photosphere; Panel B is the structure run; Panel C is the energy generation and the HR position.

What to look for: density and pressure fall far faster than temperature, and the luminosity is essentially complete within the inner third of the radius, the whole star shines on energy made in a small core. Drag the mass down toward 0.2 solar masses and the entire star turns convective and visibly bubbles, the classic result that low-mass stars are fully convective. Push the mass up and watch the CNO cycle overtake the pp chain in Panel C, the reason massive stars have hot, CNO-burning cores. The model point slides along the zero-age main sequence in the HR diagram, brighter and hotter with increasing mass.

Controls: the mass slider (logarithmic, 0.2 to 30 solar masses, with a main-sequence radius) sets the scaling, the central conditions and the convective structure; the hydrogen slider changes the mean molecular weight and the energy generation. Reset restores the solar model; Pause freezes the convective-cell animation, which appears only where the star is genuinely convective.

## Reference

Primary citation: Carroll and Ostlie, An Introduction to Modern Astrophysics, Ch. 10; Hansen and Kawaler, Stellar Interiors; Chandrasekhar 1939 (Lane-Emden).

## Verification

- Strong invariant: Lane-Emden n = 3 surface xi_1 = 6.89685 and theta'(xi_1) = -0.04243; solar L = L_sun within 5 percent; mass conserved to 1 percent.
- Visual gate: SSIM > 0.92 against committed golden frames.
- Last verified: see `.verified`.
