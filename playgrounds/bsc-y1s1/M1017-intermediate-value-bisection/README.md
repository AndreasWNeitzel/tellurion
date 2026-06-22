# The IVT and bisection

The intermediate value theorem says something almost obvious and proves it rigorously: a continuous function that is negative at one end of an interval and positive at the other has to cross zero somewhere in between, because it cannot jump the gap. The theorem only promises that a root exists, not where, but its proof is constructive and hands you an algorithm for free. Test the midpoint of the bracket; whichever half still shows the sign change must, by the same theorem, contain a root, so discard the other half and repeat. That is bisection, and the top panel runs it: the shaded bracket closes onto the crossing while the purple midpoint is tested and thrown away.

Each step halves the bracket, so after $k$ steps the root is pinned to within $(b_0 - a_0)/2^k$, and the uncertainty falls off a cliff, one binary digit of accuracy per step. The bottom panel plots the bracket width and the size of $f$ at the midpoint against the step count on a log scale, where geometric halving shows up as a straight line marching downward. The width line is perfectly straight (an exact factor of two each step); the $|f(\text{midpoint})|$ line tracks it down but wobbles, since how fast $f$ shrinks depends on how steeply the curve crosses.

Next function cycles a cubic, $\cos x - x$, $x^2 - 2$ (whose root is $\sqrt 2$), and a wobblier $\sin(3x) - 0.4x$. Drag the endpoints $a$ and $b$ to bracket the root yourself, but keep their signs opposite: drag both to the same side of the crossing and the sign change is gone, so the theorem has nothing left to promise and the search stalls.

## Reference

Rudin, *Principles of Mathematical Analysis*, 3rd ed., Thm. 4.23 (the intermediate value theorem); Burden and Faires, *Numerical Analysis*, 9th ed., Sec. 2.1 (bisection).

## Verification

- Strong invariants: every bracket retains the sign change ($f(a)f(b) \le 0$); the bracket width halves exactly each step; the midpoint converges to the true root within half the bracket width (checked against the known roots, including $\sqrt 2$).
- Visual gate: SSIM against committed golden frames at both folds.
