# Relativistic velocity addition

Newton would tell you that if a ship moves at $u$ and fires a ball forward at $v$, the ball moves at $u+v$ relative to the ground. For everyday speeds he is right to many decimal places, but the rule cannot survive a universe with a fixed speed of light, because two ordinary additions would soon push something past $c$. Einstein's replacement is $w = (u+v)/(1+uv/c^2)$. The numerator is the old answer; the denominator is the correction, and it grows just fast enough to keep the result under the light barrier. Two halves of light speed give $0.8c$. Even $0.99c$ added to $0.99c$ lands at $0.99995c$, achingly close but never equal. The scene makes this a race: from a standing start a light pulse, the ball, and the ship all set off together, and you can watch the ball gain on the ship but never on the light.

The middle of the scene lays the ground velocities on an axis that stops at the speed of light, marked as a wall on each side. The relativistic result $w$ always lands inside it, while the Galilean prediction $u+v$, drawn in red, sails straight through the wall to a speed nothing can reach. That overshoot is the visual signature of where Newtonian addition breaks. Light itself sits exactly on the wall and stays there: feed any speed into the formula alongside $c$ and it returns $c$, which is the whole reason every observer measures the same speed of light.

The cleanest way to see the structure is the third axis, rapidity. Define $\phi = \operatorname{artanh}\beta$ and the messy velocity law becomes simple addition: $\phi_w = \phi_u + \phi_v$, drawn as two arrows laid head to tail. Rapidity has no ceiling, running off to infinity as $\beta\to1$, so all the apparent strangeness of velocity addition is just the way $\tanh$ crowds its output toward one. The diagnostic plots the ground speed against the ball's speed for the current ship speed: the relativistic curve bends over and kisses the light line, while the Galilean straight line keeps climbing off the top of the panel.

## Reference

Taylor and Wheeler, *Spacetime Physics*, 2nd ed., Freeman, 1992, Ch. 3; Rindler, *Relativity: Special, General, and Cosmological*, 2nd ed., Ch. 2.

## Verification

- Strong invariants: the combined ground speed stays strictly below $c$ for any sub-light inputs; the rapidities add, $\phi_w=\phi_u+\phi_v$, to 1e-9; adding any velocity to $c$ returns exactly $c$; the law is commutative and reduces to $u+v$ at small speeds.
- Visual gate: SSIM against committed golden frames at both folds.
