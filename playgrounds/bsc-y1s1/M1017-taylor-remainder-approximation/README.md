# Taylor polynomials and the remainder

A Taylor polynomial is the best polynomial impostor of a function near a chosen point. The degree-$n$ one, $P_n(x) = \sum_{k=0}^{n} \frac{f^{(k)}(a)}{k!}(x-a)^k$, is built to match $f$ in value and in its first $n$ derivatives at the centre $a$, so right there the two are indistinguishable. Move away and they part company, and the gap is the remainder $R_n = f - P_n$, shaded in the top panel. The polynomial sweeps up in degree, each new term fading in and bending it to hug the curve over a wider stretch, the shaded gap squeezed outward from the centre. Drag the centre $a$ along the curve and the polynomial re-anchors there.

Taylor's theorem pins the remainder down with the Lagrange bound, $|R_n(x)| \le \max|f^{(n+1)}|\,|x-a|^{n+1}/(n+1)!$, and the factorial in the denominator is why the approximation can improve so fast. But only inside the radius of convergence. For $1/(1-x)$ and $\ln(1+x)$ there is a wall, drawn as the green band, past which adding terms makes things worse: the polynomial sails off as the true function blows up, or, more subtly for $\ln(1+x)$, even where $f$ is perfectly finite. The bottom panel reads the error against degree on a log scale at the draggable test point $x$, together with the Lagrange bound that caps it: a clean downhill line when $x$ is inside the radius, an uphill one when it is outside.

Next function cycles $\sin x$, $e^x$, $\ln(1+x)$, and $1/(1-x)$; the max-degree slider sets how high the sweep climbs. Drag the test point $x$ across the green wall on the last two functions and watch the error plot flip from downhill to uphill, the signature of leaving the radius of convergence.

## Reference

Rudin, *Principles of Mathematical Analysis*, 3rd ed., Thm. 5.15 (Taylor's theorem); Stewart, *Calculus*, 8th ed., Sec. 11.10 and 11.11.

## Verification

- Strong invariants: $P_n(a) = f(a)$, so the remainder is zero at the centre; the error never exceeds the Lagrange remainder bound; the error falls with degree inside the radius of convergence and grows outside it (verified on the geometric series past its wall).
- Visual gate: SSIM against committed golden frames at both folds.
