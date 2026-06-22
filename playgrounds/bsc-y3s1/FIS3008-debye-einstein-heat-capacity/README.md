# Specific heat of solids

Classical physics says every solid should store the same amount of heat per atom: the molar heat capacity is $3Nk$, the law of Dulong and Petit, and near room temperature most solids obey it. The puzzle is what happens when you cool a crystal toward absolute zero, where the heat capacity collapses to nothing. Equipartition has no answer; the resolution was one of the early triumphs of quantum theory. Einstein modelled each atom as an independent quantum oscillator of a single frequency, so that the vibrations freeze out once $kT$ falls below $\hbar\omega_E$. Debye improved on it by replacing that one frequency with a spectrum of sound waves up to a cutoff, the Debye frequency, letting the long-wavelength modes survive to much lower temperature. The scene plots both heat capacities against temperature: they agree on the Dulong-Petit plateau at high $T$ and split apart in the cold, with a cursor that sweeps across and reads each curve.

The difference between the two models lives entirely at low temperature, and it is sharp. Einstein's heat capacity dies exponentially, $(T_E/T)^2 e^{-T_E/T}$, because every mode has the same gap to freeze across. Debye's dies as a power law, $C \propto T^3$, because there is always a supply of low-frequency acoustic modes no matter how cold it gets. Real crystals follow the Debye $T^3$ law, and measuring it is how you extract a material's Debye temperature.

The lower panel makes the comparison unmistakable by switching to logarithmic axes. There a power law becomes a straight line whose slope is its exponent, so the Debye curve straightens into a line of slope three while the Einstein curve bends steeply away beneath it. The dashed reference line is exactly slope three. Sliding the Debye and Einstein temperatures shifts the curves left and right: a stiff, light crystal like diamond has a Debye temperature above 2000 K and stays "cold" (heat capacity well below the plateau) even at room temperature, while a soft, heavy metal like lead is already classical by 100 K.

## Reference

Ashcroft and Mermin, *Solid State Physics*, Holt-Saunders, 1976, Ch. 23; Kittel, *Introduction to Solid State Physics*, 8th ed., Ch. 5.

## Verification

- Strong invariants: both models reach the Dulong-Petit value $3Nk$ at high temperature (to 2%); the Debye heat capacity matches the $\tfrac{4}{5}\pi^4(T/T_D)^3$ law at low temperature (to 5%); $C/3Nk$ stays within $[0,1]$ and increases monotonically with $T$.
- Visual gate: SSIM against committed golden frames at both folds.
