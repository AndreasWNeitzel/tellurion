---
title: Faraday Rotation in Magnetized Plasma
slug: faraday-rotation-plasma-3d
status: verified
audience: portfolio
created: 2026-05-20
primary_uc: AST3014
supporting_ucs: [FIS3005]
curriculum_year: hero
primary_citation: beck-2015-magnetic-fields
primary_chapter: 1
hero_candidate: true
hook: 'Linearly polarized radio waves get their plane rotated by angle chi = RM * lambda^2 as they pass through magnetized plasma. RM is set by the parallel magnetic field and electron density, and radio astronomers use it to map the Galactic magnetic field.'
one_paragraph: 'When a linearly polarized electromagnetic wave propagates along a magnetized plasma, the two circular components have slightly different refractive indices and accumulate a phase difference, equivalent to a rotation of the linear polarization by chi(z) = RM * lambda^2. The rotation measure RM = 8.12e5 rad/m^2 * integral [n_e (cm^-3) B_par (G) dz (pc)] depends on the line-of-sight integral of n_e * B_par. Faraday rotation lets radio astronomers map Galactic magnetic fields with pulsar surveys and extragalactic AGN-jet polarimetry; typical Galactic pulsar RMs are 10 to 100 rad/m^2 while the Sgr A* foreground reaches 5 * 10^5 rad/m^2. The playground draws the polarization vector spiralling down a column of magnetized plasma, shows multiple wavelengths spreading apart in rotation, and reports RM, chi(lambda) and the depolarization width. Reference: Beck, Astron. Astrophys. Rev. 24 (2015) 4.'
caption: 'Figure 1. Faraday rotation in magnetized plasma. A linearly polarized wave enters at top with phi = 0; the polarization vector rotates by chi = RM * lambda^2 over the path length L. Multi-wavelength view (red, green, blue) shows the lambda^2 dependence directly. Method: closed-form RM = 8.12e5 n_e B_par L. Source: Beck, Astron. Astrophys. Rev. 24 (2015) 4.'
tags: [plasma, electromagnetism, three-d, animation, live-readout]
difficulty: 4
tier: single
renderer: canvas2d
estimated_engagement_minutes: 5
share_state_keys: [b_par_uG, n_e, length_pc, wavelength_m]
invariants:
  - key: runs
    label: simulation advances each frame
    tolerance: 1
  - key: bounded
    label: state stays finite
    tolerance: 1
  - key: deterministic
    label: fixed seed reproduces the run
    tolerance: 1
what_to_try:
  - Vary each control and watch the rail readouts respond.
  - Compare the diagnostic plot against the live scene.
---

# Faraday rotation in magnetized plasma
chi = RM lambda^2. Source: Beck, *Astron. Astrophys. Rev.* 24 (2015) 4; Burn, *Mon. Not. R. Astron. Soc.* 133 (1966) 67.

## Explainer

### What you are looking at

A linearly polarized radio wave entering a column of magnetized
plasma from the top. Along the column, the electric-field vector
rotates around the propagation direction; the rotation rate per unit
length is set by the local electron density $n_e$ and the magnetic
field component along the line of sight $B_\parallel$. The total
rotation accumulated over the path length $L$ is

$$\chi(L) \;=\; RM \cdot \lambda^2.$$

Multiple wavelengths are shown side-by-side: longer wavelengths
rotate more (the famous $\lambda^2$ dependence that lets observers
solve for $RM$ by polarization-angle measurements at multiple
frequencies).

### The rotation measure

Setting up the cold-plasma dispersion relation and integrating along
the line of sight gives

$$RM \;=\; \frac{e^3}{2\pi\, m_e^2\, c^4}\,
   \int_0^L n_e(z)\, B_\parallel(z)\, \mathrm{d}z,$$

which evaluates in convenient units to

$$RM \;[\mathrm{rad/m^2}] \;=\;
   8.12 \times 10^5
   \int_0^L
   [n_e \,\mathrm{cm^{-3}}]\,
   [B_\parallel\,\mathrm{G}]\,
   [\mathrm{d}z\,\mathrm{pc}].$$

Typical canonical values:

- Galactic-disk pulsar foreground: $n_e \sim 0.03\,\mathrm{cm^{-3}}$,
  $B_\parallel \sim 3 \times 10^{-6}\,\mathrm{G}$, $L \sim 1\,\mathrm{kpc}$
  give $RM \approx 73\,\mathrm{rad/m^2}$.
- Sgr A* foreground: $RM \approx 5 \times 10^5\,\mathrm{rad/m^2}$.
- AGN jet edge: $RM \approx 10^4\,\mathrm{rad/m^2}$ in dense regions.

### Why the lambda squared?

The phase difference between the left- and right-circular components
of the wave is

$$\Delta\phi \;=\; \int (k_L - k_R)\,\mathrm{d}z
   \;\propto\; \int \frac{n_e B_\parallel}{\omega^2}\,\mathrm{d}z
   \;\propto\; \lambda^2.$$

The linear-polarization angle, which is half the phase difference
between the two circular components, picks up the same $\lambda^2$.
Polarimeters at multiple radio frequencies fit a $\chi = \chi_0 +
RM\,\lambda^2$ line to extract $RM$.

### Symbols

- $\vec E$: electric field vector (transverse to propagation).
- $\chi$: position angle of linear polarization (radians).
- $\lambda$: wavelength.
- $RM$: rotation measure (rad/m$^2$).
- $n_e$: free-electron number density (cm$^{-3}$).
- $B_\parallel$: magnetic-field component along the line of sight (G).
- $L$: path length through the plasma (pc).
- $m_e, e, c$: electron mass, charge, speed of light.

### Things to try

- Sweep the wavelength from L-band ($\lambda = 21\,\mathrm{cm}$) to
  X-band ($\lambda = 3\,\mathrm{cm}$) and watch the rotation angle
  shrink by $(21/3)^2 \approx 49$.
- Crank $B_\parallel$: rotation angle scales linearly.
- Add electron density ($n_e$): same linear scaling. Both contribute
  to $RM$ through their integrated product.
- Compare the Galactic-pulsar preset ($RM = 73$) to the Sgr A* preset
  ($RM = 5\times10^5$): the angle has to wrap many times for the
  latter.

### Where this comes from

Modern review: Beck, *Astron. Astrophys. Rev.* 24 (2015) 4. Foundational treatment of Faraday
depolarization: Burn, *Mon. Not. R. Astron. Soc.* 133 (1966) 67. Classic pulsar-foreground RM application: Manchester
and Taylor, *Pulsars*, W. H. Freeman 1977, Chapter 8.
