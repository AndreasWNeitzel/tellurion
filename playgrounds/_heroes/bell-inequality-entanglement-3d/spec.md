---
title: Bell Inequality and Quantum Entanglement (Hero)
slug: bell-inequality-entanglement-3d
status: verified
audience: portfolio
created: 2026-05-20
primary_uc: FIS3007
supporting_ucs: [FIS3003]
curriculum_year: hero
primary_citation: bell-1964
primary_chapter: 1
hero_candidate: true
hook: 'Two photons in a singlet state, two distant polarizers, one measured correlation. Quantum mechanics predicts E = -cos(2(a-b)); any local hidden-variable theory cannot exceed CHSH S = 2. Aspect 1982 saw S = 2.7, well above the bound.'
one_paragraph: 'A polarization-entangled photon pair is emitted from a common source toward two distant detectors. Alice (left) and Bob (right) each set a polarizer angle and record + or - outcomes. The expectation of the product, E(a, b) = <x y>, equals -cos(2 (a - b)) in quantum mechanics (singlet correlation), independent of any local hidden variable. The CHSH statistic S = E(a,b) - E(a,b) + E(a,b) + E(a,b) is bounded by 2 in any local theory (Clauser, Horne, Shimony, Holt 1969) but reaches the Tsirelson value 2 sqrt 2 ~ 2.828 for the singlet at the optimal angle set a=0, a=45, b=22.5, b=67.5 deg. Aspect et al. 1982 measured S ~ 2.7, definitively ruling out local realism. The playground sets angles, accumulates a finite-sample correlation E, and computes the CHSH S in real time. Reference: Bell, Physics 1 (1964) 195; CHSH, PRL 23 (1969) 880.'
caption: 'Figure 1. Bell-CHSH experiment. Two entangled photons fly to detectors Alice and Bob; the polarizer angles a, b produce correlation E(a, b) = -cos(2(a-b)) for the singlet. The CHSH bar (right) shows the measured S statistic; the classical bound S = 2 and the Tsirelson quantum maximum 2 sqrt 2 are marked. Method: closed-form singlet correlation + Monte Carlo finite-sample E. Source: Bell, Physics 1 (1964) 195.'
tags: [quantum, animation, live-readout]
difficulty: 4
tier: single
renderer: canvas2d
estimated_engagement_minutes: 5
share_state_keys: [angle_a, angle_ap, angle_b, angle_bp]
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

# Bell inequality and quantum entanglement
Singlet correlation + CHSH. Source: Bell, *Physics* 1 (1964) 195; CHSH derivation: Clauser, Horne, Shimony, Holt, *Phys. Rev. Lett.* 23 (1969) 880; experimental verification: Aspect et al., *Phys. Rev. Lett.* 49 (1982) 91.

## Explainer

### What you are looking at

A central source produces a pair of photons in a polarization
*singlet state*. One flies left toward Alice's detector, the other
right toward Bob's. Both detectors have a linear polarizer set at
some angle and a single-photon counter that records the outcome
$+1$ (photon passed) or $-1$ (photon absorbed). Each photon's
measurement looks completely random, but when you compare Alice's
and Bob's records the pairs are *correlated*, and the correlation
violates any classical local-realist explanation.

### The quantum prediction

For the singlet state $|\psi^-\rangle = (|H\rangle_A |V\rangle_B -
|V\rangle_A |H\rangle_B)/\sqrt 2$, the probability that Alice and
Bob get the same sign with polarizer angles $a$ and $b$ is

$$P(=) \;=\; \tfrac{1}{2}\big[1 - \cos\!\big(2(a-b)\big)\big],$$

and the correlation $E(a,b) = \langle x_A x_B \rangle = -\cos
\!\big(2(a-b)\big)$. When the angles align ($a = b$) the
photons are perfectly *anti*-correlated; when they differ by
$45^\circ$, the correlation vanishes; at $90^\circ$ they are
perfectly correlated.

### The CHSH inequality

Clauser, Horne, Shimony and Holt (1969) showed that for any local
hidden-variable theory the linear combination

$$S \;=\; E(a, b) - E(a, b') + E(a', b) + E(a', b')$$

is bounded by $|S| \le 2$, irrespective of the choice of angles.
The bound follows from arithmetic plus locality and is therefore a
prediction shared by every conceivable classical model.

### What quantum mechanics gives

Substituting $E_{\rm QM}(a, b) = -\cos(2(a-b))$ and maximising over
angle choices yields

$$|S|_{\rm QM}^{\rm max} \;=\; 2\sqrt 2 \;\approx\; 2.828,$$

the Tsirelson bound. The optimum is attained at the angle set $a = 0$,
$a' = \pi/4$, $b = \pi/8$, $b' = 3\pi/8$, and you can hit it
exactly with the "optimal angles" preset in the playground. The
experimental observation that $|S| > 2$ (Aspect 1982, $S = 2.697 \pm
0.015$; loophole-free Hensen, Giustina, Shalm 2015) rules out *all*
local hidden-variable theories.

### Why the correlation cannot be classical

Imagine each photon carries a "secret" classical orientation $\lambda$.
For Alice's outcome to be $\pm 1$, $\lambda$ must determine it through
some function $A(a, \lambda) \in \{+1, -1\}$. By the bilinearity of
sums of $\pm 1$ values constrained by local choice, any
$E_{\rm LHV}(a, b)$ is a Lipschitz function of $a - b$ with slope at
most $1/(\pi/2)$. The smooth $\cos(2\theta)$ pinches the corners of
the Lipschitz envelope, and that pinch is the CHSH violation.

### Symbols

- $|\psi^-\rangle$: polarization-singlet state of two photons.
- $a, a', b, b'$: detector angle settings (radians).
- $x_A, x_B \in \{-1, +1\}$: single-shot outcomes.
- $E(a, b) = \langle x_A x_B \rangle$: correlation.
- $S$: CHSH statistic.
- Tsirelson bound: $|S| \le 2\sqrt 2$.
- Classical bound: $|S| \le 2$.

### Things to try

- Hit the "optimal angles" preset to see $|S| = 2\sqrt 2 = 2.828$.
- Set $a = b$: $E = -1$ (perfect anticorrelation).
- Set $a = b + \pi/2$: $E = +1$ (perfect correlation; Bob's $+1$
  outcomes pair with Alice's $+1$).
- Cycle the angle settings to traverse the full CHSH curve and watch
  $S$ pass through both $\pm 2\sqrt 2$.

### Where this comes from

Bell, *Physics* 1 (1964) 195 introduced the
inequalities. The CHSH form is in Clauser, Horne, Shimony, Holt,
*Phys. Rev. Lett.* 23 (1969) 880. The first decisive
experiment is Aspect, Grangier and Roger, *Phys. Rev. Lett.* 49
(1982) 91. Loophole-free tests: Hensen et al.
*Nature* 526 (2015) 682; Giustina et al. *Phys. Rev. Lett.* 115
(2015) 250401; Shalm et al. *Phys. Rev. Lett.* 115 (2015) 250402.
