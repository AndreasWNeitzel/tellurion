---
title: Spin Valve: GMR/TMR Hysteresis and the Two-Current Model
slug: gmr-spin-valve-simulator
status: verified
audience: portfolio
created: 2026-05-18
primary_uc: FIS4026
supporting_ucs: []
curriculum_year: bsc-y3s2
primary_citation: julliere1975
hook: 'Sandwich two ferromagnets around a spacer and the resistance depends on whether their magnetisations are parallel or antiparallel. Sweeping the field flips the soft layer first, tracing a hysteretic resistance loop; the parallel state is always the low-resistance one and the magnetoresistance is exactly the two-current beta^2/(1-beta^2) or the Julliere 2P^2/(1-P^2).'
one_paragraph: 'An interactive spin valve. In the metallic case the two-current model (Mott 1936; Baibich et al. 1988) treats spin-up and spin-down electrons as independent parallel channels, giving a parallel-state resistance R_P = 2 R_up R_dn/(R_up + R_dn) and an antiparallel-state resistance R_AP = (R_up + R_dn)/2, so R_P <= R_AP always (the arithmetic-harmonic mean inequality) and GMR = (R_AP - R_P)/R_P = (R_up - R_dn)^2/(4 R_up R_dn) = beta^2/(1 - beta^2) with channel asymmetry beta. In the tunnel-junction case the Julliere model (Julliere 1975) gives TMR = 2 P1 P2/(1 - P1 P2) with electrode spin polarisations P1, P2. A soft free layer switches at +-Hc_free while an exchange-biased pinned layer stays fixed, so sweeping the applied field traces a hysteretic R(H) loop that toggles between the low-resistance parallel state and the high-resistance antiparallel state (Dieny et al. 1991). Sweeping the applied field through the two coercive fields toggles the stack between the low-resistance parallel and high-resistance antiparallel states, tracing the hysteretic R(H) loop that GMR read heads exploit. Reference: Baibich et al. 1988; Julliere 1975; Dieny et al. 1991.'
tags: [spintronics, magnetoresistance, hysteresis, spin-valve, live-readout]
difficulty: 4
tier: hero
hero_candidate: true
renderer: canvas2d
estimated_engagement_minutes: 5
share_state_keys: [model, P, hc]
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
  - "Julli{\\`e}re, Tunneling between ferromagnetic films."
---

# Spin Valve: GMR/TMR Hysteresis and the Two-Current Model

## Explainer

### What you are looking at

Stack two magnetic layers with a thin spacer. The electrical resistance
depends on whether their magnetizations are parallel or antiparallel,
by a large margin. Sweep an external field and the resistance traces a
hysteresis loop. This giant magnetoresistance is how every hard-disk
read head works (2007 Nobel Prize).

### The two-current model

In a ferromagnet, spin-up and spin-down electrons scatter at different
rates: one spin channel "sees" a matched magnetization (low
scattering), the other does not (high scattering). The two-current
model of Mott (1936) treats conduction as two independent spin
channels in parallel:

$$\boxed{\;\frac{1}{R} = \frac{1}{R_\uparrow} + \frac{1}{R_\downarrow}.\;}$$

For a single ferromagnetic layer with spin polarization
$P \equiv (n_\uparrow - n_\downarrow)/(n_\uparrow + n_\downarrow)$
the per-channel resistivities are unequal:

$$\rho_\uparrow = \rho_0\,(1 - P),\qquad \rho_\downarrow = \rho_0\,(1 + P).$$

