# Shakura-Sunyaev accretion disc temperature

The standard thin-disc temperature profile around a compact object:
T(r) = T_in (R_in/r)^(3/4) [1 - sqrt(R_in/r)]^(1/4). The bracket
correction enforces T = 0 at the inner edge (R_in) and approaches 1 at
large r, so the bare r^(-3/4) scaling emerges. The temperature peaks at
r = (49/36) R_in ~ 1.36 R_in.

Look for: in profile view the cyan T(r) curve starts at zero, climbs to
its peak just outside R_in, then falls toward the dashed orange bare
r^(-3/4) curve at large r. Switch to disc view to see the face-on
rendering with a bright inner ring shading outward through orange to
deep red.

Use the view slider (profile vs disc) and r_out for plotting extent.

## Reference

- Frank, King, Raine, Accretion Power in Astrophysics 3e Ch. 5
  (`frank-king-raine`).
- Shakura and Sunyaev 1973 A&A.

## Verification

- Strong invariant: closed-form profile; peak at 49/36; far-edge
  asymptote r^(-3/4) within 1 percent at 10^4 R_in.
- Visual gate: SSIM > 0.92 across 5 frames mixing profile and disc views.
- Last verified: see `.verified`.
