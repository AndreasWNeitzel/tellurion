# DEVNOTES - bsc-y3s1/M3012-fourier-epicycle-drawing (hidden dev ref)

Repo-only.

## Sweep 2026-05-18
Rewrote placeholder hook/one_paragraph as first-exposure-undergrad prose; render-neutral.
invariants  + visual 5/5 x3. Shipped.

## Sweep 2026-05-19
HEAVY. REVIEW NEEDS-CODE-FIX confirmed: invariants.test.mjs was the skeleton energy-drift mock (fake sim={energy,step,diagnostics}) and there was no DOM-free core. Extracted samplePath/dft/reconstruct/rmsError into sim.js (byte-identical render math, Bracewell ch.2,18 cited), playground.js now imports it, and added a circle preset for testing. Replaced the mock with 7 real DFT invariants: single-mode circle (C_k=delta_k1), one-term exact circle reconstruction, DC coefficient = path centroid, Parseval sum|C|^2=(1/N)sum|z|^2, full-N exact sample interpolation (RMS<1e-8), monotone truncation-error convergence in M, amplitude-sort + determinism. Render-neutral: capture branch and goldens unchanged. Physics and user-facing text were already correct (REVIEW partly stale on those).
invariants Tests  7 passed + visual 5/5 x3. Shipped.
