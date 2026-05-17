# The Photoelectric Effect

This playground is the experiment that broke classical physics. Light
of frequency nu strikes a metal cathode; if the photon energy h nu
exceeds the work function phi, electrons are ejected with maximum
kinetic energy K_max = h nu - phi and stream across to the anode. The
beam colour tracks the frequency, the electron field density tracks
the intensity, and the gap is tinted green when the applied voltage
accelerates the electrons, red when it retards them.

The decisive demonstration: drop the frequency below the threshold
nu0 = phi/h, or pick a high-work-function metal like platinum, and no
electrons appear no matter how bright you make the light. Classical
waves predicted that enough intensity should always free electrons;
it does not. Above threshold, raising the frequency speeds the
electrons and raises the stopping voltage, while raising the intensity
only adds more electrons at the same speed. The side panels show the
current-voltage curve cutting off at the stopping voltage and the
Einstein line whose slope is the universal h/e.

The metal selector sets the work function; the frequency slider
sweeps across the threshold; the intensity slider scales the current;
the voltage slider accelerates or retards the electrons. Reset returns
to sodium at 0.9 PHz and Pause freezes the animation.

## Reference

Primary citation: Eisberg and Resnick, *Quantum Physics of Atoms*
(2nd ed.), Sec. 2.2-2.3 (`eisberg-resnick`).

## Verification

- Strong invariant: no photocurrent below the threshold at any
  intensity; K_max independent of intensity; the Einstein line slope
  equals h/e to 1e-6 for every metal.
- Visual gate: SSIM > 0.92 against committed golden frames at seed
  0xC0FFEE.
- Last verified: see `.verified`.
