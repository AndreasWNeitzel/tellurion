// Dijkstra vs A* invariants. With an admissible heuristic A* must
// return the same optimal cost as Dijkstra while never expanding more
// nodes, and the returned path must be valid on the city grid.

import { describe, it, expect } from 'vitest';
import { buildCity, dijkstra, astar, astarWeighted, WALL } from './sim.js';

function validatePath(g, res) {
  const p = res.path;
  expect(p.length).toBeGreaterThan(1);
  expect(p[0]).toBe(g.start);
  expect(p[p.length - 1]).toBe(g.goal);
  let sum = 0;
  for (let i = 0; i < p.length; i += 1) {
    expect(g.cost[p[i]]).not.toBe(WALL);                 // never through a wall
    if (i > 0) {
      const a = p[i - 1], b = p[i];
      const ax = a % g.cols, ay = (a / g.cols) | 0;
      const bx = b % g.cols, by = (b / g.cols) | 0;
      expect(Math.abs(ax - bx) + Math.abs(ay - by)).toBe(1);  // 4-adjacent
      sum += g.cost[b];                                  // entry cost of each step
    }
  }
  expect(sum).toBeCloseTo(res.cost, 9);                  // path cost is consistent
}

describe('pathfinding: optimality and admissibility', () => {
  it('Dijkstra and A* return the same optimal cost across seeds', () => {
    for (const seed of [1, 7, 42, 0xC0FFEE, 999]) {
      const g = buildCity(40, 26, seed);
      const d = dijkstra(g), a = astar(g);
      expect(Number.isFinite(d.cost)).toBe(true);
      expect(a.cost).toBeCloseTo(d.cost, 9);             // both optimal
    }
  });

  it('A* never expands more nodes than Dijkstra (heuristic guidance)', () => {
    let strictlyFewerSomewhere = false;
    for (const seed of [1, 7, 42, 0xC0FFEE, 999]) {
      const g = buildCity(40, 26, seed);
      const d = dijkstra(g), a = astar(g);
      expect(a.expanded).toBeLessThanOrEqual(d.expanded);
      if (a.expanded < d.expanded) strictlyFewerSomewhere = true;
    }
    expect(strictlyFewerSomewhere).toBe(true);           // it actually helps
  });

  it('both paths are valid grid paths with consistent cost', () => {
    const g = buildCity(40, 26, 42);
    validatePath(g, dijkstra(g));
    validatePath(g, astar(g));
  });
});

describe('pathfinding: weighted / greedy A* trade-off', () => {
  it('astarWeighted(g, 1) reproduces admissible A* (same cost and path)', () => {
    for (const seed of [1, 7, 42]) {
      const g = buildCity(40, 26, seed);
      const a1 = astarWeighted(g, 1), a = astar(g);
      expect(a1.cost).toBeCloseTo(a.cost, 9);
      expect(a1.path.length).toBe(a.path.length);
    }
  });

  it('greedy w>1: valid path, never optimal-worse than Dijkstra, scans <= admissible A*, and is strictly suboptimal + strictly cheaper somewhere', () => {
    let suboptimalSomewhere = false, fewerSomewhere = false;
    for (const seed of [1, 7, 42, 0xC0FFEE, 999, 12345]) {
      const g = buildCity(40, 26, seed);
      const opt = dijkstra(g).cost;
      const a = astar(g);
      const gw = astarWeighted(g, 3);
      validatePath(g, gw);                                 // still a real path
      expect(gw.cost).toBeGreaterThanOrEqual(opt - 1e-9);  // can only be >= optimum
      expect(gw.expanded).toBeLessThanOrEqual(a.expanded + 1e-9); // greedier or equal
      if (gw.cost > opt + 1e-9) suboptimalSomewhere = true;
      if (gw.expanded < a.expanded) fewerSomewhere = true;
    }
    expect(suboptimalSomewhere).toBe(true);                 // the cost of speed
    expect(fewerSomewhere).toBe(true);                      // the benefit of speed
  });
});

describe('pathfinding: determinism and connectivity', () => {
  it('buildCity is seed-deterministic', () => {
    const a = buildCity(36, 24, 5), b = buildCity(36, 24, 5);
    expect(Array.from(a.cost)).toEqual(Array.from(b.cost));
    expect(a.start).toBe(b.start);
    expect(a.goal).toBe(b.goal);
  });

  it('a path always exists (connectivity guaranteed) for many seeds', () => {
    for (let s = 0; s < 25; s += 1) {
      const g = buildCity(40, 26, s * 131 + 3);
      expect(Number.isFinite(dijkstra(g).cost)).toBe(true);
    }
  });
});
