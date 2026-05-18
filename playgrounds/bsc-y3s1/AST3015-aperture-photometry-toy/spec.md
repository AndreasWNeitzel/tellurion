---
title: Aperture Photometry
slug: aperture-photometry-toy
status: verified
audience: portfolio
created: 2026-05-14
primary_uc: AST3015
supporting_ucs: []
curriculum_year: bsc-y3s1
primary_citation: howell-ccd
primary_chapter: 5
hook: 'To measure a star''s brightness you add up the light in a circle and subtract the sky from a ring around it; get the radii wrong and the number is wrong.'
one_paragraph: 'Aperture photometry is how you turn a star image into a number. The playground drops a synthetic Moffat point-spread function onto a noisy CCD frame, then sums the counts inside a circular aperture and estimates the background from a surrounding sky annulus to recover the true flux. You move the aperture and annulus radii and watch the measured flux converge to or miss the truth: a wider aperture catches more of the PSF wings but also more sky noise, the size trade-off every observer faces. Reference: Howell, Handbook of CCD Astronomy.'
tags: [exoplanets, numerics, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
---
# Toy aperture photometry
Synthetic Moffat PSF on a CCD; aperture + sky annulus recovers true flux. Source: Howell CCD Handbook (`howell-ccd`).
