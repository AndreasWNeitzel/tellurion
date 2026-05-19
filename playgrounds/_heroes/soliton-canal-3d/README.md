# Soliton Canal (Hero)

What it shows: a Korteweg-de Vries soliton, a single hump of water that
travels without changing shape because nonlinear steepening cancels
dispersion. Taller solitons move faster, so a tall one launched behind
a short one overtakes it, passes straight through, and both emerge
unchanged. A real Fourier pseudo-spectral integrator runs the KdV
equation live; the 1D height field is lofted into a 3D reflective canal.

What to look for: the two-soliton overtaking collision (default), the
clean re-emergence of both humps, and the contrast preset where an
ordinary lump (not a soliton) just disperses into ripples. The live
panel shows the three conserved KdV quantities barely drifting.

Controls: preset selector; amplitude (height and therefore speed of the
next launched soliton); canal depth (the dispersion coefficient);
soliton count for the train; speed multiplier; pause/reset/collision.
Drag to orbit, scroll to zoom, click flat water to inject a soliton
(vertical drag sets amplitude), click an existing hump to probe it.
