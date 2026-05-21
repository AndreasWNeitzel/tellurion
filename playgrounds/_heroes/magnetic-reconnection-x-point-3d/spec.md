---
title: Magnetic Reconnection at an X-point (Hero)
slug: magnetic-reconnection-x-point-3d
status: verified
audience: portfolio
created: 2026-05-20
primary_uc: FIS3005
supporting_ucs: [AST3014]
curriculum_year: hero
primary_citation: priest-forbes-reconnection
primary_chapter: 4
hero_candidate: true
hook: 'Push two anti-parallel magnetic fields together. The current sheet between them thins, the field lines break, and the stored energy comes out as a pair of high-speed jets. That is how solar flares work.'
one_paragraph: 'Two oppositely directed magnetic fields are advected toward each other at the inflow speed v_in. Frozen-in flux holds until the resistive timescale becomes shorter than the convection timescale across a thin diffusion layer of half-width delta. Inside the layer, field lines break and reconnect across the X-point; outside, the released magnetic tension ejects plasma along the sheet at the Alfven speed v_A. The Sweet-Parker scaling sets the half-width by delta = L / sqrt(S), the reconnection rate by M_A = v_in / v_A = S^(-1/2), and the Lundquist number S = v_A L / eta. Solar-corona conditions give S ~ 10^12 and M_A ~ 10^-6 (too slow for observed flares; Petschek added slow-mode shocks). The playground draws the hyperbolic field, the inflow streamlines, the orange current sheet, and tracer particles that fold into the sheet and shoot out along it. Reference: Priest and Forbes, Magnetic Reconnection, CUP 2000, Ch. 4.'
caption: 'Figure 1. Magnetic reconnection at an X-point in Sweet-Parker geometry. Anti-parallel magnetic field lines (cyan/orange) are advected inward, reconnect across the X-point, and the plasma is ejected as twin jets along the sheet. Current density peaks in the diffusion layer (yellow band). Method: kinematic flow + analytic field B = (B0 y, B0 x); Sweet-Parker scalings M_A = S^{-1/2}, delta = L / sqrt(S). Source: Priest and Forbes, Magnetic Reconnection, Ch. 4.'
tags: [plasma, magnetohydrodynamics, animation, three-d, live-readout]
difficulty: 4
tier: single
renderer: canvas2d
estimated_engagement_minutes: 5
share_state_keys: [log_eta, v_a]
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

# Magnetic reconnection at an X-point
Sweet-Parker geometry, M_A = S^(-1/2). Source: Priest and Forbes, Magnetic Reconnection, Ch. 4 (`priest-forbes-reconnection`); Kulsrud, Plasma Physics for Astrophysics, Ch. 14 (`kulsrud-plasma-astro`).

## Explainer

### What you are looking at

Two regions of plasma carrying oppositely directed magnetic field are
pushed toward each other. The frozen-in flux theorem normally
prevents field lines from breaking; in a thin diffusion layer where
the resistive timescale becomes short, that theorem is violated and
field lines reconnect across the X-point. The released magnetic
tension snaps the new field lines outward, ejecting plasma along the
current sheet as twin jets at the Alfven speed. This is the engine
of solar flares, coronal mass ejections and substorms in Earth's
magnetotail.

The playground shows the hyperbolic field $\vec B = B_0(y, x)$ around
the X-point (cyan above the sheet, orange below), the inward driving
streamlines (white), the diffusion region (yellow band along $y = 0$),
and tracer particles that get sucked into the sheet and ejected as
two outflow jets.

### The Sweet-Parker scaling

Conservation of mass through the current sheet gives $v_{\rm in} L =
v_{\rm out} \delta$, where $L$ is the sheet length and $\delta$ its
half-width. Pressure balance across the sheet plus magnetic-tension
release gives $v_{\rm out} = v_A$, the Alfven speed. The
steady-state diffusion equation in the layer relates the layer
thickness to the resistivity by

$$\delta \;=\; \sqrt{\frac{\eta L}{v_{\rm in}}}.$$

Eliminating $v_{\rm in}$ and $\delta$ between these three relations
yields the Sweet-Parker reconnection rate

$$M_A \;\equiv\; \frac{v_{\rm in}}{v_A} \;=\; \frac{1}{\sqrt{S}}, \qquad
  S \;\equiv\; \frac{v_A L}{\eta},$$

with the sheet half-width and outflow speed

$$\delta \;=\; \frac{L}{\sqrt{S}}, \qquad v_{\rm out} \;=\; v_A.$$

For the solar corona ($L \sim 10^4\,\mathrm{km}$, $v_A \sim
10^3\,\mathrm{km/s}$, Spitzer resistivity), $S \sim 10^{12}$ giving
$M_A \sim 10^{-6}$, far too slow for observed flares. Petschek
(1964) cured this by introducing slow-mode standing shocks at the
sheet edges so the diffusion region shrinks to a tiny patch and
$M_A$ depends only logarithmically on $S$.

### Symbols

- $\vec B$: magnetic field, anti-parallel above/below the sheet.
- $v_A = B / \sqrt{4 \pi \rho}$: Alfven speed (in CGS).
- $\eta$: magnetic diffusivity (resistivity / $4 \pi$ in CGS).
- $S = v_A L / \eta$: Lundquist number.
- $M_A = v_{\rm in} / v_A$: dimensionless reconnection rate.
- $\delta$: current-sheet half-width.
- $L$: current-sheet length.

### Things to try

- Sweep the resistivity $\eta$ over many decades and watch the sheet
  thin (smaller $\delta$) but reconnection slow down (smaller $M_A$).
- Compare the laboratory preset ($S \sim 10^3$) to the solar-corona
  preset ($S \sim 10^8$): outflows look the same but the rate falls
  by $\sqrt{10^5}$.
- Notice the tracer particles snap "around the corner" at the X-point:
  inflow gets converted to outflow in a single transit.

### Where this comes from

The Sweet-Parker derivation is in Priest and Forbes, *Magnetic
Reconnection*, CUP 2000, Section 4.2 (original papers: Sweet, IAU
Symp. 6 (1958) 123; Parker, *J. Geophys. Res.* 62 (1957) 509). The
faster Petschek mechanism is in Section 4.3 of the same book.
Astrophysical applications are in Kulsrud, *Plasma Physics for
Astrophysics*, Princeton 2005, Chapter 14.
