#!/usr/bin/env node
// Capture screenshots of every playground for visual audit.
import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { startStaticServer } from '../tests/helpers/static-server.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'tests', 'audit-snaps');
await fs.mkdir(OUT, { recursive: true });

const slugs = process.argv.slice(2);
if (slugs.length === 0) { console.error('Usage: snap-pages.mjs <slug...>'); process.exit(1); }

const { server, url: baseUrl } = await startStaticServer(ROOT);
const browser = await chromium.launch();

for (const slug of slugs) {
  const ctx = await browser.newContext({ viewport: { width: 900, height: 700 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.goto(`${baseUrl}/playgrounds/${slug}/index.html`, { waitUntil: 'load' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(OUT, `${slug}.png`), fullPage: true });
  console.log(`snapped ${slug}`);
  await ctx.close();
}

await browser.close();
await server.closePromise();
