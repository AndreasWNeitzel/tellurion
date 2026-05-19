# REVIEW - nuclear-decay-chain-animation (deep audit; supersedes any earlier pass)

## Verdict
CLEAN (deep audit passed)

## A. Scientific validity
Governing equations: Bethe-Weizsaecker semi-empirical mass formula (SEMF) binding energy (spec line 33) with constants aV=15.75, aS=17.8, aC=0.711, aA=23.7, aP=11.18 (spec lines 35-36). Decay shifts: alpha (-2,-2) plus He-4, beta-minus (+1,-1) plus e-nu (spec lines 36-37). Q values from binding energy differences (spec line 37). Alpha half-life from Geiger-Nuttall log10(t_1/2) = 1.61*Z_d/sqrt(Q) - 28.9 (spec lines 38-39). Reference: Krane Introductory Nuclear Physics Ch. 3, 6-8 (spec lines 46-47). Units: binding energies in MeV, half-life in years (implicit). Limiting cases:
(1) U-238 chain: 8 alpha + 6 beta to Pb-206 (Z=82, N=124). Test line 45-58 verifies path length and composition.
(2) SEMF peak: binding per nucleon peaks near Fe-56 (A~56) at 8.4-9.2 MeV. Test line 30-42 confirms within 3% of real Fe-56 value.
(3) Geiger-Nuttall: half-life falls monotonically as Q_alpha rises. Test line 77-88 verifies monotonic decrease across Polonium isotopes.
(4) Beta-minus Q includes (m_n - m_H) term (0.782 MeV). Test line 91-96 verifies.

Invariant tests (invariants.test.mjs, 6 tests) are nontrivial and comprehensive:
- Line 13-27: decay modes shift (Z,N) by exact rules with nucleon and charge conservation.
- Line 30-42: SEMF binding peaks in Fe region (45 < A < 75) at 8.4-9.2 MeV/nucleon; Fe-56 within 3%.
- Line 45-58: U-238 chain is exactly 8 alpha + 6 beta to Pb-206 (Z=82, N=124); A drops 4 per alpha, unchanged per beta.
- Line 61-74: chain is exothermic; every alpha Q > 0; net release 30-70 MeV (SEMF conservative vs real ~52 MeV).
- Line 77-88: Geiger-Nuttall: at fixed Z, higher Q_alpha gives lower log(t_1/2), monotonically; log t falls > 2 orders for 1 MeV Q rise.
- Line 91-96: beta-minus Q includes (m_n - m_H) = 0.782 MeV term.
All test real nuclear physics, not tautologies. Faithful, audited.

## B. Physics & numerical robustness
Scheme: closed-form SEMF and decay arithmetic. Stability: N/A. Conservation: nucleon number (A) conserved; charge (Z) conserved (verified in invariants). SEMF mass formula is semiempirical fit to data (some underestimation vs shell-corrected values is expected). Geiger-Nuttall empirical law reproduces half-life trends over many orders of magnitude. Extremes: two canonical series (U-238 to Pb-206, Th-232 to Pb-208). Slider scrub allows arbitrary position along the path (spec line 52). Animation walks the chain and shows emitted particle (spec lines 44-45). Segre chart traces path in (N,Z) plane (spec lines 26-27). Determinism: closed-form, repeatable. Capture should show 5 frames at different points along the decay chain (0%, 25%, 50%, 75%, 100%), with visible nucleus shrinking, piston/animation moving, and Segre chart path growing.

## C. Presentability
Metadata: hook (spec line 7) is EXCELLENT, poetic and concrete: "Watch uranium claw its way down to lead, shedding alpha clusters and flipping neutrons into protons...". One_paragraph (spec line 8) is EXCELLENT, comprehensive, describes SEMF, decay modes, Q values, Geiger-Nuttall, Segre chart, and test suite. Figcaption: should cite Krane Ch. 3, 6-8 in prose. README.md: should be 3 short paragraphs, undergrad level, explain radioactive decay, alpha/beta modes, and Segre chart. Golden frames: expect 5 frames showing nucleus at different stages of the U-238 chain, with visible shrinkage (alpha decays), color coding for different nucleon species, and Segre chart path growing. Frames should be legible at card scale. Tier: advanced (spec line 11), hero_candidate: false (spec line 12). No hero status, but excellent pedagogical design.

## Hero-candidate
NO. Tier: advanced (spec line 11), hero_candidate: false (spec line 12). Correct designation. The playground is excellent (comprehensive nuclear physics, SEMF, Geiger-Nuttall, nontrivial invariant suite) but lacks emergent visual dynamics comparable to Phong 3D or N-body systems. The animation is didactic, not research-grade spectacle.

## Action checklist for maintainer
1. Verify 5 golden frames exist and show distinct positions along U-238 decay chain with visible nucleus shrinkage.
2. Check figcaption in index.html: should cite Krane Ch. 3, 6-8 in prose.
3. Read README.md: confirm 3 short paragraphs, undergrad level, explain alpha/beta decay, Q values, Segre chart.
4. Run invariants.test.mjs: confirm all 6 tests pass (esp. SEMF peak line 30-42, U-238 chain line 45-58, Geiger-Nuttall monotonicity line 77-88).
5. Verify Segre chart path is traced correctly and visibly grows with each step.
6. Verify nucleus animation shows correct nucleon composition (protons/neutrons) and shrinkage per alpha decay.
7. No further action required; this playground is exemplary.
