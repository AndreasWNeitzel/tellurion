# Floating-point pitfalls: the Patriot missile failure

This is the canonical floating-point engineering catastrophe, made
drivable. A Patriot battery counted time in 0.1 s ticks and multiplied
by a 24-bit fixed-point copy of 0.1. Since 0.1 is not exact in binary
the stored constant is 209715/2097152 = 0.0999999046..., so the clock
loses about 9.5e-8 s every tick and the error is never reset. It grows
linearly with how long the battery has been powered on.

Drag the uptime slider. The radar range gate (where it expects the
tracked Scud next) is placed from that clock, so it slides along the
track by clock-error times closing speed. While the gate still
contains the Scud the interceptor launches and kills it; once the
displacement exceeds the gate half-width the track is dropped, no
missile fires, and the Scud reaches the barracks. At the historical
~100 h uptime the displacement is roughly half a kilometre. Toggle the
patched software to pin the error at zero.

The lower panel shows the cause: the exact 24-bit chop of 0.1 and the
straight clock-error line versus uptime, with the 8 h / 20 h / 100 h
reference marks. The Scud closing speed is adjustable. sim.js keeps
the 1-cos and quadratic cancellation demos behind the original
invariants. Reference: GAO/IMTEC-92-26 (1992); Skeel, SIAM News 25(4)
1992; Goldberg, ACM Comput. Surv. 23 (1991) (`goldberg1991`); Newman
Ch. 4 (`newman2013`).
