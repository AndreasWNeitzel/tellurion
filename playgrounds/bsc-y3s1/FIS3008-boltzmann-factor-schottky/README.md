# The Boltzmann factor and the Schottky anomaly

Temperature does not tell a particle which energy state to occupy; it sets the odds. The Boltzmann factor says the probability of a state of energy $E$ is proportional to $e^{-E/kT}$, multiplied by the number of states at that energy. The cleanest place to watch this play out is a system with just two levels, a ground state and an excited state separated by a gap $\Delta$. The scene draws those two levels with a handful of particles, and as the temperature sweeps you see them promoted: at low temperature they all huddle in the ground state, and as $kT$ climbs past $\Delta$ they spread upward until the populations settle at the ratio fixed by the level degeneracies. The bars on the right track the exact populations.

The interesting quantity is the heat capacity, how much energy the system absorbs per degree of warming. Both at very low and at very high temperature it is nearly zero, for opposite reasons. Cold, the gap is too big to cross, so heating does almost nothing. Hot, the levels are already populated near their final ratio, so heating again does almost nothing. Only in the crossover, when $kT$ is comparable to $\Delta$, does a small temperature rise move a real chunk of the population across the gap and soak up energy. That produces a single broad bump in the heat capacity, the Schottky anomaly, peaking near $kT\approx0.42\,\Delta$ for equal degeneracies. It is not an artifact; it is the experimental fingerprint of a finite ladder of levels, and it shows up in paramagnetic salts, in nuclear spin systems, and in crystal-field-split rare-earth ions.

The lower panel plots the heat capacity against $kT/\Delta$ and overlays the mean energy. The two curves are linked: the heat capacity is the slope of the mean energy with temperature, so its peak sits exactly where the mean-energy curve is climbing most steeply. Raising the excited-state degeneracy $g_1$ tips the high-temperature population toward the excited level (its limit is $g_1/(g_0+g_1)$) and reshapes the peak.

## Reference

Reif, *Fundamentals of Statistical and Thermal Physics*, McGraw-Hill, 1965, Ch. 6; Kittel and Kroemer, *Thermal Physics*, 2nd ed., Ch. 3.

## Verification

- Strong invariants: the level populations sum to 1; the heat-capacity peak sits at $kT/\Delta=0.417$ for equal degeneracies (to 0.05); the heat capacity equals the temperature derivative of the mean energy $d\langle E\rangle/dT$ (to 1e-4); the high-temperature populations approach $g_i/(g_0+g_1)$.
- Visual gate: SSIM against committed golden frames at both folds.
