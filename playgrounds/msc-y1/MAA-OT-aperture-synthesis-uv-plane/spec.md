---
title: "Aperture Synthesis on the UV Plane"
slug: aperture-synthesis-uv-plane
status: implemented
audience: portfolio
created: 2026-05-15
primary_uc: MAA-OT
supporting_ucs: []
curriculum_year: msc-y1
hook: 'STATUS: needs_hook'
one_paragraph: 'STATUS: needs_paragraph'
tags: [optics, radio-astronomy, interactive-drag, animation, live-readout]
difficulty: 4
tier: large
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 6
share_state_keys: []
---

# Aperture Synthesis on the UV Plane

Five radio telescopes plotted on a procedural world map (continent outlines, no image texture): ALMA, VLA, Effelsberg, Metsahovi, JCMT. The sky-preview panel shows a three-source model (one bright dot + two fainter). As simulated time runs (one day per 10 s), each telescope pair traces an elliptical arc in the UV plane; the dirty image panel updates via 2D inverse FFT every 10 frames as UV coverage fills in. The user can drag telescope markers and the source position; baselines and UV arcs recompute instantly.

## Physical setup

For each baseline $(i, j)$, the projected UV coordinates as a function of hour angle $H$ and source declination $\delta$ are
$$u = (X_i - X_j) \sin H + (Y_i - Y_j) \cos H$$
$$v = -(X_i - X_j) \sin\delta \cos H + (Y_i - Y_j) \sin\delta \sin H + (Z_i - Z_j) \cos\delta$$
normalized to the observing wavelength ($\lambda = 3$ mm, 86 GHz). The dirty image is IFFT2 of the sampled visibility function.

## Controls

- Drag any telescope marker on the world map
- Drag any of the three sources in the sky-preview
- Toggle point source vs uniform circular disk (adjustable angular diameter)
- Play/pause time, time-speed slider

## Invariants

- Theoretical resolution at 1000 km baseline + 3 mm wavelength: $\theta = 0.62\ \mu$as; readout must match within 1%.
- A north-south baseline traces a UV arc more vertical than horizontal.
- After 24 simulated hours, number of UV samples equals $N_\mathrm{baselines} \times N_\mathrm{timesteps}$.
- Dirty-beam FWHM decreases monotonically as longest baseline increases.

## Status note

Scaffolded with full physics specification; engine and 2D FFT not yet implemented. Marked needs-attention to track the implementation gap.

## Citations

Thompson, Moran & Swenson, "Interferometry and Synthesis in Radio Astronomy" chs. 3-4 (`tms2017`).
