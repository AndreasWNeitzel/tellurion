---
title: Attention as Soft Retrieval
slug: attention-as-soft-retrieval
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: MAA-DM
supporting_ucs: []
curriculum_year: msc-y1
primary_citation: vaswani2017
hook: 'Attention is a differentiable lookup table. A query is compared to every key, the similarities become a probability distribution through a softmax, and the answer is the expectation of the values under it. A temperature tau slides from a sharp nearest-neighbour pick (tau to 0, one-hot at the best key) to a flat average over everything (tau large, uniform weights).'
one_paragraph: 'An interactive scaled dot-product attention block (Bahdanau, Cho and Bengio 2015; Vaswani et al. 2017). Six keys k_i sit in a 2D plane, each carrying a scalar value v_i; a movable query q scores every key by the scaled inner product s_i = q . k_i / sqrt(d), the softmax with temperature tau turns the scores into weights w_i = exp(s_i / tau) / sum_j exp(s_j / tau) that sum to one, and the retrieved output is the weighted average out = sum_i w_i v_i. The key panel draws each k_i with a radius proportional to its weight and the query in warm colour; the value panel is a bar chart of the v_i shaded by w_i with the output bar alongside; the live readout gives the weight entropy H = -sum w_i ln w_i against its ceiling ln N. Lowering tau sharpens the distribution until it collapses onto the single best-matching key (hard retrieval, H to 0); raising tau flattens it to the uniform mixture (H to ln N); this temperature-controlled softmax is exactly the Gibbs/Boltzmann distribution, and it is the operation at the heart of every Transformer. Reference: Vaswani et al., Attention Is All You Need (2017); Bishop, Pattern Recognition and Machine Learning, Chapter 4 (softmax).'
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
---

# Attention as Soft Retrieval

## Explainer

### What you are looking at

An attention block is a soft, differentiable version of looking
something up in a dictionary. A hard dictionary returns the value whose
key exactly matches the request. Attention instead compares the request
(the query) to every key, decides how relevant each one is, and returns
a blend of all the values weighted by relevance. Because the blend is
smooth, you can take derivatives through it and train it, which is why
this single operation powers Transformers and modern language models.
The playground lets you drag a query around six keys and watch the
retrieved answer change.

### Scoring, softmax, and the output

Each key $k_i$ gets a score that measures how aligned it is with the
query $q$, using the inner product divided by the square root of the
dimension (so the scores do not blow up as the vectors get longer):

$$s_i \;=\; \frac{q \cdot k_i}{\sqrt{d}}.$$

The scores are turned into a set of non-negative weights that sum to
one by the softmax with temperature $\tau$:

$$w_i \;=\; \frac{e^{\,s_i/\tau}}
                 {\sum_{j} e^{\,s_j/\tau}},
  \qquad \sum_i w_i = 1.$$

The retrieved output is the expectation of the values under this
distribution:

$$\text{out} \;=\; \sum_i w_i\, v_i.$$

Here $q$ and $k_i$ are vectors in $d$ dimensions (two, in the
playground), $v_i$ is the scalar payload attached to key $i$, and
$\tau>0$ is the temperature that controls how decisive the lookup is.

### Temperature: hard versus soft retrieval

The temperature $\tau$ is the same knob as in the Boltzmann
distribution of statistical physics. As $\tau \to 0$ the softmax
collapses onto the single highest-scoring key, so attention becomes an
exact nearest-neighbour lookup and the output is just that key's value.
As $\tau \to \infty$ all scores wash out and the weights become
uniform, so the output is the plain average of every value. The
sharpness is measured by the entropy

$$H \;=\; -\sum_i w_i \ln w_i,
  \qquad 0 \le H \le \ln N,$$

which runs from $0$ (all weight on one key, perfectly decisive) up to
$\ln N$ (uniform, maximally hedged). The playground reports $H$ and its
ceiling live as you change $\tau$.

### Things to try

- Drive $\tau$ toward zero and watch one key swell while the rest fade:
  the entropy falls to zero and the output snaps to the nearest key's
  value (hard retrieval).
- Raise $\tau$ until every key has the same radius: the output becomes
  the mean of all values and the entropy reaches $\ln 6$.
- Move the query exactly onto a key at small $\tau$ and confirm the
  output is that key's value: content-based addressing.

### Where this comes from

Scaled dot-product attention is the core of the Transformer (Vaswani et
al., Attention Is All You Need, 2017), building on the additive
attention of Bahdanau, Cho and Bengio (2015). The temperature softmax
and its entropy are the Gibbs distribution and its Shannon entropy
(Bishop, Pattern Recognition and Machine Learning, Chapter 4; Cover and
Thomas, Elements of Information Theory, Chapter 2).

