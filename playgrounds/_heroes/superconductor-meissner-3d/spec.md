---
title: Meissner Effect
description: Cool a superconductor below Tc and it expels the magnetic field, levitating the magnet above it. Field lines curve around the cold sample and thread straight through a warm one; warm it past Tc and the magnet drops.
caption: Figure 1. Image-dipole Meissner screening; field-line streamlines curve around the cold sample, a London skin on the surface, and the magnet levitates. Source: Tinkham, Introduction to Superconductivity, Ch. 1-2.
slug: superconductor-meissner-3d
status: verified
audience: portfolio
created: 2026-05-19
program: EVF
course: EVF Quantum Mechanics and Technology
suite: summer-school-hero-suite
primary_uc: EVF
supporting_ucs: []
curriculum_year: hero
primary_citation: tinkham-superconductivity
primary_chapter: 1
hook: 'Cool the puck and the magnet floats; warm it back and the magnet drops. The field cannot get inside.'
one_paragraph: 'A bar magnet above a superconductor. Below the critical temperature the superconductor expels the magnetic field from its interior (the Meissner effect), modelled exactly by the image dipole that makes the normal field vanish at the surface, and the resulting repulsion levitates the magnet. The field lines, integrated through that real field, curve cleanly around the cold sample and thread straight through a warm one; the thin glowing skin is the London penetration layer, over which any leaked field dies as exp(-d/lambda_L). Warm it past Tc, or push the applied field past the critical field, and superconductivity quenches: the screening vanishes and the magnet drops.'
tags: [solid-state, animation, live-readout, webgl2, hero]
difficulty: 5
tier: single
hero_candidate: true
renderer: webgl2
estimated_engagement_minutes: 6
share_state_keys: [TbyTc, Bapp, lam0]
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
  - "Tinkham, Introduction to Superconductivity, 2nd ed., Ch. 1."
---

# Meissner Effect

## Explainer

### What you are seeing and why it matters

Most materials let a magnetic field pass through them. A
superconductor, below a certain temperature, does the opposite: it
sets up surface currents that cancel the field everywhere inside, so
the field is pushed out. Because the field cannot get in, a magnet
brought near is repelled, and it can hover with nothing touching it.
This is the Meissner effect, the unmistakable signature that a
material has truly become superconducting (not merely a very good
conductor). It is the physics behind maglev trains and frictionless
bearings. Watch the field lines: they bend around the cold sample as
if it were a hole in space; warm it through Tc and they snap straight
through it and the magnet falls.

### Try this

- "Meissner levitation": the cold sample, the magnet floating, lines
  curving around it.
- "normal (field penetrates)": warm past Tc; lines go straight
  through, the magnet drops onto the surface.
- Drag T/Tc up slowly and watch the London depth grow (the skin
  thickens) until screening fails.
- "quench by overfield": keep it cold but push the applied field past
  Hc(T); superconductivity collapses and the magnet drops.

### Where the screening comes from: London's equations

Inside a superconductor the supercurrent density $\vec j_s$ obeys
the second London equation (London brothers 1935),

$$\boxed{\;\nabla \times \vec j_s
       = -\,\frac{n_s e^2}{m_e}\,\vec B.\;}$$

Combine with Ampere's law $\nabla \times \vec B = \mu_0\,\vec j_s$
(neglecting the displacement current) and one finds, inside the
superconductor,

$$\nabla^2 \vec B = \frac{1}{\lambda_L^2}\,\vec B,\qquad
  \lambda_L \equiv \sqrt{\frac{m_e}{\mu_0\,n_s\,e^2}}.$$

This is a Helmholtz equation with a real (not imaginary) decay
constant: solutions decay exponentially with depth. The field
inside the bulk goes to zero on a thin shell:

$$B(d) = B_{\rm surf}\,e^{-d / \lambda_L},$$

so $\lambda_L$, the *London penetration depth*, is the thickness of
the screening shell. Typical values are about 100 nm in elemental
superconductors.

### Temperature dependence: $\lambda_L$ grows, $H_c$ shrinks

As $T \to T_c$ the density of superconducting carriers $n_s(T)$
falls to zero. Empirically (the two-fluid model of Gorter and
Casimir 1934),

$$\lambda_L(T) = \frac{\lambda_0}{\sqrt{1 - (T/T_c)^4}},\qquad
  H_c(T) = H_{c0}\,\left[1 - (T/T_c)^2\right].$$

So warming the sample (a) lets the field penetrate deeper, and (b)
shrinks the field strength the sample can keep out before it
quenches. Push $T$ to $T_c$ and the levitation disappears.

### Why the magnet hovers: the image-dipole construction

For a vertical point magnetic dipole of moment $m_z$ at height $h$
above a superconducting half-space, the boundary condition
$B_\perp(z = 0) = 0$ is satisfied by placing an IMAGE dipole at
depth $h$ below the surface with opposite vertical moment $-m_z$.
Two anti-parallel coaxial dipoles separated by $2 h$ repel. In
units where $\mu_0 / 4\pi = 1$ the repulsive force is

$$F = \frac{3\,m^2}{32\,h^4}\quad (\text{vertical}, \text{upward}).$$

The magnet settles to the height where this equals its weight $mg$;
nothing touches and there is no friction.

### Symbols, at a glance

- $\vec B$, magnetic flux density (T); $\vec j_s$, supercurrent
  density (A/m^2).
- $n_s$, density of superconducting carriers; $T_c$, transition
  temperature; $\lambda_0 \equiv \lambda_L(T = 0)$.
- $\lambda_L(T)$, London penetration depth; the e-folding length of
  the field inside the bulk.
