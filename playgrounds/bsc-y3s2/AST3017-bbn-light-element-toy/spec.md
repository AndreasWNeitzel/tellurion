---
title: BBN Light-Element Abundances
slug: bbn-light-element-toy
status: verified
audience: portfolio
created: 2026-05-14
primary_uc: AST3017
supporting_ucs: []
curriculum_year: bsc-y3s2
primary_citation: liddle-cosmology
primary_chapter: 11
hook: 'The first three minutes set the universe''s helium and deuterium; both are fixed by a single number, the baryon-to-photon ratio.'
one_paragraph: 'Big Bang nucleosynthesis forged the light elements in the first few minutes. Their final abundances, the helium mass fraction Y_p, deuterium D/H, and lithium-7, depend almost entirely on one parameter: the baryon-to-photon ratio eta. The playground shows empirical fits of these abundances against eta_10, so you can dial the baryon density and watch helium barely move while deuterium drops steeply, then see where all three curves agree, the consistency test that pins down the cosmic baryon content. The stubborn lithium mismatch is the standing lithium problem. Reference: Liddle, An Introduction to Modern Cosmology, Ch. 11.'
tags: [cosmology, animation, live-readout]
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
  - "Liddle, An Introduction to Modern Cosmology, Third ed., Ch. 11."
---
# BBN light-element abundances
Empirical fits of $Y_p$, $D/H$, $^7$Li$/H$ vs $\eta_{10}$. Source: Liddle Ch. 11.

## Explainer

### What you are looking at

In the universe's first few minutes, nuclear reactions forged the
light elements. How much helium, deuterium, and lithium were made
depends on essentially one number: how many baryons there were per
photon. The playground sweeps that number and shows the three
abundances respond, and where they agree, which is one of the strongest
tests of the hot Big Bang.

### The one parameter

Big Bang nucleosynthesis (BBN) is controlled by the baryon-to-photon
ratio, usually quoted as $\eta_{10} = 10^{10}\,n_b/n_\gamma$. More
baryons (higher $\eta$) means reactions run faster and more completely.
The yields are summarized by empirical fits:

- Helium mass fraction $Y_p \approx 0.247 + 0.014\log_{10}\eta_{10}$:
  almost flat, because nearly all neutrons end up in helium-4 once
  deuterium forms.
- Deuterium $D/H$: steeply decreasing in $\eta$ (deuterium is fragile,
  more baryons burn more of it away), so it is the best "baryometer".
- Lithium-7 $^7\mathrm{Li}/H$: a non-monotonic dip-and-rise.

### Why this is a pillar of cosmology

These three curves are predicted with no free parameters once $\eta$ is
fixed. They must all agree at one value of $\eta$, and they do, near
$\eta_{10}\approx 6$, which independently matches the baryon density
measured from the cosmic microwave background. That concordance from
totally different physics (nuclear reactions at $t\sim$ minutes vs.
photon physics at $t\sim$ 380,000 yr) is a triumph of the standard
model. The one wrinkle the playground also shows: the predicted and
observed lithium disagree by a factor of about three, the unresolved
"primordial lithium problem".

### Things to try

- Slide $\eta$ and watch deuterium plunge while helium barely moves
  (why D is the baryometer).
- Find the $\eta$ where D and helium agree; note it matches the CMB
  value, the concordance.
- Compare the lithium curve to the observed band and see the standing
  factor-of-3 discrepancy.

### Where this comes from

The BBN abundance fits versus $\eta_{10}$ and the concordance argument
follow Liddle, *An Introduction to Modern Cosmology*, Chapter 11.
