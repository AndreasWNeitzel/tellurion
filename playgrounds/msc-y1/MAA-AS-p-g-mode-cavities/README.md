# p- and g-mode cavities

The top panel is a pulsating cross-section of a real n=3 polytrope: the mode displacement field is large where the mode can propagate and evanescent where it cannot, with red and blue showing opposite phase. The bottom panel is the propagation diagram, the buoyancy frequency N(r) and the Lamb frequency S_l(r) of the same polytrope. A mode of frequency omega propagates above both frequencies (an acoustic p-mode, in the envelope) or below both (a buoyancy g-mode, in the core), and is evanescent in between. The classification uses the Cowling local wavenumber k_r^2 = (omega^2 - S_l^2)(omega^2 - N^2)/(omega^2 c^2).

Slide omega low and the mode is trapped in the core (a g-mode); slide it high and it moves to the envelope (a p-mode). In between, a mixed mode appears with a core g-cavity and an envelope p-cavity coupled through a thin evanescent gap, the configuration that lets asteroseismology weigh stellar cores. Raising the degree l lifts S_l, so the p-cavity retreats toward the surface and the turning points move outward.

The omega slider sets the mode frequency (units c_0/R), the l slider the spherical-harmonic degree. Pause freezes the oscillation phase; Reset returns to the default mixed mode. The eigenfunction, cavities, and turning points are recomputed only when omega or l change.

## Reference

Aerts, Christensen-Dalsgaard and Kurtz, *Asteroseismology* (Springer, 2010), Ch. 3 (propagation diagram and mixed modes); Unno et al., *Nonradial Oscillations of Stars* (1989). Lane-Emden structure per Chandrasekhar, *Stellar Structure*, Ch. 4.

## Verification

- Strong invariants: low omega is a pure core g-mode, high omega a pure envelope p-mode, intermediate omega a mixed mode with both cavities; k_r^2 > 0 exactly inside classified cavities and < 0 in the gap; eigenfunction energy in the core for g-modes and the envelope for p-modes.
- Visual gate: SSIM > 0.92 against committed golden frames.
