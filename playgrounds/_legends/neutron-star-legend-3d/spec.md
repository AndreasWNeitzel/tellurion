---
title: Neutron Star Legend
slug: neutron-star-legend-3d
status: verified
audience: portfolio
created: 2026-05-20
primary_uc: AST3014
supporting_ucs: [FIS3030, MAA-HE, AST3017]
curriculum_year: legend
primary_citation: shapiro-teukolsky-bh-wd-ns
primary_chapter: 9
hero_candidate: true
tier: legend
hook: 'A teaspoon of neutron-star matter would weigh a billion tonnes; it spins up to 700 times a second, beams a radio lighthouse past Earth every rotation, and (for a magnetar) flashes an X-ray burst that briefly outshines the Galaxy.'
one_paragraph: 'A laboratory for the second-most-extreme object in the universe. Five interchangeable modes: Overview (rotating 1.4 M_sun NS with tilted magnetic-dipole field lines and radio-beam cones), Lighthouse (pulse profile P(t) as the beam sweeps past the observer line), Magnetar (B = 10^14 to 10^15 G with crustquake-driven X-ray flares), Structure (TOV mass-radius diagram + interior cross-section: outer crust, inner crust with nuclear pasta, outer core, inner core), and Spindown (magnetic dipole P(t) lengthening + observed glitch event with Delta P / P approximately 10^-6). The same NS is shared across modes so the user develops a single mental model. References: Shapiro and Teukolsky, Black Holes, White Dwarfs and Neutron Stars, 1983, Ch. 9 - 10; Lattimer and Prakash, ApJ 550 (2001) 426 (mass-radius); Lorimer and Kramer, Handbook of Pulsar Astronomy, 2005.'
caption: 'Figure 1. Neutron-star Legend: a multi-mode laboratory for radio pulsars (Overview, Lighthouse, Spindown), magnetars (Magnetar mode) and dense-matter physics (Structure with TOV mass-radius). Method: closed-form magnetic-dipole field geometry, classical magnetic-dipole spindown torque, TOV-solver interpolation for the M-R curve, 3D Canvas2D depth-sorted quads. Source: Shapiro and Teukolsky, Black Holes, White Dwarfs and Neutron Stars, Ch. 9.'
tags: [neutron-star, pulsar, magnetar, animation, three-d, live-readout, legend]
difficulty: 5
renderer: canvas2d
estimated_engagement_minutes: 8
share_state_keys: [mass_solar, period_ms, log_B, alpha_deg, mode]
supersedes: [pulsar-lighthouse-rotating-3d, magnetar-burst-3d]
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

# Neutron Star Legend

Five-mode laboratory for the second-most-extreme object in the universe.
Source: Shapiro and Teukolsky, *Black Holes, White Dwarfs and Neutron Stars*,
1983, Ch. 9 (`shapiro-teukolsky-bh-wd-ns`); Lattimer and Prakash, *ApJ* 550
(2001) 426 (`lattimer-prakash-mass-radius`); Lorimer and Kramer, *Handbook of
Pulsar Astronomy*, 2005 (`lorimer-kramer-pulsar-handbook`).

## Explainer

### What you are looking at

A neutron star is the collapsed core left when a massive star ends its
life as a supernova. About 1.4 solar masses are crushed into a sphere
roughly 12 kilometres across. The matter is mostly neutrons; its density
is comparable to that inside an atomic nucleus. The surface gravity is
$\sim 2 \times 10^{11}\,g_\oplus$, the magnetic field at the pole reaches
$10^{12}\,\mathrm{G}$ (or $10^{15}\,\mathrm{G}$ for magnetars), and the
rotation period ranges from $\sim 1.4\,\mathrm{ms}$ (the fastest known
millisecond pulsars) to several seconds. Five modes here let you flip
between the different observable signatures of the same object.

### Mode 1: Overview

The NS rotates about its spin axis at angular velocity
$\Omega = 2\pi / P$. The magnetic-dipole axis is tilted by an inclination
$\alpha$ from the spin axis (the misalignment that makes a pulsar
visible). The playground draws the rotating sphere, the dipole field
lines closing back on themselves around the magnetic equator, and the
two open-field-line bundles at the magnetic poles where coherent radio
emission escapes as a pair of beams (cones of half-opening angle
$\rho \sim 6^\circ \sqrt{P/1\,\mathrm{s}}$ for ordinary pulsars; Rankin
1993).

### Mode 2: Lighthouse

If the magnetic axis is misaligned with the spin axis and one of the
two beams sweeps across the Earth, we see a pulse once per rotation.
The pulse profile is the time-domain integral of the beam intensity
across our line of sight:

$$P(t) \;=\; \int_{\mathrm{beam}} I(\theta_b - \theta_{\rm los}(t))\,
                 \mathrm{d}\Omega,$$

where $\theta_b$ is the angular position inside the beam and
$\theta_{\rm los}(t) = \Omega t$ is the instantaneous line of sight.
For a Gaussian beam this gives a single Gaussian per rotation
(plus a second, weaker pulse if the second pole also crosses the
observer). The playground shows the live pulse profile P(t) against
the angular separation $\beta$ between the spin axis and the line of
sight.

### Mode 3: Magnetar

A magnetar has $B \sim 10^{14}$ to $10^{15}\,\mathrm{G}$, two to three
orders of magnitude stronger than a typical radio pulsar. Magnetic
energy stored in the crust ($E_B \sim 10^{45}$ to $10^{47}$ erg)
escapes in short, hard bursts when the crust fails: an X-ray flare
lasting $\sim 0.1$ to $10\,\mathrm{s}$, with a sharp peak luminosity
$L_X \sim 10^{37}$ to $10^{41}\,\mathrm{erg\,s^{-1}}$. SGR 1806-20
released $4 \times 10^{46}\,\mathrm{erg}$ in the giant flare of 2004
December 27. The playground spawns flare events and traces the X-ray
lightcurve.

