# Relativistic Doppler effect

A source moving at speed $\beta c$ emits at $f_s$ in its rest frame; the observer sees $f_\text{obs} = f_s / (\gamma (1 - \beta \cos\theta))$ at angle $\theta$ from the motion. Longitudinal approach gives the maximum blueshift; recession the maximum redshift; transverse motion gives a pure SR redshift by $1/\gamma$ (no Newtonian analog).

Look for the curve sharpening as $\beta \to 1$: the blueshift cone narrows toward the forward direction (the precursor to relativistic beaming). The polar plot on the right makes the angular asymmetry obvious; the dashed red line in the Cartesian plot marks $f_\text{obs}/f_s = 1$ (no shift).

Two sliders: $\beta$ and observation angle $\theta$.

## Reference

Primary citation: Jackson, *Classical Electrodynamics*, 3e, Ch. 11 (`jackson1998`).

## Verification

- Strong invariants: longitudinal and transverse limits exact; low-$\beta$ recovers Newtonian $1 + \beta\cos\theta$ within $10^{-6}$.
- Visual gate: SSIM > 0.92 against committed golden frames at seed 0xC0FFEE.
- Last verified: see `.verified`.
