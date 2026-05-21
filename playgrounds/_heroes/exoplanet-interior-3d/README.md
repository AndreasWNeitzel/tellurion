# Exoplanet Interior

A layered terrestrial planet shown as a rotating 3D cutaway. The planet is built from up to four shells, each at its characteristic density: an iron core, a silicate mantle, an optional water/ice layer, and an optional hydrogen/helium envelope. Mass conservation fixes the interface radii, and a constant-density hydrostatic balance gives a closed-form central pressure. Two side panels track the planet's position on the mass-radius diagram and its pressure profile from centre to surface.

Look at how composition reshapes the planet. Pure iron sits on the densest mass-radius branch; adding a silicate mantle, then water, then a hydrogen/helium envelope moves the planet to progressively larger radius at fixed mass, reproducing the standard mass-radius families. Switching composition jumps the central pressure by an order of magnitude, visible both in the readout and in the slope of the pressure profile. The cutaway rotates so the relative shell thicknesses stay legible.

Controls: `Mearth` sets the total planet mass in Earth masses. `fIron`, `fSil`, `fWater`, and `fGas` set the mass fraction of each layer; they are renormalised so the four sum to one. Reference: Seager et al., ApJ 669 (2007) 1279; Zapolsky and Salpeter, ApJ 158 (1969) 809.