### Mode 4: Structure (TOV mass-radius)

The NS interior balances pressure against gravity through the
Tolman-Oppenheimer-Volkoff (TOV) equation:

$$\frac{\mathrm{d}P}{\mathrm{d}r} \;=\;
   -\frac{G\,(\rho c^2 + P)\,(M(r)c^2 + 4\pi r^3 P)}
         {r^2\,c^4\,(1 - 2GM(r)/(rc^2))},
   \qquad
   \frac{\mathrm{d}M}{\mathrm{d}r} \;=\; 4\pi r^2\,\rho.$$

For each equation of state $P(\rho)$ this integrates to a mass-radius
relation $M(R)$. Different EOSs (soft like SLy, stiff like APR, mixed
quark) give different M-R curves; the family is bounded above by the
Tolman-VII upper limit $M_{\max} \lesssim 3\,M_\odot$. The playground
plots the M-R curve and shows the interior cross-section: outer crust
($\rho < 4 \times 10^{11}\,\mathrm{g\,cm^{-3}}$), inner crust with
nuclear pasta ($\rho \sim 10^{13}\,\mathrm{g\,cm^{-3}}$), outer core
of $n,p,e,\mu$ matter, and the inner core where exotic phases
(quark matter, hyperons, kaon condensates) may live.

### Mode 5: Spindown and glitches

A magnetic dipole radiates rotational kinetic energy at rate

$$\dot{E}_{\rm rot} \;=\; -\,\frac{2\,\mu^2\,\Omega^4\,\sin^2\alpha}
                                  {3\,c^3},
  \qquad
  \mu \;=\; \tfrac12\,B\,R^3,$$

where $\mu$ is the magnetic moment, $\Omega$ the spin angular
velocity, $\alpha$ the magnetic-axis inclination. With moment of
inertia $I \approx 10^{45}\,\mathrm{g\,cm^2}$ the spindown is
$\dot{\Omega} = \dot{E}_{\rm rot}/(I\Omega)$, giving the long-term
$P(t)$ lengthening (characteristic age
$\tau = P/(2\dot{P})$). Real young pulsars also show glitches:
sudden spin-ups $\Delta\Omega/\Omega \sim 10^{-6}$ from vortex
unpinning in the inner crust (Anderson and Itoh 1975). The
playground simulates a glitch event interrupting the secular
lengthening of $P(t)$.

### Symbols

- $M$: NS gravitational mass, in $M_\odot$.
- $R$: NS radius, $\sim 10$ to $14\,\mathrm{km}$.
- $P$: rotation period; $\Omega = 2\pi/P$.
- $\alpha$: angle between magnetic and spin axes.
- $\beta$: angle between spin axis and line of sight.
- $B$: surface magnetic-field strength; pulsars $10^{8}$ to $10^{13}\,\mathrm{G}$, magnetars $10^{14}$ to $10^{15}\,\mathrm{G}$.
- $\rho$: density; nuclear saturation $\rho_0 = 2.8 \times 10^{14}\,\mathrm{g\,cm^{-3}}$.
- $\mu = \tfrac12 B R^3$: magnetic moment.
- $\dot E_{\rm rot}$: spindown power (erg/s).
- $\tau = P / (2\dot P)$: characteristic age.

### Things to try

- Crab pulsar: $M = 1.4\,M_\odot$, $P = 33\,\mathrm{ms}$,
  $B = 4 \times 10^{12}\,\mathrm{G}$. Spin-down luminosity
  $\dot E_{\rm rot} = 4 \times 10^{38}\,\mathrm{erg\,s^{-1}}$, age 970 yr.
- PSR B1937+21 (millisecond pulsar): $P = 1.56\,\mathrm{ms}$,
  $B = 4 \times 10^8\,\mathrm{G}$. Recycled by accretion from a
  binary companion to spin near break-up.
- SGR 1806-20 (magnetar): $P = 7.5\,\mathrm{s}$,
  $B = 8 \times 10^{14}\,\mathrm{G}$. 2004 giant flare released
  $4 \times 10^{46}\,\mathrm{erg}$ in $\sim 0.2\,\mathrm{s}$.
- Slide $\alpha$ to zero (aligned rotator): no pulsation at all
  ($\sin^2\alpha = 0$ kills the spindown too; the NS remains
  rotating but invisible as a pulsar).

### Where this comes from

Shapiro and Teukolsky, *Black Holes, White Dwarfs and Neutron Stars*,
Wiley 1983, Ch. 9 to 10 (`shapiro-teukolsky-bh-wd-ns`) for the TOV
equation, magnetic-dipole spindown, and pulsar lighthouse model.
Lattimer and Prakash, *ApJ* 550 (2001) 426 (`lattimer-prakash-mass-radius`)
for the M-R curve. Lorimer and Kramer, *Handbook of Pulsar Astronomy*,
CUP 2005 (`lorimer-kramer-pulsar-handbook`) for pulse profiles, beaming
fractions, and glitch phenomenology. Anderson and Itoh, *Nature* 256
(1975) 25 (`anderson-itoh-glitch`) for the vortex-unpinning glitch
model. Hurley et al., *Nature* 434 (2005) 1098
(`hurley-sgr1806-20-2005`) for the SGR 1806-20 giant flare.
