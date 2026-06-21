# Group vs phase velocity in a dispersive medium

A real wave packet, a Gaussian band of wavenumbers summed as
psi(x,t) = sum A(k) cos(k x - omega(k) t), travels through a dispersive medium.
The carrier crests (gold) move at the phase velocity v_p = omega/k0; the
envelope (cyan) moves at the group velocity v_g = domega/dk. When the two differ
you watch crests appear at one edge of the packet and vanish at the other, and
because omega(k) is curved the components run at different phase speeds so the
packet spreads as it goes. That spreading is the signature of dispersion, and it
is what separates this from a plain two-tone beat.

The lower panel is the dispersion curve omega(k): the phase velocity is the
slope of the chord from the origin to (k0, omega0), and the group velocity is
the slope of the tangent there. A straight relation (light) makes them equal
(v_p = v_g, no spreading); deep water gives v_g = v_p/2, the Schrodinger
free-particle relation gives v_g = 2 v_p, and an anomalous branch makes the
tangent slope down so v_g is negative and the crests and the packet travel in
opposite directions.

Controls: carrier wavenumber k0, band width sigma_k (wider band = shorter
packet that spreads faster), the dispersion relation, and play/pause and reset.

## Reference

- Crawford, *Waves* (Berkeley Physics Course Vol. 3), Ch. 6 (`crawford-waves`);
  Pain, *The Physics of Vibrations and Waves*, Ch. 5 (`pain-vibrations`).

## Verification

- v_g/v_p matches the closed-form ratio for each dispersion relation (1 for
  light, 1/2 for deep water, 2 for Schrodinger, k^2/(omega_p^2+k^2) for plasma,
  negative for the anomalous branch). See `invariants.test.mjs`.
