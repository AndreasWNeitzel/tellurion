---
title: Binary Symmetric Channel and the Repetition Code
slug: channel-capacity-bsc
status: verified
audience: portfolio
created: 2026-05-13
---

# Binary symmetric channel and the repetition code

## Physical setup

A BSC flips each transmitted bit with probability p. Shannon's capacity
C(p) = 1 - H(p), with H(p) = -p log2 p - (1 - p) log2 (1 - p). At p = 0.5
the channel is useless; at p = 0 or 1 the channel is noiseless.

A repetition code of length n transmits each bit n times; the decoder
takes the majority vote. The decoding error is the binomial-tail
sum_{k > n/2} C(n, k) p^k (1 - p)^(n - k).

## Numerical method

Closed-form entropy, capacity, and binomial-sum repetition error. Monte
Carlo BSC simulation for the empirical BER readout.

## Controls

- p: bit-flip probability, 0 to 1.
- speed: auto-sweep over p.
- Reset / Pause / Play.

## Expected qualitative features

1. C(0) = C(1) = 1, C(0.5) = 0.
2. H(0) = H(1) = 0, H(0.5) = 1.
3. Repetition error decreases with n at p < 0.5.
4. At p = 0.5 all codes fail equally.

## Invariants and acceptance thresholds

1. H(0), H(1), H(0.5) exact.
2. C(0), C(1), C(0.5) exact.
3. Symmetry C(p) = C(1 - p).
4. Repetition-3 formula = 3 p^2 - 2 p^3.
5. Repetition error decreases monotonically with n at p < 0.5.
6. Simulation matches p within 0.02 over 100k bits.

All confirmed in `invariants.test.mjs`.

## Limiting cases for verification

- p = 0: noiseless.
- p = 0.5: capacity zero, repetition useless.
- n -> infinity: error -> 0 for any p < 0.5.

## Visual fallback

Canvas2D only. Top: C(p) and H(p) curves with current-p cursor. Bottom:
repetition-code BER for n = 1, 3, 5, 7, 11 with current-p cursor.

## Citations

- Cover and Thomas, Elements of Information Theory 2e Ch. 7
  (`cover-thomas`).
- MacKay, Information Theory, Inference, and Learning Algorithms Ch. 1.

## Stretch goals

- Hamming-7,4 code overlay.
- Shannon-limit curves for AWGN channel.
- Polar codes.

## Risk register

- For p > 0.5 the BSC can be inverted (flip the output) to recover a
  p' = 1 - p channel; we display the symmetric pair but the repetition
  code without inversion fails above 0.5.
