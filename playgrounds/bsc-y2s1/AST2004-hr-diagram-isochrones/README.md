# The HR diagram: real stars and a stellar evolution track

## What it shows

The Kiel diagram (effective temperature Teff against surface gravity log g, both axes reversed by convention) plots about 3000 real Gaia DR3 stars together with a real 1 Msun MESA stellar-evolution track. Nothing is fabricated or transformed: both Teff and log g are carried natively by the observations and the model, so the track threads straight through the observed stars. A marker walks the track by stellar age, tracing the whole life cycle of a Sun-like star from the zero-age main sequence, through the subgiant and red giant branches, helium burning and the asymptotic giant branch, and off the diagram to the white dwarf.

## What to look for

Pause and drag the age slider. The marker creeps along the main sequence for the first nine billion years, then accelerates up the giant branch in a few hundred million years. The bottom panel makes this quantitative: the model evolutionary speed (path length in the Kiel plane per Gyr, on a log scale) sits low and flat across the main sequence and then spikes by orders of magnitude through the post-main-sequence and white-dwarf transitions. That is the reason the main sequence is the most populated region of any unbiased stellar census: stars are seen most often where they live longest. This particular Gaia sample is a spectroscopic one that over-represents bright giants, so its red giant branch and red clump are especially well drawn; switch the colour to metallicity to see the chemical spread across the diagram, or switch the plane to the observational colour-magnitude diagram to see the same stars in raw Gaia measurements.

## Controls

The age slider scrubs the marker along the track; Play animates the full 12.4 Gyr evolution and Restart returns to the zero-age main sequence. Switch plane toggles between the Kiel diagram (with the model track) and the observational colour-magnitude diagram (stars only, since the model carries no synthetic Gaia photometry). Colour stars toggles between metallicity [M/H] and plain population density.

## Reference

Gaia Collaboration 2023, Gaia Data Release 3, A&A 674, A1; Paxton et al. 2011, MESA, ApJS 192, 3; Hansen, Kawaler and Trimble, *Stellar Interiors*, 2nd ed., Ch. 2.

## Verification

- Strong invariants: the main-sequence turn-off age (about 9 Gyr) and its near-solar Teff; the main sequence is the longest-lived phase (more than half the tracked life); post-main-sequence evolution is many times faster than the main sequence. All Gaia and MESA values are real, with absent measurements dropped rather than imputed.
- Visual gate: SSIM against committed golden frames at both folds.
