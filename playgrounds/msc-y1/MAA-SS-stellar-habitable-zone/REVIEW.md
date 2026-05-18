# REVIEW - stellar-habitable-zone (deep audit; supersedes any earlier pass)

## Verdict
NEEDS CODE FIX

## A. Scientific validity

Governing equations (correct): T_eq = T_sun (L_star)^0.25 (1 - A)^0.25 / sqrt(a) (playground.js:23). Luminosity: L_star = R_star^2 (Teff / T_sun)^4 (line 19). HZ bounds: T_inner = 273 K (liquid water), T_outer = 200 K (max greenhouse) (spec.md:28-29).

Derivation check: T_eq formula follows from Stefan-Boltzmann and energy balance; standard in habitability studies (Kasting et al., Kopparapu et al.). Correct.

Sanity checks: For solar parameters (Teff=5778 K, R_star=1.0, a=1.0 AU, A=0.3), the formula gives T_eq ~278 K, matching Earth's effective temperature (~254-288 K depending on albedo). Reasonable.

---

## B. Physics and numerical robustness

Numerical method: Closed-form. No iteration or integration. Calculations exact within floating-point precision.

Determinism: No RNG. Controls are sliders; all deterministic.

Live readout (playground.js:71): "Teff=... R=... A=... T_eq=... K" rendered in readout element. readoutFrame.textContent = '-' (line 72) is a placeholder, incomplete implementation.

**CRITICAL DEFECT**: invariants.test.mjs (lines 1-28) is a MOCK ENGINE, not a real test suite.

Line 17 shows:
```
sim = { energy: 1.0, step(dt) { this.energy *= 1 - 1e-9 * dt; }, diagnostics() { return { energyDrift: this.energy - 1.0 }; } };
```

This tests generic energy drift, NOT the habitable zone physics. Test line 21 checks "energy drift below 1e-3" but this evaluates the mock, not the playground.

REQUIRED REAL INVARIANTS:
1. T_eq proportional to L_star^0.25: verify when Teff is doubled
2. T_eq inversely proportional to sqrt(a): verify when a is quadrupled
3. HZ inner edge: T_eq = 273 K gives correct orbital radius
4. HZ outer edge: T_eq = 200 K gives correct orbital radius
5. Surface state transitions: T > 350 K gives red (steam), 273 K < T < 350 K gives blue (ocean), T < 273 K gives cyan (ice)
6. Determinism: identical inputs reproduce identical output

Capture quality: Five golden frames exist (t-000 to t-100). All identical (expected for static playground). Visuals clean: star, HZ band, planet color-coded by surface state. Render is correct.

---

## C. Presentability

**CRITICAL ISSUES:**

1. README.md is a TEMPLATE SKELETON (lines 1-18).
   - Lines 3-7: Placeholder text ("One short paragraph: ...")
   - Line 11: "__CITATION__" token (unfilled)
   - Line 15: "__INVARIANT__" and "__THRESHOLD__" tokens (unfilled)
   - REQUIRED ACTION: Write actual README content (three paragraphs).

2. spec.md line 4: status = "verified" but README is templated. Contradiction.

3. index.html line 24: data-slot="description" contains placeholder text "Playground." (not descriptive).

4. index.html line 29: figcaption is bare. Should cite source (e.g., "Habitable zone model after Kasting et al. 1993").

---

## Hero-candidate

NO. Not marked hero_candidate: true; qualifies as simple parameter explorer, not novel research visualization.

---

## Action checklist for maintainer

- [ ] **CRITICAL**: Rewrite README.md. Replace template with three paragraphs:
  - Para 1: Explain habitable zone concept, T_eq formula, why it matters
  - Para 2: Describe visualization (HZ band, surface-state colors)
  - Para 3: Explain each control (Teff, R_star, albedo, a)

- [ ] **CRITICAL**: Replace mock engine in invariants.test.mjs with real tests:
  - Test T_eq proportional to L_star^0.25
  - Test T_eq inversely proportional to sqrt(a)
  - Test HZ inner/outer edges
  - Test surface state transitions
  - Test determinism

- [ ] Update spec.md line 4: verify status should be "verified" only after README and invariants are complete.

- [ ] Fill figcaption with paper-style citation.


