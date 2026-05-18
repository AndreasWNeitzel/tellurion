# REVIEW - channel-capacity-bsc (pre-computed; maintainer actions later)

## Verdict
RENDER-NEUTRAL TEXT FIX ONLY

## Defects (severity-ranked)
1. [medium] Placeholder hooks in spec.md (needs_hook, needs_paragraph); fill with non-placeholder content
2. [low] README mentions "the repetition code" but has no markdown heading structure; expand to three paragraphs as per template
3. [low] Raw bib keys appear in index.html and README (citations inline in text use backtick-wrapped keys); replace with prose

## Text / approachability
Index.html has a clear hook in the body text. README is informative but dense (one long paragraph block) and lacks structure. No prose citations in user-facing HTML/README (only raw backtick keys).

## Source-material & equation fidelity
Correct: Shannon capacity C(p) = 1 - H(p) where H(p) = -p log(p) - (1-p) log(1-p) is the binary entropy. Repetition-code BER scaling is accurate. Numeric examples given (n=3 at p=0.1 gives BER 0.028) are mathematically sound.

## Golden-frame observations
Frames show capacity curve (top, symmetric, zero at p=0.5) and repetition-code BER curves (bottom, different n). Rendering clean, readout visible. All frames match expected state (no animation).

## Hero-candidate
NO. Pedagogical illustration of information theory; no novel visual or numerical content.

## Maintainer notes
- spec.md placeholder hooks must be filled
- README needs section headers and three-paragraph expansion per template
- Bib keys in user prose should be replaced with full citations (author year)
