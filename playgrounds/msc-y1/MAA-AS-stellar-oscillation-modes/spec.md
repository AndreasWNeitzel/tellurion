---
title: "Stellar Oscillation Modes"
slug: stellar-oscillation-modes
status: verified
audience: portfolio
created: 2026-05-15
primary_uc: MAA-AS
primary_citation: aerts2010
supporting_ucs: []
curriculum_year: msc-y1
hook: 'A stellar surface rings in spherical-harmonic patterns; the radial order n counts the wave nodes in depth, shown by the eigenfunction of a real polytrope.'
one_paragraph: 'The surface displacement Y_l^m(theta, phi) cos(omega t) drawn as a radially displaced sphere with its nodal lines; the diagnostic is the radial eigenfunction xi_r(r) of an n=3 Lane-Emden polytrope with n interior nodes and the p-mode turning point marked, frequencies from JWKB quantisation scaled to a solar-like Delta_nu.'
tags: [stellar, asteroseismology, animation, multi-panel, live-readout]
difficulty: 4
tier: large
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 5
share_state_keys: [n, l, m]
invariants:
  - key: radial-nodes
    label: radial eigenfunction has exactly n interior nodes
    tolerance: 0
  - key: large-separation
    label: l=0 ladder spacing equals the pinned Delta_nu
    tolerance: 0.01
  - key: harmonic-norm
    label: spherical harmonics orthonormal over the sphere
    tolerance: 0.01
what_to_try:
  - Sweep m from -l to l at fixed n and l; the surface pattern reorganises but the radial eigenfunction never changes.
  - Raise n and count the new nodes appearing in the eigenfunction; the frequency climbs by the large separation.
  - Raise l at fixed n; the p-mode turning point moves outward and the cavity shrinks toward the surface.
references:
  - "Aerts, Christensen-Dalsgaard, Kurtz, Asteroseismology."
---

# Stellar Oscillation Modes

A stellar surface rings in the chosen spherical-harmonic pattern $Y_l^m(\theta, \phi) \cos(\omega t)$, drawn as a radially displaced sphere (red outward, blue inward) with its nodal lines. Sliders for radial order $n$, degree $l$, azimuthal order $m$ morph the pattern. The diagnostic shows the radial part of the same mode, the displacement eigenfunction $\xi_r(r)$ of a real $n = 3$ Lane-Emden polytrope, whose number of interior nodes is the radial order $n$, with the p-mode (acoustic) turning point marked. The three integers divide cleanly: $l$ and $m$ shape the surface, $n$ counts the nodes in depth.

## Explainer

### What you are looking at

A star is not a static ball; it is a resonant cavity that rings in
millions of standing-wave patterns at once, like a 3D drumhead. The
playground lets you pick one of those patterns by its three quantum-
like numbers and watch the stellar surface breathe, ring, and ripple
in that exact shape, with a propagation diagram showing where the
mode lives.

### The mode pattern

A small oscillation of the star is separated into a radial part and
an angular part. The angular part is a spherical harmonic, so the
surface displacement of a single mode is

$$\xi(\theta,\phi,t) \;\propto\;
  Y_\ell^m(\theta,\phi)\,\cos(\omega_{n\ell}\,t),$$

labelled by three integers:

- the radial order $n$: how many nodes the wave has from the center
  to the surface (the overtone number),
- the degree $\ell$: the number of node lines on the surface (total
  angular structure),
- the azimuthal order $m$: how many of those node lines pass through
  the poles ($-\ell \le m \le \ell$).

$\ell=0$ is a pure radial pulsation (the whole star breathing);
higher $\ell$ tiles the surface into a finer checkerboard of in-and-
out patches.

### The acoustic cavity and the radial nodes

This playground treats acoustic (pressure, p) modes, the dominant
class for solar-like oscillators. An acoustic mode is trapped between
the stellar surface, where it reflects, and a lower turning point
$r_t$ set by the Lamb frequency $S_\ell$:

$$S_\ell^2 = \frac{\ell(\ell+1)\,c^2}{r^2},
  \qquad \omega = S_\ell(r_t).$$

