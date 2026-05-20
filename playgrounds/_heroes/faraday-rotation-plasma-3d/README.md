# Faraday Rotation in Magnetized Plasma (Hero)

A linearly polarized radio wave passing through a magnetized plasma
has its polarization angle rotated by $\chi(L) = RM \cdot \lambda^2$,
where the rotation measure $RM = 8.12 \times 10^5
\int n_e B_\parallel \, \mathrm{d}z$ (cgs-pc units) depends on the
integrated electron density and parallel magnetic field. Radio
astronomers use the $\lambda^2$ signature to map cosmic magnetic
fields, from the Galactic disk through Sgr A* to AGN jets.

## What to look for

Three panels. Left: a column of magnetized plasma with the polarization
vector (cyan) rotating along the propagation direction; the magnetic
field $\vec B$ is drawn as purple arrows. Middle: three radio bands
(L = 21 cm red, S = 13 cm yellow, C = 6 cm cyan-green) rotating side
by side at the same physical $RM$, showing the $\lambda^2$ spread.
Right: $\chi$ vs $\lambda^2$ line plot with markers at L, S, C, X
bands.

## Controls

Sliders set $B_\parallel$ (microgauss), $n_e$ (cm$^{-3}$), $L$
(parsec) and the observing wavelength (centimeters). Presets jump to
canonical astrophysical regimes:

- **Galactic pulsar**: $RM \approx 73$ rad/m$^2$, mild rotation.
- **Sgr A* foreground**: $RM \approx 5 \times 10^5$ rad/m$^2$, the
  polarization angle wraps many times.
- **AGN jet edge**: $RM \approx 10^4$ rad/m$^2$, edge-on view.

## Source

Beck, *Astron. Astrophys. Rev.* 24 (2015) 4 (review of cosmic
magnetic fields). Burn, *Mon. Not. R. Astron. Soc.* 133 (1966) 67
(Faraday depolarization theory). Manchester and Taylor, *Pulsars*,
W. H. Freeman 1977, Chapter 8 (pulsar-foreground RM).
