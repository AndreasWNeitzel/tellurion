# Second-Harmonic Generation: Phase Matching and Conversion

This playground shows frequency doubling in a chi(2) crystal. The top
panel plots the second-harmonic intensity along the propagation
distance z, swept by a playhead as the beam crosses the crystal. In the
undepleted regime `I_2w(z) = (gamma z)^2 sinc^2(dk z/2)`: at perfect
phase matching `dk = 0` it climbs as `z^2`, and for `dk != 0` it is a
fixed-amplitude oscillation with coherence length `L_c = pi/|dk|`. In
the depleted phase-matched regime the exact solution `I_2w =
tanh^2(z/L_NL)`, `I_w = sech^2(z/L_NL)` is drawn, with the two always
summing to one. The lower panels show the `sinc^2(dk L/2)` acceptance
and the beta-BBO dispersion with its type-I phase-matching angle.

Switch the regime selector to see the physics that makes nonlinear
optics hard: with any phase mismatch the harmonic energy flows straight
back into the fundamental every coherence length and never
accumulates, so without phase matching there is essentially no useful
conversion. Set `dk` to zero (or pick the depleted regime) and the
conversion instead grows and then saturates toward 100% as the pump is
used up, never exceeding it because `tanh^2 < 1`. The dispersion panel
explains why a birefringent crystal angle is needed: in BBO the
fundamental ordinary index sits between the two second-harmonic
indices, so a 22.8 degree cut phase-matches 1064 nm to 532 nm.

`regime` switches between the undepleted sinc^2 picture and the exact
depleted tanh^2 conversion. `phase mismatch dk` sets the coherence
length and moves the operating point on the acceptance lobe; `coupling
gamma` sets the nonlinear length. Reset returns to the undepleted
default; Pause/Play stops or replays the sweep, and Copy URL shares the
exact state. The full analytic profile is always visible, so the
physics reads without motion (`prefers-reduced-motion` friendly).

## Reference

Primary citation: `armstrong-bloembergen1962` (Armstrong, Bloembergen,
Ducuing and Pershan, Phys. Rev. 127, 1918, 1962); see also
`boyd-nlo2008` Ch. 2 and `eimerl-davis1987` for the beta-BBO Sellmeier
equations.

## Verification

- Strong invariant: `I_2w / z^2` is constant at perfect phase matching;
  the depleted solution conserves power (`I_w + I_2w = 1`); the
  beta-BBO type-I angle for 1064 nm is `22.0`-`23.6` degrees.
- Visual gate: SSIM > 0.92 against committed golden frames at seed
  0xC0FFEE.
- Last verified: see `.verified`.
