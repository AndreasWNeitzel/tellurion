---
title: Phased Array Beam Steering
slug: antenna-array-beam-steering
status: verified
audience: portfolio
created: 2026-06-23
primary_uc: FIS2013
supporting_ucs: []
curriculum_year: bsc-y2s1
primary_citation: balanis
primary_chapter: 6
hook: 'A radar sweeps the sky without turning: change the phase fed to each antenna and the beam swings electronically, instantly, with nothing mechanical moving.'
one_paragraph: 'A linear array of N identical radiators with element spacing d and a progressive phase shift beta has the array factor AF(psi) = sin(N psi / 2) / sin(psi / 2) with psi = k d sin(theta) + beta. The fields add in phase only where psi = 0, so the main beam points to sin(theta0) = -beta/(kd): a linear phase taper steers the beam electronically. A longer array (larger N) narrows the main lobe and lowers the side lobes, while a spacing of one wavelength or more lets a grating lobe (a full-strength copy of the main beam) appear in an unwanted direction. The playground draws the polar power pattern with the N phased elements on the baseline, sweeps the steer angle, and reports the half-power beamwidth, the peak side-lobe level, and the grating-lobe count, with the same array factor shown in decibels below. Reference: Balanis, Antenna Theory, Ch. 6.'
tags: [electromagnetism, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
invariants:
  - key: main-peak
    label: main beam peaks at the steer angle
    tolerance: 1e-6
  - key: no-grating-when-dense
    label: no grating lobe for d < lambda/2
    tolerance: 1
  - key: bounded
    label: state stays finite
    tolerance: 1
what_to_try:
  - Sweep the steer angle and watch the beam swing with only the feed phases changing.
  - Increase N to narrow the beam and lower the side lobes.
  - Push the spacing past one wavelength to raise a grating lobe.
references:
  - "Balanis, Antenna Theory: Analysis and Design (2016), Ch. 6."
  - "Kraus and Marhefka, Antennas for All Applications (2002), Ch. 5."

---
# Phased array beam steering
$AF=\frac{\sin(N\psi/2)}{\sin(\psi/2)}$, $\psi=kd\sin\theta+\beta$; the beam points to $\sin\theta_0=-\beta/(kd)$. Source: Balanis Ch. 6.

## Physical setup

$N$ isotropic radiators sit on a straight line, spaced $d$ apart, each fed
the same amplitude but with a constant phase increment $\beta$ between
neighbours. Far from the array, the total field is the single-element
pattern times the array factor, which is set purely by the geometry and
the feed phases.

## Equations

With wavenumber $k=2\pi/\lambda$ and electrical angle
$\psi = kd\sin\theta + \beta$, the array factor is the geometric sum

$$AF(\psi)=\sum_{n=0}^{N-1}e^{i n \psi}=\frac{\sin(N\psi/2)}{\sin(\psi/2)},$$

with normalised power $\left(\tfrac{|AF|}{N}\right)^2$. The main beam is at
$\psi=0$, that is

$$\sin\theta_0=-\frac{\beta}{kd},$$

so a progressive phase taper steers the beam. Grating lobes occur at
$\psi=2\pi m$, i.e. $\sin\theta=\sin\theta_0+m\lambda/d$, which has extra
solutions in $[-1,1]$ once $d\gtrsim\lambda$. The broadside half-power
beamwidth scales as $\lambda/(Nd)$ and widens as $1/\cos\theta_0$ when the
beam is steered off broadside.

## Numerical method

The array factor and element phases are closed-form. The half-power
beamwidth is found by scanning outward from $\theta_0$ to the $-3$ dB
points; the peak side-lobe level by scanning the pattern outside the main
and grating lobes; the grating-lobe directions by solving the
$\sin\theta\in[-1,1]$ condition.

## Controls

- N: number of elements (2 to 16).
- d/lambda: element spacing in wavelengths (0.25 to 1.5).
- steer theta0: commanded beam angle (auto-sweeps like a radar).
- Reset, Pause.

## Expected qualitative features

- The main lobe points exactly at the steer angle.
- More elements give a narrower main lobe and lower side lobes.
- Steering off broadside widens the beam (the $1/\cos\theta_0$ factor).
- A grating lobe appears once the spacing reaches about one wavelength.

## Invariants and acceptance

- The normalised power equals 1 at the steer angle for every setting.
- No grating lobe exists when $d<\lambda/2$ at any steer angle.
- All reported quantities remain finite.

## Explainer

### What you are looking at

The blue lobe is the radiation pattern: how much power the array sends in
each direction. The yellow line is the commanded beam direction, and the
coloured dots on the baseline are the antennas, tinted by the phase fed to
each one. Sweeping the steer angle changes only those phases, yet the
whole beam swings. That is electronic beam steering, the basis of radar,
5G base stations, and radio-telescope arrays.

### Why it matters

Mechanical dishes are slow and wear out; a phased array repoints in
microseconds and can even form several beams at once. The cost is the side
lobes (power leaking in other directions) and grating lobes (full-strength
copies of the beam) that appear if the elements are spaced too far apart,
which is why practical arrays keep $d\approx\lambda/2$.

### Where this comes from

Balanis, *Antenna Theory: Analysis and Design* (2016), Ch. 6; Kraus and
Marhefka, *Antennas for All Applications* (2002), Ch. 5.
