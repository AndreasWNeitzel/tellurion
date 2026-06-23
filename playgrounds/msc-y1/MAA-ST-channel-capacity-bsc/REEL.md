# Reel script: Binary Symmetric Channel and the Repetition Code

Vertical 9:16, about 30 to 40 seconds. Screen-record the playground in portrait (820x1040), voiceover plus on-screen captions. Voice: first person, direct, no hype. No em-dashes, no emoji.

## Beat 1, hook (0 to 3s)
VO: If a channel randomly flips your bits, how much can you still send reliably?
Caption: If a channel randomly flips your bits, ho…

## Beat 2, the reveal (3 to 10s)
VO: The binary symmetric channel flips each transmitted bit independently with probability p.
Caption: what you are seeing

## Beat 3, the mechanism (10 to 22s)
VO: Its capacity is C(p) = 1 - H(p) bits per use, where H(p) = -p log2 p - (1-p) log2 (1-p) is the binary entropy; C is 1 for a clean channel, 0 at p = 1/2 (pure noise). Shannon''s noisy-channel coding theorem says any rate below C is achievable with arbitrarily low error given long enough codes, while no scheme beats C.
Caption: the physics, simply

## Beat 4, try it (22 to 33s)
VO: Slide the flip probability p toward 0.5: the capacity C = 1 - H(p) collapses to zero.
VO: Push p to 0 or 1: capacity returns to 1 bit per use.
Caption: your turn

## Beat 5, payoff and CTA (33 to 40s)
VO: The playground demonstrates this with the simplest code: an n-fold repetition code with majority vote has rate 1/n and a residual error that shrinks as n grows, visibly hugging but never crossing the capacity bound.
VO: Full interactive version at tellurion.dev. Follow for one of these a day.
Caption: tellurion.dev

## On-screen text beats
- If a channel randomly flips your bits, ho…
- what you are seeing
- the physics
- try it yourself
- tellurion.dev

## Source
Cover and Thomas, Elements of Information Theory, Chapters 2 and 7; Shannon 1948.
