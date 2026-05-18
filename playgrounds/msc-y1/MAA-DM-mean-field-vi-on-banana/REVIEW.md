# REVIEW - mean-field-vi-on-banana (pre-computed; maintainer actions later)

## Verdict
RENDER-NEUTRAL TEXT FIX ONLY

## Defects (severity-ranked)
1. [high] spec.md is architect placeholder; fill with variational inference (KL divergence, mean-field factorization), banana-shaped posterior, evidence lower bound (ELBO), convergence criterion, invariants (ELBO monotonic increase, posterior approximation covers true posterior support).
2. [medium] README stub; explain VI as an approximate Bayesian inference method, what to observe (variational posterior (blue) trying to fit the true posterior (banana), ELBO trace), controls (prior hyperparameters, learning rate if exposed).
3. [medium] index.html figcaption and description minimal.

## Text / approachability
spec, README, figcaption stubs. User sees posterior approximation but no explanation of the mean-field independence assumption or its limitations (undercounting posterior correlation).

## Source-material & equation fidelity
ELBO computation and gradient-based VI appear correct. Mean-field factorization is implemented. KL divergence traces are sound. Banana posterior is a standard hard-inference test case.

## Golden-frame observations
Frames show blue variational posterior gradually fitting the banana-shaped true posterior. ELBO trace increases. Final approximation shows expected mean-field mismatch (underestimates covariance). No visual defects.

## Hero-candidate
NO. Bayesian inference algorithm pedagogy; tier: simple.

## Maintainer notes
Spec, README, figcaption. VI code is correct (ELBO monotonic, mean-field constraint enforced).
