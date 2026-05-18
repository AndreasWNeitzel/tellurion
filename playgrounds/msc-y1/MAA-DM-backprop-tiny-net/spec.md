---
title: Backprop on a Tiny MLP
slug: backprop-tiny-net
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: MAA-DM
supporting_ucs: []
curriculum_year: msc-y1
hook: 'Watch a tiny neural network learn a 2D boundary: the decision surface bends, the weights thicken, and the loss falls, all driven by one rule, backpropagation.'
one_paragraph: 'A small fully-connected network maps 2D points to a class probability through tanh hidden layers and a sigmoid output. Training is gradient descent on the binary cross-entropy loss, with the gradients computed by backpropagation (the chain rule applied layer by layer). The playground draws the decision surface, the weight graph (edge width is weight magnitude, color its sign), and the loss curve live as the network learns moons, XOR, spirals, or blobs. It turns the abstract training loop into something you watch converge. Reference: Goodfellow, Bengio and Courville, Deep Learning, Ch. 6.'
tags: [numerics, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
---

# Backpropagation on a tiny MLP

## Physical setup

A small fully-connected neural network with 2 input units, 1 to 3 stacked tanh hidden layers of up to 8 units each, and a single sigmoid output unit. Trained by full-batch gradient descent on the binary cross-entropy loss for a 2D binary classification problem (moons, XOR, spiral, circles, or gaussians). The decision surface, the network graph (edge width proportional to weight magnitude, color by sign, node glow tracking the activation of a probe point that sweeps the input plane), and the loss trace are drawn live.

## Governing equations

Forward, layer l = 1..L (tanh hidden), output layer sigmoid:
  a^(l) = tanh(W^(l) a^(l-1) + b^(l)),   a^(0) = x
  p = sigmoid(W^(out) a^(L) + b^(out))

BCE loss: L = -y log p - (1 - y) log(1 - p).

Backprop (explicit, no autograd), with delta^(out) = p - y:
  dL/dW^(l) = delta^(l) (a^(l-1))^T
  delta^(l-1) = ((W^(l))^T delta^(l)) * (1 - (a^(l-1))^2)

SGD update: W <- W - lr * (dL/dW averaged over batch).

For a single hidden layer this reduces exactly to the original W1/W2 equations, and the weight-init draw order is preserved so the invariant thresholds are unchanged.

## Numerical method

Pure-JS forward + backward over the full N = 360 batch each step. He initialization scaled by sqrt(2 / n_in), drawn out-then-in so the single-layer sequence is bit-identical to the prior implementation.

## Controls

- dataset: moons, XOR, spiral, circles, gaussians
- layers: 1 - 3 hidden layers, default 1
- neurons: 2 - 8 units per hidden layer, default 8
- lr: 0.05 - 1.0, default 0.5
- speed: training iters per render frame, 1 - 20, default 4
- Reset / Single step / Play

## Expected qualitative features

1. Random init gives a roughly linear decision boundary.
2. After 100 iters on moons: surface curves to follow the moons.
3. XOR needs H >= 4 to separate the four quadrants.
4. Spiral with H = 8 takes 500+ iters.

## Invariants and acceptance thresholds

- Forward output in [0, 1].
- Loss decreases after 100 iters.
- Moons accuracy > 80 percent after 200 iters at lr = 0.5.
- XOR accuracy > 90 percent after 400 iters at H = 8.

All confirmed in `invariants.test.mjs`.

## Limiting cases for verification

- H = 1: cannot solve XOR.
- H -> infinity: overfits training set.
- lr too high: divergence; slider capped at 1.0.

## Visual fallback

Canvas2D only.

## Citations

- Goodfellow, Bengio, Courville 2016, Deep Learning, Chapter 6 (`goodfellow2016`).
- Bishop and Bishop 2024, Deep Learning: Foundations and Concepts.
- Rumelhart, Hinton, Williams 1986, Nature 323, 533.

## Stretch goals

- Add momentum or Adam as an optimizer choice.
- Add a held-out validation accuracy.
- Add a weight-visualization inset.

## Risk register

- Spiral can plateau at ~ 60 percent accuracy on some seeds.
- 60 x 60 heatmap = 3600 forward passes per render; at H = 32, ~ 200k ops; less than 1 ms per frame.
