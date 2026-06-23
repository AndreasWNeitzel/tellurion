# Reel script: Dimensionality Reduction: PCA vs Isomap vs t-SNE

Vertical 9:16, about 30 to 40 seconds. Screen-record the playground in portrait (820x1040), voiceover plus on-screen captions. Voice: first person, direct, no hype. No em-dashes, no emoji.

## Beat 1, hook (0 to 3s)
VO: The same dataset, reduced to 2D three ways.
Caption: The same dataset, reduced to 2D three way…

## Beat 2, the reveal (3 to 10s)
VO: A side-by-side dimensionality-reduction comparator on three synthetic high-dimensional sets (a torus, a Hopf link of two interlocked rings, and five Gaussian clusters arranged on a ring in 5D with extra noise dimensions).
Caption: what you are seeing

## Beat 3, the mechanism (10 to 22s)
VO: The original data rotates so its true shape is visible; three panels show its 2D image under PCA, Isomap and t-SNE. PCA projects onto the top two eigenvectors of the covariance matrix, the best linear (variance-preserving) flattening, so a curved manifold collapses and overlaps.
Caption: the physics, simply

## Beat 4, try it (22 to 33s)
VO: Pick the torus or Hopf link and compare the three: Isomap preserves global geodesic distances, t-SNE and UMAP preserve local neighborhoods.
VO: Sweep the t-SNE perplexity: small values fragment the manifold into islands, large values smear it into one blob.
Caption: your turn

## Beat 5, payoff and CTA (33 to 40s)
VO: The point is that there is no single best embedding: a linear method, a global manifold method and a local probabilistic method each keep a different property and discard the rest.
VO: Full interactive version at tellurion.dev. Follow for one of these a day.
Caption: tellurion.dev

## On-screen text beats
- The same dataset, reduced to 2D three way…
- what you are seeing
- the physics
- try it yourself
- tellurion.dev

## Source
van der Maaten and Hinton, Visualizing Data using t-SNE (2008); Tenenbaum, de Silva and Langford, Science 290 (2000); Bishop, Pattern Recognition and Machine Learning, Chapter 12 (PCA).
