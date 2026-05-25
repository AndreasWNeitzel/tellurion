---
title: Transverse vs Longitudinal Modes on a 1D Chain
slug: transverse-vs-longitudinal-mode
status: verified
audience: portfolio
created: 2026-05-14
primary_uc: FIS2016
supporting_ucs: []
curriculum_year: bsc-y2s1
primary_citation: crawford-waves
primary_chapter: 5
hook: 'Two waves with the identical dispersion can look completely different: one shakes the chain sideways, the other squeezes it along its length.'
one_paragraph: 'On a 1D chain of masses and springs the dispersion relation can be the same for two polarizations, yet the motion looks distinct: a transverse mode displaces the masses perpendicular to the chain, a longitudinal mode compresses and rarefies it along the chain. The playground animates both at the same wavenumber so you see that polarization is independent of the frequency-wavenumber relation. This is exactly the distinction between seismic S and P waves, and between light and sound. Reference: Crawford, Waves (Berkeley Physics Course), Ch. 5.'
tags: [waves, animation, live-readout]
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
references:
  - "Crawford, Waves (Berkeley Physics Course Vol. 3), Ch. 5."
---
# Transverse vs longitudinal modes
Same dispersion, different polarization. Source: Crawford Ch. 5.

## Explainer

### What you are looking at

A wave on a chain of masses can wiggle in two completely different
ways: side to side across the direction it travels (transverse) or
back and forth along it (longitudinal). The playground runs both on
the same lattice so you see the polarization difference directly,
the distinction between a plucked string and a sound wave.

### One lattice, two polarisations

Take a 1D chain of $N$ masses of mass $m$ connected by springs of
stiffness $\kappa$ at lattice spacing $a$. The displacement of mass
$n$ from its equilibrium position is $u_n(t)$. Newton's second law
gives

$$\boxed{\;m\,\ddot u_n = \kappa\,(u_{n+1} - 2 u_n + u_{n-1}).\;}$$

Plug in a plane wave $u_n(t) = A\,\cos(k n a - \omega t)$ and you
get the dispersion relation

$$\boxed{\;\omega(k) = 2\,\sqrt{\frac{\kappa}{m}}\,\left|\sin\!\frac{k a}{2}\right|,\;}$$

with maximum frequency $\omega_{\max} = 2\sqrt{\kappa/m}$ at the
Brillouin zone edge $k = \pi/a$ and small-$k$ acoustic limit
$\omega \approx \sqrt{\kappa/m}\,|k|\,a$, i.e. a sound speed
$c_s = a\sqrt{\kappa/m}$.

This dispersion is the SAME for both polarisations. What differs is
the geometric direction of the displacement vector $\vec u_n$:

- *Transverse*: $\vec u_n$ is PERPENDICULAR to the chain axis $\hat x$.
  In 3D there are two independent transverse polarisations (along
  $\hat y$ and $\hat z$).
- *Longitudinal*: $\vec u_n$ is PARALLEL to $\hat x$. There is only
  one polarisation. The wave consists of alternating compressions
  ($u_{n+1} - u_n < 0$) and rarefactions ($u_{n+1} - u_n > 0$).

### Linear elasticity in a solid

In a 3D solid the transverse and longitudinal speeds differ because
shear and bulk moduli are independent:

$$c_L = \sqrt{\frac{K + (4/3)\mu}{\rho}},\qquad
  c_T = \sqrt{\frac{\mu}{\rho}},$$

with $K$ the bulk modulus, $\mu$ the shear modulus, $\rho$ the
density. Always $c_L > c_T$, so primary (P) seismic waves arrive
before secondary (S) waves; this is how the difference in their
arrival times pinpoints earthquake epicentres. The Earth's liquid
outer core was identified by Lehmann (1936) precisely because S
waves cannot propagate through a liquid (zero $\mu$) and the
seismic shadow zone is correspondingly empty.

### Why the distinction matters

Polarisation is a real physical degree of freedom, not a drawing
choice:

- Transverse waves can be POLARISED (the displacement direction can
  be filtered), and this is exploited everywhere from polaroid
  sunglasses through liquid-crystal displays to gravitational-wave
  detectors (the two LIGO polarisations $h_+$, $h_\times$).
- Longitudinal waves cannot be polarised.
- Light is purely transverse (Maxwell's equations forbid a
  longitudinal mode in vacuum); sound in a fluid is purely
  longitudinal (fluids have zero shear modulus).

### Symbols, at a glance

- $u_n(t)$, displacement of mass $n$ from equilibrium.
- $m$, mass; $\kappa$, nearest-neighbour spring constant; $a$, lattice
  spacing.
- $k$, wavenumber; $\omega$, angular frequency.
- $c_s = a\sqrt{\kappa/m}$, the long-wavelength sound speed.
- $K$, $\mu$, bulk and shear moduli of an elastic solid.
- $c_L$, $c_T$, longitudinal and transverse wave speeds.

### Things to try

- Run the transverse mode and watch masses move across the chain
  (string-like); switch to longitudinal and watch compressions and
  rarefactions travel along it (sound-like).
- Confirm both share the same $\omega(k)$: the propagation speed does
  not depend on polarization, only the displacement direction does.
- Note the longitudinal density pattern (bunching) vs the transverse
  sinusoidal offset.

### Bibliographic origin

The 1D linear-chain dispersion is in Brillouin, *Wave Propagation in
Periodic Structures* (Dover 1953), Ch. 1; the modern textbook
treatment is Crawford, *Waves* (Berkeley Physics Course Vol. 3,
McGraw-Hill 1968), Ch. 5; French, *Vibrations and Waves* (Norton
1971), Ch. 7. The Earth's-core S-wave shadow zone discovery is
Lehmann, *Bureau Central Sismologique International, Travaux
Scientifiques* **14** (1936) 87. A standard solid-state reference
is Ashcroft and Mermin, *Solid State Physics* (Holt 1976), Ch. 22.
