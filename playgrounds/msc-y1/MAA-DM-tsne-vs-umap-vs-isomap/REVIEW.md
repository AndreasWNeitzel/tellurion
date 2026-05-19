# REVIEW - tsne-vs-umap-vs-isomap (pre-computed; maintainer actions later)

## Verdict
RENDER-NEUTRAL TEXT FIX ONLY

## Defects (severity-ranked)
1. [high] spec.md is architect placeholder; fill with manifold learning (tSNE KL divergence, UMAP cross-entropy, Isomap geodesic distances), distance metric definitions, parameter ranges (perplexity for tSNE, n_neighbors for UMAP/Isomap), invariants (tSNE KL monotonic decrease, UMAP loss decreasing, Isomap preserves local structure).
2. [medium] README stub; explain these three dimensionality-reduction methods, what to observe (different structure preservation: tSNE clusters tightly, UMAP preserves global structure, Isomap captures manifold), controls (algorithm selector, data set, parameters).
3. [medium] index.html figcaption and description minimal.

## Text / approachability
spec, README, figcaption stubs. User sees three embeddings side-by-side but no pedagogical guidance on strengths/weaknesses of each method.

## Source-material & equation fidelity
KL divergence for tSNE, cross-entropy for UMAP, and geodesic distance for Isomap appear correctly implemented. No discrepancies. Loss traces are sound.

## Golden-frame observations
Frames show expected algorithmic differences: tSNE creates tight separated clusters, UMAP preserves more global structure, Isomap captures manifold geometry. Convergence is smooth. No visual defects.

## Hero-candidate
NO. ML algorithm comparison tool; tier: simple pedagogy.

## Maintainer notes
Spec, README, figcaption. Code algorithms are correct.
