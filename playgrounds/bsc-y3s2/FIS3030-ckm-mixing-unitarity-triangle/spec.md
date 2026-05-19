---
title: CKM Mixing Unitarity Triangle
slug: ckm-mixing-unitarity-triangle
status: verified
audience: portfolio
created: 2026-05-14
primary_uc: FIS3030
supporting_ucs: []
curriculum_year: bsc-y3s2
primary_citation: griffiths-particles
primary_chapter: 10
hook: 'The CKM unitarity condition is three complex vectors that close into a triangle; its area is CP violation.'
one_paragraph: 'The CKM unitarity triangle shown as the vector identity V_ud V*_ub + V_cd V*_cb + V_td V*_tb = 0: three complex side-vectors added tip-to-tail, closing the triangle, with angle arcs alpha/beta/gamma and a travelling marker emphasising closure. The enclosed area is the Jarlskog invariant, so a CP-asymmetry panel shows the B0 vs B0-bar golden-mode rate difference (~ sin 2 beta) breathing in time: it vanishes for a flat triangle (no CP violation) and grows with the area. A compact |V_ij| magnitude heatmap accompanies the triangle, and the rho-bar and eta-bar sliders move its apex. Reference: Griffiths, Introduction to Elementary Particles, Chapter 9; the PDG review of the CKM quark-mixing matrix.'
tags: [nuclear-particle, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
---
# CKM unitarity triangle
Wolfenstein parameterization; triangle area is Jarlskog (CP violation). Source: Griffiths-Particles Ch. 10 (`griffiths-particles`).

## Explainer

### What you are looking at

Quarks do not decay along clean family lines: an up-type quark can turn
into any down-type quark, with amplitudes set by the CKM matrix.
Unitarity of that matrix collapses into a triangle in the complex
plane, and whether the triangle has nonzero area is exactly whether
nature treats matter and antimatter differently (CP violation).

### The unitarity triangle

Weak decays mix the down quarks through a unitary $3\times3$ matrix.
The first-third-column orthogonality relation,

$$V_{ud}V_{ub}^* + V_{cd}V_{cb}^* + V_{td}V_{tb}^* = 0,$$

is three complex numbers summing to zero, so drawn tip-to-tail they
close into a triangle whose apex is the Wolfenstein parameters
$(\bar\rho,\bar\eta)$. The interior angles $\alpha,\beta,\gamma$ are
measurable in B-meson decays.

### Area equals CP violation

The triangle has nonzero area only if the CKM matrix carries an
irreducible complex phase. That area is (up to a factor) the Jarlskog
invariant $J$, the single parameter-free measure of CP violation in the
quark sector. The "golden mode" decay-rate asymmetry between $B^0$ and
$\bar B^0$ is $\sin 2\beta$, which vanishes for a flat
($\bar\eta\to0$) triangle and grows with its area. A flat triangle
means CP is conserved; the measured nonzero area is why the Standard
Model violates CP, a necessary (though insufficient) ingredient for
the universe's matter-antimatter asymmetry. The playground lets you
drag $(\bar\rho,\bar\eta)$ and watch the triangle open, the angles
change, and the $B$ vs $\bar B$ rate asymmetry appear.

### Things to try

- Lower $\bar\eta$ toward 0: the triangle flattens, $\sin 2\beta\to0$,
  the $B^0/\bar B^0$ bars equalize (CP suppressed).
- Open it up: the area (Jarlskog $J$) grows and the decay-rate
  asymmetry appears (CP violated).
- Read the angles $\alpha,\beta,\gamma$: exactly what B-factories
  measure to over-constrain the triangle.

### Where this comes from

The CKM matrix, the unitarity triangle, the Jarlskog invariant, and
the $\sin 2\beta$ golden-mode asymmetry follow Griffiths,
*Introduction to Elementary Particles*, Chapter 10.

## Explainer

### What you are looking at

Quarks do not decay along clean family lines: an up-type quark can turn
into any down-type quark, with amplitudes set by the CKM matrix. The
constraint that this matrix is unitary collapses into a triangle in the
complex plane, and whether that triangle has nonzero area is exactly
whether nature violates CP symmetry (treats matter and antimatter
differently).

### The CKM matrix and the triangle

Weak decays mix the three down-type quarks through a $3\times3$ unitary
matrix $V_\text{CKM}$. Unitarity ($V V^\dagger = I$) gives orthogonality
relations between columns; the one between the first and third,

$$V_{ud}V_{ub}^* + V_{cd}V_{cb}^* + V_{td}V_{tb}^* = 0,$$

is a sum of three complex numbers equal to zero, so plotted in the
complex plane they close into a triangle, the unitarity triangle. The
Wolfenstein parameterization writes the entries as a power series in
$\lambda \approx 0.225$ (the Cabibbo angle), making the small hierarchy
explicit and the apex of the triangle the parameters $(\bar\rho,
\bar\eta)$.

### Area = CP violation

The triangle has nonzero area only if the CKM matrix has an
irreducible complex phase. That area is, up to a factor, the Jarlskog
invariant $J$:

$$J = \text{Im}\big(V_{ud}V_{cb}V_{ub}^*V_{cd}^*\big)
  \;\approx\; 3\times10^{-5},$$

the single parameter-independent measure of CP violation in the quark
sector. A flat (zero-area) triangle would mean CP is conserved; the
measured nonzero area is why the Standard Model violates CP, a
necessary ingredient for the matter-antimatter asymmetry of the
universe (though far too small to explain it alone). The playground
lets you vary the Wolfenstein parameters and watch the triangle, and
its area $J$, change.

### Things to try

- Set the CP-violating parameter to zero and watch the triangle
  collapse to a line (area $\to 0$, CP conserved).
- Restore it and see the triangle open up; its area is the Jarlskog
  $J$.
- Note the side lengths are very unequal: the $\lambda$ hierarchy of
  the Wolfenstein parameterization.

### Where this comes from

The CKM matrix, the Wolfenstein parameterization, the unitarity
triangle, and the Jarlskog invariant follow Griffiths, *Introduction to
Elementary Particles*, Chapter 10.
