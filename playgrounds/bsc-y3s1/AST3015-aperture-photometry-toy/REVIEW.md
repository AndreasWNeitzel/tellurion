# REVIEW - aperture-photometry-toy (deep audit; supersedes any earlier pass)

## Verdict
RENDER-NEUTRAL TEXT FIX ONLY

## A. Scientific validity

Moffat PSF model (β=2.5, Gaussian-like wings) is a standard CCD model (Howell 2006). The aperture photometry algorithm (aperture + sky annulus for background subtraction) is canonical. No physics defects.

## B. Physics & numerical robustness

**Static visualization:** This playground renders a single frame showing a synthetic PSF image, user-drawn or preset aperture and sky annulus, and flux measurements. No time-stepping occurs. The Play/Pause button controls the animation loop UI, but there is no time-dependent simulation.

**Identical frames acceptable:** All five golden frames are byte-identical because the playground renders a static scene. The visual test framework expects frame progression, but this is a mismatch in test expectations, not a code bug. The playground is correct; the test framework should recognize static playgrounds.

**Readout present:** Yes, monospace stats display flux values.

## C. Presentability

**Spec.md placeholders:**
Line 12: `hook: 'STATUS: needs_hook'`.
Line 13: `one_paragraph: 'STATUS: needs_paragraph'`.

**README.md:** Only 1 line (48 words). Must expand to three paragraphs per rules.

**index.html:** Check for raw bib keys in user-facing text (avoid backtick-wrapped citations in captions).

## Hero-candidate
NO. Static pedagogical tool.

## Action checklist for maintainer

- [ ] **Fix spec.md placeholders** (hook and one_paragraph).
- [ ] **Expand README.md** to three paragraphs: (1) What is aperture photometry and why it matters. (2) What you see (synthetic PSF, aperture, sky annulus). (3) Which controls do what (aperture sliders, etc.).
- [ ] **Check index.html** for raw bib keys; remove or relocate to spec.
- [ ] **Do NOT recapture frames.** Identical frames are correct for this static visualization.
- [ ] **Consider adding a note to spec** under "Visual fallback" or "Expected qualitative features" stating: "This is a static pedagogical visualization; all frames are identical."