## Physical setup

Six keys $k_i \in \mathbb{R}^2$ are scattered in a plane, each tagged
with a scalar value $v_i$. A movable query $q \in \mathbb{R}^2$ scores
every key by the scaled inner product, a temperature softmax turns the
scores into a probability distribution over keys, and the output is the
value expectation under that distribution. This is the attention
operation studied as a content-addressable, differentiable memory.

## Governing equations

Scaled dot-product attention (Vaswani et al. 2017):

```math
s_i = \frac{q \cdot k_i}{\sqrt{d}}, \qquad
w_i = \frac{e^{s_i/\tau}}{\sum_j e^{s_j/\tau}}, \qquad
\text{out} = \sum_i w_i\, v_i .
```

Distribution sharpness (Shannon entropy, nats):

```math
H = -\sum_i w_i \ln w_i, \qquad 0 \le H \le \ln N .
```

Limits: $\tau \to 0$ gives $w \to$ one-hot at $\arg\max_i s_i$ (hard
retrieval, $H \to 0$); $\tau \to \infty$ gives $w_i \to 1/N$ (uniform
mixture, $H \to \ln N$).

## Numerical method

The softmax is evaluated with the standard max-subtraction shift
($s_i \to s_i - \max_j s_j$ before exponentiating) so the exponentials
never overflow. All quantities (scores, weights, output, entropy) are
closed-form algebra over six keys, so the result is exact and
reproduces identically for identical inputs. The capture path sweeps
$\tau$ geometrically from $2.5$ down to about $0.05$ to show the
collapse from the uniform mixture to the one-hot pick.

## Controls

- temperature $\tau$ (slider): the softmax temperature; small is sharp
  retrieval, large is uniform averaging.
- query $q_x$, $q_y$ (sliders): the query position in the key plane.
- Reset (returns $\tau = 0.5$, $q = (0,0)$), Shuffle (redraws the keys
  and values from a new seed).
- Live monospace readout: $\tau$, the entropy $H$ and its ceiling
  $\ln N$, the $\arg\max$ key index, the top weight, and the output.

## Expected qualitative features

- The weights are always non-negative and sum to one; key radii and bar
  shading track the weights.
- Small $\tau$: one key dominates, the output equals that key's value,
  entropy near $0$.
- Large $\tau$: equal radii, the output is the mean value, entropy near
  $\ln 6$.
- Entropy increases monotonically with $\tau$.
- The query nearest a key (largest score) gets the most weight; moving
  the query continuously moves the output (differentiable).

## Invariants and acceptance thresholds

Checked offline in `invariants.test.mjs`:

1. Weights sum to one to $10^{-12}$.
2. Softmax is order-preserving (monotone in the scores).
3. $\tau \to 0$ collapses to a one-hot at $\arg\max$ (top weight
   $>0.99$, all others $<0.01$).
4. $\tau \to \infty$ gives the uniform distribution to $10^{-6}$.
5. Output equals the weighted sum of values to $10^{-12}$.
6. A query at one key with small $\tau$ retrieves that key's value
   (weight $>0.9$).
7. Entropy is bounded in $[0, \ln N]$ and is non-decreasing in $\tau$.

Visual gate: SSIM > 0.92 against the five committed golden frames.

## Limiting cases for verification

- $\tau \to 0$: hard nearest-neighbour retrieval, one-hot weights.
- $\tau \to \infty$: uniform mixture, output is the plain mean.
- query on a key: that value is retrieved at small $\tau$.
- equal scores: uniform weights at any $\tau$.

## Visual fallback

Static two-panel Canvas2D: the key/query scatter and the value bar
chart are fully informative without animation; only the temperature
sweep animates.

## Citations

- Vaswani, A. et al., Attention Is All You Need, NeurIPS 2017.
  `vaswani2017`.
- Bahdanau, D., Cho, K. and Bengio, Y., Neural Machine Translation by
  Jointly Learning to Align and Translate, ICLR 2015. `bahdanau2015`.
- Bishop, C. M., Pattern Recognition and Machine Learning, Ch. 4
  (softmax). `bishop2006`.

## Stretch goals

- Multi-head attention: several query/key projections in parallel.
- Vector values and a 2D output instead of a scalar payload.
- Causal masking (each query sees only earlier keys).

## Risk register

- The scaling $1/\sqrt{d}$ matters: without it the scores grow with
  dimension and the softmax saturates; the gated quantity is the scaled
  form used here.
- Very small $\tau$ underflows the non-top exponentials to zero; the
  max-subtraction shift keeps the top weight exact, which is what the
  one-hot test checks.
- The values are a synthetic increasing-ish set so the output moves
  visibly with the query; this is a teaching dataset, not learned
  parameters.
