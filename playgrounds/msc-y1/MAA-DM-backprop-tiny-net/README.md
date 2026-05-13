# Backpropagation on a tiny MLP

A 2-input, H-hidden, 1-output neural network trained on a 2D binary classification problem. Watch the decision surface deform under gradient descent. Three datasets: moons, XOR, spiral.

What to look for: the initial decision boundary is roughly linear. After 100 iterations on moons it bends to fit the two arcs. XOR is impossible for a linear classifier; the hidden layer makes it work. Spiral is the hardest and benefits from more hidden units.

Controls: dataset dropdown, hidden H, lr, speed, reset / single step / pause / play.

## Reference

Goodfellow et al. 2016, Deep Learning, Chapter 6; Rumelhart, Hinton, Williams 1986, Nature 323, 533.

## Verification

- Strong invariants: output in [0, 1], loss decreases, moons > 80 percent, XOR > 90 percent.
- Visual gate: SSIM > 0.92 against committed golden frames at seed 0xC0FFEE.
- Last verified: see `.verified`.
