---
title: 1D Alfvén Wave in MHD
slug: alfven-wave-mhd-1d
status: verified
audience: portfolio
created: 2026-05-14
primary_uc: AST3014
supporting_ucs: []
curriculum_year: bsc-y3s1
primary_citation: goedbloed-plasma
primary_chapter: 5
hook: 'Pluck a magnetic field line like a guitar string: a transverse ripple runs along it at the Alfven speed, restored by magnetic tension.'
one_paragraph: 'In a magnetized plasma the field lines behave like elastic strings under tension. A transverse perturbation of the field, with the frozen-in fluid moving with it, propagates along the background field as an Alfven wave at speed v_A = B_0 / sqrt(mu_0 rho), with magnetic tension providing the restoring force exactly as string tension does for a wave on a string. The playground animates the 1D transverse perturbation and reports v_A as you change the field strength and density, so the B over sqrt(rho) scaling is explicit. Alfven waves carry energy through the solar corona and the solar wind. Reference: Goedbloed and Poedts, Principles of Magnetohydrodynamics, Ch. 5.'
tags: [fluids-mhd, stellar, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
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
---
# Alfvén wave, 1D
Transverse magnetic perturbation travels at $v_A = B_0/\sqrt{\mu_0 \rho}$; magnetic-tension restoring force. Source: Goedbloed-Poedts Ch. 5.

## Explainer

### What you are looking at

In a magnetized plasma the field lines act like elastic strings frozen
into the fluid. Pluck one sideways and a transverse ripple runs along
it, exactly like a wave on a guitar string. That is the Alfven wave,
the workhorse of solar and space plasma physics.

### Where the wave comes from

Magnetohydrodynamics couples the fluid to the magnetic field via two
facts: the field is frozen into the plasma (it moves with the fluid),
and a bent field line pulls back with magnetic tension
$B^2/\mu_0$ per unit area, the analogue of string tension. Linearizing
the MHD equations for a transverse perturbation perpendicular to a
uniform background field $B_0$ gives a clean wave equation whose phase
speed is the Alfven speed:

$$v_A = \frac{B_0}{\sqrt{\mu_0\,\rho}}.$$

The restoring force is purely magnetic tension; the inertia is the
plasma mass density $\rho$. It is the magnetic twin of $v = \sqrt{T/\mu}$
for a string.

### Reading the scaling

Everything follows from that one formula. A stronger field
($B_0\uparrow$) stiffens the lines and the wave runs faster; a denser
plasma ($\rho\uparrow$) is heavier to shake and the wave slows. The
wave carries energy and momentum along the field without compressing
the plasma (it is transverse and incompressible), which is why Alfven
waves can ferry energy from the solar surface up into the corona and
out into the solar wind. The playground animates the transverse
displacement and reports $v_A$ as you change $B_0$ and $\rho$.

### Things to try

- Raise $B_0$ and watch the ripple propagate faster ($v_A \propto
  B_0$).
- Raise the density and watch it slow ($v_A \propto 1/\sqrt\rho$).
- Note the perturbation is purely transverse: the plasma is not
  compressed, only shaken sideways.

### Where this comes from

The frozen-in condition, magnetic tension, and the Alfven speed
$v_A = B_0/\sqrt{\mu_0\rho}$ follow Goedbloed and Poedts, *Principles
of Magnetohydrodynamics*, Chapter 5 (after Alfven 1942).
