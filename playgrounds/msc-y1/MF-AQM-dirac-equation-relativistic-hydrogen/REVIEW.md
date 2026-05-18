# REVIEW - dirac-equation-relativistic-hydrogen (deep audit; supersedes any earlier pass)

## Verdict
CLEAN (deep audit passed)

## A. Scientific validity

**Governing equations (exact):**
Schrodinger: E_n = -Ry Z^2 / n^2 where Ry = (1/2) m c^2 alpha^2 (sim.js:18, 22). Constant: Ry = 13.605693 eV (CODATA). Correct.

Dirac-Coulomb (Sommerfeld, Dirac 1928): E_{n,j} = m c^2 [1 + (Z alpha/(n - k + sqrt(k^2 - (Z alpha)^2)))^2]^{-1/2} with k = j + 1/2 (sim.js:28-36). Binding energy = E_{n,j} - m c^2. Implementation exact.

Fine-structure splitting: Delta E_FS(n) = E_{n,j_max} - E_{n,1/2} proportional to (Z alpha)^4 (sim.js:47-49). Reference: Dirac (1928), Bjorken & Drell (1964).

Zitterbewegung: position trembles at angular frequency omega_ZB = 2 m c^2 / hbar = 2 sqrt(1+p^2) (natural units) over a drift v_g = p c^2 / E = p / sqrt(1+p^2) (sim.js:66, 62, 72-83). Reference: Schrodinger (1930), Bjorken & Drell Ch. 3.3.

**Sanity checks (via invariants.test.mjs):**
1. Schrodinger ground state = -13.605693 eV to 0.01% (line 9). Scaling: Z^2 (line 11), 1/n^2 (line 12). PASS.
2. Dirac to Schrodinger limit: correction O((Z alpha)^2) (line 21). Dirac deeper by ~10^-5 eV at Z=1 (line 25). fineStructureExpansion agrees within tolerance (lines 54-56). PASS.
3. Fine-structure scaling: Z^4 ratio = 16 per doubling (lines 31-32). Also alpha^4 (lines 40-42). At Z=1, n=2: Delta E_FS ~45.3 micro-eV (known). Z=50: 308.86 eV (frame t-050), ratio proportional to 50^4 consistent. PASS.
4. Dirac (n,j) degeneracy: 2s_{1/2} = 2p_{1/2}, 2p_{3/2} above (lines 47-50). Visual inset confirms: two overlapping lines at j=1/2, one above at j=3/2. PASS.
5. Zitterbewegung frequency and velocity: omega_ZB = 2 at rest (line 60), = 2 sqrt(1+p^2) general (line 61). v_g < c always (lines 63-64). Amplitude bounded (lines 69-70). Visual t-050 shows omega_ZB = 2.33; p=0.6 gives 2 sqrt(1.36) = 2.33 checkmark. PASS.
6. Determinism: no RNG (lines 21-83). Reproducibility verified (lines 73-77). PASS.

**Equations versus sources:**
Dirac (1928): Sommerfeld formula is exact Dirac-Coulomb solution (point nucleus, no QED). Matches spec.md line 40-42 and sim.js:28-36 precisely.

Fine-structure expansion (spec.md line 53): standard from any relativistic QM text. Coefficient 3/4 and n/(j+1/2) correct (sim.js:56).

Zitterbewegung (spec.md line 49-51): standard mixed-packet from Bjorken & Drell 3.3 (sim.js:72-83). Scope noted as toy model, not full wave-packet (spec.md line 143-145). Appropriate.

---

## B. Physics and numerical robustness

**Numerical method:**
Schrodinger: closed-form, floating-point exact.

Dirac: closed-form with sqrt and division (line 33). Guard: discriminant k^2 - (Z alpha)^2 becomes negative at supercritical Z alpha > k; returns NaN (line 32). Slider capped at Z=118 (spec.md:138), safely below Z ~137 where Z alpha ~1. Acceptable.

Fine-structure expansion: algebraically sound.

Zitterbewegung: exp, sin, sqrt all stable for parameter domain (t < 100 natural units, p < 10). No concerns.

**Stability and conservation:**
No dynamical evolution. All quantities computed once per frame. No floating-point error accumulation. Readout (playground.js:23-26) extracts exact results.

