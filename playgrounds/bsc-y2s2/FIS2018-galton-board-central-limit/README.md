# The Galton board and the central limit theorem

Sir Francis Galton built a wooden box of pegs in the 1870s to make an abstract idea physical, and it remains the clearest demonstration of why the bell curve is everywhere. A ball enters at the top and meets a peg; it goes left or right, a coin flip. It meets another peg one row down and flips again, and again, for all $R$ rows, before dropping into a bin at the bottom. Which bin it lands in is set entirely by how many times it happened to go right. One ball is a random accident, and watching a single ball teaches you nothing. The magic is in the aggregate: drop thousands and they sort themselves into a smooth, symmetric mound that none of them was aiming for, peaked in the middle and thinning toward the edges. The scene runs exactly this, balls cascading through the pegs and stacking up in the bins.

There are two layers of mathematics here. The first is the binomial distribution. Because each ball makes $R$ independent right-or-left choices, the number that come up right is a binomial random variable, and the expected height of bin $k$ is $\binom{R}{k}p^k(1-p)^{R-k}$. That is the orange curve the histogram grows to match, and the distance meter in the lower panel measures how close the actual counts have crept to it. As more balls fall the gap shrinks toward zero, the law of large numbers turning a pile of accidents into a sharp prediction.

The second layer is deeper. As the number of rows grows, the binomial does not just stay binomial; it morphs into the Gaussian, the universal bell curve, with mean $Rp$ and variance $Rp(1-p)$. This is the central limit theorem: the sum of many small independent random contributions is normally distributed almost regardless of the distribution of the individual contributions. The same theorem is why the errors in a careful measurement, the velocities of molecules in a gas, and the noise in an electronic circuit are all Gaussian. Each peg row is one tiny random nudge, and their sum is the bell. Add rows and watch the green Gaussian limit and the orange binomial points become indistinguishable; tilt the pegs by changing $p$ and the whole distribution slides to a new center but keeps its bell shape.

## Reference

Press, Teukolsky, Vetterling, Flannery, *Numerical Recipes*, 3rd ed., Cambridge, 2007, Ch. 7; Galton, *Natural Inheritance*, Macmillan, 1889 (the quincunx).

## Verification

- Strong invariants: the binomial mass sums to 1 with mean $Rp$ and variance $Rp(1-p)$; it is symmetric at $p=1/2$; the Gaussian limit is correctly normalized; the seeded simulation's histogram converges to the binomial with total-variation distance below 0.03 after many drops.
- Visual gate: SSIM against committed golden frames at both folds.

The ball paths are a seeded simulation (an explicit UI demo), not measured data.
