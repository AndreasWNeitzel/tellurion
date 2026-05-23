---
title: Hydrogen Orbitals 3D
description: 'The exact quantum shapes of the hydrogen atom, drawn as a 3D probability cloud. Pick the quantum numbers n, l, m and watch the orbital change from a sphere to dumbbells, rings and multi-lobed shells. View as density, phase, or a lit isosurface; drag to orbit, scroll to zoom.'
caption: 'Figure 1. Hydrogen orbitals: the electron probability cloud |psi|^2 for quantum numbers (n, l, m). Brighter regions are where the electron is more likely to be found, and the colour key in the corner shows the active scale. Method: exact hydrogenic wavefunctions (radial Laguerre times spherical harmonic) volume ray-marched on the GPU. Source: Eisberg and Resnick, Quantum Physics, Ch. 5.'
slug: hydrogen-orbitals-3d
status: verified
audience: portfolio
created: 2026-05-14
primary_uc: FIS3029
supporting_ucs: []
curriculum_year: hero
primary_citation: eisberg-resnick
primary_chapter: 5
hook: 'An electron bound to a proton does not orbit like a tiny planet; it spreads into a standing wave whose shape is fixed by three integers. Dial n, l, m and the cloud morphs from a plain sphere (1s) into dumbbells, rings and many-lobed shells, the exact shapes chemists draw as orbitals.'
one_paragraph: 'This is the hydrogen atom solved exactly by quantum mechanics, shown as a 3D cloud. The electron has no definite position; the brightness at each point is the probability of finding it there, |psi|^2. Three integers set the shape: n (1 to 5) is the energy level and overall size, l is how much angular structure the cloud has (0 is a sphere, 1 a dumbbell, 2 a cloverleaf), and m tilts and twists that pattern around the axis. The sliders are clamped to the only allowed combinations, l < n and |m| <= l, so some settings refuse to move; that restriction is the physics, not a bug, and it is what builds the periodic table. Switch the view to read probability density (viridis), the wavefunction phase (hue wheel), or a lit isosurface that makes the lobes look solid; a colour key in the corner says which scale is active. Drag to orbit, scroll to zoom. The readout shows the energy E_n = -13.6 eV / n^2 and the mean radius, which grows like n^2.'
tags: [quantum, atomic-molecular, animation, multi-panel, live-readout]
difficulty: 4
tier: single
hero_candidate: true
renderer: webgl2
estimated_engagement_minutes: 8
share_state_keys: [n, l, m, view]
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

# Hydrogen Orbitals 3D

## Explainer

### What you are looking at

The electron in a hydrogen atom has no orbit and no path. It is a
standing wave around the proton, and what you can know is only the
probability of finding it somewhere. The playground draws those
probability clouds, the orbitals, in 3D, and lets you dial the three
quantum numbers to morph the shape.

### The Schrodinger solution

The electron obeys the time-independent Schrodinger equation in the
proton's Coulomb potential $V=-e^2/4\pi\varepsilon_0 r$. The
normalizable solutions exist only for discrete energies

$$E_n = -\frac{13.6\ \mathrm{eV}}{n^2},$$

and each wavefunction separates into a radial and an angular part:

$$\psi_{n\ell m}(r,\theta,\phi)
  = R_{n\ell}(r)\,Y_\ell^m(\theta,\phi),$$

labelled by three integers: $n$ (size and energy, $1,2,3,\dots$),
$\ell$ (orbital shape / angular momentum, $0\le\ell<n$: s, p, d,
f...), and $m$ (orientation, $-\ell\le m\le\ell$). The displayed
cloud is $|\psi|^2$, the probability density.

### Reading the clouds

The structure is not decorative, it is the quantum numbers made
visible:

- $n-\ell-1$ radial nodes (spherical shells where $\psi=0$) and
  $\ell$ angular nodal planes; the total number of nodes is $n-1$,
  and more nodes means higher energy.
- $\ell=0$ (s) is spherical; $\ell=1$ (p) is a dumbbell; $\ell=2$
  (d) has the cloverleaf lobes; raising $m$ rotates/reorients the
  same shape.
- The orbital is largest for large $n$ (the electron is, on average,
  farther out), which is the size of the atom.

These shapes determine chemical bonding, spectra (transitions between
levels emit the Balmer/Lyman lines), and the periodic table. The
playground renders $|\psi_{n\ell m}|^2$ as a 3D point cloud you can
rotate, with the nodal surfaces visible as gaps.

### Things to try

- Set $\ell=0$ for a round s orbital, then raise $\ell$ to grow the
  p dumbbell and d cloverleaf lobes.
- Increase $n$ at fixed $\ell$ and count the radial shells appearing
  ($n-\ell-1$ of them) as the cloud grows.
- Vary $m$ and watch the same shape reorient (the orientation quantum
  number).

### Where this comes from

