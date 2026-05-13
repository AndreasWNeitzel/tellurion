// ESLint v9 flat config.
// Hard rules from CLAUDE.md and docs/ARCHITECTURE.md, expressed as lints.

import js from '@eslint/js';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node }
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-implicit-globals': 'error',
      'no-restricted-globals': ['error', 'event'],
      'no-restricted-syntax': [
        'error',
        {
          selector: "CallExpression[callee.object.name='Math'][callee.property.name='random']",
          message: "Math.random is forbidden. Import a seeded RNG from shared/js/render/rng.js."
        }
      ],
      eqeqeq: ['error', 'smart'],
      'prefer-const': 'error',
      'no-var': 'error'
    }
  },
  {
    files: ['shared/js/render/rng.js'],
    rules: {
      'no-restricted-syntax': 'off'        // rng.js is the only place a fallback to Math.random is allowed
    }
  },
  {
    files: ['shared/js/engine/**/*.js'],
    rules: {
      // Engines must be pure numerics. No DOM, no top-level await, no performance.now.
      'no-restricted-globals': [
        'error',
        'document', 'window', 'performance', 'navigator', 'localStorage', 'sessionStorage'
      ]
    }
  },
  {
    ignores: ['dist/**', 'node_modules/**', 'playwright-report/**', 'test-results/**']
  }
];
