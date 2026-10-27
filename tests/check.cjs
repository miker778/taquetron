// Headless checks: boot, self-test, console errors, bot shift, fps under load.
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const url = process.argv[2] || 'http://127.0.0.1:3092/';
  const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.type() + ': ' + m.text()); });
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  await page.goto(url);
  await page.waitForTimeout(800);
  const st = await page.evaluate(() => __T.selfTest);
  await page.screenshot({ path: path.resolve(__dirname, 'shot-title.png') });
  // bot plays a full shift in fast-forward
  const diffs = await page.evaluate(() => ['medio', 'dificil'].map(k => { __T.setDiff(k); __T.start(); __T.step(95, __T.bot); const S = __T.S; __T.setDiff('facil'); return { k, end: S.endReason, served: S.served, wrong: S.wrong, strikes: S.strikes, bins: __T.S.time && document.title }; }));
  const res = await page.evaluate(() => { __T.start(); window.__fev = 0; const m = __T.step(95, __T.bot); const S = __T.S; return { mode: m, end: S.endReason, tips: S.tips, served: S.served, pinas: S.pinas, wrong: S.wrong, strikes: S.strikes, combo: S.bestCombo, fever: S.fever, time: Math.round(S.time) }; });
  // idle shift: nobody plays, must close by strikes
  const idle = await page.evaluate(() => { __T.start(); __T.step(95); return { mode: __T.S.mode, end: __T.S.endReason, strikes: __T.S.strikes }; });
  // real-time fps at peak: start, jump late, let it run with the bot
  await page.evaluate(() => { __T.start(); __T.step(60, __T.bot); window.__botI = setInterval(() => __T.bot(), 50); });
  await page.waitForTimeout(3500);
  const fps = await page.evaluate(() => ({ fps: __T.fps.value, renderMs: __T.fps.renderMs }));
  await page.screenshot({ path: path.resolve(__dirname, 'shot-play.png') });
  await page.evaluate(() => { clearInterval(window.__botI); __T.step(80); });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.resolve(__dirname, 'shot-over.png') });
  const pina = await page.evaluate(() => {
    const T = __T, S = T.S, out = {}, key = k => window.dispatchEvent(new KeyboardEvent('keydown', { key: k }));
    T.start(); T.step(1.5);
    out.boardReady = !!S.board;
    key('a'); key('e'); T.step(0.5); out.pinaLands = S.board.p === true && !S.pina;
    const c = S.customers.find(c => c.mood === 'wait'); const before = c.patience;
    if (!c.items.some(it => it.key === 'pastor|1' && it.done < it.qty)) { key(['j','k','l','ñ'][c.slot]); out.wrongHurts = c.patience < before && !!S.board; } else out.wrongHurts = true;
    key('x'); out.trashed = !S.board; T.step(0.5); out.autoTortilla = !!S.board;
    key('s'); out.suadero = S.board.meat === 'suadero';
    key('p'); out.paused = S.paused; key('p');
    return out;
  });
  // sound: play 6 real seconds with audio on and count noise bursts (only the quiet snare tick may use noise)
  await page.mouse.click(10, 700);
  await page.evaluate(() => { __T.S.mode = 'title'; });
  await page.keyboard.press('1'); await page.evaluate(() => { window.__bi = setInterval(() => __T.bot(), 60); }); await page.waitForTimeout(6000);
  const ctxState = await page.evaluate(() => typeof AudioContext !== 'undefined');
  const sound = await page.evaluate(() => { clearInterval(window.__bi); return { noisePerSec: +(window.__T.noise() / 6).toFixed(2), musicOn: window.__T.musicOn() }; });
  console.log(JSON.stringify({ sound, diffs, pina, selfTest: st, botShift: res, idleShift: idle, fps, errors }, null, 1));
  await browser.close();
  const ok = sound.musicOn && sound.noisePerSec <= 3 && diffs.every(d => d.end === 'time' && d.served > 20 && d.wrong === 0) && Object.values(pina).every(Boolean) && st.ok && res.end === 'time' && res.served > 15 && idle.strikes >= 1 && errors.length === 0;
  process.exit(ok ? 0 : 1);
})();
