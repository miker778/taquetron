// Static server for the released build in dist/ plus a tiny event leaderboard.
// Binds loopback; put a reverse proxy or tunnel in front for public access.
const http = require('http'), fs = require('fs'), path = require('path');
const DIR = path.join(__dirname, 'dist'), PORT = 3092;
const DATA = path.join(__dirname, 'data'), FILE = path.join(DATA, 'scores.json');
const TYPES = { '.html': 'text/html; charset=utf-8', '.png': 'image/png', '.ico': 'image/x-icon', '.svg': 'image/svg+xml' };
fs.mkdirSync(DATA, { recursive: true });
let scores = [];
try { scores = JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch (e) {}
const lastByIp = new Map();
let windowStart = Date.now(), windowCount = 0;
const MODES = ['facil', 'medio', 'dificil'];
const top = mode => scores.filter(s => (s.mode || 'facil') === mode).sort((a, b) => b.score - a.score).slice(0, 10).map(s => ({ name: s.name, score: s.score }));
function json(res, code, obj) { res.writeHead(code, { 'content-type': 'application/json', 'cache-control': 'no-store' }); res.end(JSON.stringify(obj)); }
http.createServer((req, res) => {
  const url = req.url.split('?')[0];
  const qmode = (new URL(req.url, 'http://x').searchParams.get('mode') || 'facil');
  if (url === '/api/top' && req.method === 'GET') return json(res, 200, MODES.includes(qmode) ? top(qmode) : []);
  if (url === '/api/score' && req.method === 'POST') {
    const ip = req.headers['cf-connecting-ip'] || req.socket.remoteAddress || '?';
    const now = Date.now();
    if (now - windowStart > 60000) { windowStart = now; windowCount = 0; }
    if (++windowCount > 60) return json(res, 429, { error: 'busy' });
    if (now - (lastByIp.get(ip) || 0) < 8000) return json(res, 429, { error: 'slow down' });
    let body = '';
    req.on('data', d => { body += d; if (body.length > 200) req.destroy(); });
    req.on('end', () => {
      let o; try { o = JSON.parse(body); } catch (e) { return json(res, 400, { error: 'bad json' }); }
      const name = String(o.name || '').toUpperCase();
      const score = o.score, mode = o.mode || 'facil';
      if (!MODES.includes(mode)) return json(res, 400, { error: 'mode' });
      if (!/^[A-Z0-9Ñ]{3}$/.test(name)) return json(res, 400, { error: 'name' });
      if (!Number.isInteger(score) || score < 1 || score > 50000) return json(res, 400, { error: 'score' });
      lastByIp.set(ip, now);
      scores.push({ name, score, mode, at: new Date(now).toISOString() });
      if (scores.length > 500) scores = scores.sort((a, b) => b.score - a.score).slice(0, 300);
      fs.writeFile(FILE, JSON.stringify(scores), () => {});
      const rank = scores.filter(s => (s.mode || 'facil') === mode && s.score > score).length + 1;
      json(res, 200, { rank, top: top(mode) });
    });
    return;
  }
  let p = decodeURIComponent(url);
  if (p === '/') p = '/index.html';
  const f = path.join(DIR, path.normalize(p).replace(/^(\.\.[\/\\])+/, ''));
  if (!f.startsWith(DIR) || !fs.existsSync(f) || !fs.statSync(f).isFile()) { res.writeHead(404, { 'content-type': 'text/plain' }); return res.end('404'); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream', 'cache-control': 'no-cache', 'x-content-type-options': 'nosniff' });
  fs.createReadStream(f).pipe(res);
}).listen(PORT, '127.0.0.1', () => console.log('taquetron on 127.0.0.1:' + PORT));
