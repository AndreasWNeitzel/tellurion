// Full-page screenshot of a playground, with optional control state so
// example-dependent views can be reviewed without wiring share-state.
//   node scripts/_shot.mjs <playground-path> <outfile> \
//        [--select=ID:value]... [--range=ID:value]... [--wait=ms]
import { chromium } from 'playwright';
import { startStaticServer } from '../tests/helpers/static-server.mjs';

const path = process.argv[2], out = process.argv[3];
const rest = process.argv.slice(4);
const selects = rest.filter(a => a.startsWith('--select=')).map(a => a.slice(9).split(':'));
const ranges = rest.filter(a => a.startsWith('--range=')).map(a => a.slice(8).split(':'));
const waitArg = rest.find(a => a.startsWith('--wait='));
const waitMs = waitArg ? parseInt(waitArg.slice(7), 10) : 1800;

const { server, url } = await startStaticServer(process.cwd());
const b = await chromium.launch(); const pg = await b.newPage();
await pg.setViewportSize({ width: 900, height: 760 });
const errs = []; pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
await pg.goto(url + '/' + path + '/index.html');
await pg.waitForTimeout(500);
for (const [id, value] of selects) {
  await pg.selectOption('#' + id, value).catch(() => {});
}
for (const [id, value] of ranges) {
  await pg.$eval('#' + id, (el, v) => {
    el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true }));
  }, value).catch(() => {});
}
await pg.waitForTimeout(waitMs);
await pg.screenshot({ path: out, fullPage: true });
console.log('errs:', errs.length ? errs.join(' | ') : '(none)');
await b.close(); await server.closePromise(); process.exit(0);
