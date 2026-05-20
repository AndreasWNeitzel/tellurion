# Brewster Angle and Fresnel Reflection (Hero)

A light ray hits an interface between two media of refractive indices
$n_1$ and $n_2$. The reflected and refracted amplitudes are governed
by the Fresnel coefficients, with two famous geometries: at the
Brewster angle $\theta_B = \arctan(n_2/n_1)$ the p-polarized
reflectance vanishes; for $n_1 > n_2$ above the critical angle
$\theta_c = \arcsin(n_2/n_1)$, total internal reflection takes hold.

## What to look for

A 2D scene with the interface as a horizontal line, $n_1$ above and
$n_2$ below tinted differently. The yellow incident ray comes in from
the lower-left; the white reflected ray bounces up-right with
thickness $\propto \sqrt{R_{\rm unpol}}$; the cyan refracted ray goes
down-right at angle $\theta_t$ from Snell's law, thickness
$\propto \sqrt{T}$. Annotations report $R_s$, $R_p$, $R$, $T$,
$\theta_t$. The right panel plots $R_s(\theta_i)$ (red) and
$R_p(\theta_i)$ (cyan) with the Brewster $R_p$-dip and (when
applicable) the TIR cliff marked.

## Controls

- $\theta_i$ slider (0 to 89 deg).
- Medium 1 and Medium 2 dropdowns: air, water, crown glass, diamond.
- Animation-speed slider auto-sweeps $\theta_i$.

Try water-to-air (Brewster 36.9 deg + TIR cliff 48.6 deg); air-to-glass
(Brewster 56.3 deg, no TIR); diamond-to-air (tiny TIR critical angle
24.4 deg, source of diamond brilliance).

## Source

Brewster, *Phil. Trans. R. Soc.* 105 (1815) 125. Hecht, *Optics*, 5th
ed., Pearson 2017, Section 4.6. Born and Wolf, *Principles of Optics*,
7th ed., CUP 1999, Chapter 1.
