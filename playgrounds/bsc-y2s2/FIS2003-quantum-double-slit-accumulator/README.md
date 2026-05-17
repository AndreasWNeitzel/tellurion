# Quantum Double Slit, One Particle at a Time

This playground builds the double-slit interference pattern the way
the experiment actually runs: one particle at a time. Each detection
is a single dot whose screen position is drawn by the Born rule from
the far-field probability density. Any one dot is random, but as they
pile up the fringes of spacing `lambda L / d` emerge under the
single-slit envelope. The side panel tracks the running histogram
against the analytic `|psi|^2` and the live fringe visibility.

The striking part is the which-path detector. Slide it up and the
fringes wash out continuously: the moment information about which slit
each particle took becomes available, the interference disappears and
only the broad single-slit envelope survives, with visibility falling
to zero. Slide it back down and the fringes return. Changing the slit
separation packs the fringes tighter; changing the wavelength stretches
them, exactly as `Delta y = lambda L / d`.

The which-path slider sets the detector strength (0 = off, full
fringes; 1 = full path information, no fringes); the slit-separation
and wavelength sliders set the fringe scale. Reset clears the screen
and Pause halts the accumulation. The readout reports the detector
state, particle count, fringe spacing and visibility.

## Reference

Primary citation: Eisberg and Resnick, *Quantum Physics of Atoms*
(2nd ed.), Ch. 3 and 5 (`eisberg-resnick`).

## Verification

- Strong invariant: fringe spacing equals `lambda L / d` within 1%;
  visibility goes from above 0.98 (detector off) to below 0.02 (full
  which-path); Born sampling matches the analytic CDF (KS < 0.02).
- Visual gate: SSIM > 0.92 against committed golden frames at seed
  0xC0FFEE.
- Last verified: see `.verified`.
