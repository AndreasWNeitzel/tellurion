#!/usr/bin/env node
// scripts/capture-reference.mjs --playground <slug> [--deterministic] [--seed 0xC0FFEE]
// Captures the five canonical frames for a playground using Playwright Chromium.

import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT      = path.resolve(__dirname, '..');

const { values } = parseArgs({
  options: {
    playground:    { type: 'string' },
    deterministic: { type: 'boolean', default: true },
    seed:          { type: 'string',  default: '0xC0FFEE' },
    out:           { type: 'string' }
  }
});

if (!values.playground) {
  console.error('Usage: capture-reference.mjs --playground <slug>');
  process.exit(1);
}

const pgDir = path.join(ROOT, 'playgrounds', values.playground);
try {
  await fs.access(path.join(pgDir, 'index.html'));
} catch {
  console.error(`Playground not found: ${pgDir}`);
  process.exit(1);
}

const ts      = new Date().toISOString().replace(/[:.]/g, '-');
const outDir  = values.out ?? path.join(pgDir, 'references', 'captured', ts);
await fs.mkdir(outDir, { recursive: true });

const FRAMES = [
  { name: 't-000', fraction: 0.00 },
  { name: 't-025', fraction: 0.25 },
  { name: 't-050', fraction: 0.50 },
  { name: 't-075', fraction: 0.75 },
  { name: 't-100', fraction: 1.00 }
];

const browser = await chromium.launch({ headless: true });
const ctx     = await browser.newContext({ viewport: { width: 800, height: 600 }, deviceScaleFactor: 2 });
const page    = await ctx.newPage();

const url = new URL(pathToFileURL(path.join(pgDir, 'index.html')).toString());
url.searchParams.set('seed', values.seed);
if (values.deterministic) url.searchParams.set('deterministic', '1');

for (const frame of FRAMES) {
  url.searchParams.set('capture', frame.name);
  url.searchParams.set('captureFraction', String(frame.fraction));
  await page.goto(url.toString());
  await page.waitForEvent('simulation-ready', { timeout: 30_000 });
  await page.waitForTimeout(50);            // settle one render frame
  const target = page.locator('#stage');
  const buf    = await target.screenshot();
  await fs.writeFile(path.join(outDir, `${frame.name}.png`), buf);
  console.log(`captured ${frame.name}`);
}

await browser.close();

const manifest = {
  playground: values.playground,
  seed: values.seed,
  deterministic: values.deterministic,
  capturedAt: ts,
  frames: FRAMES.map(f => f.name)
};
await fs.writeFile(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log(`Done -> ${outDir}`);
