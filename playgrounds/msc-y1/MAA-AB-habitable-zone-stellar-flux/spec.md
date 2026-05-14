---
title: Stellar Habitable Zone
slug: habitable-zone-stellar-flux
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: MAA-AB
supporting_ucs: [AST2004]
curriculum_year: msc-y1
primary_citation: carroll-ostlie
primary_chapter: 7
hook: 'STATUS: needs_hook'
one_paragraph: 'STATUS: needs_paragraph'
tags: [exoplanets, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
---

# Stellar habitable zone

## Physical setup

A central star characterized by effective temperature $T_\text{eff}$ and radius $R_\star$ (in solar units). The luminosity is the Stefan-Boltzmann integral

$$L_\star = 4 \pi R_\star^2 \sigma T_\text{eff}^4.$$

The incident flux on a planet at distance $d$ is $S(d) = L_\star / (4 \pi d^2)$. The continuous habitable zone (Kasting recent) is the band where $S$ lies between $1.37\,S_\odot$ (inner edge, runaway greenhouse) and $0.354\,S_\odot$ (outer edge, maximum greenhouse).

## Numerical method

Closed-form. The plot scale auto-adjusts to keep the outer HZ visible.

## Controls

- $T_\text{eff}$ in K (2500 to 10000).
- $R_\star$ in $R_\odot$ (0.1 to 3).
- Test-planet distance $d$ in AU (0.05 to 5).

## Expected qualitative features

1. Sun-like default ($T = 5778$ K, $R = 1$): HZ approximately 0.85 to 1.68 AU; Earth at 1 AU well inside.
2. M-dwarf ($T = 3000$ K, $R = 0.3$): HZ shrinks to roughly 0.05-0.10 AU.
3. Hot O-star ($T = 10000$ K, $R = 3$): HZ pushes out to 10+ AU.
4. The planet marker turns green when inside the HZ and red when outside.

## Invariants and acceptance thresholds

| invariant | threshold | location |
| Sun luminosity from $R_\odot, T_\odot$ | within 1 percent of $L_\odot$ | invariants test |
| Earth at 1 AU receives $\approx 1361$ W/m$^2$ | within 1 percent | invariants test |
| asSEff at 1 AU equals 1 | within 1 percent | invariants test |
| Sun HZ: inner 0.85, outer 1.68 AU | strict | invariants test |
| Earth in Sun's HZ | strict | invariants test |
| Mercury (0.387 AU) outside HZ | strict | invariants test |
| HZ shrinks for M-dwarf | strict | invariants test |
| inner < outer always | strict | invariants test |

All confirmed in `invariants.test.mjs` (8 tests passing).

## Limiting cases for verification

- $T_\text{eff} \to 0$: $L_\star \to 0$, HZ vanishes.
- $R_\star \to 0$: same.
- Proxima Centauri b (0.05 AU around an M5 V): falls inside the HZ in this playground at the right slider values.

## Visual fallback

If KaTeX or Canvas2D is unavailable, sliders still operate.

## Citations

- Carroll-Ostlie, *An Introduction to Modern Astrophysics*, 2e, Ch. 7 (`carroll-ostlie`).
- Kasting et al. 1993 (ApJ 412, 506) for the canonical CHZ band; the 1.37 / 0.354 bounds are the recent revisions.

## Stretch goals

- Add multiple planets and an animated orbit.
- Include Earth-like vs water-vapor-rich atmosphere variants of the HZ.
- Show the chronological evolution of the HZ as the star ages on the main sequence.

## Risk register

- The 1.37 / 0.354 bounds are a particular convention; some authors use slightly different limits. The playground states the choice in the prose.
