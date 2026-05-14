# Semi-empirical mass formula (Bethe-Weizsacker)

The Bethe-Weizsacker mass formula gives nuclear binding energy as a sum of volume, surface, Coulomb, asymmetry, and pairing terms. Along the valley of stability ($Z^*(A)$) the binding per nucleon rises from $\sim 1$ MeV at $A = 2$ to $\sim 8.8$ MeV near iron at $A \sim 60$ and falls slowly to $\sim 7.6$ MeV at U-238.

Look for the iron-peak crossover and the term-by-term breakdown at the current $A$: volume is the constant $+15.8$ contribution; surface decays as $A^{-1/3}$; Coulomb takes over above iron and explains the asymmetric fall-off; the asymmetry term grows with neutron excess.

One slider: mass number $A$.

## Reference

Primary citation: Krane, *Introductory Nuclear Physics*, Ch. 3 (`krane-nuclear`).

## Verification

- Strong invariants: peak in A = 50-80 at 8.4-9.0 MeV; Fe-56 ~ 8.6 MeV; U-238 ~ 7.5 MeV; Pb-208 ~ 7.87 MeV; pairing sign by parity.
- Visual gate: SSIM > 0.92 against committed golden frames at seed 0xC0FFEE.
- Last verified: see `.verified`.
