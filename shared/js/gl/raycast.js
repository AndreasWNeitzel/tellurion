// Shared screen-to-world picking primitives.
// rayPlaneIntersect: standard P + t*d on a plane through P0 with normal n.
// rayHeightfieldCell: project a ray onto the y=0 plane of a heightfield with
// world-space half-extent L and grid resolution N; return the (i, j) cell.

import { dot, sub } from './orbit-camera.js';

export function rayPlaneIntersect(ray, planePoint, planeNormal) {
  const denom = dot(ray.dir, planeNormal);
  if (Math.abs(denom) < 1e-9) return null;
  const t = dot(sub(planePoint, ray.origin), planeNormal) / denom;
  if (t < 0) return null;
  return [
    ray.origin[0] + t * ray.dir[0],
    ray.origin[1] + t * ray.dir[1],
    ray.origin[2] + t * ray.dir[2],
  ];
}

// gridConfig: { halfExtent, N, planeY, planeNormal } where the heightfield
// covers x,z in [-halfExtent, +halfExtent] on the plane y=planeY (default 0)
// with normal planeNormal (default +y). Returns { i, j, hit:[x,y,z] } or null.
export function rayHeightfieldCell(ray, gridConfig) {
  const L = gridConfig.halfExtent;
  const N = gridConfig.N;
  const planeY = gridConfig.planeY ?? 0;
  const planeNormal = gridConfig.planeNormal ?? [0, 1, 0];
  const hit = rayPlaneIntersect(ray, [0, planeY, 0], planeNormal);
  if (!hit) return null;
  if (hit[0] < -L || hit[0] > L || hit[2] < -L || hit[2] > L) return null;
  const i = Math.max(0, Math.min(N - 1, Math.floor((hit[0] + L) / (2 * L) * N)));
  const j = Math.max(0, Math.min(N - 1, Math.floor((hit[2] + L) / (2 * L) * N)));
  return { i, j, hit };
}
