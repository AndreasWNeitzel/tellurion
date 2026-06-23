# Reel script: Attention as Soft Retrieval

Vertical 9:16, about 30 to 40 seconds. Screen-record the playground in portrait (820x1040), voiceover plus on-screen captions. Voice: first person, direct, no hype. No em-dashes, no emoji.

## Beat 1, hook (0 to 3s)
VO: Attention is a differentiable lookup table.
Caption: Attention is a differentiable lookup tabl…

## Beat 2, the reveal (3 to 10s)
VO: An interactive scaled dot-product attention block (Bahdanau, Cho and Bengio 2015; Vaswani et al.
Caption: what you are seeing

## Beat 3, the mechanism (10 to 22s)
VO: 2017). Six keys k i sit in a 2D plane, each carrying a scalar value v i; a movable query q scores every key by the scaled inner product s i = q.
Caption: the physics, simply

## Beat 4, try it (22 to 33s)
VO: Drag the query among the keys: the attention lines thicken toward whichever key it sits nearest and the weighted output slides toward that key value, content-based soft retrieval.
VO: Lower the temperature tau: the softmax sharpens toward a hard argmax with one key winning and entropy near zero; raise it and attention spreads evenly across all keys.
VO: This single head is the building block of every transformer: a query reading a soft, differentiable average of values addressed by their keys.
Caption: your turn

## Beat 5, payoff and CTA (33 to 40s)
VO: Lowering tau sharpens the distribution until it collapses onto the single best-matching key (hard retrieval, H to 0); raising tau flattens it to the uniform mixture (H to ln N); this temperature-controlled softmax is exactly the Gibbs/Boltzmann distribution, and it is the operation at the heart of every Transformer.
VO: Full interactive version at tellurion.dev. Follow for one of these a day.
Caption: tellurion.dev

## On-screen text beats
- Attention is a differentiable lookup tabl…
- what you are seeing
- the physics
- try it yourself
- tellurion.dev

## Source
Vaswani et al., Attention Is All You Need (2017); Bishop, Pattern Recognition and Machine Learning, Chapter 4 (softmax).
