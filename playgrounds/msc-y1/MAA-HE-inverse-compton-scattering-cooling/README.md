# Inverse-Compton cooling

A relativistic electron at $\gamma$ in a soft-photon bath of energy density $U_\text{ph}$ cools by IC scattering with timescale $t_\text{IC} = 3 m_e c / (4 \sigma_T \gamma U_\text{ph})$. For CMB ($U \approx 4 \times 10^{-14}$ J/m$^3$), a $\gamma = 10^5$ electron cools in $\sim 10$ Myr; for galactic-radiation densities ($U \sim 10^{-13}$ J/m$^3$ in the disk) it's faster.

Look for the slope-$-1$ curve. Above $\gamma \sim 10^7$ in the CMB the cooling time is below the disk crossing time of $\sim 10^7$ yr; this is why TeV electron cosmic rays are local.

One slider: $\log_{10}T$ of the photon bath.

## Reference

Primary citation: Rybicki and Lightman, *Radiative Processes in Astrophysics*, Ch. 7 (`rybickilightman1979`).

## Verification

- Strong invariants: $t \propto 1/\gamma$ and $1/U_\text{ph}$ exact; CMB $U \approx 4.17 \times 10^{-14}$ J/m$^3$.
- Visual gate: SSIM > 0.92 against committed golden frames at seed 0xC0FFEE.
- Last verified: see `.verified`.
