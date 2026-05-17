import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { registerVisualGate } from '../../../tests/visual-test-runner.mjs';

registerVisualGate(path.dirname(fileURLToPath(import.meta.url)), 'plasma-waves-dispersion visual gate');
