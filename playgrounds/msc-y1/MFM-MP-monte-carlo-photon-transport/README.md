# Monte Carlo Photon Transport in a Tissue Slab

This is how every radiotherapy and imaging dose calculation actually works: you do not solve a transport equation, you throw millions of photons at the problem and let chance decide. Each photon here travels a random distance drawn from the exponential attenuation law, then rolls dice against the photoelectric, Compton and Rayleigh cross sections to decide what happens next. Compton scattering follows the Klein-Nishina formula; the electrons it frees carry the energy a short way forward, which is the physical origin of the dose build-up that every megavoltage beam shows.

What to look for: at low photon energy the interaction dots are mostly red, photoelectric absorption stops the beam near the surface and almost nothing gets through. Raise the energy and the dots turn cyan, Compton scattering takes over, the photons penetrate, and the depth dose develops a clear build-up region before its exponential tail. The energy-balance line makes the trade-off explicit, a 25 keV beam dumps 91 percent of its energy in the slab while a 1 MeV beam lets half of it straight through, and a thinner slab transmits even more.

Controls: the energy slider sweeps the cross sections and the dominant interaction; the thickness slider changes how much of the beam is stopped; the histories slider trades Monte Carlo noise for speed. Reset restores a 1 MeV, 15 cm, 8000-history run; Pause freezes the streaming-in of the tracks, which is animation only.

## Reference

Primary citation: Klein and Nishina, Z. Phys. 52, 853 (1929); Attix, Introduction to Radiological Physics and Radiation Dosimetry (1986).

## Verification

- Strong invariant: the sampled first-flight free path equals 1/mu within 2 percent; energy is conserved exactly (deposited + escaped = input).
- Visual gate: SSIM > 0.92 against committed golden frames.
- Last verified: see `.verified`.
