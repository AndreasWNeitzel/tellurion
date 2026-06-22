# The Drude model of conduction

Three years after the electron was discovered, Paul Drude wrote down a model of electrical conduction that is almost embarrassingly simple and still the first thing every solid-state course teaches. Picture the conduction electrons in a metal as a gas of little balls, free to roam but colliding at random with something (in Drude's day, the ions; we now know it is mostly impurities and lattice vibrations) at a characteristic mean time $\tau$ between hits. A collision is assumed to be total amnesia: the electron forgets where it was going and bounces off in a fresh random direction at its high thermal speed. Now switch on an electric field. During each free flight the field nudges the electron, adding a sliver of velocity along the force, but the next collision erases it. The competition between steady pushing and random erasing settles into a constant average drift, $v_d = -eE\tau/m$, a gentle directed creep buried inside violent random motion. The scene animates exactly this: blue electrons ricocheting off red impurities at thermal speed, while the cloud as a whole edges in the direction the field drives them.

A word of honesty about that drift: it is wildly exaggerated here so you can see it. In a real copper wire carrying a household current the drift speed is on the order of micrometers per second, while the electrons' actual thermal (Fermi) speed is over a thousand kilometers per second. The directed motion is a part in a billion. What makes it matter is that there are an enormous number of electrons, and their tiny biases all add in the same direction.

Summing the drift of all of them gives the current, and because the drift is proportional to the field, so is the current: $j = \sigma E$ with conductivity $\sigma = ne^2\tau/m$. That is Ohm's law, derived rather than assumed, and the lower-left panel shows the current the random simulation actually produces landing on the predicted straight line. A cleaner metal (longer $\tau$) tilts the line steeper, because fewer collisions mean a larger drift for the same push. The lower-right panel carries the model one step further to alternating fields: when the field oscillates faster than the electrons can respond to it, above $\omega = 1/\tau$, the conductivity falls away, the Drude rolloff that shapes how metals reflect and absorb light.

## Reference

Ashcroft and Mermin, *Solid State Physics*, Holt-Saunders, 1976, Ch. 1; Kittel, *Introduction to Solid State Physics*, 8th ed., Ch. 6.

## Verification

- Strong invariants: the current is linear in the field, $j=\sigma E$; the conductivity is proportional to the scattering time; the AC conductivity starts at $\sigma_0$ and rolls off above $\omega=1/\tau$; the stochastic simulation's mean drift converges to the predicted $-E\tau$.
- Visual gate: SSIM against committed golden frames at both folds.

The electron and impurity positions are a seeded simulation (an explicit UI demo), not measured data.
