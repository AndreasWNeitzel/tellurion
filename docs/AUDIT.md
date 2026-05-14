# Audit snapshot (2026-05-14)

## Inventory

- 203 verified playgrounds + 6 hero placeholders = 209 spec.md files total.
- All 203 verified playgrounds have a `.verified` marker, `spec.md` `status: verified`, 6 source files, golden frames, and a passing visual test history.
- 1306 invariant tests across 221 test files; all currently green.

## Per-year card count

| Year | Verified | Notes |
|-|-|-|
| bsc-y1s1 | 26 | M1017/M1038/CC1017/FIS1013 covered. |
| bsc-y1s2 | 9 | FIS1014 method-of-images + Coulomb + Gauss; FIS1015 Michelson + grating refs; M1015 line integrals + Stokes + Fubini. |
| bsc-y2s1 | 37 | AST2004 stellar/orbital/transit/RV; FIS2013 Larmor + Liénard + skin effect; FIS2014 thermo cycle + equipartition + adiabatic; FIS2016 wave clusters. |
| bsc-y2s2 | 24 | FIS2017 Modern-Physics quartet; FIS2018 root-finding + ODE + linear-system; FIS2021 phase-space + Liouville + Noether + Lagrangian. |
| bsc-y3s1 | 18 | AST3014 MHD/Bondi/Parker/Sedov; AST3015 photometry + LS orbit; FIS3019 finesse + grating; M3012 Fourier-Laplace + Green's. |
| bsc-y3s2 | 41 | AST3016 brems/synchrotron/RT; AST3017 BBN + distance ladder + Friedmann; FIS3020 BCS + Bloch + Cooper + phonon; FIS3028 Mandelstam + Thomas; FIS3029 fine-structure + Zeeman + Aharonov-Bohm + angular-momentum addition; FIS3030 alpha-decay + CKM + Fermi-GT + parton; M3007 curvature + geodesic deviation. |
| msc-y1 | 38 | MAA-AS asteroseismology quartet; MAA-CS cosmology trio; MAA-GD galactic-dynamics quartet; MAA-HE PWN; MAA-OT PSF + speckle; MAA-SA convection + M-L + nuclear burning; MAA-SP Voigt; MAA-SS resonance + secular; MAA-AB habitable zone + Drake. |
| hero | 6 | 2 Canvas2D MVPs verified, 4 needs-implementation. |

## Tests

- 1306 / 1306 passing.
- A few late-binding tolerance fixes (Coulomb softening, Lagrangian -0/0, synchrotron Hz upper bound, alpha-decay Geiger-Nuttall log, method-of-images 3D integration, wave-heightfield numerical damping, lienard FWHM-not-peak-shift) were applied as part of the final pre-ship sweep.

## Outstanding

See `docs/NEEDS-ATTENTION.md`.
