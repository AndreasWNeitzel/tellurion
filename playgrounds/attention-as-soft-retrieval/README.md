# Attention as Soft Retrieval

Single-head scaled dot-product attention over a small key-value bank: w_i = softmax(Q . k_i / sqrt(d) / tau), output = sum w_i v_i. The left panel shows six keys in 2D; the query (red) can be dragged. The right panel shows the value bars colored by attention weight; the cat-3 bar is the weighted output. As temperature tau drops, attention concentrates on the nearest key (the limit is one-hot retrieval); large tau gives the uniform mixture.

Controls: tau slider, q_x / q_y position sliders, reset, shuffle keys.

## Reference

Vaswani, Shazeer, Parmar, Uszkoreit, Jones, Gomez, Kaiser, Polosukhin, "Attention Is All You Need", NeurIPS 2017; Bishop and Bishop, "Deep Learning: Foundations and Concepts", 2024, Section 12.1 (Attention mechanisms). Both verified in chapter_index.

## Verification

- softmax weights sum to 1 and preserve the order of the logits.
- tau -> 0 collapses to one-hot at the argmax (w[argmax] > 0.99).
- tau -> infinity gives the uniform distribution to 1e-6.
- output equals the weighted sum of values exactly.
- entropy is bounded by log(N) and monotone non-decreasing in tau.
