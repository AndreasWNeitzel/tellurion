# Airy disks and the Rayleigh limit

When does a telescope split a double star into two? Each star images to an Airy pattern, $I(\alpha)/I_0=[2J_1(x)/x]^2$, whose first dark ring sits at the Rayleigh angle $\theta_R=1.22\lambda/D$. The top panel is the combined image of the pair (intensity stretched to show the faint rings); the bottom panel is the brightness along the line joining them, with the central dip and the Rayleigh threshold marked.

The aperture grows automatically, like building a bigger telescope. As $D$ increases, $\theta_R$ shrinks, the normalised separation $s=\Delta\theta/\theta_R$ rises past 1, and the single blob splits into two stars; the header reads off a resolved / at-limit / unresolved verdict and the depth of the central dip. At exactly the Rayleigh separation the saddle is about 73.5 percent of the peak, the classic 26.5 percent dip.

Controls: the binary separation $\Delta\theta$ in arcseconds, the aperture $D$ (which drives the sweep and pauses it on input), and the wavelength $\lambda$ (blue resolves finer than red). Reset returns to a 0.10-arcsec binary at 550 nm. Source: Hecht, *Optics* (2017), Sec. 10.2.5 (`hecht`).
