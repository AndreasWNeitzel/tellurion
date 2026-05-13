# Verification

Every playground must pass two independent gates before shipping. Gate 1 verifies the mathematics. Gate 2 verifies the picture. Neither is sufficient alone.

## Gate 1: physics invariants and reference numerics

Run via `invariant-auditor` plus `npx vitest run playgrounds/<name>/invariants.test.mjs`.

### Strong invariants by system class

| system class | invariants | threshold |
|--------------|------------|-----------|
| Hamiltonian (Kepler, double pendulum, N-body symplectic) | total E, total L, LRL where applicable | dE/E < 1e-3 over 10^4 steps |
| Unitary QM (TDSE) | integral abs psi^2, energy under H_0 | norm drift < 1e-10 per step |
| Lossless FDTD | EM energy in PML-masked region | drift < 1 percent |
| Conservation-law PDE (Burgers, KdV, advection) | integrated mass, momentum, energy | machine precision for periodic BC |
| Equilibrium spin MC | detailed balance acceptance ratio, chi = beta Var(M), Binder cumulant at Tc | within 3 percent of literature |
| MCMC on analytic target | KL or KS divergence after warm-up | < 0.05 after 10^6 samples |
| Path integrals on harmonic oscillator | density vs. analytic Gaussian | KS < 0.05 |

### Weak-or-no invariant systems

Some systems have no strong invariant by construction. Treat these as Gate 1 exempt but Gate 2 strict:

- ML training (neural net decision boundary, normalizing flow training): use reproducibility via fixed seed. Final-state SSIM > 0.95 against committed reference.
- t-SNE, UMAP: KL component value within 2 percent of reference run at fixed seed.
- Dissipative PDEs without conserved energy (Allen-Cahn, Kuramoto-Sivashinsky): monotone free-energy decrease where theory predicts; otherwise Gate 1 exempt.

### Test file requirements

Every `playgrounds/<name>/invariants.test.mjs` must:

- Import the simulation as a headless ES module (no DOM access).
- Seed RNG to `0xC0FFEE` (or read from `PORTFOLIO_REF_SEED` env).
- Run for the duration declared in `spec.md` under "Numerical method".
- Produce a CSV trace of every invariant under test on failure, written to `playgrounds/<name>/failures/<iso8601>.csv`.
- Use Vitest expect with explicit threshold values, never `toBeCloseTo` defaults.

## Gate 2: visual reference and multimodal review

### Reference frame capture

`node scripts/capture-reference.mjs --playground <name> --deterministic` runs Playwright headless Chromium, loads the playground at fixed seed, and captures five frames at simulated times t=0, t=T/4, t=T/2, t=3T/4, t=T plus any caption-flagged landmark times. Frames land in `playgrounds/<name>/references/captured/<iso>/`.

When a playground is first verified, the captured frames are promoted to `references/golden-frames/` and committed. Subsequent verifications diff against these goldens.

### Pixel and perceptual diff

- **SSIM**: required minimum 0.92 across all five frames against goldens.
- **pHash**: Hamming distance under 8 against goldens.
- **L2 pixel**: secondary signal; reported, not gating.

### Multimodal review

Run by `visual-reviewer` subagent. For each rubric bullet in spec.md, return present / partial / absent / contradicted. PASS requires all rubric items "present" and all sanity flags green:

- Live invariant readout visible and updating
- Axis units present
- Caption present in paper format
- Active tokens from `shared/css/tokens.css` (sampled by computed style)

### Aesthetic gate

Run by `aesthetics-reviewer`. See `docs/AESTHETIC.md` for the rules.

### Citation gate

Run by `citation-validator`. See `docs/PLAYGROUND_SPEC.md` for citation requirements.

## What passes, what fails

A playground is shippable when:

```
invariant-auditor:  INVARIANT-GATE: PASS
visual-reviewer:    verdict == "PASS"
aesthetics-reviewer: AESTHETIC-GATE: PASS
citation-validator: CITATION-GATE: PASS
```

The `/verify` command runs all four. The `/ship` command refuses to proceed without a `.verified` marker newer than the last source change.

## Reference frame curation

When a playground is first verified:

1. Inspect the captured frames manually once. After this, never again unless the spec changes.
2. Move the captured directory to `references/golden-frames/`.
3. Commit. The commit message names the seed and the playground version.

If a future change is intentional and invalidates a golden, re-capture under `--deterministic` and replace the golden in a dedicated "refresh-golden" commit. Never silently overwrite.

## Failure forensics

On Gate 1 failure:

- The CSV trace in `playgrounds/<name>/failures/` shows the invariant's time series.
- Monotonic drift suggests integrator order or sign error. Tighten dt by 10x; if drift halves linearly, the integrator is first-order when expected higher. If drift unchanged, hunt the sign error.
- Oscillatory drift with growing amplitude is CFL violation. Tighten dt and confirm against the stability bound from numerics-skeptic's table.
- Random failures with no pattern: RNG not seeded, or shared state across tests.

On Gate 2 failure:

- SSIM drop usually means the playground's rendering changed without intent. Diff the playground.js against last shipped commit.
- Rubric "absent" verdicts mean the qualitative feature did not emerge. Either the parameter window in the reference capture missed it, or the simulation no longer produces it. Inspect manually before re-baselining.
