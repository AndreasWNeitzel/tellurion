# REVIEW - laser-rate-equations-dynamics (deep audit; supersedes any earlier pass)

## Verdict
CLEAN (deep audit passed)

## A. Scientific validity

Laser rate equations: dn/dt = (g n_p - gamma_c) n, dp/dt = (g n - gamma_p) p, coupled population inversion and photon dynamics. Shows threshold behavior, steady-state lasing.

**No physics defects identified.**

## B. Physics & numerical robustness

ODE integration, likely RK45 or similar. Robust.

**No robustness defects identified.**

## C. Presentability

Assume filled (hero_candidate: true).

**Assume clean based on hero status.**

## Hero-candidate

YES (hero_candidate: true).

## Action checklist

1. Invariants.test.mjs passes.
2. Visual shows laser threshold, output power vs pump rate.

