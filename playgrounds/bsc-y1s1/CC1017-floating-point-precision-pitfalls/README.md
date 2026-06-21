# Floating-point pitfalls: accumulating clock drift

The canonical floating-point trap, made drivable: a tiny error in one
repeated constant accumulates into a gross failure. A long-running
real-time tracker counts time in 0.1 s ticks and multiplies by a 24-bit
fixed-point copy of 0.1. Since 0.1 is not exact in binary the stored
constant is 209715/2097152 = 0.0999999046..., so the clock loses about
9.5e-8 s every tick and the error is never reset. It grows linearly with
how long the system has been powered on.

Drag the uptime slider. The tracker's prediction gate (where it expects a
fast moving object next) is placed from that clock, so it slides along the
track by clock-error times object speed. While the gate still covers the
object the catch is centered; once the displacement exceeds the catch
radius the object slips outside the gate and is missed. At ~100 h uptime
the displacement is hundreds of metres. Toggle the patched software to pin
the error at zero.

The lower panel shows the cause: the exact 24-bit chop of 0.1 and the
straight clock-error line versus uptime, with a 100 h reference mark. The
object speed is adjustable. sim.js keeps the 1-cos and quadratic
cancellation demos behind the original invariants. Reference: Goldberg,
ACM Comput. Surv. 23 (1991) (`goldberg1991`); Newman Ch. 4
(`newman2013`).
