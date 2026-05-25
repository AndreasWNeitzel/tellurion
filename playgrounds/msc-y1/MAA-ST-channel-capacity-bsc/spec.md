---
title: Binary Symmetric Channel and the Repetition Code
slug: channel-capacity-bsc
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: MAA-ST
primary_citation: mackay2003
supporting_ucs: []
curriculum_year: msc-y1
hook: 'If a channel randomly flips your bits, how much can you still send reliably? Shannon''s answer is exact: there is a hard ceiling, and below it the error rate can be driven to zero.'
one_paragraph: 'The binary symmetric channel flips each transmitted bit independently with probability p. Its capacity is C(p) = 1 - H(p) bits per use, where H(p) = -p log2 p - (1-p) log2 (1-p) is the binary entropy; C is 1 for a clean channel, 0 at p = 1/2 (pure noise). Shannon''s noisy-channel coding theorem says any rate below C is achievable with arbitrarily low error given long enough codes, while no scheme beats C. The playground demonstrates this with the simplest code: an n-fold repetition code with majority vote has rate 1/n and a residual error that shrinks as n grows, visibly hugging but never crossing the capacity bound. Reference: Cover and Thomas, Elements of Information Theory, Chapters 2 and 7; Shannon 1948.'
tags: [numerics, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
invariants:
  - key: runs
    label: simulation advances each frame
    tolerance: 1
  - key: bounded
    label: state stays finite
    tolerance: 1
  - key: deterministic
    label: fixed seed reproduces the run
    tolerance: 1
what_to_try:
  - Vary each control and watch the rail readouts respond.
  - Compare the diagnostic plot against the live scene.
references:
  - "MacKay, Information Theory, Inference, and Learning Algorithms."
---

# Binary symmetric channel and the repetition code

## Explainer

### What you are looking at

If a communication channel randomly corrupts your bits, how much
information can you still send reliably? Shannon's answer is exact and
surprising: there is a hard ceiling (the capacity), and below it you
can drive the error rate to zero with clever coding. The playground
uses the simplest channel, the binary symmetric channel, and the
simplest code, repetition, to make this concrete.

### The channel and its capacity

The binary symmetric channel (BSC) flips each transmitted bit
independently with probability $p$. Shannon's channel capacity is

$$C(p) = 1 - H(p),
  \qquad
  H(p) = -p\log_2 p - (1-p)\log_2(1-p),$$

where $H(p)$ is the binary entropy (the uncertainty the noise
injects). $C$ is the maximum bits of real information per channel use:

- $p=0$: perfect channel, $C=1$ bit/use.
- $p=0.5$: every bit is a coin flip, $H=1$, $C=0$, the output is
  independent of the input and nothing can be sent.
- $C$ is symmetric about $p=0.5$ ($p$ and $1-p$ are equivalent up to
  relabeling).

### The repetition code and the coding theorem

The intuitive defense is to send each bit $n$ times and majority-vote.
That does drive the error down, but the rate collapses to $1/n$: the
naive code pays for reliability by sending almost nothing. Shannon's
noisy-channel coding theorem says you do not have to make that trade:
for any rate $R<C$ there exist codes with error probability
$\to 0$, while for $R>C$ reliable communication is impossible. So the
repetition code is a concrete demonstration of the problem (reliability
vs rate) and the capacity $C(p)$ is the line that good codes can
actually approach. The playground sweeps $p$ and the repetition count
$n$ and shows the post-decoding error, the rate $1/n$, and the
capacity ceiling $C(p)$.

### Things to try

- Sweep $p$ from 0 to 0.5 and watch $C(p)$ fall to zero (a 50%-flip
  channel carries nothing).
- Increase the repetition $n$ and watch the error drop but the rate
  collapse as $1/n$ (the naive trade-off).
- Compare the repetition rate to $C(p)$: the gap is what good codes
  recover (the coding theorem).

### Where this comes from

The binary symmetric channel, the capacity $C=1-H(p)$, and the
noisy-channel coding theorem follow Shannon, Bell Syst. Tech. J. 27,
379 (1948), and Cover and Thomas, *Elements of Information Theory*,
Chapter 7.

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
 .
- MacKay, Information Theory, Inference, and Learning Algorithms Ch. 1.

## Stretch goals

- Hamming-7,4 code overlay.
- Shannon-limit curves for AWGN channel.
- Polar codes.

## Risk register

- For p > 0.5 the BSC can be inverted (flip the output) to recover a
  p' = 1 - p channel; we display the symmetric pair but the repetition
  code without inversion fails above 0.5.
