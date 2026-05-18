# REVIEW - two-stream-pic-plasma (pre-computed; maintainer actions later)

## Verdict
RENDER-NEUTRAL TEXT FIX ONLY

## Defects (severity-ranked)
1. [medium] index.html contains one raw bib key in parentheses: (`hockneyeastwood1988`). Move to figcaption or spec.md References only.

## Text / approachability
- README.md is excellent: three paragraphs with clear narrative (what happens, what to observe, controls).
- spec.md hook and one_paragraph are both present and detailed.

## Source-material & equation fidelity
- Physics correct: two-stream instability governing equations (Lorentz force, Poisson solver).
- Linear growth rate omega_p/(2 sqrt 2) matches Krall and Trivelpiece (1973).
- Dispersion relation: unstable for k v0 < omega_p; peak growth at k^2 v0^2 = 3 omega_p^2/8.
- PIC scheme (NGP deposit, DFT Poisson, leapfrog) per Hockney and Eastwood (1988) ch. 5-8.

## Golden-frame observations
- Five frames have distinct MD5 hashes; all progressions visible.
- Frame progression shows beam vortex formation, spectrogram mode growth, saturation.

## Hero-candidate
NO. Standard PIC benchmark visualization; no novel graphics.

## Maintainer notes
- Remove bib key (`hockneyeastwood1988`) from index.html body text. Cite author and year inline if needed, or move to figcaption.
