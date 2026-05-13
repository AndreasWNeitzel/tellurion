# Dimensionality reduction: PCA vs Isomap vs t-SNE

A 3D dataset shown alongside three 2D embeddings of it. The Swiss roll is the classic "is your DR method nonlinear?" test: PCA squashes it because PCA only knows linear projections, Isomap unrolls it because it measures distances along the manifold, t-SNE clusters local neighborhoods but loses the global ordering. The two-blob dataset is easier and all three methods solve it.

The slug names UMAP, but the third method shown is PCA. A faithful UMAP implementation requires fuzzy simplicial sets and Riemannian-metric estimation; PCA gives a cleaner linear baseline against the two non-linear methods.

Controls: dataset selector, N points, k for Isomap, perplexity for t-SNE.

## Reference

Murphy, "Probabilistic Machine Learning: An Introduction", 2022, Sections 20.4 (t-SNE and UMAP) and 20.5 (Isomap and Laplacian eigenmaps).

## Verification

- Both datasets generated with the correct dimensions.
- PCA separates the two-blob clusters along PC1.
- Isomap also separates them, with the geodesic structure preserved.
- t-SNE separates them with even larger inter-cluster distance.
