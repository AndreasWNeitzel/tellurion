# Driven RLC resonance and phasors

A series resistor, inductor and capacitor driven by an alternating voltage respond most strongly at one frequency. The inductor reactance grows with frequency and the capacitor reactance falls, so at the resonance omega_0 = 1/sqrt(LC) they cancel, the impedance drops to just R, and the current is largest and in phase with the drive. The top panel is the phasor diagram: V_R points along the current, V_L leads it by ninety degrees, V_C lags by ninety degrees, and they add tip-to-tail to the source. The bottom panel is the resonance curve, current amplitude versus drive frequency.

Sweep the drive frequency and watch the current marker ride up to the peak at f0, where the reactive phasors cancel and the source aligns with V_R. Lower the resistance and the peak grows tall and narrow: the quality factor Q = (1/R) sqrt(L/C) rises, the half-power bandwidth omega_0/Q shrinks, and at resonance V_L and V_C balloon to Q times the source voltage (equal and opposite). This voltage magnification and the sharp single peak are how a radio selects one station out of the whole band.

The R, L, C and frequency sliders set the circuit; the source amplitude is fixed. Reset returns to the default (R = 50 Ohm, L = 10 mH, C = 1 uF, f at resonance). Everything is closed-form steady-state AC, so the phasor angles and the resonance curve are exact.

## Reference

Young and Freedman, *University Physics*, 14th ed., Ch. 31 (AC circuits and resonance); Griffiths, *Introduction to Electrodynamics*, 5th ed., Sec. 7.2.4.

## Verification

- Strong invariants: the phasor sum V_R^2 + (V_L - V_C)^2 equals V0^2 exactly; at resonance the phase is zero and the current is V0/R; the exact half-power frequencies are spaced by R/L; the three forms of Q agree.
- Visual gate: SSIM against committed golden frames at both folds.
