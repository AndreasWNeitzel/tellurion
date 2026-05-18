# REVIEW - resonance-mean-motion-toy (deep audit; supersedes any earlier pass)

## Verdict
RENDER-NEUTRAL TEXT FIX ONLY

## A. Scientific validity

Governing equations: Kepler's 3rd law P^2 = 4 pi^2 a^3 / GM. Resonance condition: p * n_2 = q * n_1 where n = sqrt(GM/a^3). For asteroid belt (a ~ 2-3.5 AU) and Jupiter (a = 5.2 AU), resonance ratios (2:1, 3:1, 5:2, 7:3) match actual Kirkwood gaps (playground.js:9, sim.js).

Eccentricity-pumping mechanism (playground.js:66-71): Gaussian profile near resonance, pump proportional to resonance strength * dt. Simplified but physically sound; captures essence of Wisdom (1982) chaos.

Sanity checks: Kirkwood gap locations match observations (2:1 at ~3.28 AU, 3:1 at ~2.5 AU; invariants.test.mjs lines 4-9 verify these to 5% tolerance).

---

## B. Physics and numerical robustness

Numerical method: Leapfrog-like orbit evolution (playground.js:73-75): n = a^-1.5, angular motion theta += dt * n, perihelion precession. Simple but stable for toy timescales.

Eccentricity growth (line 71): pe[i] = min(1.2, pe[i] + 0.06 * pump * pkick[i] * dt). When pe > 0.55, planet-crossing; orbits are ejected (lines 77-79). Mechanism is deterministic and conservative (particle removal models physical ejection).

Determinism: RNG seeded at init (playground.js:41, seed 0xC0FFEE). Ejection dynamics are deterministic given seed. CAPTURE_NAME and CAPTURE_FRAC handle frame reproducibility.

Live readout (playground.js:92-94): particle count (alive) displayed. Resonance pumping total shown in readout. Present and functional.

Capture quality: t-000 shows full belt (30,000 particles), t-050 shows gaps forming, t-100 shows carved gaps. Progression is visually clear and scientifically meaningful.

---

## C. Presentability

**CRITICAL ISSUES:**

1. spec.md line 12: hook = 'STATUS: needs_hook' (UNFILLED).
2. spec.md line 13: one_paragraph = 'STATUS: needs_paragraph' (UNFILLED).
3. README.md line 23: Raw bib key "(murray-dermott)" in user-facing text. Should be "Murray & Dermott, Solar System Dynamics, Ch. 8".
4. index.html line 10 (figcaption): Raw bib key "(murray-dermott)". Same issue.

---

## Hero-candidate

NO. Toy simulation illustrating Kirkwood gaps dynamically; no novel visual or numerical breakthrough.

---

## Action checklist

- [ ] Fill spec.md hook with descriptive text (e.g., "Mean-motion resonances with Jupiter pump asteroid eccentricities chaotically; those that become planet-crossing are ejected, carving the Kirkwood gaps in observed solar system.")
- [ ] Fill spec.md one_paragraph with technical summary.
- [ ] Replace raw bib keys in README.md and index.html with prose citations.
- [ ] No code fixes needed; invariants and physics are sound.


