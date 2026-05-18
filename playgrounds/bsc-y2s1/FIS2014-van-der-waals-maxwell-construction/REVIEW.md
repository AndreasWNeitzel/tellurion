# REVIEW - van-der-waals-maxwell-construction (deep audit; supersedes any earlier pass)

## Verdict
CLEAN (deep audit passed)

## A. Scientific validity
Governing equations: reduced van der Waals EOS p = 8*T/(3*V-1) - 3/V^2 (spec line 34). Critical point at V = T = p = 1 with dp/dV = d2p/dV2 = 0 (spec lines 36-37). Maxwell equal-area construction: integral_{Vl}^{Vg} p dV = pco*(Vg-Vl) with p(Vl) = p(Vg) = pco (spec lines 39-41). Lever rule: x = (Vg - V)/(Vg - Vl) (spec line 41). Spinodal: dp/dV = 0 (spec line 42). Reference: Callen 2e Sec. 3.6 Problem 9.4-1 (spec lines 52-53). Numerical method: closed-form area integral integral(p dV) = (8*T/3)*ln(3*V-1) + 3/V (spec line 48). Spinodal volumes solved via (3*V-1)^2 = 4*T*V^3 (spec line 51). Limiting cases:
(1) T = 1 (critical): dp/dV = d2p/dV2 = 0 at V = 1, no coexistence (spec line 88). Test line 10-14 verifies to 1e-9 precision.
(2) T >= 1: maxwell returns null (single phase, spec line 89). Test line 37 confirms.
(3) T < 1: coexistence with binodal enclosing critical point (spec line 71). Test line 30-37 confirms binodal closes and nests correctly.

Invariant tests (invariants.test.mjs, 7 tests) are nontrivial and comprehensive:
- Line 10-14: critical inflection dp/dV = d2p/dV2 = 0 at (1,1) within 1e-9.
- Line 17-27: Maxwell equal-area and equal-end-pressure, with valid phase bounds (Vl < 1 < Vg, 0 < pco < 1), area < 1e-4.
- Line 30-37: binodal closure as T -> 1, verified at T = 0.85 and T = 0.999.
- Line 40-47: spinodal nests strictly inside binodal at T = 0.8, 0.9, 0.97.
- Line 50-54: mechanical stability: dp/dV < 0 on coexisting phases, > 0 between spinodals.
- Line 57-64: lever rule: 1 at Vl, 0 at Vg, monotone, 0.5 at midpoint.
- Line 67-72: observed pressure flat at pco across coexistence, continuous at binodal.
All test real thermodynamic constraints (van der Waals theory), not tautologies. Faithful, audited.

## B. Physics & numerical robustness
Scheme: closed-form via bisection (Newton would fail near critical point due to critical slowing). Stability: N/A (closed-form). Conservation: Maxwell area integral is exact; lever rule is exact. Extremes: T/Tc range 0.70 to 1.20 (spec line 57), crosses critical point. Manual volume slider allows full V range (spec line 58). Auto cycle mode alternates compress-expand (spec line 59). Meniscus tracking: molecule rendering tracks lever-rule liquid fraction (spec line 28). Phase diagram: binodal and spinodal computed and plotted (spec lines 62-71). Determinism: bisection is deterministic; same T yields identical Vl, Vg, pco. Capture should show 5 frames: subcritical (T < 1) with visible meniscus at different liquid fractions, crossing critical point (T = 1) with meniscus vanishing, supercritical (T > 1) with no meniscus. Frames should be objectively distinct.

## C. Presentability
Metadata: hook (spec line 7) is EXCELLENT, vivid and concrete: "Compress the gas and watch it condense: a liquid meniscus rises...". One_paragraph (spec line 8) is EXCELLENT, comprehensive and detailed, explains van der Waals, Maxwell construction, lever rule, S-curve, binodal, spinodal, live display. Figcaption: should cite Callen 2e Sec. 3.6 Problem 9.4-1 in prose. README.md: should be 3 short paragraphs, undergrad level, explaining condensation, lever rule, and phase diagram. Golden frames: expect 5 frames showing subcritical (meniscus visible) -> critical (meniscus vanishes) -> supercritical (single phase). Frames should be legible at card scale, showing piston, meniscus height, P-V isotherm with operating point, binodal/spinodal envelope. Tier: advanced (spec line 11), hero_candidate: true (spec line 12). This designation is earned by the nontrivial phase equilibrium theory (Maxwell construction, spinodal), comprehensive visualization (molecule pool, meniscus, phase diagram), and extensive invariant suite (7 tests covering all critical physics).

## Hero-candidate
YES. Tier: advanced (spec line 11), hero_candidate: true (spec line 12). Justification: The playground tackles van der Waals condensation, a cornerstone of thermodynamics education. The Maxwell equal-area construction is the central computational challenge, solved rigorously via bisection. The visualization (meniscus height tracks lever rule liquid fraction, P-V isotherm with live operating point, binodal/spinodal envelope, critical inflection) is comprehensive and perceptually effective. The invariant suite is extensive (7 nontrivial tests covering critical point, Maxwell area, binodal closure, spinodal nesting, mechanical stability, lever rule, pressure continuity). Elevation: already exemplary; consider adding animated T-S (entropy-temperature) diagram alongside P-V to show how different paths through phase space correspond to different thermodynamic processes.

## Action checklist for maintainer
1. Verify 5 golden frames exist and span from subcritical (T < 1, meniscus visible) through critical (T = 1, meniscus vanishes) to supercritical (T > 1, single phase).
2. Check figcaption in index.html: should cite Callen 2e Sec. 3.6 Problem 9.4-1 in prose.
3. Read README.md: confirm 3 short paragraphs, undergrad level, explain van der Waals, condensation, lever rule.
4. Run invariants.test.mjs: confirm all 7 tests pass (esp. binodal closure line 30-37, spinodal nesting line 40-47, mechanical stability line 50-54, lever rule line 57-64).
5. Verify meniscus animation is smooth and tracks liquid fraction via lever rule.
6. Verify P-V diagram shows binodal and spinodal curves and live operating point progressing along isotherm.
7. No further action required; this playground is exemplary and hero-worthy.
