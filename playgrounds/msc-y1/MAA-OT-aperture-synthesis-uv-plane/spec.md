---
title: "Aperture Synthesis on the UV Plane"
slug: aperture-synthesis-uv-plane
status: verified
audience: portfolio
created: 2026-05-15
primary_uc: MAA-OT
primary_citation: lorimer-kramer
supporting_ucs: []
curriculum_year: msc-y1
hook: 'A radio interferometer images the sky one baseline at a time as Earth rotates.'
one_paragraph: 'Five real telescopes (ALMA, VLA, Effelsberg, Metsahovi, JCMT) trace UV-plane arcs as Earth rotates; the dirty image of a three-source sky model sharpens in real time via direct inverse Fourier transform. Drag a telescope to a new latitude, watch its arcs change, and see the resolution improve.'
tags: [optics, radio-astronomy, interactive-drag, animation, live-readout]
difficulty: 4
tier: large
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 6
share_state_keys: []
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
references:
  - "Lorimer, Kramer, Handbook of Pulsar Astronomy."
---

# Aperture Synthesis on the UV Plane

Five radio telescopes plotted on a procedural world map (continent outlines, no image texture): ALMA, VLA, Effelsberg, Metsahovi, JCMT. The sky-preview panel shows a three-source model (one bright dot + two fainter). As simulated time runs (one day per 10 s), each telescope pair traces an elliptical arc in the UV plane; the dirty image panel updates via 2D inverse FFT every 10 frames as UV coverage fills in. The user can drag telescope markers and the source position; baselines and UV arcs recompute instantly.

## Explainer

### What you are looking at

A single radio dish big enough to resolve a distant galaxy would have
to be kilometers across. Aperture synthesis fakes that giant dish: a
handful of small antennas, plus the Earth's rotation, sample pieces
of the would-be aperture and a computer reassembles the image. The
playground shows the array, the patches it samples, and the image
sharpening as the night goes on.

### What an interferometer measures

Each pair of antennas measures one complex number, the visibility,
which by the van Cittert-Zernike theorem is one Fourier component of
the sky brightness $I(l,m)$:

$$V(u,v) = \iint I(l,m)\,
  e^{-2\pi i (ul + vm)}\,dl\,dm.$$

The Fourier coordinate $(u,v)$ is the antenna separation (the
baseline) measured in wavelengths and projected onto the sky. A pair
of antennas samples exactly one point in this "UV plane"; more
antennas give more points.

### Earth-rotation synthesis

As the Earth turns, each baseline's projected $(u,v)$ sweeps out an
elliptical arc, so a fixed array fills in the UV plane over a night
for free. The image is recovered by an inverse transform of the
sampled visibilities:

$$I_\mathrm{dirty}(l,m)
  = \sum_{(u,v)\ \mathrm{sampled}} V(u,v)\,
  e^{+2\pi i(ul+vm)}.$$

Because only some $(u,v)$ points are measured, this "dirty image" is
the true sky convolved with the array's point-spread function (the
"dirty beam", the FT of the sampling pattern). Better UV coverage
means a cleaner beam and a sharper image: long baselines give
resolution, short baselines give large-scale sensitivity. The
playground runs simulated time, fills the UV tracks, and updates the
dirty image so you see resolution build up from a smear to the
three-source model.

### Things to try

- Let time run and watch the UV ellipses fill in and the dirty image
  resolve the three sources from a blur.
- Drag two telescopes far apart (a long baseline) and watch fine
  detail appear; bring them close for only coarse structure.
- Move a source and watch every baseline's visibility phase change
  (the Fourier shift theorem in action).

### Where this comes from

The van Cittert-Zernike theorem, the UV plane, and Earth-rotation
aperture synthesis follow Thompson, Moran and Swenson,
*Interferometry and Synthesis in Radio Astronomy*, Chapters 2 and 3.

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

Thompson, Moran & Swenson, "Interferometry and Synthesis in Radio Astronomy" chs. 3-4.
