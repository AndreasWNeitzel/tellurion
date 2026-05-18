import { describe, it, expect } from 'vitest';
import {
  fockState, annihilate, create, number, dot, norm, expectationN,
  commutatorAction, coherentState, poisson, pump,
} from './sim.js';

const NM = 24;

describe('second-quantization-bosons-fermions invariants', () => {
  it('boson lowering: a|n> = sqrt(n) |n-1>, a|0> = 0', () => {
    for (const n of [1, 3, 7, 12]) {
      const a = annihilate(fockState(n, NM));
      expect(a[n - 1]).toBeCloseTo(Math.sqrt(n), 12);
      a.forEach((v, i) => { if (i !== n - 1) expect(Math.abs(v)).toBeLessThan(1e-12); });
    }
    expect(norm(annihilate(fockState(0, NM)))).toBe(0);   // a|0> = 0
  });

  it('boson raising: a^dag|n> = sqrt(n+1) |n+1>', () => {
    for (const n of [0, 2, 5, 10]) {
      const c = create(fockState(n, NM));
      expect(c[n + 1]).toBeCloseTo(Math.sqrt(n + 1), 12);
    }
  });

  it('boson commutator [a, a^dag] = 1 and N = a^dag a has spectrum n', () => {
    for (const n of [0, 1, 4, 9]) {
      const s = fockState(n, NM);
      const c = commutatorAction(s, 'boson');             // (a a^dag - a^dag a)|n>
      c.forEach((v, i) => expect(v).toBeCloseTo(i === n ? 1 : 0, 12)); // = |n>
      const Ns = create(annihilate(s));                   // a^dag a |n> = n |n>
      expect(Ns[n]).toBeCloseTo(n, 12);
      expect(expectationN(s)).toBeCloseTo(n, 12);
    }
  });

  it('a^dag is the adjoint of a: <a^dag x | y> = <x | a y>', () => {
    const x = coherentState(1.3, NM), y = coherentState(0.7, NM);
    expect(dot(create(x), y)).toBeCloseTo(dot(x, annihilate(y)), 10);
  });

  it('fermions obey Pauli: a|1>=|0>, a|0>=0, a^dag|0>=|1>, a^dag|1>=0, a^2=0', () => {
    const s0 = fockState(0, 1), s1 = fockState(1, 1);
    expect([...annihilate(s1, 'fermion')]).toEqual([1, 0]);   // a|1> = |0>
    expect([...annihilate(s0, 'fermion')]).toEqual([0, 0]);   // a|0> = 0
    expect([...create(s0, 'fermion')]).toEqual([0, 1]);       // a^dag|0> = |1>
    expect([...create(s1, 'fermion')]).toEqual([0, 0]);       // a^dag|1> = 0 (Pauli)
    expect([...annihilate(annihilate(s1, 'fermion'), 'fermion')]).toEqual([0, 0]); // a^2 = 0
    expect([...create(create(s0, 'fermion'), 'fermion')]).toEqual([0, 0]);          // (a^dag)^2 = 0
  });

  it('fermion anticommutator {a, a^dag} = 1 and N in {0, 1}', () => {
    for (const n of [0, 1]) {
      const s = fockState(n, 1);
      const c = commutatorAction(s, 'fermion');           // (a a^dag + a^dag a)|n>
      c.forEach((v, i) => expect(v).toBeCloseTo(i === n ? 1 : 0, 12));
      expect(expectationN(s)).toBeCloseTo(n, 12);          // occupation 0 or 1 only
    }
  });

  it('the bosonic coherent state is a normalised Poissonian eigenstate of a', () => {
    for (const al of [1.0, 2.0, 3.0]) {
      const cs = coherentState(al, 60);
      expect(norm(cs)).toBeCloseTo(1, 8);                  // normalised
      expect(expectationN(cs)).toBeCloseTo(al * al, 5);    // <N> = |alpha|^2
      const acs = annihilate(cs);
      for (const k of [1, 3, 6, 10]) expect(acs[k] / cs[k]).toBeCloseTo(al, 6); // a|al> = al|al>
      for (const k of [0, 2, 5]) expect(cs[k] * cs[k]).toBeCloseTo(poisson(k, al * al), 6);
    }
  });

  it('the raising pump climbs for bosons but saturates at |1> for fermions (Pauli)', () => {
    const b3 = pump(3, 'boson', NM);
    expect(b3[3]).toBeCloseTo(1, 10);                      // |0> -> |3>
    expect(expectationN(b3)).toBeCloseTo(3, 10);
    for (const k of [1, 2, 5, 9]) {
      const f = pump(k, 'fermion', 1);
      expect(expectationN(f)).toBeCloseTo(1, 10);          // stuck at |1>, never 2+
    }
    expect([...pump(7, 'fermion', 1)]).toEqual([0, 1]);
  });

  it('deterministic: identical inputs reproduce the operator action', () => {
    const a = annihilate(coherentState(2.2, NM));
    const b = annihilate(coherentState(2.2, NM));
    for (let i = 0; i < a.length; i += 1) expect(a[i]).toBe(b[i]);
    expect(pump(4, 'boson', NM)[4]).toBe(pump(4, 'boson', NM)[4]);
  });
});
