---
title: White-Dwarf Cooling Sequence
slug: white-dwarf-cooling-3d
status: verified
audience: portfolio
created: 2026-05-20
primary_uc: AST3014
supporting_ucs: [FIS3008]
curriculum_year: hero
primary_citation: fontaine-brassard-bergeron-2001
primary_chapter: 1
hero_candidate: true
hook: 'A white dwarf is a hot star that spends a few hundred million years cooling. The luminosity decays as L ~ t^(-7/5); the coldest WDs in the disk are about 9 Gyr old. Counting them tells us how long the disk has been around.'
one_paragraph: 'A white dwarf is the inert remnant of a low to intermediate-mass star (M < 8 M_sun) after the AGB phase. With no nuclear burning, it slowly radiates the residual thermal energy of its non-degenerate carbon-oxygen ion gas. Mestel (1952) showed that the luminosity decays as L(t) ~ M t^(-7/5) until the central ion temperature drops below the Debye temperature, at which point the C/O ions crystallize and latent heat slows the cooling further (Winget et al. 1987). The oldest white dwarfs in the Galactic disk are ~ 9 Gyr old, giving the disk age. The playground draws the WD cooling track on the HR diagram, the interior crystallization front growing inward over time, and a live readout of L, T_eff, t_cool and the crystal core fraction f_X. Reference: Fontaine, Brassard, Bergeron, PASP 113 (2001) 409.'
caption: 'Figure 1. White-dwarf cooling: HR-diagram track (blue curve from hot WD at top to cold WD at bottom), interior cross-section showing crystallization front, and live readout. Method: Mestel L ~ M t^(-7/5) cooling law, Eggleton (1983) mass-radius relation, empirical crystallization fraction f_X(t). Source: Fontaine, Brassard, Bergeron, PASP 113 (2001) 409.'
tags: [stellar, asteroseismology, animation, three-d, live-readout]
difficulty: 4
tier: single
renderer: canvas2d
estimated_engagement_minutes: 5
share_state_keys: [mass, age_gyr]
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

# White-dwarf cooling sequence
Mestel cooling + C/O crystallization. Source: Fontaine, Brassard, Bergeron, PASP 113 (2001) 409; Mestel, MNRAS 112 (1952) 583; Winget et al., ApJ 315 (1987) L77.

## Explainer

### What you are looking at

A white dwarf, drawn as a glowing sphere on the left of the canvas
with its photospheric colour set by the effective temperature, and a
companion cross-section on the right that shows the carbon-oxygen
interior with the growing solid crystal core (yellow). The top of
the canvas is a Hertzsprung-Russell diagram: a track of $\log L / L_\odot$
vs $T_{\rm eff}$ along which the WD slides as you sweep its age. A
small bump in the WD luminosity function near $\log L \sim -4$ marks
the crystallization transition: where the cooling speeds up briefly,
then slows down again as latent heat is released by the freezing C/O
plasma.

### The Mestel cooling law

A WD has no fusion. Its only energy reservoir is the thermal kinetic
energy of the non-degenerate ions ($U \sim N_{\rm ion} k T$). The
luminosity is the rate at which the ion gas loses heat by neutrino
emission and surface radiation; in the standard simple-model derivation
(Mestel 1952; see Kippenhahn-Weigert Ch. 35),

$$L(t) \;\propto\; M\, t^{-7/5}.$$

We pick a normalisation so that a $0.6\,M_\odot$ WD has
$L = 10^{-3} L_\odot$ at $t = 1$ Gyr (a typical observed value). The
effective temperature follows from Stefan-Boltzmann,

$$T_{\rm eff} \;=\; \left(\frac{L}{4\pi R^2 \sigma}\right)^{1/4},$$

with the WD radius given by the Eggleton (1983) fit to the
Chandrasekhar mass-radius relation:

$$R(M) \;\propto\; \sqrt{(M_{\rm Ch}/M)^{2/3} - (M/M_{\rm Ch})^{2/3}}.$$

This is the unusual feature of WDs: more massive ones are *smaller*,
not larger.

### Crystallization

When the central temperature drops below the Debye temperature of
the C/O ion plasma (a function of density), the ions arrange
themselves into a body-centred cubic lattice. The transition is
governed by the Coulomb coupling parameter

$$\Gamma \;=\; \frac{(Z e)^2}{a\, k T} \;\approx\; 175 \;\text{at freezing,}$$

where $a$ is the interion spacing. The crystallization front moves
outward from the centre as the star continues to cool. Latent heat
released at the freezing front slows the cooling (a "bump" in the
luminosity function). We model the crystal mass fraction with an
empirical sigmoid

$$f_X(t) \;=\; 1 - \exp\!\big[-((t - t_X)/\tau_X)^2\big]\quad
  \text{for } t > t_X,$$

with $t_X \sim 1.5\,(M_\odot/M)\,\text{Gyr}$ and
$\tau_X \sim 3\,(M_\odot/M)\,\text{Gyr}$ following Fontaine et al.
2001. More massive WDs crystallize earlier because their interiors
are denser.

### Symbols

- $M$: white-dwarf mass (in $M_\odot$).
- $R$: white-dwarf radius (in $R_\odot$).
- $L$: luminosity.
- $T_{\rm eff}$: photospheric effective temperature.
- $\sigma = 5.67 \times 10^{-5}\,\mathrm{erg\,cm^{-2}\,s^{-1}\,K^{-4}}$: Stefan-Boltzmann.
- $M_{\rm Ch} = 1.44\,M_\odot$: Chandrasekhar mass.
- $\Gamma$: Coulomb coupling parameter; $\Gamma \approx 175$ at freezing.
- $f_X$: crystallized mass fraction (0 to 1).
- $t_X$: onset time of crystallization.

### Things to try

- Set $M = 0.6\,M_\odot$ (the median WD mass), drag the age slider
  from $10^7$ yr (just-born hot WD) to $10^{10}$ yr (cold, dim WD
  approaching the Galactic-disk age cutoff at $\sim 9$ Gyr).
- Compare $M = 0.4\,M_\odot$ (He-core WD, late M-dwarf remnant) and
  $M = 1.2\,M_\odot$ (massive O-Ne WD): more massive WDs are
  *smaller*, cool *faster* in their hot phase but more slowly after
  crystallization onset.
- Note when $f_X$ crosses $0.5$ on the cross-section: the central
  half of the WD is solid carbon-oxygen, the outer half still liquid.

### Where this comes from

Original cooling law: Mestel, *Mon. Not. R. Astron. Soc.* 112 (1952)
583. The standard modern review and crystallization timescales are
in Fontaine, Brassard and Bergeron, *Publ. Astron. Soc. Pacific*
113 (2001) 409. The luminosity
function bump from crystallization was first identified by Winget et
al., *Astrophys. J.* 315 (1987) L77. The
mass-radius relation comes from Chandrasekhar's polytrope theory
fitted by Eggleton, *Astrophys. J.* 268 (1983) 368.
