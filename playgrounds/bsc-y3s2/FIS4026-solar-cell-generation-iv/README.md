# Solar Cell: I-V, Fill Factor and the Shockley-Queisser Limit

This playground runs a single-diode solar cell. The top panel is the
I-V curve (cyan) and the power curve (amber): a load point sweeps from
short circuit, where the full photocurrent I_sc flows at zero volts,
to open circuit, where the voltage is V_oc and no current flows. The
power is zero at both ends and peaks at the maximum-power point; the
shaded rectangle is the fill factor. The lower-left panel rains photons
onto the cell, with above-gap photons absorbed into electron-hole
pairs that feed the photocurrent. The lower-right panel is the
Shockley-Queisser detailed-balance efficiency versus bandgap.

Watch the photocurrent readout as the load point sweeps: it is 100% of
I_sc near short circuit and falls to 0% at open circuit, while the
power passes through its peak in between (that is the operating point a
real array tracks). The open-circuit voltage always stays below the
bandgap voltage E_g/q, because some voltage is always lost to
recombination. The efficiency panel shows why silicon-range gaps are
chosen: the detailed-balance limit is a single hump peaking near 30% at
about 1.3 eV, and the realistic cell sits below it.

`spectrum` switches between the terrestrial AM1.5G (1000 W/m^2) and
space AM0 (1353 W/m^2) input. `bandgap E_g` moves the operating point
along the Shockley-Queisser curve. `concentration` raises the
illumination, which scales I_sc linearly and V_oc logarithmically.
Reset returns to E_g = 1.34 eV, 1 sun, AM1.5G. Pause/Play stops or
replays the load sweep, and Copy URL shares the exact state. The I-V
and limit panels read without motion for `prefers-reduced-motion`.

## Reference

Primary citation: `shockley-queisser1961` (the detailed-balance
limit); see also `shockley1949` (the diode equation), `green1981` (the
fill-factor expression), and `wurfel2009`.

## Verification

- Strong invariant: `V = 0` gives `I = I_sc`; `I = 0` gives the
  `V_oc` formula; `V_oc < E_g/q`; the Shockley-Queisser efficiency
  peaks near 1.1-1.4 eV around 30%.
- Visual gate: SSIM > 0.92 against committed golden frames at seed
  0xC0FFEE.
- Last verified: see `.verified`.
