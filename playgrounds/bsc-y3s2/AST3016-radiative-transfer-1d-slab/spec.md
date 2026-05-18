---
title: 1D Radiative Transfer (Uniform Slab)
slug: radiative-transfer-1d-slab
status: verified
audience: portfolio
created: 2026-05-14
primary_uc: AST3016
supporting_ucs: []
curriculum_year: bsc-y3s2
primary_citation: rybickilightman1979
primary_chapter: 1
hook: 'Look through a glowing slab: what you see is the background dimmed by absorption plus the slab''s own glow, blended by how thick it is.'
one_paragraph: 'The equation of radiative transfer for a uniform slab with constant source function S and optical depth tau has a clean closed form: I(tau) = I_in e^(-tau) + S(1 - e^(-tau)). The emerging intensity interpolates between the background I_in (transparent slab, tau much less than 1) and the slab''s own source function S (opaque slab, tau much greater than 1). The playground sweeps tau and the source contrast and shows the line going into emission or absorption, which is exactly why a spectral line appears bright or dark depending on the temperature structure. Reference: Rybicki and Lightman, Radiative Processes in Astrophysics, Ch. 1.'
tags: [stellar, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
---
# 1D radiative transfer
Slab with constant $S$ and finite $\tau$; closed-form $I(\tau) = I_{in} e^{-\tau} + S(1-e^{-\tau})$. Source: Rybicki-Lightman Ch. 1 (`rybickilightman1979`).
