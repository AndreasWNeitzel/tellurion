import { chromium } from 'playwright';
import { startStaticServer } from '/home/aneitzel/projects/portfolio/playgrounds-portfolio/tests/helpers/static-server.mjs';

const ROOT = '/home/aneitzel/projects/portfolio/playgrounds-portfolio';
const { server, url: baseUrl } = await startStaticServer(ROOT);
const browser = await chromium.launch();

const targets = [
  'coupled-springs-normal-modes',
  'damped-driven-oscillator',
  'maxwell-boltzmann-emergence',
  'coupled-kuramoto-oscillators',
  'inverted-pendulum-kapitza',
  'foucault-pendulum',
  'tautochrone-isochronism',
  'gauss-quadrature-vs-trapezoid',
  'mc-integration-convergence',
  'magnus-effect-spinning-ball',
];

for (const slug of targets) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(`${baseUrl}/playgrounds/${slug}/index.html`, { waitUntil: 'load' });
  await page.waitForTimeout(1500);
  const info = await page.evaluate(() => {
    const katexNodes = document.querySelectorAll('.katex');
    const errs = document.querySelectorAll('.katex-error');
    const rawDollar = document.body.innerHTML.match(/\$[^$<]{1,40}\$/g) || [];
    return {
      katexCount: katexNodes.length,
      errCount: errs.length,
      sampleKatex: Array.from(katexNodes).slice(0, 4).map(k => k.textContent || ''),
      unrenderedDollar: rawDollar.slice(0, 5),
    };
  });
  console.log(`${slug}:`);
  console.log(`  rendered=${info.katexCount} errors=${info.errCount}`);
  if (info.unrenderedDollar.length > 0) console.log(`  UNRENDERED:`, info.unrenderedDollar);
  if (info.sampleKatex.length > 0) console.log(`  sample:`, info.sampleKatex.slice(0, 2));
  await ctx.close();
}

await browser.close();
await server.closePromise();
