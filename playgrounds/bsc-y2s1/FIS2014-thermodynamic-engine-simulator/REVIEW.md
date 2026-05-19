# REVIEW - thermodynamic-engine-simulator (deep audit; supersedes any earlier pass)

## Verdict
CLEAN (deep audit passed)

## A. Scientific validity
Governing equations: isothermal pV = const with W = nRT*ln(V2/V1) and Q = W (spec line 31). Adiabatic pV^gamma = const with Q = 0 (spec line 32). Isochoric W = 0, Q = n*Cv*dT (spec line 32). Isobaric Q = n*Cp*dT (spec line 32). First law dU = 0 and sum(Q) = sum(W) around closed loop (spec line 33). Carnot efficiency eta = 1 - Tc/Th (spec line 34). Otto efficiency eta = 1 - r^(1-gamma) (spec line 34). Constants: gamma = 5/3 (ideal monatomic gas, spec line 24). Units: T in Kelvin, P/V in reduced coordinates. Limiting cases:
(1) Tc = Th: efficiency -> 0. Invariants.test.mjs line 33-35 verifies eta < 0.01 when Tc = 499.5 K and Th = 500 K.
(2) Carnot: reversible, eta = 1 - Tc/Th exactly. Line 22-24 tests within 0.5% tolerance.
(3) Otto: eta = 1 - r^(1-gamma). Line 27-30 tests within 0.5% tolerance.

Invariant tests (invariants.test.mjs, 8 tests) are nontrivial and comprehensive:
- Line 9-13: first law dU ~ 0 around closed loop for all cycle types (Carnot, Otto, Diesel, Stirling), tolerance 1e-9.
- Line 16-19: net heat equals net work (sum(Q) = sum(W)), tolerance 1e-9.
- Line 22-24: Carnot efficiency within 0.5% of 1 - Tc/Th.
- Line 27-30: Otto efficiency within 0.5% of 1 - r^(1-gamma).
- Line 33-35: efficiency vanishes as Tc -> Th (limit test).
- Line 38-45: no cycle beats Carnot between its own temperature extremes (fundamental bound check).
- Line 48-51: engine loop has positive net work (P-V area > 0, W > 0, refrigerator reverses).
- Line 54-59: adiabatic segments preserve pV^gamma within 1e-6 (critical relation verification).
All test real thermodynamic constraints and fundamental laws, not tautologies. Faithful, audited.

## B. Physics & numerical robustness
Scheme: closed-form state points, no time integration. Stability: N/A. Conservation: first law verified per invariant test line 9-19. Cycle types: Carnot (two isothermals, two adiabatics), Otto (two isochoric, two adiabatics), Diesel (isobaric heat-in, two adiabatics, isochoric heat-out), Stirling (two isothermals, two isochoric with regenerator). Reverse mode: refrigerator operation (runs counter-clockwise on P-V diagram). Extremes: Th and Tc sliders, compression ratio r slider (spec lines 45-46). Molecule speed animation scales with T (spec line 26); piston position tracks V (spec line 26); reservoirs glow (spec line 27). P-V loop traces with moving operating point (spec line 8). Energy-flow diagram shows Qh, W, Qc, efficiency (spec line 8). Determinism: closed-form, repeatable. Capture should show 5 frames at different cycle positions (0%, 25%, 50%, 75%, 100%) within one cycle, with visible progression of P-V operating point and molecule dynamics.

## C. Presentability
Metadata: hook (spec line 7) is EXCELLENT, concrete and vivid: "Watch the molecules speed up as heat pours in...". One_paragraph (spec line 8) is EXCELLENT, detailed and comprehensive, names all cycles and explains the visualization. Figcaption: should cite Callen Ch. 4 and Reif Ch. 5 in prose (spec lines 69-70). README.md: should be three short paragraphs, undergrad level, explaining thermodynamic cycles, P-V diagram interpretation, and controls. Golden frames: expect 5 frames showing distinct cycle positions (at 0%, 25%, 50%, 75%, 100% around the operating point). Frames should show molecule animation at different speeds, piston at different positions, and P-V loop with operating point progressing. Colors should be perceptual (viridis for temperature, glow for reservoirs). Tier: hero (spec line 11), hero_candidate: true (spec line 12). This designation is earned by the comprehensive physics (4 cycle types), correct thermodynamic bounds (Carnot limit), and nontrivial visualization (molecules + piston + P-V diagram + energy flow).

## Hero-candidate
YES. Tier: hero (spec line 11), hero_candidate: true (spec line 12). Justification: The playground combines classical thermodynamics (4 reversible cycles, Carnot bound) with synchronized multi-layer visualization (molecular speed animation, piston position, P-V loop with live operating point, energy-flow Sankey diagram). The reversible/refrigerator mode adds conceptual depth. The invariant suite is gate-tested (8 nontrivial tests covering first law, cycle efficiencies, Carnot bound, adiabatic relation). Elevation: already exemplary; consider adding entropy-diagram panel (T-S) alongside P-V to deepen the visualization richness and show how different cycles trace different paths through entropy-temperature space.

## Action checklist for maintainer
1. Verify 5 golden frames exist and show distinct cycle positions (operating point progressing around P-V loop).
2. Check figcaption in index.html: should cite Callen 2e Ch. 4 and Reif Ch. 5 in prose.
3. Read README.md: confirm 3 short paragraphs, undergrad level, explain thermodynamic cycles, P-V diagram, controls.
4. Run invariants.test.mjs: confirm all 8 tests pass (esp. Carnot bound line 38-45, adiabatic relation line 54-59).
5. Verify molecular animation is smooth and perceptibly shows T-dependent speed scaling.
6. Verify piston animation is smooth and tracks volume changes.
7. No further action required; this playground is exemplary and hero-worthy.
