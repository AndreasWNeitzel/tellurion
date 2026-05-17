# The Meissner Effect

A superconductor is not just a perfect conductor. A perfect conductor
would trap whatever field was inside it when it was cooled; a
superconductor actively pushes the field out. That active expulsion,
the Meissner effect, is the real signature of the state, and a sphere
does it by flowing screening currents until the field is zero inside
and the lines have to swerve around the outside.

What to look for: at low temperature and modest field the streamlines
bow around the sphere and the inside is dark, B = 0. The dot on the
phase diagram sits in the blue superconducting region. Now raise the
temperature slider toward Tc, or push the applied-field slider up:
the moment the dot crosses the critical parabola Bc(T), the lines
snap straight through and the dot turns red, the flux has flooded
back in. Switch to type II and a field below Bc admits the flux as a
neat triangular lattice of Abrikosov vortices instead of being fully
excluded, each vortex carrying exactly one flux quantum h/2e.

Controls: the temperature and applied-field sliders move you around
the phase diagram; the type selector switches full Meissner
(type I) for the vortex lattice (type II); Bc0 sets the
zero-temperature critical field; Reset returns to a cold, low-field
type-I sphere.

## Reference

Primary citation: Tinkham, *Introduction to Superconductivity*
(2nd ed.), Ch. 1-5 (`tinkham`); Kittel, *Introduction to Solid State
Physics* (8th ed.), Ch. 10-12 (`kittel-cm`).

## Verification

- Strong invariant: B = 0 everywhere inside the superconducting
  sphere; the normal field vanishes at the surface and the
  tangential field is exactly 3/2 B0 at the equator; the normal
  state recovers B0; the critical field follows Bc0(1 - (T/Tc)^2);
  the London profile decays as exp(-x/lambda); and the flux quantum
  is h/2e.
- Visual gate: SSIM > 0.92 against committed golden frames at seed
  0xC0FFEE.
- Last verified: see `.verified`.
