# Big-O empirical scaling

The same shuffled array is sorted twice at once: an O(N^2) comparison
sort (bubble or insertion) on the left, merge sort O(N log N) on the
right. Both replay from a recorded comparison/swap/write event stream,
so the speed slider does not change the algorithm. Every comparison is
counted in the live monospace readout, with the O(N^2) / O(N log N)
ratio.

The lower panel is the point of the playground. Each finished race
drops one measured point on top of the theoretical 1/2 N(N-1) and
N log2 N curves. The points land on the curves: the abstract Big-O
plot is the mechanism you just watched, not a separate claim. The
flat blue merge curve next to the exploding red quadratic curve is
why "avoid worse than N log N for large N" is a rule of thumb.

Controls: array size N and the O(N^2) algorithm reshuffle and rebuild
both races; speed sets comparisons per frame; Sweep N runs the full
set of sizes at once to fill the empirical curve; Reset reshuffles.
Reference: Newman, Computational Physics Ch. 4 (`newman2013`); Cormen
et al., Introduction to Algorithms 3rd ed. Ch. 2 (`cormen2009`).
