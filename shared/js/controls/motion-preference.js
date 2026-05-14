// Detect user motion preference. The standard signal is the media query
// `prefers-reduced-motion: reduce`. We add a "play" override via the existing
// Pause/Play button: if the user starts paused (default for reduced-motion users)
// and clicks Play, they have opted in to motion for this session.
//
// Usage in playground.js:
//   import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
//   let running = !prefersReducedMotion();
//   // The Pause/Play button toggles `running` and flips text + aria-pressed.
//   // bootSync() should call render() once even when running is false, so a
//   // reduced-motion user still sees the initial frame.
export function prefersReducedMotion() {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
