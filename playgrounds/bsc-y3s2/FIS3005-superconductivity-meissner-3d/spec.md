---
title: The Meissner Effect
slug: superconductivity-meissner-3d
status: verified
audience: portfolio
created: 2026-05-17
hook: 'Cool the sphere below Tc and the field lines snap out around it; warm it past the critical parabola and the flux floods straight back in.'
one_paragraph: 'The Meissner effect: a superconducting sphere is a perfect diamagnet that expels the magnetic field. The closed-form perfect-diamagnet solution gives B = 0 inside, B_r = 0 at the surface and a tangential field enhanced to (3/2) B0 at the equator, so the streamlines bend around the sphere; outside it is the applied field plus a screening dipole that dies as 1/r^3. Superconductivity holds only while B0 < Bc(T) = Bc0 (1 - (T/Tc)^2); cross that parabola and the field penetrates. A type-II superconductor instead admits the field as a triangular Abrikosov lattice of vortices, one flux quantum Phi0 = h/2e each. The scene is the field-line cross-section with the Bc(T) phase diagram and the vortex state, so the active expulsion of flux (not merely zero resistance), its breakdown at the critical field or temperature, and the quantized vortex lattice of a type-II material are all visible. Reference: Tinkham, Introduction to Superconductivity, Chapters 1 to 5; Ashcroft and Mermin, Solid State Physics, Chapter 34.'
tags: [condensed-matter, superconductivity, magnetism, multi-panel, live-readout]
difficulty: 4
tier: advanced
hero_candidate: true
renderer: canvas2d
estimated_engagement_minutes: 6
curriculum_year: 'L:F-3Y-2S'
primary_uc: FIS3005
primary_citation: tinkham-superconductivity
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
  - "Tinkham, Introduction to Superconductivity."

---

# The Meissner Effect

## Explainer

### What you are looking at

Cool a sphere below its superconducting transition in a magnetic field
and it actively expels the field from its interior, the field lines
bend around it as if it were a perfect diamagnet. This Meissner effect,
not just "zero resistance", is the defining signature of
superconductivity, and it is what levitates magnets over cooled
samples.

### Field expelled, with a thin skin

A bulk superconductor enforces $\mathbf B = 0$ inside (it is not merely
a perfect conductor; it expels even a pre-existing field). For a sphere
of radius $R$ in a uniform field $B_0$ the exterior field is the
perfect-diamagnet solution

$$B_r = B_0\cos\theta\left(1 - \frac{R^3}{r^3}\right),
  \qquad
  B_\theta = -B_0\sin\theta\left(1 + \frac{R^3}{2r^3}\right),$$

with $B = 0$ for $r < R$, exactly the pattern of a sphere with an
induced opposing dipole. The expulsion is not perfectly abrupt: the
field penetrates a thin surface layer and decays as

$$B(x) = B_s\,e^{-x/\lambda},$$

over the London penetration depth $\lambda$, where screening
supercurrents flow.

### Critical field and type I vs II

Superconductivity is destroyed if the field exceeds a temperature-
dependent critical field

$$B_c(T) = B_{c0}\left[1 - (T/T_c)^2\right].$$

Type I superconductors expel field completely up to $B_c$ then go
normal abruptly. Type II admit quantized flux tubes (each carrying one
flux quantum $\Phi_0 = h/2e$) in a vortex lattice between two critical
fields, which is what lets them stay superconducting to very high
fields (the basis of MRI and accelerator magnets). The playground
shows the bent exterior field, the field-free core with its London
skin, and the $B_c(T)$ boundary.

### Things to try

- Cool below $T_c$ in a field and watch the lines expelled, bending
  around the sphere (the Meissner state).
- Raise the field toward $B_c(T)$ and watch superconductivity collapse
  (field floods in).
- Switch to type II and watch quantized vortices thread the sample
  between the two critical fields.

### Where this comes from

The Meissner expulsion, the perfect-diamagnet sphere solution, the
London penetration depth, and the critical field follow Tinkham,
*Introduction to Superconductivity*, and Ashcroft and Mermin, *Solid
State Physics*, Chapter 34.

## Physical setup

A superconducting sphere of radius R in a uniform applied field B0,
at reduced temperature T/Tc, type I or II, zero-temperature critical
field Bc0.

## Governing equations

Perfect-diamagnet sphere: `B_r = B0 cos t (1 - R^3/r^3)`,
`B_t = -B0 sin t (1 + R^3/2r^3)`, `B = 0` for `r < R`. Surface
tangential `(3/2) B0 sin t`. Critical field
`Bc(T) = Bc0 (1 - (T/Tc)^2)`. London decay
`B(x) = B_s e^{-x/lambda}`. Flux quantum `Phi0 = h/2e`. Triangular
vortex lattice `a = sqrt(2 Phi0/(sqrt3 B))`,
`N = B A / Phi0`.

## Numerical method

Closed-form field, streamline-integrated for the lines (which stop
at the sphere when superconducting). Deterministic, no RNG.
Reference: Tinkham, Introduction to Superconductivity (2nd ed.),
Ch. 1-5; Kittel, Introduction to Solid State Physics
(8th ed.), Ch. 10-12.

## Controls

- temperature T/Tc, applied field B0: position on the phase diagram.
- type: I (full Meissner) or II (vortex lattice).
- Bc0: the zero-temperature critical field.
- Reset.

## Expected qualitative features

- Below the parabola: field lines bend around the sphere, B = 0
  inside, the operating dot is green in the SC region.
- Cross Tc or Bc: lines drive straight through, the dot turns red.
- Type II between Bc1 and Bc2: a triangular vortex lattice inside.
- The equatorial field reads `3/2 B0` while superconducting.

## Invariants and acceptance thresholds

- `B = 0` everywhere inside the SC sphere.
- Normal state: `|B| = B0` uniform.
- `B_r(R) = 0` for all theta; `|B_t(R)| = (3/2) B0 sin theta`.
- Far field tends to `B0` (dipole dies as `1/r^3`).
- `Bc(0) = Bc0`, `Bc(Tc) = 0`, parabolic; `isSuperconducting`
  flips at the boundary.
- London: `B(0)=B_s`, `B(lambda)=B_s/e`, integral `B_s lambda`.
- `Phi0 = h/2e`; type-II for `kappa > 1/sqrt2`; `Bc1 < Bc2`.
- Triangular cell carries one `Phi0`; spacing `~ B^{-1/2}`.

## Limiting cases for verification

- `T -> Tc` or `B0 -> Bc`: full penetration (normal).
- `r -> infinity`: the uniform applied field.
- `B -> 0`: the vortex spacing diverges (no vortices).

## Visual fallback

Static frame: the field-line cross-section and phase-diagram dot at
the captured temperature.

## Citations

- Tinkham, Introduction to Superconductivity (2nd ed.), Ch. 1-5
 .
- Kittel, Introduction to Solid State Physics (8th ed.), Ch. 10-12
 .

## Stretch goals

- Flux trapping on field-cooling (hysteresis of the dot).
- A real London shell: the thin exp-decay layer at the surface.

## Risk register

- The streamlines are integrated, not analytic curves; they halt at
  the sphere when superconducting so none leak inside.
- The vortex lattice is drawn schematically (count grows with B0);
  the exact count is in the gate-tested `vortexCount`.
