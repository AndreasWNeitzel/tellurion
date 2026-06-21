---
title: Lane-Emden Polytrope
slug: polytrope-lane-emden
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: MAA-SA
supporting_ucs: []
curriculum_year: msc-y1
primary_citation: chandrasekhar1939
primary_chapter: 7
hook: 'The Lane-Emden solution is a star: see the density-shaded sphere restructure as the polytropic index changes.'
one_paragraph: 'The Lane-Emden polytrope shown as the star it describes. The dimensionless solution theta(xi) is mapped to a density-shaded sphere with rho/rho_c = theta(xi)^n: a bright dense core fading to a faint envelope, a cutaway wedge exposing the interior density run, and isodensity contour rings. Selecting the polytropic index n restructures the star: n = 0 is a compact uniform sphere, n = 1.5 (degenerate non-relativistic) and n = 3 (Chandrasekhar-limit white dwarf) are progressively more centrally concentrated, and n = 5 is a huge, formally infinite, diffuse envelope. A linked theta(xi) strip with the xi_1 marker and an animated radial probe ties the 1D solution to the 2D structure; xi_1 and the mass proxy are read out live. Reference: Chandrasekhar, An Introduction to the Study of Stellar Structure, Chapter 4; Kippenhahn and Weigert, Stellar Structure and Evolution.'
tags: [stellar, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
invariants:
  - key: bc-initial
    label: central boundary condition theta(0) = 1
    tolerance: 1e-10
  - key: bc-boundary
    label: theta reaches zero at the surface (finite-radius polytropes)
    tolerance: 1e-2
  - key: analytic-match
    label: xi_1 matches the closed form for n = 0, 1, 3
    tolerance: 0.01
what_to_try:
  - Step n from 0 to 5: the star goes from a uniform ball with a sharp edge to a centrally concentrated, diffuse cloud.
  - Compare the xi_1 markers: n=0 ends at sqrt(6), n=1 at pi, n=3 at 6.897, each checked against its closed form.
  - Select n=5: theta never reaches zero, so the polytrope has infinite radius and the star reads "diffuse".
references:
  - "Chandrasekhar, An Introduction to the Study of Stellar Structure."

---

# Lane-Emden polytrope

## Explainer

### What you are looking at

Before computers, the entire run of stellar structure could be
captured by one tidy ordinary differential equation, the Lane-Emden
equation, by assuming pressure is a simple power of density. It still
gives the right intuition: how centrally concentrated a star is, and
the famous result that a white dwarf has a maximum mass. The
playground integrates it for any polytropic index and shows the
density profile and global properties.

### The polytrope assumption

Replace the full thermodynamics by a polytropic relation between
pressure and density,

$$P = K\,\rho^{\,1 + 1/n},$$

where $n$ is the polytropic index. Combining this with hydrostatic
equilibrium and Poisson's equation, and writing the density as
$\rho = \rho_c\,\theta^{\,n}$ with a dimensionless radius $\xi$,
collapses everything to the Lane-Emden equation:

$$\frac{1}{\xi^2}\frac{d}{d\xi}
  \left(\xi^2\frac{d\theta}{d\xi}\right)
  = -\,\theta^{\,n},
  \qquad
  \theta(0)=1,\ \ \theta'(0)=0.$$

Integrating outward, $\theta$ falls to zero at the first root
$\xi_1$, which is the stellar surface.

### What the index controls

The single parameter $n$ tunes the structure from uniform to
extremely centrally condensed:

- $n=0$: constant density (incompressible), $\theta=1-\xi^2/6$.
- $n=1$: $\theta=\sin\xi/\xi$, an exact analytic solution.
- $n=1.5$: an adiabatic monatomic gas, the model for fully
  convective stars and non-relativistic white dwarfs.
- $n=3$: the Eddington standard model and relativistic white
  dwarfs; here the mass becomes independent of the central density,
  which is precisely the origin of the Chandrasekhar limiting mass.
- $n\to5$: infinite radius (the structure becomes unbound).

Global quantities follow from $\xi_1$ and $\theta'(\xi_1)$, for
example the central-to-mean density ratio
$\rho_c/\bar\rho = -\xi_1 / [3\,\theta'(\xi_1)]$, which grows sharply
with $n$ (more centrally concentrated). The playground sweeps $n$
and shows the profile, the surface $\xi_1$, and these derived
numbers.

### Things to try

- Set $n=1$ and confirm the analytic $\sin\xi/\xi$ profile with
  surface at $\xi_1=\pi$.
- Increase $n$ toward 5 and watch the star become extremely
  centrally concentrated and the radius diverge.
- Read the $n=3$ case: the mass-density degeneracy behind the
  Chandrasekhar mass.

### Where this comes from

The polytropic relation and the Lane-Emden equation follow Chandrasekhar,
*An Introduction to the Study of Stellar Structure*, Chapter 4, and
Hansen, Kawaler and Trimble, *Stellar Interiors*, Chapter 7.

## Physical setup

A self-gravitating sphere with equation of state $P = K \rho^{1 + 1/n}$. The dimensionless density profile $\theta(\xi) = (\rho/\rho_c)^{1/n}$ satisfies the Lane-Emden equation

$$\frac{d^2\theta}{d\xi^2} + \frac{2}{\xi} \frac{d\theta}{d\xi} + \theta^n = 0$$

with $\theta(0) = 1$, $\theta'(0) = 0$. The first zero $\xi_1$ marks the stellar surface.

## Governing equations

Closed-form solutions:
- $n = 0$: $\theta = 1 - \xi^2/6$, $\xi_1 = \sqrt{6}$.
- $n = 1$: $\theta = \sin\xi / \xi$, $\xi_1 = \pi$.
- $n = 5$: $\theta = 1/\sqrt{1 + \xi^2/3}$, $\xi_1 = \infty$ (infinite-radius limit; total mass finite).

Numerical solutions for arbitrary $n$. Two stellar-physics standards:
- $n = 1.5$: degenerate non-relativistic gas (low-mass MS, brown dwarfs), $\xi_1 \approx 3.6537$.
- $n = 3$: ultra-relativistic degenerate gas (Chandrasekhar-limit WD), $\xi_1 \approx 6.8969$.

## Numerical method

RK4 with $d\xi = 10^{-3}$, special-cased small-$\xi$ Taylor series to avoid the $1/\xi$ singularity (sim.js, unchanged). The trajectory is interpolated to a density field $\rho/\rho_c = \theta(\xi)^n$ and rendered as a sphere-shaded disc with a cutaway wedge and isodensity contours; a common physical scale keeps the radius differences between indices visible (the formally infinite $n = 5$ is clipped where the density drops below a small floor).

## Controls

- Polytropic index $n$ (dropdown selector: 0, 1, 1.5, 3, 5).

## Expected qualitative features

1. The star is a bright dense core fading to a faint envelope; $n = 0$ is a uniform sphere, higher $n$ is more centrally concentrated.
2. Radius grows with $n$; $n = 5$ is a large, diffuse, formally infinite envelope.
3. The cutaway wedge shows the same density run; isodensity rings are concentric.
4. The $\theta(\xi)$ strip bolds the selected $n$ with the $\xi_1$ dashed marker, and the radial probe stays synced between the sphere and the curve.

## Invariants and acceptance thresholds

| invariant | threshold | location |
| $n = 0$: $\xi_1 = \sqrt{6}$ | within 1 percent | invariants test |
| $n = 1$: $\xi_1 = \pi$ | within 1 percent | invariants test |
| $n = 1.5$: $\xi_1 \approx 3.654$ | within 1 percent | invariants test |
| $n = 3$: $\xi_1 \approx 6.897$ | within 1 percent | invariants test |
| analytic $n = 0$: $\theta = 1 - \xi^2/6$ exact | within $10^{-15}$ | invariants test |
| analytic $n = 1$: $\theta = \sin\xi/\xi$ exact | within $10^{-12}$ | invariants test |
| analytic $n = 5$: $\theta = 1/\sqrt{1+\xi^2/3}$ exact | within $10^{-12}$ | invariants test |
| numerical $n = 1$ at $\xi = 1$ matches $\sin(1)/1$ | within $10^{-3}$ | invariants test |

All confirmed in `invariants.test.mjs` (8 tests passing).

## Limiting cases for verification

- $n = 0$: uniform-density sphere (incompressible).
- $n = 1$: somewhat artificial but exactly solvable.
- $n = 5$: marginally bound; mass is finite but radius infinite.
- $n = 3/2, 3$: physical white-dwarf branches.

## Visual fallback

If KaTeX or Canvas2D is unavailable, the dropdown still operates.

## Citations

- Hansen-Kawaler-Trimble, *Stellar Interiors*, 2e, Ch. 7.
- Chandrasekhar, *Introduction to the Study of Stellar Structure*, classical reference.

## Stretch goals

- Mass-radius relation derived from $M \propto \xi_1^2 |\theta'(\xi_1)|$.
- Add the Lane-Emden function table to the readout.
- Hybrid EOS: polytrope at low $\rho$, different polytrope at high $\rho$.

## Risk register

- RK4 with $d\xi = 10^{-3}$ accumulates only ~$10^{-9}$ error over the integration range; precision is fine for the 1 percent invariants.
- The "M proxy" in the readout is dimensionless; useful for relative comparisons but not for physical mass.