- $H_c(T)$, critical field; above it superconductivity is destroyed.
- $m$, magnetic dipole moment; $h$, height of the dipole above the
  surface.
- $\mu_0 = 4\pi \times 10^{-7}\,\mathrm{T\,m/A}$, the vacuum
  permeability.

### Type-I vs Type-II (a caveat)

The clean image-dipole picture is for *Type-I* superconductors,
where the Meissner state is complete up to $H_c$. *Type-II*
materials (most high-$T_c$ compounds, including YBCO) allow flux
to penetrate as discrete quantised vortices above the lower
critical field $H_{c1}$ and remain superconducting up to a larger
$H_{c2}$. The playground's "Type-II vortex" preset hints at this
state qualitatively; the image-dipole formula above is for the
Type-I Meissner regime.

### Bibliographic origin

The original observation: Meissner and Ochsenfeld, *Naturwissenschaften*
**21** (1933) 787. The phenomenological theory: F. and H. London,
*Proc. R. Soc. A* **149** (1935) 71. The two-fluid temperature
dependence: Gorter and Casimir, *Physica* **1** (1934) 305. A
modern textbook: Tinkham, *Introduction to Superconductivity* (2nd
ed., Dover 1996), Ch. 1, 2, 3. Type-II vortex lattice: Abrikosov,
*Sov. Phys. JETP* **5** (1957) 1174 (2003 Nobel Prize). The
image-dipole levitation formula is in Jackson, *Classical
Electrodynamics* (3rd ed., Wiley 1998), Section 5.13.

## Physical setup

A vertical point-dipole magnet at height h above a superconducting
half-space. Field lines are integrated through the engine's exact
field (dipole plus image when superconducting). The magnet settles to
the height where the image repulsion balances its weight.

## Numerical method

Closed-form image-dipole field and streamline integration of it;
engine `shared/js/engine/meissner-cpu.js` (DOM-free, tested in
`tests/meissner.test.mjs`). Render:
`shared/js/engine-gl/meissner-3d.js`.

### Stack note (WebGL2 relaxation)

Project default is Canvas2D/SVG; relaxed to WebGL2 (30 integrated 3D
field-line streamlines plus shaded solids at 60 fps is not feasible
in Canvas2D). Reuses `createGL2` / `compileProgram`; default
framebuffer + in-shader ACES.

## INTERACTIVITY (standard S4)

- Camera orbit (drag): yes, shared orbit camera.
- Camera zoom (scroll): yes.
- Camera pan: not applicable (the sample is centred and is the
  subject; fixed target keeps it framed; stated).
- Direct manipulation: the magnet height is not hand-dragged; it
  settles to the computed levitation equilibrium (the physics places
  it). Stated as intentionally physics-driven rather than free-drag.
- Parameters: T/Tc (0 to 1.4); applied field (0 to 1.5, drives the
  Hc(T) quench); lambda0 (0.15 to 1.2, the zero-T London depth);
  magnet moment m (1 to 3.5).
- Time controls: play, pause; Cool down / Warm up shortcuts. No speed
  multiplier (the settle is a damped relaxation; the sliders are the
  control).
- Presets: Meissner levitation, normal (field penetrates), Type-II
  vortex, quench by overfield.
- Probe/readout: state (Meissner / Type-II / normal / quenched),
  lambda_L, Hc(T), the levitation height, and the bulk |B| (near zero
  when superconducting).

Type-II note: the "Type-II vortex" preset is a labelled regime
(cold, intermediate field) where real materials admit quantised flux
tubes; this playground models the field with the same image screening
and states this simplification rather than faking flux lattices.

## Diagnostic plot (secondary)

A Canvas2D panel plots the field fraction versus depth into the
sample: an exponential London decay when superconducting, flat (full
penetration) when normal. Subordinate to the 3D scene (S3).

## Expected qualitative features

1. On load (Meissner preset) the magnet is floating and the lines
   curve around the cold sample within 3 s (S5).
2. Warming past Tc or overfielding makes the lines straighten through
   the sample and the magnet visibly drop (S6).
3. The skin glows only when superconducting; the |B|-vs-depth panel
   switches from exponential to flat.
4. The bulk |B| readout is ~0 in the Meissner state.

## Invariants and acceptance thresholds

| invariant | threshold | location |
| lambda diverges at Tc; Hc parabolic; quench logic | exact | invariants test |
| normal B vanishes at the cold surface; not for a warm sample | < 1e-2 / > 1e-2 | invariants test |
| total external field divergence-free (with and without image) | < 1e-4 | invariants test |
| London decay matches the set lambda | within 1 percent | invariants test |
| levitation 1/h^4 and weight-balanced height | exact | invariants test |
| pure functions deterministic | exact | invariants test |

Confirmed in `invariants.test.mjs` and `tests/meissner.test.mjs`.

## Limiting cases for verification

- T -> 0: thinnest London skin, strongest screening, highest float.
- T -> Tc: lambda diverges, screening fails, magnet drops.
- Applied field > Hc(T): quench even when cold.

## Citations

- Tinkham, Introduction to Superconductivity, 2nd ed., Dover 2004,
  Ch. 1-2.
- Jackson, Classical Electrodynamics, 3rd ed., Wiley 1998, Sec. 5.6
  (image of a dipole in a perfect diamagnet).

## Risk register

- Ideal Meissner levitation is Earnshaw-unstable; real Type-II flux
  pinning supplies stability. The playground models the force balance
  and the height and states the pinning caveat (no false stability
  claim).
- Golden determinism: capture fixes a per-fraction (T, B) preset, the
  equilibrium height and the camera.