The hydrogen wavefunctions, quantum numbers and nodal structure
follow Griffiths, *Introduction to Quantum Mechanics*, Chapter 4, and
Cohen-Tannoudji, Diu and Laloe, *Quantum Mechanics*, Vol. 1.

## Physical setup

A hydrogen atom is one electron bound to one proton by the Coulomb attraction. Quantum mechanics says the electron does not follow a path; it is described by a wavefunction psi, and |psi|^2 is the probability density of finding it at a given point. Solving the Schrodinger equation for the Coulomb potential gives a discrete family of solutions labelled by three integers, the quantum numbers (n, l, m). Each one is a fixed 3D shape, an orbital. This playground draws that shape directly: where the cloud is bright, the electron is likely to be; where it is dark, it almost never is.

## Governing equations

The bound-state wavefunctions separate into a radial part and an angular part:

psi_{n,l,m}(r, theta, phi) = R_{n,l}(r) * Y_{l,m}(theta, phi),

with R_{n,l} an exponential times an associated Laguerre polynomial and Y_{l,m} a spherical harmonic. The energy depends only on n:

E_n = -13.6057 eV / n^2,

so larger n means a weaker binding, a larger atom, and more nodes. The mean radius scales roughly as n^2 (exactly <r> = (3 n^2 - l (l + 1)) a_0 / 2). The allowed quantum numbers are n = 1, 2, 3, ..., then l = 0, 1, ..., n - 1, then m = -l, ..., +l. Those inequalities are why the sliders clamp.

## Numerical method

The density |psi|^2 and the phase of psi are evaluated on the CPU on a 32^3 grid (`shared/js/engine/hydrogen-orbital-cpu.js`, the same code the invariant tests call), then uploaded as an RG16F 3D texture. A WebGL2 fragment shader marches one ray per pixel through the unit bounding box and accumulates emission with density-weighted alpha compositing. The box rescales with the orbital extent (about 2.5 n^2 Bohr radii) so even n = 5 fits. No time integration and no random numbers; the scene is deterministic, so the reference capture is reproducible.

## Controls

- n, l, m sliders: choose the orbital. Out-of-range combinations snap back because they do not exist.
- view: density (viridis), phase (hue = arg psi), or iso (a lit Blinn-Phong isosurface, two-tone by the sign of psi).
- Drag to orbit the camera, scroll to zoom. Reset returns to 1s; Pause freezes the gentle auto-rotation.
- A screen-space colour key in the top right shows the scale for the active view.
- Share keys: `n`, `l`, `m`, `view`.

## Expected qualitative features

- 1s (1, 0, 0): a single round ball, densest at the nucleus.
- 2p (2, 1, 0): two lobes with a flat nodal plane between them.
- 3d (3, 2, 0): a four-lobe cloverleaf with a ring.
- Higher n adds radial shells (concentric layers separated by spherical nodes).
- Phase view: the hue winds around the axis m times; density view does not (density is phase-independent).
- A legible colour key is visible in every frame; the readout never overlaps the cloud.

## Invariants and acceptance thresholds

`invariants.test.mjs` (vitest, offline):

1. E_n = -13.6 eV / n^2 to 0.01 eV for n = 1, 2.
2. 1s density is larger near the nucleus than far away.
3. 2p_z density vanishes in the xy plane (theta = pi/2) and is nonzero on the z axis.
4. The m = 2 azimuthal phase advances by 4 pi around a full loop.
5. <r> = 1.5 a_0 for 1s and 5 a_0 for 2p.
6. signed-amplitude squared equals the density (phase carries no magnitude); the sign flips across a nodal plane; phase winds with phi while density does not; phase offsets by pi across a radial node.

Visual gate: SSIM > 0.92 against committed golden frames. The post-build sweep added the on-screen colour key and reran the multimodal visual review (recognizable orbitals, no text overlap, legible key, sensible shapes, visible variation).

## Limiting cases for verification

- l = 0 for any n: a spherically symmetric cloud (s orbital), structure only in r.
- n = 1: a single shell, no radial node.
- m = 0: the pattern is real and axisymmetric about z; nonzero m twists it azimuthally.

## Visual fallback

A Canvas2D slice through y = 0 is used when `EXT_color_buffer_float` is unavailable, so the orbital is still readable without the volume renderer.

## Citations

- Eisberg and Resnick, Quantum Physics of Atoms, Molecules, Solids, Nuclei, and Particles, Ch. 5: the hydrogen wavefunctions and quantum numbers.
- Wittenbrink, Malzbender and Gortler 1998: opacity-weighted volume rendering of scalar fields.

## Risk register

- The grid is 32^3; very high (n, l) orbitals are slightly under-resolved at the finest nodes. The invariants are evaluated analytically on the CPU, not on the grid, so the physics claims are unaffected; only the visual sharpness of the largest orbitals is.
