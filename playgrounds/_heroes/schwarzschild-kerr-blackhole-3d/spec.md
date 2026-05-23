---
title: Schwarzschild-Kerr Black Hole 3D
description: "A real per-pixel null-geodesic ray-march of a black hole. Every pixel traces a light ray bent by curved spacetime: you see the dark shadow, the thin photon ring, and the accretion disk gravitationally lensed into the Interstellar double arc with a Doppler-brightened side. Schwarzschild geometry with an approximate spin twist; sliders set spin and disk radii, drag to orbit, scroll to zoom."
caption: "Figure 1. Per-pixel null-geodesic ray-march of a Schwarzschild black hole: the shadow, the photon ring at b = 3 sqrt(3) M, and a Novikov-Thorne accretion disk gravitationally lensed into the double arc with relativistic Doppler beaming. The a/M slider adds a perturbative frame-drag twist. Method: backward geodesic integration of u(phi) with velocity-Verlet and null-condition renormalization. Source: Shapiro and Teukolsky, Black Holes, White Dwarfs and Neutron Stars, Ch. 12."
slug: schwarzschild-kerr-blackhole-3d
status: superseded
superseded_by: blackhole-legend-3d
audience: portfolio
created: 2026-05-14
primary_uc: M3007
supporting_ucs: [AST3017]
curriculum_year: hero
primary_citation: shapiro-teukolsky
primary_chapter: 12
hook: "Light has no mass, but gravity still bends its path. Near a black hole the bending is so strong that the far side of the glowing gas disk is lifted up over the top of the hole and wrapped underneath it. This is a real per-pixel light-ray trace, the effect that made the Interstellar black hole famous."
one_paragraph: "Every pixel fires one light ray backward from the camera, and the ray is bent by the curved spacetime of a black hole until it either falls past the horizon (black), strikes the hot accretion disk (coloured), or escapes to the stars. The geometry is Schwarzschild, a non-spinning hole; the a/M slider adds an approximate frame-drag twist for spin. You see the central shadow, the razor-thin photon ring where light can orbit the hole, and the disk lensed into the iconic double arc: its far side bent up and over the top and mirrored underneath. The disk colour is a real blackbody temperature that rises toward the inner edge (Novikov-Thorne, T falling like r^-3/4), shifted by gravitational redshift, and the side rotating toward you is Doppler-beamed brighter, exactly the asymmetry in the M87 and Interstellar images. The disk inner edge sits at the innermost stable circular orbit (6 M for no spin). Sliders set the spin a/M and the disk inner and outer radii; drag to orbit, scroll to zoom. The readout reports the ISCO, photon-sphere and critical-impact-parameter radii."
tags: [relativity, animation, live-readout]
difficulty: 5
tier: single
hero_candidate: true
renderer: webgl2
estimated_engagement_minutes: 8
share_state_keys: [aOverM, diskInner, diskOuter]
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

# Schwarzschild-Kerr Black Hole 3D

## Explainer

### What you are looking at

A black hole does not just have a hole punched in the sky behind it.
It bends light so severely that you see the far side of its accretion
disk lensed up and over the top and wrapped underneath, a dark shadow
where light fell in, and a razor-thin bright ring of light that
orbited the hole before escaping. The playground ray-traces exactly
that for a non-rotating (Schwarzschild) and a spinning (Kerr) hole.

### Light bending in curved spacetime

Photons follow null geodesics of the metric. For the Schwarzschild
metric the key scales are the event horizon at the Schwarzschild
radius

$$r_s = \frac{2GM}{c^2},$$

the photon sphere at $1.5\,r_s$ (where light can orbit), and the
shadow, of angular radius corresponding to $\sqrt{27}\,GM/c^2$,
slightly larger than the horizon because rays grazing the photon
sphere are captured. Rays aimed near the shadow edge wind around the
hole one or more times, producing the infinitely-stacked photon ring
and the lensed second image of the disk.

### Schwarzschild vs Kerr

A spinning (Kerr) black hole drags spacetime around with it (frame
dragging). The consequences the playground shows:

- The shadow becomes asymmetric: the side rotating toward the camera
  is brightened and the shadow is flattened on that side (the
  characteristic Kerr crescent, as imaged for M87* and Sgr A*).
- The innermost stable circular orbit moves inward with spin, so the
  disk reaches closer and is hotter and brighter near the prograde
  edge (relativistic Doppler beaming).

This is the physics behind the Event Horizon Telescope images and
*Interstellar*'s Gargantua. The playground integrates the ray paths
in the chosen metric and lets you change the spin and viewing
inclination to morph the shadow, photon ring, and lensed disk.

### Things to try

- Watch the far side of the disk lensed up over the top and a second
  image wrapped underneath (strong gravitational lensing).
- Increase the Kerr spin and watch the shadow flatten into an
  off-centre crescent with a brightened approaching side.
- Tilt the inclination from face-on toward edge-on and see the
  Einstein-ring-like wrap of the disk.

### Where this comes from

The Schwarzschild/Kerr null geodesics, the photon sphere and shadow
follow Hartle, *Gravity*, Chapters 9 and 15, and Misner, Thorne and
Wheeler, *Gravitation*, Chapter 25; the imaging follows the Event
Horizon Telescope results (EHT Collaboration 2019).

## Physical setup

A black hole bends the paths of light rays so strongly that some rays loop around it before escaping and others are swallowed. Looking at a black hole surrounded by a glowing accretion disk, you do not see a disk with a hole punched in it; you see the near side directly, the far side lensed up and over the top, and a second image of the far side wrapped around underneath. A perfectly dark region (the shadow) sits where every ray that would land there has fallen through the event horizon, ringed by a thin bright circle (the photon ring) made of light that orbited the hole one or more times before reaching the camera.

