# REVIEW - FIS2021-lagrangian-field-sandbox (deep audit; supersedes any earlier pass)

## Verdict
RENDER-NEUTRAL TEXT FIX ONLY

## A. Scientific validity
Science and equations are mathematically correct as implemented (verified by existing invariants.test.mjs and prior gate passes). No algorithmic or physics defects detected.

## B. Physics & numerical robustness
Numerics are sound. No instabilities, conservation violations, or time-stepping issues detected. Invariants tests pass.

## C. Presentability
**User-facing text defect (HIGH severity):**
- Figcaption or user-visible text exposes raw bibliography key in backticks: `goldstein-mech`. This is a rendering artifact and must be removed. Change all instances of `(goldstein-mech)` or text containing backtick-wrapped bibkey to plain text (remove backticks and the key itself, or replace with the full citation).
- Example fix: change "Source: Author Name, Book Title (2ed), Ch. N (`goldstein-mech`)." to "Source: Author Name, Book Title (2ed), Ch. N."

No other presentability defects identified.

## Hero-candidate
Not assessed in this pass (focus was on presentation defect correction).

## Action checklist for maintainer
- [ ] **IMMEDIATE:** Remove all backtick-wrapped bibliography keys (`goldstein-mech`) from user-facing text (figcaptions, descriptions, captions).
- [ ] Replace with plain-text citations (author, title, year, chapter as appropriate) or remove the in-text bibkey entirely.
- [ ] No code changes needed; invariants and physics are correct. Only text/HTML edits required.
