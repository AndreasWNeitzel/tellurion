# Supernova Light Curve (Hero)

A radioactive-decay-powered supernova light curve in 3D.

## What you see

- A 3D fireball that expands homologously (r = v_ej t), tinted
  brighter/whiter at peak and cooling to red-orange at late times.
- A bolometric L(t) panel with the Arnett 1982 light curve (early
  rise from diffusion trapping, peak at t_diff ~ 14 d for SN Ia,
  late-time tail from 56Co decay).
- A mass-partition panel showing the live Ni / Co / Fe partition as
  the decay chain runs:
    56Ni -> 56Co (t_1/2 = 6.1 d) -> 56Fe (t_1/2 = 77.7 d).

## Two presets

- SN 2011fe (Type Ia, thermonuclear): M_Ni = 0.6 M_sun, peak
  M_V = -19.5. The textbook standard candle.
- SN 1987A (Type II, core collapse): M_Ni = 0.075 M_sun, peak
  M_V = -16.7. Long diffusion time (envelope plateau).

## Source

Arnett, *ApJ* 253 (1982) 785 (`arnett-1982`); Filippenko, *ARA&A* 35
(1997) 309 (`filippenko-1997-sn-types`); Hillebrandt and Niemeyer,
*ARA&A* 38 (2000) 191 (`hillebrandt-niemeyer-sn-ia`).
