# Reel script: Backprop on a Tiny MLP

Vertical 9:16, about 30 to 40 seconds. Screen-record the playground in portrait (820x1040), voiceover plus on-screen captions. Voice: first person, direct, no hype. No em-dashes, no emoji.

## Beat 1, hook (0 to 3s)
VO: Watch a tiny neural network learn a 2D boundary: the decision surface bends, the weights thicken, and the loss falls, all driven by one rule, backpropagation.
Caption: Watch a tiny neural network learn a 2D bo…

## Beat 2, the reveal (3 to 10s)
VO: A small fully-connected network maps 2D points to a class probability through tanh hidden layers and a sigmoid output.
Caption: what you are seeing

## Beat 3, the mechanism (10 to 22s)
VO: Training is gradient descent on the binary cross-entropy loss, with the gradients computed by backpropagation (the chain rule applied layer by layer). The playground draws the decision surface, the weight graph (edge width is weight magnitude, color its sign), and the loss curve live as the network learns moons, XOR, spirals, or blobs.
Caption: the physics, simply

## Beat 4, try it (22 to 33s)
VO: Drag a control and watch the whole picture change, not just a number on the side.
VO: Push it to an extreme and see where the physics breaks down.
Caption: your turn

## Beat 5, payoff and CTA (33 to 40s)
VO: It turns the abstract training loop into something you watch converge.
VO: Full interactive version at tellurion.dev. Follow for one of these a day.
Caption: tellurion.dev

## On-screen text beats
- Watch a tiny neural network learn a 2D bo…
- what you are seeing
- the physics
- try it yourself
- tellurion.dev

## Source
Goodfellow, Bengio and Courville, Deep Learning, Ch. 6.
