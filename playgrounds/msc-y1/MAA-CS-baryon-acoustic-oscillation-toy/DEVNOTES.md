# DEVNOTES - msc-y1/MAA-CS-baryon-acoustic-oscillation-toy (hidden dev ref)

Repo-only.

## Sweep 2026-05-18
Rewrote placeholder hook/one_paragraph as first-exposure-undergrad prose; render-neutral.
invariants  + visual 5/5 x3. Shipped.

## Sweep 2026-05-18
Added comprehensive ## Explainer (first-exposure plain language, all governing equations in KaTeX, bibliographic origin); render-neutral.
invariants Tests  4 passed + visual 5/5 x3. Shipped.

## Hero rehaul 2026-05-19 (mission #286)
Below hero: thin (dot + ring), no recombination freeze, no
standard-ruler / correlation-function payoff, capture didn't sweep R
(5 identical goldens). sim.js APPENDED (soundSpeed/shellRadius/
C_KM_S byte-identical so the 4 originals pass): soundHorizon(R) (toy
normalisation anchored to Planck ~150 Mpc at the fiducial baryon
loading R_FID, scaling with c_s) and baoXi(r,r_s) (power-law
clustering + acoustic bump). invariants 4 -> 6 (r_s ~ 150 Mpc and
shrinks with R; xi has a local max at r_s). JS exponentiation gotcha
hit twice: -(x)**2 is a SyntaxError, replaced with a temp and
-(z*z).
playground.js rebuilt: a 2D ripple where the CDM core stays, the
baryon-photon sound shell expands at c_s, at recombination the photon
ring decouples and free-streams while the baryon shell FREEZES at r_s
with a labelled caliper; a recombination timeline; density profile
rho(r) and the galaxy correlation xi(r) with the BAO bump as demoted
diagnostics. Capture sweeps R in {0.05,0.3,0.6,1.1,1.8} in the
post-recombination frozen state -> 5 distinct goldens.
Gate: 6 invariants + smoke + visual 5/5 x3 PASS. Shipped.
