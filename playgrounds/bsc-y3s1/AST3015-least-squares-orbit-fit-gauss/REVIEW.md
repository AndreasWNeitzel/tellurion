# REVIEW - least-squares-orbit-fit-gauss (deep audit; supersedes any earlier pass)

## Verdict
RENDER-NEUTRAL TEXT FIX ONLY

## A. Scientific validity

Least-squares orbit fitting from noisy astrometric observations. The method is standard: minimize chi-squared residuals to determine orbital elements (a, e, omega, etc.). Gaussian noise model is appropriate for CCD astrometry. No physics defects.

## B. Physics & numerical robustness

**Static visualization:** This playground renders a single frame showing observed positions (with noise), fitted ellipse, and residuals. The render() function (line 50) is called in a tick loop but does not advance any underlying simulation time. The visualization is static (no evolution).

**Identical frames correct:** All five golden frames byte-identical because this is a static pedagogical display. The frames show the same least-squares fit and residual scatter for a fixed random seed and fixed observational parameters.

**Readout present:** Yes, monospace stats (chi-squared, errors, convergence metrics).

## C. Presentability

**Spec.md placeholders:**
Line 12: `hook: 'STATUS: needs_hook'`.
Line 13: `one_paragraph: 'STATUS: needs_paragraph'`.

**README.md:** Only 1 line (39 words). Expand to three paragraphs.

**index.html:** Check for backtick-wrapped bib keys; remove from user-facing captions.

## Hero-candidate
NO. Numerical pedagogy.

## Action checklist for maintainer

- [ ] **Fix spec.md placeholders** (hook, one_paragraph).
- [ ] **Expand README.md** to three paragraphs: (1) What is least-squares orbit fitting and its role in astrometry. (2) What you see (observed points with noise, fitted orbit, residuals). (3) How controls vary the noise level and observation count.
- [ ] **Check index.html** for backtick-wrapped bib keys; relocate or remove.
- [ ] **Do NOT recapture frames.** Identical frames are correct.
- [ ] **Consider a spec note** documenting that this is a static visualization.


