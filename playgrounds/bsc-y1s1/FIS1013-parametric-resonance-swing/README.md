# Parametric resonance: pumping a swing

Everybody learns to pump a swing as a child, and almost nobody is taught why it works. You are not pushing against anything; your feet never touch the ground once you are moving. What you are doing is changing your own height at the right rhythm, crouching as you pass the bottom and standing as you reach the ends, which raises and lowers your center of mass twice during each full swing. Raising and lowering the center of mass is the same as shortening and lengthening the pendulum, and that changes its natural frequency. Modulating a system's own frequency in time, rather than pushing it with an outside force, is called parametric driving, and it obeys a different and more dramatic law than ordinary resonance.

The governing equation is the Mathieu equation, $\ddot\theta + 2\beta\dot\theta + \omega_0^2(1+h\cos\omega_d t)\theta = 0$, where the cosine term is the periodic squeeze of the frequency. Its signature is that when the modulation runs at close to twice the natural frequency, exactly the pump-twice-per-swing rhythm, and the modulation is deep enough to overcome friction, the amplitude does not grow linearly the way a pushed oscillator does. It grows exponentially. The scene runs the pendulum with its length visibly pumping, and the amplitude builds up explosively when you sit on resonance. The plot beside it shows the logarithm of the amplitude against time, where exponential growth becomes a straight rising line, the cleanest possible fingerprint of an instability.

The lower panel is the explanation behind the behaviour: the Ince-Strutt stability chart of the Mathieu equation. Its vertical axis is $a=(2\omega_0/\omega_d)^2$, set by how the drive frequency compares to twice the natural one, and its horizontal axis is the modulation strength $q$. The shaded tongues are the regions where the system is unstable and the amplitude grows, and they sprout upward from the points $a=1,4,9,\dots$ on the axis. The first and by far the widest tongue is at $a=1$, the drive-at-twice-the-frequency resonance every swinging child rediscovers. The dot marks your current settings: drag the drive ratio and the modulation depth and watch it move into a tongue, where the swing grows, or out of one, where damping wins and it dies. Turning up the damping lifts the whole tongue off the axis, which is why a gentle pump fails but a vigorous one succeeds.

## Reference

Landau and Lifshitz, *Mechanics*, 3rd ed., Butterworth-Heinemann, 1976, section 27; Bender and Orszag, *Advanced Mathematical Methods for Scientists and Engineers*, Ch. 11.

## Verification

- Strong invariants: the principal Mathieu tongue at $a=1$ is unstable (Floquet growth above 1) whenever the modulation is on; sufficient damping stabilizes a shallow tongue point; the integrator conserves energy when $h=\beta=0$ (a plain oscillator).
- Visual gate: SSIM against committed golden frames at both folds.
