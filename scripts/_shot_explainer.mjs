// Screenshot the open explainer dialog for one playground (verification
// tool, not committed by ship.sh).
//   node scripts/_shot_explainer.mjs <playground-path> <outfile>
import { chromium } from 'playwright';
import { startStaticServer } from '../tests/helpers/static-server.mjs';

const path = process.argv[2], out = process.argv[3];
const { server, url } = await startStaticServer(process.cwd());
const b = await chromium.launch();
const pg = await b.newPage();
await pg.setViewportSize({ width: 980, height: 900 });
const errs = [];
pg.on('pageerror', (e) => errs.push(e.message));
pg.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
await pg.goto(url + '/' + path + '/index.html');
await pg.waitForTimeout(900);
const fab = await pg.$('.explainer-fab');
if (!fab) { console.log('NO_FAB errs:', errs.join(' | ')); await b.close(); await server.closePromise(); process.exit(2); }
await fab.click();
await pg.waitForTimeout(2400);
const dlg = await pg.$('.explainer-dialog');
if (!dlg) { console.log('NO_DIALOG'); await b.close(); await server.closePromise(); process.exit(3); }
await dlg.screenshot({ path: out });
// Second frame: scrolled down, to inspect mid/late equations and the
// Reference-detail disclosure.
await pg.evaluate(() => {
  const bdy = document.querySelector('.explainer-body');
  if (bdy) bdy.scrollTop = Math.round(bdy.scrollHeight * 0.62);
});
await pg.waitForTimeout(400);
await dlg.screenshot({ path: out.replace(/\.png$/, '_b.png') });
const info = await pg.evaluate(() => {
  const d = document.querySelector('.explainer-dialog');
  return {
    chars: d.textContent.trim().length,
    katex: d.querySelectorAll('.katex').length,
    h4: d.querySelectorAll('h4').length,
    katexErr: d.querySelectorAll('.katex-error').length,
    rawDelims: (d.innerHTML.match(/\$\$/g) || []).length,
  };
});
console.log('INFO', JSON.stringify(info), 'errs:', errs.length ? errs.join(' | ') : '(none)');
await b.close();
await server.closePromise();
process.exit(0);
