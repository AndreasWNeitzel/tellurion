# Faraday induction on a sliding bar

A conducting bar slides on two rails through a magnetic field into the page. The area of the loop grows, so the flux B L x grows, and Faraday's law turns that change into a motional EMF e = -B L v. The EMF drives a current I = e/R around the loop, and that current in the field feels a force that, by Lenz's law, always opposes the motion: F = B^2 L^2 v / R. The top panel shows the loop with the field, the swept flux, the induced current and the opposing force; the bottom panel shows the velocity rising to a terminal value.

Push the bar with a steady force and it accelerates only until the magnetic drag grows to match the push, settling at the terminal velocity v_t = F_app R / (B^2 L^2). Stronger field or wider rails brake it harder (the drag scales as B^2 L^2); more resistance lets it run faster. At terminal speed nothing is free: the mechanical power you supply equals the heat dumped in the resistor, shown by the two converging power readouts. This is exactly how electromagnetic brakes, eddy-current dampers, and the simplest generator work.

The B, L, R and applied-force sliders set the circuit; mass is fixed at 1 kg. Reset returns to the default and relaunches the bar; Pause freezes it. The loop resets when the bar reaches the right edge so the run repeats.

## Reference

Griffiths, *Introduction to Electrodynamics*, 5th ed., Sec. 7.1-7.2 (motional EMF and Lenz's law); Young and Freedman, *University Physics*, 14th ed., Ch. 29.

## Verification

- Strong invariants: EMF = B L v exactly; the bar reaches the analytic terminal velocity F_app R / (B^2 L^2); input minus dissipated power equals the kinetic-energy rate; at terminal the input power equals the Ohmic dissipation.
- Visual gate: SSIM against committed golden frames at both folds.
