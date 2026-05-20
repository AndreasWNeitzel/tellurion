# Black Hole Legend

A *Legend* is a hero of heroes: one object, full laboratory. This
playground covers Schwarzschild and Kerr black holes through five
modes, all sharing the same physical parameters.

## Five modes

- **Overview** (default): event horizon, photon sphere, ISCO, and a
  Doppler-beamed accretion disk rendered together.
- **Photons**: shoot test rays at controllable impact parameter $b$;
  watch escape (cyan), photon-sphere orbit (yellow at $b \approx
  b_c = 3\sqrt{3}/2\, R_s$), and capture (red).
- **Lensing**: a background source behind the BH; Einstein-ring
  formation at $\beta = 0$; two crescent images at small offsets;
  Refsdal 1964 lens equation and magnification readout.
- **Frame drag (Kerr)**: spin $\chi = a/M$ slider; ergosphere bulge;
  ISCO retreat from $3 R_s$ at $\chi = 0$ to $R_s/2$ at $\chi \to 1$.
- **Spacetime (Flamm)**: embedding diagram of the spatial slice.

## Toggles

Every overlay is independently toggleable: event horizon, photon
sphere, ISCO, ergosphere, coordinate grid, geodesic traces.

## Controls

- $\log_{10} M_{\rm BH}$ in $M_\odot$ (1 to $10^{10}$).
- $\chi = a/M$ from 0 (Schwarzschild) to 0.99 (near-extremal Kerr).
- Inclination from 0 (face-on) to 85 deg (near edge-on).
- $b / R_s$ for photons mode.
- $\beta / \theta_E$ for lensing mode (drag source past zero to
  collapse two images into the Einstein ring).

## Source

Misner, Thorne, Wheeler, *Gravitation*, W. H. Freeman 1973, Ch. 25.
Bardeen, Press, Teukolsky, *Astrophys. J.* 178 (1972) 347.
Luminet, *Astron. Astrophys.* 75 (1979) 228 (first BH "photograph").
Refsdal, *Mon. Not. R. Astron. Soc.* 128 (1964) 295.
