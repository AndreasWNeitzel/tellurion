# Big-O empirical scaling
Plots N, N log N, N^2, N^3 on log-log axes. At N = 10^4 the cubic is already 10^12 ops (minutes); at N = 10^6 even quadratic is 10^12 ops. This is why one rule of thumb is: avoid algorithms above N log N if N could be > 10^6.
Reference: Newman, Computational Physics Ch. 4 (`newman2013`).