**Determinism:**
No RNG. All outputs deterministic. Capture-fraction maps directly to Zitterbewegung time probe (playground.js:120-140), ensuring reproducible frames.

**Extremes and edge cases:**
Z=1 to Z=118 (slider, index.html): all covered by invariants (tests at Z=1,2,4,5).
p=0.1 to p=5.0 (slider, index.html): rest to ultrarelativistic. v_g < c always.
n=1 to n=3 (NMAX=3, playground.js:31): true scale plus magnified inset. Effective.

**Live readout:**
Playground.js lines 23-26: readout IDs for Z, E(1,1/2), FS splitting, Z alpha. Index.html lines 22-27: elements present. Readout shows Z, E(1,1/2), dE_FS, Z alpha. PASS.

**Capture quality:**
Five golden frames at t in {0,0.25,0.5,0.75,1.0}: visually distinct, capture animation accurately. t-000 and t-100 show early/late Zitterbewegung; t-050 shows mid-trajectory with full oscillation. Frames are not redundant. PASS.

---

## C. Presentability

**Spec.md metadata:**
Hook: "Schrodinger atom has -13.6 Z^2/n^2 ladder; Dirac deepens and splits by j; ground state -13.6057 eV to 0.01%; n=2 splitting 45 micro-eV, scaling Z^4." Vivid, precise, excellent. PASS.

One_paragraph: detailed equations, physical scales, three panels described. First-exposure friendly. PASS.

**User-facing prose:**
Title: "Relativistic Hydrogen: Dirac vs Schrodinger, Fine Structure, Zitterbewegung." Clear.

Description (index.html:24-25): equations in LaTeX, properly formatted. Explains ladders, fine structure, and Zitterbewegung. No code artifacts. PASS.

**README.md:** Three paragraphs, pedagogical context, control description, full text. No placeholders. PASS.

**Figcaption:** "Figure 1. Relativistic hydrogen (Dirac equation) vs Schrodinger atom. Three panels: (left) energy levels normalized by Ry Z^2 with fine-structure inset for n=2; (middle) Zitterbewegung trembling (cyan) on classical drift (dashed) at angular frequency 2 m c^2/hbar; (right) fine-structure splitting dE_FS vs Z on log-log scale (slope 4 from alpha^4 dependence). Reference: Dirac (1928), Bjorken and Drell (1964)." Paper-style. PASS.

**Controls:** Z (1-118), p (0.1-5.0), Reset, Pause/Play. Labels and aria-labels present. Accessible. PASS.

**Visual quality:** Three-panel layout clear. Schrodinger (blue) vs Dirac (amber) contrast effective. Inset resolves fine-structure. Zitterbewegung oscillation distinct from drift. Log-log shows Z^4 trend. Colors accessible on dark background. No overlapping text. Monospace readout. PASS.

---

## Hero-candidate

YES. Genuinely hero-grade. The playground addresses a cornerstone topic in graduate quantum mechanics (relativistic corrections, fine structure, spin-orbit coupling), combines three visually and conceptually distinct phenomena (energy levels, Zitterbewegung, scaling laws) in separate panels, and presents a striking visual: comparison of Schrodinger vs Dirac shows relativistic effects immediately; fine-structure inset resolves O(100 micro-eV) splitting; Zitterbewegung trace shows counterintuitive position trembling at 2 m c^2/hbar. The physics is exact (closed-form Dirac-Coulomb formula, deterministic, no approximations) and verification is comprehensive (seven invariant tests covering all major features and limits).

Elevation plan: Shipped-ready. Recommend for prominent gallery position (featured MF/AQM example).

---

## Action checklist for maintainer

- [x] Spec.md hook and one_paragraph are comprehensive. No action needed.
- [x] Code is deterministic, closed-form, tested. No action needed.
- [x] Invariants test suite is comprehensive (7 tests, all pass). No action needed.
- [x] Visual reference frames are distinct and accurate. No action needed.
- [x] Figcaption is paper-style with full reference. No action needed.
- [x] README.md is complete. No action needed.
- [x] Live readout displays all required quantities. No action needed.

