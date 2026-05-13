---
title: Backprop on a Tiny MLP
slug: backprop-tiny-net
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: MAA-DM
supporting_ucs: []
curriculum_year: msc-y1
---

# Backpropagation on a tiny MLP

## Physical setup

A small fully-connected neural network with 2 input units, H tanh hidden units, and a single sigmoid output unit. Trained by full-batch gradient descent on the binary cross-entropy loss for a 2D binary classification problem (moons, XOR, or spiral).

## Governing equations

Forward:
  a1_i = tanh(W1_{i, :} x + b1_i)
  p = sigmoid(sum_i W2_i a1_i + b2)

BCE loss: L = -y log p - (1 - y) log(1 - p).

Backprop (explicit, no autograd):
  dL/dz2 = p - y
  dL/dW2 = (p - y) a1
  dL/da1 = (p - y) W2
  dL/dz1 = dL/da1 * (1 - a1^2)
  dL/dW1 = dL/dz1 * x

SGD update: W <- W - lr * (dL/dW averaged over batch).

## Numerical method

Pure-JS forward + backward over the full N = 200 batch each step. He initialization scaled by sqrt(2 / n_in).

## Controls

- dataset: moons, XOR, spiral
- hidden H: 2 - 32, default 8
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
