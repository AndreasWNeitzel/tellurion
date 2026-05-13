import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: [
      'tests/**/*.test.mjs',
      'shared/**/*.test.mjs',
      'playgrounds/*/invariants.test.mjs'
    ],
    exclude: [
      'node_modules/**',
      'dist/**',
      'playgrounds/_template/**',
      'playgrounds/*/visual.test.mjs'   // Playwright owns these
    ],
    pool: 'forks',                       // each test file in its own process for determinism
    isolate: true,
    testTimeout: 30_000,
    hookTimeout: 30_000,
    reporters: ['default'],
    coverage: {
      provider: 'v8',
      include: ['shared/js/**/*.js'],
      exclude: ['shared/js/**/*.test.*']
    }
  }
});