Inside the cavity the radial wavenumber is
$k_r^2 = (\omega^2 - S_\ell^2)/c^2$, and the asymptotic (JWKB)
quantisation condition $\int_{r_t}^{R} k_r\,dr = (n + \tfrac12)\pi$
fixes the eigenfrequencies. It also fixes the eigenfunction
$\xi_r(r) \propto \cos(\Phi(r) - \pi/4)$, which carries exactly $n$
interior nodes. The sound speed comes from the genuine $n_{\rm poly}=3$
Lane-Emden structure: for a polytrope $c^2 = \Gamma_1 P/\rho \propto
\theta(\xi)$. Higher $\ell$ pushes $r_t$ outward (the cavity shrinks
toward the surface), so high-degree modes never sample the core; the
turning point is shown on the diagnostic. Only the overall frequency
scale is set externally, pinned so the radial large separation matches
a solar-like $\Delta\nu = 135\ \mu$Hz; the structure is the real
polytrope. Gravity (g) modes, which need the Brunt-Vaisala frequency
$N$, are outside this acoustic model and are not drawn.

### Things to try

- Set $\ell=0$ for the pure radial "breathing" mode (turning point at
  the centre), then raise $\ell$ to tile the surface more finely and
  watch the turning point march outward.
- Vary $m$ at fixed $\ell$ and watch the surface nodal lines rotate
  from zonal (latitude bands) to sectoral (meridional segments), while
  the radial eigenfunction stays put.
- Raise $n$ and count the extra nodes appearing in the eigenfunction;
  each one is another shell where the gas reverses direction.

### Where this comes from

The spherical-harmonic decomposition and the asymptotic (JWKB)
acoustic theory follow Aerts, Christensen-Dalsgaard and Kurtz,
*Asteroseismology*, Ch. 1 and 3 (eq. 3.215-3.234); Tassoul, ApJS 43
(1980) 469; the polytrope structure is the standard Lane-Emden
solution (Chandrasekhar, *Stellar Structure*, Ch. 4).

## Physical setup

Surface displacement: $\xi(\theta, \phi, t) = Y_l^m(\theta, \phi) \cos(\omega_{n,l} t)$, the real orthonormal spherical harmonic. Structure: the $n_{\rm poly}=3$ Lane-Emden polytrope, integrated by RK4 to the surface zero $\xi_1 = 6.89685$, giving $c^2 \propto \theta(\xi)$. Acoustic frequencies from the JWKB quantisation $\int_{r_t}^{R} k_r\,dr = (n + 1/2)\pi$ with $k_r^2 = (\omega^2 - S_l^2)/c^2$ and Lamb frequency $S_l^2 = l(l+1)c^2/r^2$; the lower turning point is $\omega = S_l(r_t)$. Frequencies are scaled so the $l = 0$ large separation equals $\Delta\nu = 135\ \mu$Hz. The radial eigenfunction is the JWKB form $\xi_r \propto \cos(\Phi - \pi/4)$, displayed with the JWKB amplitude clipped so interior oscillations stay visible.

## Controls

- $n$ (0 to 5), $l$ (0 to 6), $m$ ($-l$ to $l$)
- Play / Pause, Reset

## Invariants

- Lane-Emden first zero $\xi_1 = 6.89685$ within $10^{-3}$.
- Radial eigenfunction has exactly $n$ interior nodes for all tested $(n, l)$.
- $l = 0$ ladder spacing equals the pinned $\Delta\nu = 135\ \mu$Hz within $0.01\ \mu$Hz.
- Frequency increases with $n$ (fixed $l$) and with $l$ (fixed $n$).
- Turning point is the centre for $l = 0$ and moves monotonically outward with $l$, staying in $(0, 1)$.
- Spherical harmonics orthonormal over the sphere: $\langle Y_2^1, Y_2^1\rangle = 1$, $\langle Y_2^1, Y_3^1\rangle = 0$ within $10^{-2}$.

## Citations

Aerts, Christensen-Dalsgaard, Kurtz, "Asteroseismology", Springer 2010. Tassoul, "Asymptotic approximations for stellar nonradial pulsations", ApJS 43 (1980) 469. Chandrasekhar, "An Introduction to the Study of Stellar Structure", 1939, Ch. 4.
