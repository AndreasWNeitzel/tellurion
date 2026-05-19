---
title: 'Dimensionality Reduction: PCA vs Isomap vs t-SNE'
slug: tsne-vs-umap-vs-isomap
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: MAA-DM
supporting_ucs: []
curriculum_year: msc-y1
primary_citation: vandermaaten2008
hook: 'The same dataset, reduced to 2D three ways. PCA keeps the directions of largest variance and flattens a curved manifold into a smear. Isomap walks along the data on a neighbour graph and unrolls the global shape. t-SNE only trusts who-is-near-whom and tears the manifold into tight, well-separated clumps.'
one_paragraph: 'A side-by-side dimensionality-reduction comparator on three synthetic high-dimensional sets (a torus, a Hopf link of two interlocked rings, and five Gaussian clusters arranged on a ring in 5D with extra noise dimensions). The original data rotates so its true shape is visible; three panels show its 2D image under PCA, Isomap and t-SNE. PCA projects onto the top two eigenvectors of the covariance matrix, the best linear (variance-preserving) flattening, so a curved manifold collapses and overlaps. Isomap replaces straight-line distances with shortest paths along a k-nearest-neighbour graph and then applies classical multidimensional scaling, so it preserves global geodesic structure and unrolls the manifold. t-SNE matches Gaussian neighbour probabilities in high dimensions to heavy-tailed Student-t probabilities in 2D by minimising the Kullback-Leibler divergence, so it preserves local neighbourhoods and produces tight, well-separated clusters at the cost of global geometry. The point is that there is no single best embedding: a linear method, a global manifold method and a local probabilistic method each keep a different property and discard the rest. Reference: van der Maaten and Hinton, Visualizing Data using t-SNE (2008); Tenenbaum, de Silva and Langford, Science 290 (2000); Bishop, Pattern Recognition and Machine Learning, Chapter 12 (PCA).'
tags: [numerics, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
---

# Dimensionality Reduction: PCA vs Isomap vs t-SNE

## Explainer

### What you are looking at

High-dimensional data often lies on a low-dimensional surface bent
inside a bigger space (a manifold). Dimensionality reduction tries to
draw that surface in 2D so you can see it. There is no perfect way to
do this: every method keeps one kind of structure and sacrifices
another. The playground rotates a 3D (or higher) dataset on the left
and shows three different 2D images of it: PCA, Isomap and t-SNE, so
the trade-offs are visible at a glance.

### Three philosophies

PCA (linear, variance-preserving). PCA finds the directions of largest
spread by diagonalising the covariance matrix and projects the data
onto the top two eigenvectors:

$$C \;=\; \frac{1}{N-1}\sum_{i}
   (x_i-\mu)(x_i-\mu)^{\mathsf T},
   \qquad Y_i \;=\; \big(u_1^{\mathsf T}(x_i-\mu),\;
                         u_2^{\mathsf T}(x_i-\mu)\big),$$

where $\mu$ is the data mean and $u_1,u_2$ are the leading
eigenvectors of $C$. It is fast and global but only ever applies a flat
rotation-and-projection, so a curved sheet (a torus) is squashed and
self-overlapping.

Isomap (global, geodesic). Distances measured straight through the
ambient space are misleading on a curved manifold (the short way across
a rolled sheet is not the way along it). Isomap builds a
$k$-nearest-neighbour graph, takes the geodesic distance
$d_G(i,j)$ as the shortest path along that graph, and then runs
classical multidimensional scaling: double-centre the squared geodesic
distances and take the top eigenvectors of

$$B \;=\; -\tfrac12\, J\, D_G^{(2)}\, J,
   \qquad J = I - \tfrac1N \mathbf{1}\mathbf{1}^{\mathsf T}.$$

This unrolls the manifold and keeps large-scale shape.

t-SNE (local, probabilistic). t-SNE turns distances into
probabilities. In high dimensions a Gaussian per point sets neighbour
probabilities $p_{ij}$ whose width is tuned so each point has a fixed
perplexity (an effective neighbour count). In 2D a heavy-tailed
Student-t kernel gives $q_{ij}$. The 2D layout is moved to minimise the
Kullback-Leibler divergence

$$\mathrm{KL}(P\,\|\,Q) \;=\;
   \sum_{i\neq j} p_{ij}\,\ln\frac{p_{ij}}{q_{ij}}.$$

The heavy tail lets clusters push far apart, so t-SNE makes crisp
clumps but distances between clumps are not meaningful.

### Things to try

- Torus: PCA gives an overlapping disc; Isomap recovers the periodic
  sheet; t-SNE breaks it into a ring of local patches.
- Hopf link (two interlocked rings): watch how each method handles a
  topology that cannot be separated in the plane without a cut.
- Five 5D clusters in noise: all three should isolate five clumps, but
  with very different spacing (t-SNE the most separated).
- Change the neighbour count $k$ (Isomap) and the perplexity (t-SNE)
  and see global versus local structure trade off.

### Where this comes from

Isomap is Tenenbaum, de Silva and Langford, Science 290, 2319 (2000);
t-SNE is van der Maaten and Hinton, JMLR 9 (2008); PCA and classical
MDS follow Bishop, Pattern Recognition and Machine Learning, Chapter
12, and Cox and Cox, Multidimensional Scaling.

## Physical setup

A synthetic dataset with known intrinsic structure (a torus surface, a
Hopf link of two interlocked rings, or five Gaussian clusters on a ring
embedded in 5D with noise dimensions) is reduced to 2D by three
methods: PCA (linear), Isomap (global geodesic), and t-SNE (local
probabilistic). The original data is shown rotating so its true shape
is apparent next to the three embeddings.

## Governing equations

PCA (Bishop Ch. 12): leading eigenvectors of the covariance.

```math
C = \frac{1}{N-1}\sum_i (x_i-\mu)(x_i-\mu)^{\mathsf T}, \qquad
Y_i = \big(u_1^{\mathsf T}(x_i-\mu),\, u_2^{\mathsf T}(x_i-\mu)\big).
```

Isomap (Tenenbaum et al. 2000): geodesic distances on a $k$-NN graph,
then classical MDS by double-centering.

```math
d_G(i,j) = \text{shortest path on the }k\text{-NN graph}, \qquad
B = -\tfrac12 J D_G^{(2)} J, \quad J = I - \tfrac1N \mathbf 1 \mathbf 1^{\mathsf T}.
```

t-SNE (van der Maaten and Hinton 2008): high-D Gaussian affinities
(perplexity-tuned), low-D Student-t affinities, minimise the KL
divergence by gradient descent with momentum.

```math
q_{ij} = \frac{(1+\lVert y_i-y_j\rVert^2)^{-1}}
              {\sum_{k\neq l}(1+\lVert y_k-y_l\rVert^2)^{-1}}, \qquad
\mathrm{KL}(P\|Q)=\sum_{i\neq j} p_{ij}\ln\frac{p_{ij}}{q_{ij}}.
```

## Numerical method

PCA uses power iteration with deflation for the top two eigenvectors of
the covariance. Isomap builds the $k$-NN graph, runs an all-pairs
shortest-path pass for the geodesic distances, double-centres the
squared distances, and takes the top two eigenvectors of the resulting
Gram matrix; disconnected components are bridged with a large finite
distance so the centering stays defined. t-SNE does a binary search on
each Gaussian width to hit the target perplexity, symmetrises the
affinities, and runs KL gradient descent with momentum from a small
random initialisation. The capture path sweeps the dataset (torus, then
Hopf link, then the 5D clusters) and runs all three synchronously so a
frame is reproducible.

## Controls

- dataset (select): torus, hopf-link, or clusters-5d.
- N (slider): number of points.
- k (slider): Isomap neighbour count (graph connectivity).
- perplexity (slider): t-SNE effective neighbour count.
- Recompute, Reset (torus, N = 300, k = 8, perplexity = 30),
  Pause/Resume rotation of the original-data panel.

## Expected qualitative features

- PCA flattens a curved manifold and overlaps it; it never tears.
- Isomap unrolls the manifold and keeps global ordering when the
  neighbour graph is connected.
- t-SNE produces tight, well-separated clumps and preserves local
  neighbourhoods but not between-cluster distances.
- On the 5D cluster ring all three recover five clumps, with t-SNE the
  most separated and PCA the least.
- Larger Isomap k connects the graph but can short-circuit the
  manifold; larger t-SNE perplexity favours more global structure.

## Invariants and acceptance thresholds

Checked offline in `invariants.test.mjs`:

1. torus: returns an $N\times 3$ array and every point lies on the
   torus surface to $10^{-10}$.
2. hopf-link: exactly half the points on each ring.
3. clusters-5d: five clusters with $N/5$ points each, ambient
   dimension 5.
4. PCA separates the five 5D clusters (minimum pairwise centroid
   distance $>1.5$).
5. Isomap separates them (minimum pairwise centroid distance $>0.5$
   at $k=20$ for connectivity at $N=200$).
6. t-SNE separates them into visually disjoint clumps (minimum
   pairwise centroid distance $>2.0$).
7. PCA returns $2N$ coordinates; the legacy swiss-roll and s-curve
   generators remain exported and well-formed.

Visual gate: SSIM > 0.92 against the five committed golden frames.

## Limiting cases for verification

- A linear dataset: PCA, Isomap and t-SNE all recover it.
- A torus: PCA overlaps, Isomap unrolls, t-SNE patches.
- Disconnected clusters: Isomap bridges with a large finite distance so
  the embedding stays defined.
- Perplexity at the point count: t-SNE tends toward a global layout.

## Visual fallback

Static 2x2 Canvas2D grid: the original data and the three embeddings
are fully informative as still frames; only the original-data panel
rotates.

## Citations

- van der Maaten, L. and Hinton, G., Visualizing Data using t-SNE,
  JMLR 9 (2008) 2579. `vandermaaten2008`.
- Tenenbaum, J. B., de Silva, V. and Langford, J. C., A Global
  Geometric Framework for Nonlinear Dimensionality Reduction, Science
  290 (2000) 2319. `tenenbaum2000`.
- Bishop, C. M., Pattern Recognition and Machine Learning, Ch. 12
  (PCA, MDS). `bishop2006`.

## Stretch goals

- Add UMAP (fuzzy simplicial sets, cross-entropy on the neighbour
  graph) as a fourth panel alongside t-SNE.
- A trustworthiness/continuity score per method on each dataset.
- An interactive lasso to track the same points across all panels.

## Risk register

- t-SNE here uses a fixed iteration budget, so layouts are
  reproducible but not fully converged; the gated claim is cluster
  separation, not exact positions.
- Isomap on well-separated clusters with small k yields a disconnected
  graph; the large-finite-distance bridge keeps MDS defined and the
  cluster topology, which the k = 20 test pins down.
- The slug retains the historical name; the playground compares PCA,
  Isomap and t-SNE (UMAP is a stretch goal, not implemented), and the
  rendered title states the three methods actually shown.
