# Nuclear shell model and magic numbers

Filling nucleons into the harmonic-oscillator-plus-spin-orbit shell-model spectrum produces closed shells at $2, 8, 20, 28, 50, 82, 126$. Without the strong spin-orbit force, only the pure-HO closures $2, 8, 20$ would be magic; the observed extra magic numbers $28, 50, 82, 126$ are direct evidence for the spin-orbit nuclear force (Mayer-Jensen Nobel, 1963).

Look for the cumulative counts on the right: rows highlighted with "MAGIC" mark shell closures. Crank $N$ up to 126 to fill the full ${}^{208}$Pb nucleus.

One slider: nucleon count $N$.

## Reference

Primary citation: Krane, *Introductory Nuclear Physics*, Ch. 5 (`krane-nuclear`).

## Verification

- Strong invariants: MAGIC sequence $2, 8, 20, 28, 50, 82, 126$ exact; occupancy $= 2j+1$ for every level.
- Visual gate: SSIM > 0.92 against committed golden frames at seed 0xC0FFEE.
- Last verified: see `.verified`.
