# Quadtree N-body

Live 2D Barnes-Hut quadtree on a gravity-bound disk. The brown squares
are the spatial partitioning that adapts to the moving particles every
step; cells with one body are left alone, cells with more split into
four. To compute the force on each body, distant cells are replaced by
their centre of mass when the angle they subtend is smaller than the
threshold `theta`.

Toggle the algorithm select to "direct" to see the O(N^2) cost: at
N=500 the tree saves an order of magnitude in pair evaluations, and the
saving grows like N/log(N) with N.

Slider `theta` is the accuracy knob. Smaller theta gives a more
faithful force at higher cost; larger theta is faster but starts
missing close encounters and the disk fluffs up.