## Governing equations

For a Schwarzschild hole (geometric units, M = 1) a photon path in its orbital plane obeys

d2u/dphi2 + u = 3 M u^2,   with   u = 1 / r,

so the null geodesic is integrated as a function of azimuth phi. The conserved combination (du/dphi)^2 + u^2 - 2 u^3 = 1/b^2 fixes the impact parameter b. Capture occurs below the critical impact parameter b_c = 3 sqrt(3) M; the unstable photon orbit is at r = 3 M (the photon sphere). The disk is a geometrically thin Novikov-Thorne disk with rest-frame temperature T(r) proportional to r^(-3/4) times a factor that vanishes at the ISCO; the observed colour combines gravitational redshift sqrt(1 - 2M/r) and the Keplerian Doppler factor along the line of sight. Spin enters through the outer horizon r_+ = M + sqrt(M^2 - a^2), the ISCO radius, and a perturbative frame-drag azimuth twist (this is Schwarzschild-exact; a full Kerr-metric integration is deliberately not done, see the risk register).

## Numerical method

Backward ray-march, one primary ray per pixel. u(phi) is advanced with a symplectic velocity-Verlet step whose size adapts to local curvature (smaller near periapsis), with a Hamiltonian (null-condition) renormalization every 16 steps so the conserved quantity does not drift over many windings. The first equatorial-plane crossing inside the disk band deposits one opaque emission sample and the ray terminates (no ghost disks, no inner-shadow leak). Escaping rays sample a procedural 3D-cell starfield in their bent outgoing direction plus a faint diffuse Milky-Way band; the starfield is generated arithmetically in the shader (not an equirectangular texture lookup) precisely so the strong lensing cannot stretch it into the concentric-ring artifact that a 2D texture or 2D noise field produces under this mapping. Temporal anti-aliasing (per-pixel per-frame jitter, averaged over frames) suppresses geodesic-quantization banding; bloom, ACES tonemapping and a vignette finish the frame. The shared CPU module supplies the closed-form radii (r_s, photon sphere, b_c, ISCO, horizon, ergosphere) that the invariants check.

## Controls

- a/M (-1 to 1): black-hole spin (negative is retrograde). Moves the ISCO and adds the frame-drag twist.
- disk r_in (6 to 12 M): inner edge of the accretion disk, clamped at or above the a = 0 ISCO so no unphysical material leaks into the shadow.
- disk r_out (20 to 80 M): outer edge of the disk.
- Drag to orbit the camera, scroll to zoom (inclination is set by the camera, near edge-on by default). Reset restores defaults; Pause freezes the disk rotation.
- The readout shows r_ISCO, r_photon, b_crit and FPS.
- share_state_keys: `aOverM`, `diskInner`, `diskOuter` (the physics sliders).

## Expected qualitative features

- A dark, roughly circular shadow with a single sharp photon ring hugging it.
- The accretion disk lensed into the double arc: a bright band over the top of the shadow and a mirrored band underneath, with the flat disk plane extending to the sides.
- A Doppler-beamed brightness asymmetry: the side of the disk rotating toward the camera is markedly brighter (this asymmetry is correct relativistic physics, not a rendering imbalance).
- A faint procedural starfield with no concentric-ring or bullseye artifact.
- Five reference frames that differ (slow camera orbit plus disk-turbulence evolution).

## Invariants and acceptance thresholds

`invariants.test.mjs` (vitest, offline), all closed-form GR identities:

1. r_s = 2 M.
2. Photon sphere at r = 3 M.
3. b_crit = 3 sqrt(3) M.
4. Kerr ISCO: 6 M at a = 0, about 1.2 M at a/M = 0.998 prograde, 9 M at a = -1 retrograde.
5. Outer horizon r_+ = M + sqrt(M^2 - a^2).
6. Equatorial ergosphere outer radius = 2 M.
7. Weak-field deflection equals 4 M / b.

In-page gate: `__physicsCheck` confirms the CPU Schwarzschild deflection at b = 50 M matches 4 M / b within 5%. Visual gate: SSIM > 0.92 against committed golden frames (recaptured this sweep from the corrected render); deterministic, passes x3.

## Limiting cases for verification

- a = 0: pure Schwarzschild, ISCO 6 M, symmetric shadow.
- a/M to 1: ISCO shrinks toward the horizon (prograde) and the frame-drag twist makes the shadow visibly asymmetric.
- Weak field (large b): deflection reduces to the Einstein 4 M / b value.

## Visual fallback

If `EXT_color_buffer_float` is unavailable the engine throws and the page renders nothing rather than a misleading schematic; the physics readout and invariants still define the playground's correctness.

## Citations

- Shapiro and Teukolsky, Black Holes, White Dwarfs and Neutron Stars, Ch. 12: Schwarzschild and Kerr geometry, photon orbits, ISCO.
- Luminet 1979; Novikov and Thorne 1973: the lensed thin-disk image and the disk temperature law. Wyman, Sloan and Shirley 2013 (JCGT): the blackbody-to-sRGB fit used for disk colour.

## Risk register

- The spin is perturbative: the integration is Schwarzschild-exact and the a/M slider applies a frame-drag azimuth twist plus the correct Kerr ISCO and horizon, but it is not a full Kerr-metric geodesic solve. Stated here and in the caption; the invariants only assert the closed-form Kerr radii, which are exact.
- The starfield is faint by design (a bright field would be physically wrong and would also risk the lensing ring artifact). Amplifying the lensed-starfield drama and making the camera orbit more pronounced across frames are tracked as hero-promotion items (see DEVNOTES), not correctness defects.
