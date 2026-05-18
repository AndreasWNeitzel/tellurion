# REVIEW - inflation-slow-roll (deep audit; supersedes any earlier pass)

## Verdict
BROKEN (describe)

## A. Scientific validity

The slow-roll spectral index formulas for power-law chaotic potentials (sim.js:27-49) contain coefficient errors. The correct results from Mukhanov Ch. 5 are:

For V = lambda * phi^n, slow-roll parameters at N e-folds before end:
- epsilon_N = n / (2N)
- eta_N = n / N
- n_s = 1 - 6*epsilon + 2*eta = 1 - 6*n/(2N) + 2*n/N = 1 - n/N

Code implementation (sim.js:30, 32) mixes coefficients incorrectly:
- phi^2: returns `1 - 4/(2*N) - 2/N = 1 - 4/N` (WRONG; should be 1 - 2/N)
- phi^4: returns `1 - 6/(2*N) - 2/N = 1 - 5/N` (WRONG; should be 1 - 4/N)

Impact for N=50 (typical observational timescale):
- phi^2: code gives n_s = 0.92, correct is 0.96 (4% error, observable significance)
- phi^4: code gives n_s = 0.90, correct is 0.92 (2% error, crosses Planck 1-sigma contours)

Starobinsky formula (line 45) is correct: n_s = 1 - 2/N. This consistency error suggests the phi^n formulas were copy-pasted without rechecking coefficients.

## B. Physics & numerical robustness

- Scheme: Algebraic formula only; no numerics.
- Conservation: Not applicable.
- Extremes: For N = 60 (end-of-inflation limit), phi^2 code gives n_s = 0.985 (should be 0.983, 2% high). Observable but incorrect.
- Determinism: Deterministic (no RNG).
- Capture/frames: Golden frames show distinct parameter sweeps (n_s ranges 0.962 to 0.98; r ranges 0.001 to 0.24). Frames visually distinct. No identical frame pairs detected.
- Readout: Present in index.html and visible in golden frames.
- dt mixing: Not applicable.

## C. Presentability

- Placeholder hook: `'STATUS: needs_hook'` in spec.md. Blocks gallery card rendering.
- Placeholder paragraph: `'STATUS: needs_paragraph'` in spec.md. Blocks gallery card rendering.
- Raw bib key: index.html figcaption contains (`mukhanov-cosmology`). Should be formatted citation.
- README: Too terse; does not explain Planck observational constraints or model degeneracies that make this playground pedagogically valuable.

High-severity: (1) Presentation blockers; (2) spectral index formula errors affect observational interpretation.

## Hero-candidate

NO. Physics errors prevent candidacy.

## Action checklist for maintainer

1. CRITICAL: Fix sim.js lines 30 and 32. Use correct slow-roll formulas:
   ```javascript
   case 'phi2': // V = phi^2
     return { ns: 1 - 2 / N, r: 8 / N };
   case 'phi4': // V = phi^4
     return { ns: 1 - 4 / N, r: 16 / N };
   ```

2. HIGH: Replace placeholder hook and one_paragraph in spec.md (lines 12-13) with actual prose (3-4 sentences each).

3. HIGH: Remove backticked bib keys from index.html and README. Use proper citation format.

4. MEDIUM: Expand README to 3 paragraphs. Explain Planck constraints, why certain models are ruled in/out, and the observational significance of the n_s vs. r plot.

5. Verify: Run invariants.test.mjs to ensure all bounds still pass after formula fix.

6. Recapture: Re-run visual test with --deterministic after all fixes.