For a stack of two ferromagnetic layers separated by a non-magnetic
spacer thinner than the spin-diffusion length, an electron in channel
$\uparrow$ keeps its spin between layers; so the parallel-aligned
stack lets one channel be low-resistance everywhere (a "short
circuit"), while the antiparallel-aligned stack forces every spin to
be in the high-scattering state somewhere. The magnetoresistance is

$$\boxed{\;\mathrm{MR} = \frac{R_\mathrm{AP} - R_\mathrm{P}}{R_\mathrm{P}}
       \;=\; \frac{P^2}{1 - P^2}.\;}$$

For 3$d$ ferromagnets $P \approx 0.4$ giving MR around 20 %; for
half-metallic ferromagnets ($P \to 1$) the MR diverges, which is the
goal of spintronics. A tunnel barrier (TMR) replaces the metal spacer
with an insulator; the conductance then depends on the tunnelling DOS
of each spin, and Julliere's formula

$$\mathrm{TMR} = \frac{2 P_1 P_2}{1 - P_1 P_2}$$

gives the magnetoresistance.

### Why it makes a hysteresis loop

One layer is soft (the free layer) and flips at a low field $H_{c,1}$;
the other is pinned by an adjacent antiferromagnet (exchange bias)
and flips only at a much larger field $H_{c,2}$. Sweeping $H$ up and
down, the two layers switch at different points; between $H_{c,1}$
and $H_{c,2}$ they are antiparallel (high $R$), elsewhere parallel
(low $R$). The exchange-bias field $H_{\rm eb}$ offsets the hard-layer
loop:

$$R(H) =
\begin{cases}
R_\mathrm{P} & \text{both layers aligned,}\\
R_\mathrm{AP} & \text{layers anti-aligned.}
\end{cases}$$

Reading the resistance state reads back the stored bit (this is what
every hard-disk head does, 1998-2007).

### Symbols, at a glance

- $R_\uparrow$, $R_\downarrow$, the per-spin-channel resistance.
- $\rho_0$, the spin-averaged resistivity; $P$, the spin polarization.
- $R_\mathrm{P}$, $R_\mathrm{AP}$, parallel- and antiparallel-aligned
  stack resistances.
- $\mathrm{MR}$, the magnetoresistance ratio (dimensionless).
- $H$, applied field; $H_{c,1}$, $H_{c,2}$, coercive fields of free
  and pinned layers; $H_{\rm eb}$, exchange-bias offset.
- $M_1$, $M_2$, layer magnetizations (unit vectors in the playground).

### Things to try

- Sweep the field and watch the soft layer flip first, opening the
  antiparallel high-resistance plateau.
- Compare GMR (metal spacer, MR $\sim 20$ %) with TMR (insulating
  barrier, MR up to several hundred percent in MgO-based junctions).
- Note the loop is offset by the exchange-bias field that pins the
  hard layer.

### Bibliographic origin

The two-current model: Mott, *Proc. R. Soc. A* **153** (1936) 699.
Giant magnetoresistance discovery (the 2007 Nobel work): Baibich,
Broto, Fert et al., *Phys. Rev. Lett.* **61** (1988) 2472, and
Binasch, Gruenberg et al., *Phys. Rev. B* **39** (1989) 4828. TMR
prediction: Julliere, *Phys. Lett. A* **54** (1975) 225. Exchange
bias: Meiklejohn and Bean, *Phys. Rev.* **102** (1956) 1413. A
textbook treatment is Coey, *Magnetism and Magnetic Materials*
(Cambridge 2010), Ch. 5, 14.

## Physical setup

A spin valve is two ferromagnetic layers separated by a non-magnetic
spacer: a metal (giant magnetoresistance, GMR) or a thin insulating
barrier (tunnel magnetoresistance, TMR). One layer is soft (the free
layer) and follows the applied field; the other is pinned by an
adjacent antiferromagnet (exchange bias). The device resistance is low
when the two magnetisations are parallel and high when antiparallel,
and because the two layers switch at different fields the resistance
versus field is a hysteresis loop.

## Governing equations

Two-current (Mott) model for the metallic spin valve:

```math
R_P = \frac{2 R_\uparrow R_\downarrow}{R_\uparrow + R_\downarrow},
\quad
R_{AP} = \frac{R_\uparrow + R_\downarrow}{2},
\quad
\mathrm{GMR} = \frac{R_{AP}-R_P}{R_P}
= \frac{(R_\uparrow-R_\downarrow)^2}{4 R_\uparrow R_\downarrow}
= \frac{\beta^2}{1-\beta^2},
```

with `beta = (R_dn - R_up)/(R_dn + R_up)`. Julliere model for the
tunnel junction:

```math
\mathrm{TMR} = \frac{R_{AP}-R_P}{R_P} = \frac{2 P_1 P_2}{1 - P_1 P_2},
\qquad \frac{R_{AP}}{R_P} = \frac{1 + P_1 P_2}{1 - P_1 P_2}.
```

The free layer switches when `|H|` exceeds `Hc_free`, the pinned
layer only beyond `Hc_pin > Hc_free`; the state (parallel or
antiparallel) is therefore path dependent and the `R(H)` loop is
hysteretic.

## Numerical method

All resistances are closed form. The hysteresis loop is generated by
stepping the free/pinned magnetisations through a triangular field
sweep with sharp switching at the coercive fields (a deterministic
state machine). The playhead sweeps one full field cycle; the capture
path maps capture fraction directly to the loop phase, so reference
frames are reproducible and frame-rate independent. The full loop is
always drawn so the hysteresis is visible in every frame. No RNG.

## Controls

- `model` (share key `model`): GMR (two-current, metal spacer) or TMR
  (Julliere, tunnel barrier).
- `spin polarization P` (share key `P`): the electrode polarisation
  (TMR) or the channel asymmetry (GMR); sets the magnetoresistance.
- `free-layer Hc` (share key `hc`): the free-layer coercive field;
  sets the width of the antiparallel window.
- Reset (GMR, `P = 0.5`, `Hc = 0.3`), Pause/Play (Play replays the
  field sweep), Copy URL.

## Expected qualitative features

- The `R(H)` loop has a low (`R_P`) and a high (`R_AP`) plateau with
  sharp jumps at the switching fields; it is open (hysteretic).
- Saturated parallel (low `R`) at large `|H|`.
- The stack arrows are aligned in the parallel state and opposed
  (one flipped) in the antiparallel state.
- The model panel shows `GMR = beta^2/(1-beta^2)` or
  `TMR = 2 P^2/(1-P^2)` diverging as `P -> 1` (half-metal).
- A larger `Hc_free` narrows the antiparallel window
  (width ~ `Hc_pin - Hc_free`).

## Invariants and acceptance thresholds

Checked offline in `invariants.test.mjs` (6 tests):

1. `R_P < R_AP` for any asymmetric channels (equal only when
   `R_up = R_dn`).
2. GMR `>= 0`, zero only for symmetric channels, equal to both
   `(R_up-R_dn)^2/(4 R_up R_dn)` and `beta^2/(1-beta^2)`; grows with
   asymmetry.
3. Julliere `TMR = 2 P1 P2/(1 - P1 P2)`, consistent with the
   resistance ratio (well within 1%), symmetric in `P1,P2`, monotone
   in `P`, diverging as `P -> 1`.
4. The spin-valve loop is hysteretic: only `R_P`/`R_AP` levels,
   multivalued in field (descending vs ascending differ), saturated
   parallel at `|H| = Hmax`.
5. The antiparallel window width is set by `Hc_pin - Hc_free` (a
   softer free layer widens it).
6. Determinism: identical inputs reproduce the loop bit-for-bit.

Visual gate: SSIM > 0.92 against the five committed golden frames.

## Limiting cases for verification

- `R_up = R_dn` (or `P = 0`): GMR/TMR = 0, no magnetoresistance
  (tests 2, 3).
- `P -> 1` (half-metal): `R_AP -> infinity`, MR diverges (test 3).
- `|H| > Hc_pin`: both layers aligned, saturated parallel (test 4).
- `Hc_free -> Hc_pin`: the antiparallel window closes (test 5).

## Visual fallback

Static three-panel Canvas2D: the full `R(H)` loop is always drawn, so
the hysteresis reads without animation; only the operating point and
the stack arrows change with the swept field. The model curve is
time-independent.

## Citations

- Julliere, M., Phys. Lett. A 54, 225 (1975). `julliere1975`.
- Mott, N. F., Proc. R. Soc. A 153, 699 (1936). `mott1936`.
- Baibich, M. N. et al., Phys. Rev. Lett. 61, 2472 (1988).
  `baibich1988`.
- Dieny, B. et al., Phys. Rev. B 43, 1297 (1991). `dieny1991`.

## Stretch goals

- Angular magnetoresistance `R(theta) = R_P + (R_AP-R_P) sin^2(theta/2)`.
- Minor loops (free-layer-only switching) and the exchange-bias shift.
- Spin-transfer-torque switching at high current density.

## Risk register

- Sharp (step) switching is an idealisation of a real coercive
  transition: stated; the invariants target the resistance identities
  and the loop topology, which are exact.
- The captured loop phases fall on parallel plateaus; the always-drawn
  full loop makes the antiparallel plateau visible in every frame, and
  the antiparallel stack state is exercised by the field sweep.
- Single polarisation slider drives both electrodes (`P1 = P2`): the
  Julliere test also checks the asymmetric `P1 != P2` identity.
