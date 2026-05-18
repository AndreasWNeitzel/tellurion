# DEVNOTES - FIS1014-brewster-angle-fresnel (hidden dev ref)
Repo-only. Not linked, not in gallery, never shown to users.
Lives under playgrounds/bsc-y1s2/.

## What it is
Canvas2D. Ray diagram (incident/reflected/refracted) + Fresnel R_s,
R_p vs angle with the Brewster dip (R_p -> 0 at theta_B =
arctan(n2/n1)). Readout: theta_i, n1, n2, theta_B, theta_t, R_s, R_p.

## Post-build sweep (2026-05-18)
- Opus visual-reviewer 6/6 PASS (ray diagram, Fresnel curves with the
  Brewster zero, angle sweep across frames, render correct).
- Fixed placeholder hook/one_paragraph (Brewster = one polarization
  fully transmitted; polarized sunglasses). Figcaption already had a
  clean source (Hecht, Optics, Ch. 4), no raw key. Render-neutral, NO
  recapture. Index rebuilt.

## Gate: node --check; vitest invariants; build-index; visual gate
  only if #stage changes (text-only sweep).

## Sweep 2026-05-18
Rewrote placeholder hook/one_paragraph as first-exposure-undergrad prose; render-neutral.
invariants  + visual 5/5 x3. Shipped.
