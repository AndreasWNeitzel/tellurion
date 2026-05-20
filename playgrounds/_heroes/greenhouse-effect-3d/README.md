# Greenhouse Effect (Hero)

A radiative-balance laboratory for planetary surface temperature.

## What you see

- 3D Earth + Sun in scene. Earth rotates slowly with shaded land
  ocean and ice-cap tints.
- Photon paths in three colours:
  - cyan: solar shortwave streaming in from the Sun.
  - blue/grey: a fraction (= bond albedo A) reflected back to space.
  - red: thermal IR emitted by the surface (escapes to space with
    probability tau_LW).
  - amber: IR trapped by the atmospheric layer (re-emitted toward
    surface, warming it further).
- Atmospheric layer glow (translucent blue-cyan halo around Earth,
  more opaque when tau_LW is smaller).
- Right panel: T_surf vs tau_LW curve from the single-layer grey
  atmosphere with current marker; T_eff and T_surf readouts in K
  and degrees Celsius.

## Five presets

- Snowball Earth (A = 0.70, T_surf ~ 220 K).
- Pre-industrial (CO2 = 280 ppm, T_surf ~ 287 K).
- Current (CO2 = 420 ppm, T_surf ~ 288 K).
- 2x CO2 (560 ppm, T_surf ~ 291 K; IPCC climate sensitivity).
- Venus runaway (30 opaque layers, T_surf ~ 737 K).

## Source

Pierrehumbert, *Principles of Planetary Climate*, CUP 2010, Ch. 4
(`pierrehumbert-pp`); Hansen et al., *Science* 213 (1981) 957
(`hansen-1981-co2-climate`); IPCC AR6 WG1 (2021) (`ipcc-ar6`);
Ingersoll, *J. Atmos. Sci.* 26 (1969) 1191 (runaway-greenhouse limit).
