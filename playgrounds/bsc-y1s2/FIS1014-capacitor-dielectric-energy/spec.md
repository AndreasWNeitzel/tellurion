---
title: Capacitor with a Dielectric - Energy and the Pull-In Force
slug: capacitor-dielectric-energy
status: verified
audience: portfolio
created: 2026-06-21
primary_uc: FIS1014
curriculum_year: bsc-y1s2
primary_citation: griffithsem2017
primary_chapter: 4
hook: "Slide a dielectric into a capacitor and it gets sucked in. Disconnect the battery and the energy falls (the field does the work); keep it connected and the energy rises (the battery does)."
one_paragraph: "A dielectric slab covering a fraction x of a parallel-plate gap makes two capacitors in parallel, C(x) = C0[1 + (eps_r - 1)x], and the free charge crowds more densely under the dielectric. The slab is pulled in by the edge field. At constant charge (battery disconnected) the energy U = Q^2/2C falls as the slab enters and that released energy is the work pulling it in; at constant voltage (battery connected) U = C V^2/2 rises while the battery supplies the work, and the slab is still pulled in. The playground shows the charges, the field, and the inward force, animates the slab being pulled fully in, and plots U(x) and F(x) for both modes. The dielectric energy density is eps_r times the vacuum value at the same field."
tags: [electromagnetism, capacitor, dielectric, energy, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 4
share_state_keys: [eps, V, mode]
invariants:
  - key: claw
    label: the capacitance is C0(1 + (eps_r - 1)x)
    tolerance: 1e-9
  - key: force
    label: the slab is pulled in (the force is inward) in both modes
    tolerance: 0.0
  - key: work
    label: at constant charge the work pulling the slab in equals the energy released
    tolerance: 1e-3
what_to_try:
  - Press Release: the slab is pulled into the gap and settles fully inserted; drag it back out and release again.
  - In constant-Q mode the energy curve falls and the field arrows shorten (the voltage drops); the released energy is the work that pulls the slab in.
  - Toggle the battery on (constant V): the energy curve rises, the force stays inward, and the charge grows.
references:
  - "Griffiths, Introduction to Electrodynamics, Fifth ed., Sec. 4.4.4 (energy in dielectric systems, the force on a dielectric)."
  - "Halliday, Resnick and Walker, Fundamentals of Physics, Ch. 25 (capacitance and dielectrics)."
---

# Capacitor with a dielectric: energy and the pull-in force

## Physical setup

A parallel-plate capacitor (area A, separation d) with a dielectric slab of
relative permittivity eps_r slid into the gap, covering a fraction x of the plate
area.

## Equations

Covering a fraction x of the area gives two capacitors in parallel,

$$ C(x) = C_0\,[1 + (\varepsilon_r - 1)x], \qquad C_0 = \varepsilon_0 A/d. $$

The plate-to-plate field is $E = V/d$ in both regions (the plates are
equipotentials), but the dielectric region holds more free charge. The inward
force on the slab is, at constant charge,
$F = -\,dU/dx = \tfrac{Q^2}{2C^2}\,dC/dx > 0$ with $U = Q^2/2C$, and at constant
voltage, $F = +\tfrac12 V^2\,dC/dx > 0$ with $U = \tfrac12 C V^2$, the battery
supplying the energy. The energy density is $\tfrac12\varepsilon_0\varepsilon_r E^2$.

## Numerical method

No engine. Closed-form capacitance, energy, and force; the slab position is
advanced with a damped second-order step under the inward force, settling fully
inserted.

## Controls

- Dielectric constant eps_r and the voltage; a toggle between constant charge
  (battery off) and constant voltage (battery on); Release (let the field pull
  the slab in) and Slab out. The slab can also be dragged.

## Expected qualitative features

1. The free charge is denser under the dielectric; the slab carries bound
   surface charges.
2. The slab is pulled in (the force is inward) in both modes.
3. At constant charge U falls and the field weakens; at constant voltage U rises
   and the charge grows.

## Invariants and acceptance thresholds

- $C = C_0[1 + (\varepsilon_r - 1)x]$.
- The force is inward in both modes.
- At constant charge the work pulling the slab in equals the energy released.

## Citations

Griffiths, Introduction to Electrodynamics, 5th ed., Sec. 4.4.4. Halliday,
Resnick and Walker, Fundamentals of Physics, Ch. 25.
